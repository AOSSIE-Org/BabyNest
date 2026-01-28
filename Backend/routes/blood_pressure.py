from flask import Blueprint, request, jsonify,current_app
from db.db import open_db
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent.agent import get_agent
from error_handling.handlers import handle_db_errors
from error_handling.error_classes import MissingFieldError, NotFoundError
from utils import validate_bp_data

bp_bp = Blueprint('blood_pressure', __name__)

# Create
@bp_bp.route('/blood_pressure', methods=['POST'])
@handle_db_errors
def add_bp_log():
    data = request.get_json()
    required = ['week_number', 'systolic', 'diastolic', 'time']

    missing = [field for field in required if field not in data]

    if missing:
        raise MissingFieldError(missing)
    
    fields = validate_bp_data(data)
    if fields:
        mode = current_app.config.get("ENV", "development")
    
        if mode == "production":
        # Only generic message in prod
            return jsonify({"error": "Invalid input data"}), 400
        else:
        # Detailed errors in dev
            return jsonify({"error": "Invalid input data", "fields": fields}), 400

    db = open_db()
    db.execute(
        '''INSERT INTO blood_pressure_logs (week_number, systolic, diastolic, time, note)
           VALUES (?, ?, ?, ?, ?)''',
        (data['week_number'], data['systolic'], data['diastolic'], data['time'], data.get('note'))
    )
    db.commit()
    
    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="blood_pressure", operation="create")
    
    return jsonify({"status": "success", "message": "Blood pressure entry added"}), 201

# Read all
@bp_bp.route('/blood_pressure', methods=['GET'])
@handle_db_errors
def get_bp_logs():
    db = open_db()
    rows = db.execute('SELECT * FROM blood_pressure_logs ORDER BY created_at DESC').fetchall()
    return jsonify([dict(row) for row in rows]), 200

# Read by week
@bp_bp.route('/blood_pressure/week/<int:week>', methods=['GET'])
@handle_db_errors
def get_bp_logs_by_week(week):
    db = open_db()
    rows = db.execute('SELECT * FROM blood_pressure_logs WHERE week_number = ? ORDER BY created_at DESC', (week,)).fetchall()
    return jsonify([dict(row) for row in rows]), 200

# Read by ID
@bp_bp.route('/blood_pressure/<int:id>', methods=['GET'])
@handle_db_errors
def get_bp_log(id):
    db = open_db()
    entry = db.execute('SELECT * FROM blood_pressure_logs WHERE id = ?', (id,)).fetchone()
    if not entry:
        raise NotFoundError(resource="Blood pressure entry", resource_id=id)
    return jsonify(dict(entry)), 200

# Update
@bp_bp.route('/blood_pressure/<int:id>', methods=['PATCH'])
@handle_db_errors
def update_bp_log(id):
    data = request.get_json()
   
    db = open_db()
    entry = db.execute('SELECT * FROM blood_pressure_logs WHERE id = ?', (id,)).fetchone()

    if not entry:
        raise NotFoundError(resource="Blood pressure entry", resource_id=id)
    
    week_number = data.get('week_number', entry['week_number'])
    systolic = data.get('systolic', entry['systolic'])
    diastolic = data.get('diastolic', entry['diastolic'])
    fields = {}
    
    if any(k in data for k in ('week_number', 'systolic', 'diastolic')):
        fields = validate_bp_data({
            'week_number': week_number,
            'systolic': systolic,
            'diastolic': diastolic
        })
    if fields:
        mode = current_app.config.get("ENV", "development")
    
        if mode == "production":
        # Only generic message in prod
            return jsonify({"error": "Invalid input data"}), 400
        else:
        # Detailed errors in dev
            return jsonify({"error": "Invalid input data", "fields": fields}), 400

    db.execute(
        '''UPDATE blood_pressure_logs SET week_number=?, systolic=?, diastolic=?, time=?, note=? WHERE id=?''',
        (
            data.get('week_number', entry['week_number']),
            data.get('systolic', entry['systolic']),
            data.get('diastolic', entry['diastolic']),
            data.get('time', entry['time']),
            data.get('note', entry['note']),
            id),
            
        )
    db.commit()
    
    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="blood_pressure", operation="update")
    
    return jsonify({"status": "success", "message": "Entry updated"}), 200

# Delete
@bp_bp.route('/blood_pressure/<int:id>', methods=['DELETE'])
@handle_db_errors
def delete_bp_log(id):
    db = open_db()

    result = db.execute('DELETE FROM blood_pressure_logs WHERE id = ?', (id,))
    if result.rowcount == 0:
        raise NotFoundError(resource="Blood pressure entry", resource_id=id)
    db.commit()
    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="blood_pressure", operation="delete")
    
    return jsonify({"status": "success", "message": "Entry deleted"}), 200