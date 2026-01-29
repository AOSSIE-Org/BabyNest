from flask import Blueprint, request, jsonify
from db.db import open_db
import os
from services import db_service

weight_bp = Blueprint('weight', __name__)

# Create
@weight_bp.route('/weight', methods=['POST'])
def log_weight():
    data = request.json
    week = data.get('week_number')
    weight = data.get('weight')
    note = data.get('note')

    # STEP 1:Basic validation (Routine Check)
    if not all([week, weight]):
        return jsonify({"error": "Missing week_number or weight"}), 400

    try:
        # STEP 2
        db_service.save_weight(week, weight, note)
        
        return jsonify({"status": "success", "message": "Weight added"}), 201
    except Exception as e:
        # if some error occoured in service layer
        return jsonify({"error": str(e)}), 500

# Read all
@weight_bp.route('/weight', methods=['GET'])
def get_all_weights():
    db = open_db()
    weights = db.execute('SELECT * FROM weekly_weight').fetchall()
    return jsonify([dict(row) for row in weights]), 200

# Read by week
@weight_bp.route('/weight/<int:week>', methods=['GET'])
def get_week_weight(week):
    db = open_db()
    weights = db.execute('SELECT * FROM weekly_weight WHERE week_number = ?', (week,)).fetchall()
    return jsonify([dict(row) for row in weights]), 200

# Read by ID
@weight_bp.route('/weight/<int:id>', methods=['GET'])
def get_weight(id):
    weight=db_service.get_weight_by_id(id)
    if not weight:
        return jsonify({"error": "Weight entry not found"}), 404
    return jsonify(dict(weight)), 200   

# Update by ID
@weight_bp.route('/weight/<int:id>', methods=['PUT'])
def update_weight(id):
    weight_entry = db_service.get_weight_by_id(id)
    if not weight_entry:
        return jsonify({"error": "Weight entry not found"}), 404

    db_service.update_weight_entry(id, request.json, weight_entry)
    return jsonify({"status": "success", "message": "Weight updated"}), 200

# Delete by ID
@weight_bp.route('/weight/<int:id>', methods=['DELETE'])
def delete_weight(id):
    weight_entry = db_service.get_weight_by_id(id)
    if not weight_entry:
        return jsonify({"error": "Weight entry not found"}), 404

    db_service.delete_weight_entry(id)
    return jsonify({"status": "success", "message": "Weight entry deleted"}), 200
    
   