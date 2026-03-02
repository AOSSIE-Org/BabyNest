from flask import Blueprint, request, jsonify
from db.db import open_db
import os
import sys
from error_handling.error_classes import MissingFieldError, NotFoundError
from error_handling.handlers import handle_db_errors
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent.agent import get_agent


discharge_bp = Blueprint('discharge', __name__)

# Create
@discharge_bp.route('/set_discharge_log', methods=['POST'])
@handle_db_errors
def add_discharge_log():
    data = request.get_json()
    required = ['week_number', 'type', 'color', 'bleeding']

    missing = [field for field in required if field not in data]

    if missing:
        raise MissingFieldError(missing)

    db = open_db()
    db.execute(
        '''INSERT INTO discharge_logs (week_number, type, color, bleeding, note)
           VALUES (?, ?, ?, ?, ?)''',
        (data['week_number'], data['type'], data['color'], data['bleeding'], data.get('note'))
    )
    db.commit()
    
    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="discharge", operation="create")
    
    return jsonify({"status": "success", "message": "Discharge entry added"}), 201

# Read all
@discharge_bp.route('/get_discharge_logs', methods=['GET'])
@handle_db_errors
def get_discharge_logs():
    db = open_db()
    rows = db.execute('SELECT * FROM discharge_logs ORDER BY created_at DESC').fetchall()
    return jsonify([dict(row) for row in rows]), 200

# Read by week
@discharge_bp.route('/get_discharge_logs/<int:week>', methods=['GET'])
@handle_db_errors
def get_discharge_logs_by_week(week):
    db = open_db()
    rows = db.execute('SELECT * FROM discharge_logs WHERE week_number = ? ORDER BY created_at DESC', (week,)).fetchall()
    return jsonify([dict(row) for row in rows]), 200

# Read by ID
@discharge_bp.route('/discharge_log/<int:id>', methods=['GET'])
@handle_db_errors
def get_discharge_log(id):
    db = open_db()
    entry = db.execute('SELECT * FROM discharge_logs WHERE id = ?', (id,)).fetchone()
    if not entry:
        raise NotFoundError(resource="Discharge entry", resource_id=id)
    return jsonify(dict(entry)), 200

# Update
@discharge_bp.route('/discharge_log/<int:id>', methods=['PATCH'])
@handle_db_errors
def update_discharge_log(id):
    data = request.get_json()
    db = open_db()
    entry = db.execute('SELECT * FROM discharge_logs WHERE id = ?', (id,)).fetchone()
    if not entry:
        raise NotFoundError(resource="Discharge entry", resource_id=id)

    db.execute(
        '''UPDATE discharge_logs SET week_number=?, type=?, color=?, bleeding=?, note=? WHERE id=?''',
        (
            data.get('week_number', entry['week_number']),
            data.get('type', entry['type']),
            data.get('color', entry['color']),
            data.get('bleeding', entry['bleeding']),
            data.get('note', entry['note']),
            id
        )
    )
    db.commit()
    
    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="discharge", operation="update")
    
    return jsonify({"status": "success", "message": "Entry updated"}), 200

# Delete
@discharge_bp.route('/discharge_log/<int:id>', methods=['DELETE'])
@handle_db_errors
def delete_discharge_log(id):
    db = open_db()
    entry = db.execute('SELECT * FROM discharge_logs WHERE id = ?', (id,)).fetchone()
    if not entry:
        raise NotFoundError(resource="Discharge entry", resource_id=id)

    db.execute('DELETE FROM discharge_logs WHERE id = ?', (id,))
    db.commit()
    
    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="discharge", operation="delete")
    
    return jsonify({"status": "success", "message": "Entry deleted"}), 200