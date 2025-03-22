import sqlite3
from flask import Blueprint, jsonify, request
from db.db import open_db, close_db

appointments_bp = Blueprint('appointments', __name__)

@appointments_bp.route('/get_appointments', methods=['GET'])
def get_appointments():
    db = open_db()

    try:
        appointments = db.execute('SELECT * FROM appointments').fetchall()
        appointments_list = [dict(appt) for appt in appointments]
        
        return jsonify(appointments_list), 200

    except sqlite3.OperationalError:
        return jsonify({"error": "Database Error"}), 500
    finally:
        close_db(db)
    

@appointments_bp.route('/get_appointment/<int:appointment_id>', methods=['GET'])
def get_appointment(appointment_id):
    db = open_db()

    if not appointment_id:
        return jsonify({"error": "Appointment ID is required"}), 400
    
    try:
        appointment = db.execute('SELECT * FROM appointments WHERE id = ?', (appointment_id,)).fetchone()
        if not appointment:
            return jsonify({"error": "Appointment not found"}), 404
        
        return jsonify(dict(appointment)), 200
    
    except sqlite3.OperationalError:
        return jsonify({"error": "Database Error"}), 500
    finally:
        close_db(db)

@appointments_bp.route('/add_appointment', methods=['POST'])
def add_appointment():
    db = open_db()
    try:
        data = request.json
        title = data.get('title')
        content = data.get('content')
        appointment_date = data.get('appointment_date')
        appointment_time = data.get('appointment_time')
        appointment_location = data.get('appointment_location')

        if not all([title, content, appointment_date, appointment_time, appointment_location]):
            return jsonify({"error": "Missing required fields"}), 400

        db.execute(
            'INSERT INTO appointments (title, content, appointment_date, appointment_time, appointment_location, appointment_status) VALUES (?, ?, ?, ?, ?, ?)',
            (title, content, appointment_date, appointment_time, appointment_location, 'pending')
        )
        db.commit()

        return jsonify({"status": "success", "message": "Appointment added successfully"}), 200

    except sqlite3.OperationalError:
        return jsonify({"error": "Database Error"}), 500
    finally:
        close_db(db)

@appointments_bp.route('/update_appointment/<int:appointment_id>', methods=['PUT'])
def update_appointment(appointment_id):
    db = open_db()

    existing_appointment = db.execute('SELECT * FROM appointments WHERE id = ?', (appointment_id,)).fetchone()
    if not existing_appointment:
        return jsonify({"error": "Appointment not found"}), 404

    try:
        data = request.json
        title = data.get('title')
        content = data.get('content')
        appointment_date = data.get('appointment_date')
        appointment_time = data.get('appointment_time')
        appointment_location = data.get('appointment_location')
        appointment_status = data.get('appointment_status', 'pending')

        if not all([title, content, appointment_date, appointment_time, appointment_location]):
            return jsonify({"error": "Missing required fields"}), 400

        db.execute(
            'UPDATE appointments SET title = ?, content = ?, appointment_date = ?, appointment_time = ?, appointment_location = ?, appointment_status = ? WHERE id = ?',
            (title, content, appointment_date, appointment_time, appointment_location, appointment_status, appointment_id)
        )
        db.commit()

        return jsonify({"status": "success", "message": "Appointment updated successfully"}), 200

    except sqlite3.OperationalError:
        return jsonify({"error": "Database Error"}), 500
    finally:
        close_db(db)

@appointments_bp.route('/delete_appointment/<int:appointment_id>', methods=['DELETE'])
def delete_appointment(appointment_id):
    db = open_db()

    existing_appointment = db.execute('SELECT * FROM appointments WHERE id = ?', (appointment_id,)).fetchone()
    if not existing_appointment:
        return jsonify({"error": "Appointment not found"}), 404

    try:
        db.execute('DELETE FROM appointments WHERE id = ?', (appointment_id,))
        db.commit()

        return jsonify({"status": "success", "message": "Appointment deleted successfully"}), 200

    except sqlite3.OperationalError:
        return jsonify({"error": "Database Error"}), 500
    finally:
        close_db(db)
