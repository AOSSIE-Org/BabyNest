from flask import Blueprint, request, jsonify
from services import db_service

discharge_bp = Blueprint('discharge', __name__)

@discharge_bp.route('/set_discharge_log', methods=['POST'])
def add_discharge_log():
    data = request.get_json()
    required = ['week_number', 'type', 'color', 'bleeding']

    if not all(field in data and data[field] for field in required):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        db_service.save_discharge_entry(
            data['week_number'], data['type'], data['color'], 
            data['bleeding'], data.get('note')
        )
        return jsonify({"status": "success", "message": "Discharge entry added"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@discharge_bp.route('/get_discharge_logs', methods=['GET'])
def get_discharge_logs():
    logs = db_service.get_all_discharge_entries()
    return jsonify(logs), 200

@discharge_bp.route('/get_discharge_logs/<int:week>', methods=['GET'])
def get_discharge_logs_by_week(week):
    logs = db_service.get_discharge_entries_by_week(week)
    return jsonify(logs), 200

@discharge_bp.route('/discharge_log/<int:id>', methods=['GET'])
def get_discharge_log(id):
    entry = db_service.get_discharge_entry_by_id(id)
    if not entry:
        return jsonify({"error": "Entry not found"}), 404
    return jsonify(dict(entry)), 200

@discharge_bp.route('/discharge_log/<int:id>', methods=['PUT'])
def update_discharge_log(id):
    data = request.get_json()
    entry = db_service.get_discharge_entry_by_id(id)
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    db_service.update_discharge_entry(id, data, entry)
    return jsonify({"status": "success", "message": "Entry updated"}), 200

@discharge_bp.route('/discharge_log/<int:id>', methods=['DELETE'])
def delete_discharge_log(id):
    entry = db_service.get_discharge_entry_by_id(id)
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    db_service.delete_discharge_entry(id)
    return jsonify({"status": "success", "message": "Entry deleted"}), 200