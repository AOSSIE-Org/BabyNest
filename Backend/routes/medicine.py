from flask import Blueprint, request, jsonify, session, current_app
from functools import wraps
from db.db import open_db
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent.agent import get_agent
from error_handling.handlers import handle_db_errors
from error_handling.error_classes import MissingFieldError, NotFoundError
from utils import validate_medicine_data, validate_week_number

medicine_bp = Blueprint('medicine', __name__)

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

# Create
@medicine_bp.route('/set_medicine', methods=['POST'])
@handle_db_errors
def add_medicine():
    db = open_db()
    required = ['week_number', 'name', 'dose', 'time']
    data = request.get_json()
    missing = [field for field in required if field not in data] 
    if missing:
        raise MissingFieldError(missing)
    
    week = data['week_number']
    name = data['name']
    dose = data['dose']
    time = data['time']
    note = data.get('note')
    fields = {}

    # Validate data types and ranges
    mode = current_app.config.get("ENV", "development")
    fields = validate_medicine_data(data)

    if fields:
        if mode == "production":
            return jsonify({"error": "Invalid input values"}), 400
        return jsonify({"error": "Invalid input values", "fields": fields}), 400


    db.execute(
        'INSERT INTO weekly_medicine (week_number, name, dose, time, note) VALUES (?, ?, ?, ?, ?)',
        (week, name, dose, time, note)
    )
    db.commit()

    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="medicine", operation="create")

    return jsonify({"status": "success", "message": "Medicine added"}), 201

# Read all
@medicine_bp.route('/get_medicine', methods=['GET'])
@handle_db_errors
def get_all_medicine():
    db = open_db()
    rows = db.execute('SELECT * FROM weekly_medicine').fetchall()
    return jsonify([dict(row) for row in rows]), 200

# Read by week
@medicine_bp.route('/medicine/week/<int:week>', methods=['GET'])
@require_auth
@handle_db_errors
def get_week_medicine(week):
    db = open_db()
    rows = db.execute('SELECT * FROM weekly_medicine WHERE week_number = ?', (week,)).fetchall()
    return jsonify([dict(row) for row in rows]), 200

# Read by ID
@medicine_bp.route('/medicine/<int:id>', methods=['GET'])
@require_auth
@handle_db_errors
def get_medicine(id):
    db = open_db()
    entry = db.execute('SELECT * FROM weekly_medicine WHERE id = ?', (id,)).fetchone()
    if not entry:
        raise NotFoundError(resource="Medicine entry", resource_id=id)
    return jsonify(dict(entry)), 200

# Update by ID
@medicine_bp.route('/medicine/<int:id>', methods=['PATCH'])
@require_auth
@handle_db_errors
def update_medicine(id):
    db = open_db()
    data = request.get_json()
    entry = db.execute('SELECT * FROM weekly_medicine WHERE id = ?', (id,)).fetchone()
    
    if not entry:
        raise NotFoundError(resource="Medicine entry", resource_id=id)
    
    # Validate other fields if provided
    if 'name' in data or 'dose' in data or 'week_number' in data:
        fields = validate_medicine_data(data)
        if fields:
            mode = current_app.config.get("ENV", "development")
            if mode == "production":
                return jsonify({"error": "Invalid input values"}), 400
            return jsonify({"error": "Invalid input values", "fields": fields}), 400

    db.execute(
        '''UPDATE weekly_medicine SET week_number=?, name=?, dose=?, time=?, note=? WHERE id=?''',
        (
            data.get('week_number', entry['week_number']),
            data.get('name', entry['name']),
            data.get('dose', entry['dose']),
            data.get('time', entry['time']),
            data.get('note', entry['note']),
            id
        )
    )
    db.commit()

    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="medicine", operation="update")

    return jsonify({"status": "success", "message": "Medicine updated"}), 200

# Delete by ID
@medicine_bp.route('/medicine/<int:id>', methods=['DELETE'])
@require_auth
@handle_db_errors
def delete_medicine(id):
    db = open_db()
    entry = db.execute('SELECT * FROM weekly_medicine WHERE id = ?', (id,)).fetchone()
    
    if not entry:
        raise NotFoundError(resource="Medicine entry", resource_id=id)

    db.execute('DELETE FROM weekly_medicine WHERE id = ?', (id,))
    db.commit()

    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="medicine", operation="delete")

    return jsonify({"status": "success", "message": "Medicine entry deleted"}), 200