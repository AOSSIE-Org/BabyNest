import sqlite3
from flask import Blueprint, jsonify, request
from db.db import open_db, close_db
from cerberus import Validator 

appointments_bp = Blueprint('appointments', __name__)

appointment_schema = {
    'title': {'type': 'string', 'minlength': 1, 'maxlength': 255, 'required': True},
    'content': {'type': 'string', 'minlength': 1, 'maxlength': 1000, 'required': True},
    'appointment_date': {'type': 'string', 'regex': r'^\d{4}-\d{2}-\d{2}$', 'required': True},  
    'appointment_time': {'type': 'string', 'regex': r'^\d{1,2}:\d{2} (AM|PM)$', 'required': True},  # Updated regex for AM/PM format
    'appointment_location': {'type': 'string', 'minlength': 1, 'maxlength': 255, 'required': True},
    'appointment_status': {'type': 'string', 'allowed': ['pending', 'confirmed', 'cancelled', 'completed'], 'required': False}  # Added 'completed'
}

@appointments_bp.route('/get_appointments', methods=['GET'])
def get_appointments():
    db = open_db()

    try:
        appointments = db.execute('SELECT * FROM appointments').fetchall()
        appointments_list = [dict(appt) for appt in appointments]
        
    except sqlite3.OperationalError:
        return jsonify({"error": "Database Error"}), 500
    
    return jsonify(appointments_list), 200

@appointments_bp.route('/get_appointment/<int:appointment_id>', methods=['GET'])
def get_appointment(appointment_id):
    if appointment_id <= 0:
        return jsonify({"error": "Invalid appointment ID"}), 400

    db = open_db()
    try:
        appointment = db.execute('SELECT * FROM appointments WHERE id = ?', (appointment_id,)).fetchone()
        if not appointment:
            return jsonify({"error": "Appointment not found"}), 404

        return jsonify(dict(appointment)), 200

    except sqlite3.OperationalError:
        return jsonify({"error": "Database Error"}), 500

@appointments_bp.route('/add_appointment', methods=['POST'])
def add_appointment():
    db = open_db()
    try:
        data = request.json
        v = Validator(appointment_schema)

        if not v.validate(data):
            return jsonify({"error": "Invalid input", "details": v.errors}), 400

        title = data['title']
        content = data['content']
        appointment_date = data['appointment_date']
        appointment_time = data['appointment_time']
        appointment_location = data['appointment_location']

        db.execute(
            'INSERT INTO appointments (title, content, appointment_date, appointment_time, appointment_location, appointment_status) VALUES (?, ?, ?, ?, ?, ?)',
            (title, content, appointment_date, appointment_time, appointment_location, 'pending')
        )
        db.commit()

        return jsonify({"status": "success", "message": "Appointment added successfully"}), 200

    except sqlite3.OperationalError:
        return jsonify({"error": "Database Error"}), 500
    
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

