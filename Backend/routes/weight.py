from flask import Blueprint, request, jsonify
from db.db import open_db
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent.agent import get_agent

weight_bp = Blueprint('weight', __name__)

# Create
@weight_bp.route('/weight', methods=['POST'])
def log_weight():
    db = open_db()
    data = request.json
    week = data.get('week_number')
    weight = data.get('weight')
    note = data.get('note')

    if not all([week, weight]):
        return jsonify({"error": "Missing week_number or weight"}), 400

    # Validate week number
    try:
       week = int(week)
       if week < 1 or week > 52:
           return jsonify({"error": "Week number must be between 1 and 52"}), 400
    except (ValueError, TypeError):
       return jsonify({"error": "Week number must be a valid integer"}), 400
   
    # Validate weight
    try:
       weight = float(weight)
       if weight <= 0 or weight > 1000:  # reasonable range in kg
           return jsonify({"error": "Weight must be a positive number up to 1000kg"}), 400
    except (ValueError, TypeError):
       return jsonify({"error": "Weight must be a valid number"}), 400
    db.execute('INSERT INTO weekly_weight (week_number, weight, note) VALUES (?, ?, ?)', (week, weight, note))

    db.commit()
    
    # Invalidate cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.invalidate_cache()
    
    return jsonify({"status": "success", "message": "Weight added"}), 200

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
    db = open_db()
    weight = db.execute('SELECT * FROM weekly_weight WHERE id = ?', (id,)).fetchone()
    if not weight:
        return jsonify({"error": "Weight entry not found"}), 404
    return jsonify(dict(weight)), 200   

# Update by ID
@weight_bp.route('/weight/<int:id>', methods=['PUT'])
def update_weight(id):
    db = open_db()
    data = request.json
    weight_entry = db.execute('SELECT * FROM weekly_weight WHERE id = ?', (id,)).fetchone()
    
    if not weight_entry:
        return jsonify({"error": "Weight entry not found"}), 404

    db.execute(
        'UPDATE weekly_weight SET week_number=?, weight=?, note=? WHERE id=?',
        (data.get('week_number', weight_entry['week_number']),
         data.get('weight', weight_entry['weight']),
         data.get('note', weight_entry['note']),
         id)
    )
    db.commit()
    
    # Invalidate cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.invalidate_cache()
    
    return jsonify({"status": "success", "message": "Weight updated"}), 200

# Delete by ID
@weight_bp.route('/weight/<int:id>', methods=['DELETE'])
def delete_weight(id):
    db = open_db()
    weight_entry = db.execute('SELECT * FROM weekly_weight WHERE id = ?', (id,)).fetchone()
    
    if not weight_entry:
        return jsonify({"error": "Weight entry not found"}), 404

    db.execute('DELETE FROM weekly_weight WHERE id = ?', (id,))
    db.commit()
    
    # Invalidate cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.invalidate_cache()
    
    return jsonify({"status": "success", "message": "Weight entry deleted"}), 200