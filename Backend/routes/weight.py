from flask import Blueprint, request, jsonify
from services import db_service

weight_bp = Blueprint('weight', __name__)

@weight_bp.route('/weight', methods=['POST'])
def log_weight():
    data = request.json
    week = data.get('week_number')
    weight = data.get('weight')
    note = data.get('note')

    if not all([week, weight]):
        return jsonify({"error": "Missing week_number or weight"}), 400

    # Data validation remains in the route to ensure immediate feedback
    try:
       week = int(week)
       if week < 1 or week > 52:
           return jsonify({"error": "Week number must be between 1 and 52"}), 400
    except (ValueError, TypeError):
       return jsonify({"error": "Week number must be a valid integer"}), 400
   
    try:
       weight = float(weight)
       if weight <= 0 or weight > 1000:
           return jsonify({"error": "Weight must be a positive number"}), 400
    except (ValueError, TypeError):
       return jsonify({"error": "Weight must be a valid number"}), 400

    db_service.save_weight(week, weight, note)
    return jsonify({"status": "success", "message": "Weight added"}), 200

@weight_bp.route('/weight', methods=['GET'])
def get_all_weights():
    weights = db_service.get_all_weight_entries()
    return jsonify(weights), 200

@weight_bp.route('/weight/<int:week>', methods=['GET'])
def get_week_weight(week):
    weights = db_service.get_weight_by_week(week)
    return jsonify(weights), 200

@weight_bp.route('/weight/<int:id>', methods=['GET'])
def get_weight(id):
    weight = db_service.get_weight_by_id(id)
    if not weight:
        return jsonify({"error": "Weight entry not found"}), 404
    return jsonify(dict(weight)), 200   

@weight_bp.route('/weight/<int:id>', methods=['PUT'])
def update_weight(id):
    weight_entry = db_service.get_weight_by_id(id)
    if not weight_entry:
        return jsonify({"error": "Weight entry not found"}), 404

    db_service.update_weight_entry(id, request.json, weight_entry)
    return jsonify({"status": "success", "message": "Weight updated"}), 200

@weight_bp.route('/weight/<int:id>', methods=['DELETE'])
def delete_weight(id):
    weight_entry = db_service.get_weight_by_id(id)
    if not weight_entry:
        return jsonify({"error": "Weight entry not found"}), 404

    db_service.delete_weight_entry(id)
    return jsonify({"status": "success", "message": "Weight entry deleted"}), 200