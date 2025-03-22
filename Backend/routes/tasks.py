import sqlite3
from flask import Blueprint, jsonify, request
from db.db import open_db

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/get_tasks', methods=['GET'])
def get_tasks():
    db = open_db()
    try:
        tasks = db.execute('SELECT * FROM tasks').fetchall()
        return jsonify([dict(task) for task in tasks]), 200
    
    except sqlite3.OperationalError:
        return jsonify({"error": "Database Error"}), 500
    finally:
        close_db(db)
        
@tasks_bp.route('/get_task/<int:task_id>', methods=['GET'])
def get_task(task_id):
    db = open_db()
    if not task_id:
        return jsonify({"error": "Task ID is required"}), 400
    
    try:
        task = db.execute('SELECT * FROM tasks WHERE id = ?', (task_id,)).fetchone()
        return jsonify(dict(task)), 200
    
    except sqlite3.OperationalError:
        return jsonify({"error": "Database Error"}), 500
    finally:
        close_db(db)

@tasks_bp.route('/add_task', methods=['POST'])
def add_task():
    db = open_db()
    try:
        data = request.json

        db.execute(
            'INSERT INTO tasks (title, content, starting_week, ending_week, task_status, task_priority, isOptional, isAppointmentMade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            (data['title'], data['content'], data['starting_week'], data['ending_week'],
             data.get('task_status', 'pending'), data.get('task_priority', 'low'), int(data.get('isOptional', False)), int(data.get('isAppointmentMade', False)))
        )
        db.commit()
        return jsonify({"status": "success", "message": "Task added"}), 200

    except sqlite3.OperationalError as e:
        print(f"Database Error: {e}")  # Print the exact error
        return jsonify({"error": "Database Error", "details": str(e)}), 500

    except Exception as e:  # Catch all other errors
        print(f"Unexpected Error: {e}")
        return jsonify({"error": "Unexpected Error", "details": str(e)}), 500
    finally:
        close_db(db)

@tasks_bp.route('/update_task/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    db = open_db()

    if not task_id:
        return jsonify({"error": "Task ID is required"}), 400
    
    try:
        data = request.json

        task = db.execute('SELECT * FROM tasks WHERE id = ?', (task_id,),).fetchone()
        db.execute(
            'UPDATE tasks SET title = ?, content = ?, starting_week = ?, ending_week = ?, task_status = ?, task_priority = ?, isOptional = ?, isAppointmentMade = ? WHERE id = ?',
            (data.get('title',task['title']), data.get('content',task['content']), data.get('starting_week',task['starting_week']),
             data.get('ending_week',task['ending_week']), data.get('task_status', 'pending'), data.get('priority', 'low'), data.get('isOptional', False),
             data.get('isAppointmentMade', False), task_id)
        )
        db.commit()
        return jsonify({"status": "success", "message": "Task updated"}), 200
    
    except sqlite3.OperationalError:
        return jsonify({"error": "Database Error"}), 500   
    finally:
        close_db(db)

@tasks_bp.route('/delete_task/<int:task_id>', methods=['DELETE'])    
def delete_task(task_id):
    db = open_db()    
    if not task_id:
        return jsonify({"error": "Task ID is required"}), 400
    
    try:
        db.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
        db.commit()
        return jsonify({"status": "success", "message": "Task deleted"}), 200
    
    except sqlite3.OperationalError:
        return jsonify({"error": "Database Error"}), 500
    finally:
        close_db(db)

@tasks_bp.route('/move_to_appointment/<int:task_id>', methods=['PUT'])
def move_to_appointment(task_id):
    db = open_db()

    if not task_id:
        return jsonify({"error": "Task ID is required"}), 400
    
    try:
        task = db.execute('SELECT * FROM tasks WHERE id = ?', (task_id,)).fetchone()

        if task is None:
            return jsonify({"error": "Task not found"}), 404
        
        data = request.json
        appointment_title = data.get('appointment_title',task['title'])
        appointment_content = data.get('appointment_content',task['content'])
        appointment_date = data.get('appointment_date')
        appointment_time = data.get('appointment_time')
        appointment_location = data.get('appointment_location')

        if not all([appointment_date, appointment_time, appointment_location]):
            return jsonify({"error": "Missing appointment details"}), 400
        
        task = db.execute(
            'UPDATE tasks SET isAppointmentMade = ? WHERE id = ?',
            (1, task_id)
        )
        db.commit()

        # add that task to appointments
        db.execute(
            'INSERT INTO appointments (title, content, appointment_date, appointment_time, appointment_location, appointment_status) VALUES (?, ?, ?, ?, ?, ?)',y
            (appointment_title, appointment_content, appointment_date, appointment_time, appointment_location, 'pending')
        )

        db.commit()
        return jsonify({"status": "success", "message": "Task moved to appointment"}), 200
    
    except sqlite3.OperationalError:
        return jsonify({"error": "Database Error"}), 500
    finally:
        close_db(db)
