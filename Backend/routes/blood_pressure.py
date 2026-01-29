from flask import Blueprint, request, jsonify
from services import db_service

bp_bp = Blueprint('blood_pressure', __name__)

@bp_bp.route('/blood_pressure', methods=['POST'])
def add_bp_log():
    data = request.get_json()
    required = ['week_number', 'systolic', 'diastolic', 'time']

    if not all(field in data and data[field] for field in required):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        db_service.save_bp_entry(
            data['week_number'], 
            data['systolic'], 
            data['diastolic'], 
            data['time'], 
            data.get('note')
        )
        return jsonify({"status": "success", "message": "Blood pressure entry added"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp_bp.route('/blood_pressure', methods=['GET'])
def get_bp_logs():
    logs = db_service.get_all_bp_entries()
    return jsonify(logs), 200

@bp_bp.route('/blood_pressure/<int:week>', methods=['GET'])
def get_bp_logs_by_week(week):
    logs = db_service.get_bp_entries_by_week(week)
    return jsonify(logs), 200

@bp_bp.route('/blood_pressure/<int:id>', methods=['GET'])
def get_bp_log(id):
    entry = db_service.get_bp_entry_by_id(id)
    if not entry:
        return jsonify({"error": "Entry not found"}), 404
    return jsonify(dict(entry)), 200

@bp_bp.route('/blood_pressure/<int:id>', methods=['PUT'])
def update_bp_log(id):
    data = request.get_json()
    
    # Optional Validation
    if 'week_number' in data and (not isinstance(data['week_number'], int) or data['week_number'] < 1):
       return jsonify({"error": "Invalid week_number"}), 400

    entry = db_service.get_bp_entry_by_id(id)
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    db_service.update_bp_entry(id, data, entry)
    return jsonify({"status": "success", "message": "Entry updated"}), 200

@bp_bp.route('/blood_pressure/<int:id>', methods=['DELETE'])
def delete_bp_log(id):
    entry = db_service.get_bp_entry_by_id(id)
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    db_service.delete_bp_entry(id)
    return jsonify({"status": "success", "message": "Entry deleted"}), 200