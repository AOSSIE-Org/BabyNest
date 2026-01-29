from flask import Blueprint, request, jsonify
from services import db_service

appointments_bp = Blueprint('appointments', __name__)

@appointments_bp.route('/get_appointments', methods=['GET'])
def get_appointments():
    try:
        appointments_list = db_service.get_all_appointments()
        return jsonify(appointments_list), 200
    except Exception as e:
        return jsonify({"error": "Database Error", "details": str(e)}), 500

@appointments_bp.route('/get_appointment/<int:appointment_id>', methods=['GET'])
def get_appointment(appointment_id):
    try:
        appointment = db_service.get_appointment_by_id(appointment_id)
        if not appointment:
            return jsonify({"error": "Appointment not found"}), 404
        return jsonify(dict(appointment)), 200
    except Exception as e:
        return jsonify({"error": "Database Error", "details": str(e)}), 500

@appointments_bp.route('/add_appointment', methods=['POST'])
def add_appointment():
    data = request.json
    required_fields = [
        'title', 'content', 'appointment_date', 
        'appointment_time', 'appointment_location'
    ]

    if not all(data.get(field) for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        db_service.save_appointment(
            data['title'], data['content'], data['appointment_date'],
            data['appointment_time'], data['appointment_location']
        )
        return jsonify({"status": "success", "message": "Appointment added successfully"}), 201
    except Exception as e:
        return jsonify({"error": "Database Error", "details": str(e)}), 500

@appointments_bp.route('/update_appointment/<int:appointment_id>', methods=['PUT'])
def update_appointment(appointment_id):
    try:
        existing_appointment = db_service.get_appointment_by_id(appointment_id)
        if not existing_appointment:
            return jsonify({"error": "Appointment not found"}), 404

        db_service.update_appointment_entry(appointment_id, request.json, existing_appointment)
        return jsonify({"status": "success", "message": "Appointment updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Database Error", "details": str(e)}), 500

@appointments_bp.route('/delete_appointment/<int:appointment_id>', methods=['DELETE'])
def delete_appointment(appointment_id):
    try:
        existing_appointment = db_service.get_appointment_by_id(appointment_id)
        if not existing_appointment:
            return jsonify({"error": "Appointment not found"}), 404

        db_service.delete_appointment_entry(appointment_id)
        return jsonify({"status": "success", "message": "Appointment deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Database Error", "details": str(e)}), 500