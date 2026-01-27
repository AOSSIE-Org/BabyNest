from flask import Blueprint, request, jsonify
from db.db import open_db
import os
import sys
from error_handling.error_classes import MissingFieldError, NotFoundError
from error_handling.handlers import handle_db_errors
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent.agent import get_agent
from utils import validate_week_number, validate_weight_value

weight_bp = Blueprint('weight', __name__)


# Create
@weight_bp.route('/weight', methods=['POST'])
@handle_db_errors
def log_weight():
    db = open_db()
    data = request.get_json()
    required = ['week_number', 'weight']
    missing = [field for field in required if field not in data]
    if missing:
        raise MissingFieldError(missing)
    
    week = data['week_number']
    weight = data['weight']
    note = data.get('note')

    week_result = validate_week_number(week)
    weight_result = validate_weight_value(weight)

    if not week_result["status"]:
        return jsonify({"error": week_result["error"]}), 400
    if not weight_result["status"]:
        return jsonify({"error": weight_result["error"]}), 400


    db.execute('INSERT INTO weekly_weight (week_number, weight, note) VALUES (?, ?, ?)', (week, weight, note))

    db.commit()
    
    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="weight", operation="create")
    
    return jsonify({"status": "success", "message": "Weight added"}), 201

# Read all
@weight_bp.route('/weight', methods=['GET'])
@handle_db_errors
def get_all_weights():
    db = open_db()
    weights = db.execute('SELECT * FROM weekly_weight').fetchall()
    return jsonify([dict(row) for row in weights]), 200

# Read by week
@weight_bp.route('/weight/week/<int:week>', methods=['GET'])
@handle_db_errors
def get_week_weight(week):
    db = open_db()
    weights = db.execute('SELECT * FROM weekly_weight WHERE week_number = ?', (week,)).fetchall()
    return jsonify([dict(row) for row in weights]), 200

# Read by ID
@weight_bp.route('/weight/<int:id>', methods=['GET'])
@handle_db_errors
def get_weight(id):
    db = open_db()
    weight = db.execute('SELECT * FROM weekly_weight WHERE id = ?', (id,)).fetchone()
    if not weight:
        raise NotFoundError(resource="Weight entry", resource_id=id)
    return jsonify(dict(weight)), 200   

# Update by ID
@weight_bp.route('/weight/<int:id>', methods=['PATCH'])
@handle_db_errors
def update_weight(id):
    db = open_db()
    data = request.get_json()
    weight_entry = db.execute('SELECT * FROM weekly_weight WHERE id = ?', (id,)).fetchone()
    
    if not weight_entry:
        raise NotFoundError(resource="Weight entry", resource_id=id)
    
    week_number = data.get('week_number', weight_entry['week_number'])
    weight = data.get('weight', weight_entry['weight'])

    if not validate_week_number(week_number):
        return jsonify({"error": "Week number must be an integer between 1 and 52"}), 400
    if not validate_weight_value(weight):
        return jsonify({"error": "Weight must be a positive number up to 1000kg"}), 400


    db.execute(
        'UPDATE weekly_weight SET week_number=?, weight=?, note=? WHERE id=?',
        (week_number,
         weight,
         data.get('note', weight_entry['note']),
         id)
    )
    db.commit()
    
    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="weight", operation="update")
    
    return jsonify({"status": "success", "message": "Weight updated"}), 200

# Delete by ID
@weight_bp.route('/weight/<int:id>', methods=['DELETE'])
@handle_db_errors
def delete_weight(id):
    db = open_db()

    weight = db.execute('DELETE FROM weekly_weight WHERE id = ?', (id,))
    if weight.rowcount == 0:
        raise NotFoundError(resource="Weight entry", resource_id=id)
    db.commit()
    
    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="weight", operation="delete")
    
    return jsonify({"status": "success", "message": "Weight entry deleted"}), 200