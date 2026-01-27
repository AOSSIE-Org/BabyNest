import sqlite3
from flask import Blueprint, jsonify, request
from db.db import open_db,close_db
from error_handling.error_classes import MissingFieldError, NotFoundError
from error_handling.handlers import handle_db_errors

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/get_tasks', methods=['GET'])
@handle_db_errors
def get_tasks():
    db = open_db()
    tasks = db.execute('SELECT * FROM tasks').fetchall()
    return jsonify([dict(task) for task in tasks]), 200

        
@tasks_bp.route('/get_task/<int:task_id>', methods=['GET'])
@handle_db_errors
def get_task(task_id):
    db = open_db()    
    task = db.execute('SELECT * FROM tasks WHERE id = ?', (task_id,)).fetchone()
    if not task:
        raise NotFoundError(resource="Task entry", resource_id=task_id)
    return jsonify(dict(task)), 200
    

@tasks_bp.route('/add_task', methods=['POST'])
@handle_db_errors
def add_task():
    db = open_db()
    data = request.get_json()
    required = ['title', 'content', 'starting_week', 'ending_week']
    missing = [field for field in required if field not in data]
    if missing:
        raise MissingFieldError(missing)

    db.execute(
        'INSERT INTO tasks (title, content, starting_week, ending_week, task_status, task_priority, isOptional, isAppointmentMade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        (data['title'], data['content'], data['starting_week'], data['ending_week'],
         data.get('task_status', 'pending'), data.get('task_priority', 'low'), int(data.get('isOptional', False)), int(data.get('isAppointmentMade', False)))
    )
    db.commit()
    return jsonify({"status": "success", "message": "Task added"}), 200


@tasks_bp.route('/update_task/<int:task_id>', methods=['PATCH'])
@handle_db_errors
def update_task(task_id):
    db = open_db()
    
    data = request.get_json()
    task = db.execute('SELECT * FROM tasks WHERE id = ?', (task_id,),).fetchone()
    
    if task is None:
        raise NotFoundError(resource="Task", resource_id=task_id)
    
    db.execute(
        'UPDATE tasks SET title = ?, content = ?, starting_week = ?, ending_week = ?, task_status = ?, task_priority = ?, isOptional = ?, isAppointmentMade = ? WHERE id = ?',
        (data.get('title',task['title']), data.get('content',task['content']), data.get('starting_week',task['starting_week']),
         data.get('ending_week',task['ending_week']), data.get('task_status', task['task_status']), data.get('task_priority', task['task_priority']), data.get('isOptional', False),
         data.get('isAppointmentMade', False), task_id)
    )
    db.commit()
    return jsonify({"status": "success", "message": "Task updated"}), 200
    

@tasks_bp.route('/delete_task/<int:task_id>', methods=['DELETE'])    
@handle_db_errors
def delete_task(task_id):
    db = open_db()    
    task = db.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
    if task.rowcount == 0:
        raise NotFoundError(resource="Task", resource_id=task_id)
    db.commit()
    return jsonify({"status": "success", "message": "Task deleted"}), 200

@tasks_bp.route('/move_to_appointment/<int:task_id>', methods=['PUT'])
@handle_db_errors
def move_to_appointment(task_id):
    db = open_db()

    task = db.execute('SELECT * FROM tasks WHERE id = ?', (task_id,)).fetchone()
    if task is None:
        raise NotFoundError(resource="Task", resource_id=task_id)
    
    data = request.get_json()
    required = ['appointment_date', 'appointment_time', 'appointment_location']
    missing = [field for field in required if field not in data]
    if missing:
        raise MissingFieldError(missing)
    
    appointment_title = data.get('appointment_title',task['title'])
    appointment_content = data.get('appointment_content',task['content'])
    
    db.execute(
        'UPDATE tasks SET isAppointmentMade = ? WHERE id = ?',
        (1, task_id)
    )
    db.commit()
    # add that task to appointments
    db.execute(
        'INSERT INTO appointments (title, content, appointment_date, appointment_time, appointment_location, appointment_status) VALUES (?, ?, ?, ?, ?, ?)',
        (appointment_title, appointment_content, data['appointment_date'], data['appointment_time'], data['appointment_location'], 'pending')
    )
    db.commit()
    return jsonify({"status": "success", "message": "Task moved to appointment"}), 200
    