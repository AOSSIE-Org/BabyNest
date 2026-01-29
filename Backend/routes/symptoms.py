from flask import Blueprint, request, jsonify
from services import db_service

symptoms_bp = Blueprint('symptoms', __name__)

@symptoms_bp.route('/symptoms', methods=['POST'])
def add_symptom():
    data = request.json
    week = data.get('week_number')
    symptom = data.get('symptom')
    note = data.get('note')

    if not (week and symptom):
        return jsonify({"error": "Missing week_number or symptom"}), 400

    try:
        db_service.save_symptom_entry(week, symptom, note)
        return jsonify({"status": "success", "message": "Symptom added"}), 201
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@symptoms_bp.route('/symptoms', methods=['GET'])
def get_all_symptoms():
    logs = db_service.get_all_symptom_entries()
    return jsonify(logs), 200

@symptoms_bp.route('/symptoms/<int:week>', methods=['GET'])
def get_week_symptoms(week):
    logs = db_service.get_symptom_entries_by_week(week)
    return jsonify(logs), 200

@symptoms_bp.route('/symptoms/<int:id>', methods=['GET'])
def get_symptom(id):
    entry = db_service.get_symptom_by_id(id)
    if not entry:
        return jsonify({"error": "Symptom entry not found"}), 404
    return jsonify(dict(entry)), 200

@symptoms_bp.route('/symptoms/<int:id>', methods=['PUT'])
def update_symptom(id):
    entry = db_service.get_symptom_by_id(id)
    if not entry:
        return jsonify({"error": "Symptom entry not found"}), 404

    db_service.update_symptom_entry(id, request.json, entry)
    return jsonify({"status": "success", "message": "Symptom updated"}), 200

@symptoms_bp.route('/symptoms/<int:id>', methods=['DELETE'])
def delete_symptom(id):
    entry = db_service.get_symptom_by_id(id)
    if not entry:
        return jsonify({"error": "Symptom entry not found"}), 404

    db_service.delete_symptom_entry(id)
    return jsonify({"status": "success", "message": "Symptom deleted"}), 200