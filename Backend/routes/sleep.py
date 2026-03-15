from flask import Blueprint, request, jsonify
from db.db import open_db
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent.agent import get_agent
from error_handling.handlers import handle_db_errors
from error_handling.error_classes import MissingFieldError, NotFoundError

sleep_bp = Blueprint('sleep', __name__)

VALID_QUALITY = ['poor', 'fair', 'good', 'excellent']

@sleep_bp.route('/log_sleep', methods=['POST'])
@handle_db_errors
def add_sleep():
    db = open_db()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    week_number = data.get('week_number')
    hours = data.get('hours')
    quality = data.get('quality', '')
    note = data.get('note', '')
    
    if not week_number or hours is None:
        raise MissingFieldError(['week_number', 'hours'])
    
    if quality and quality.lower() not in VALID_QUALITY:
        return jsonify({"error": f"Invalid quality. Must be one of: {', '.join(VALID_QUALITY)}"}), 400
    
    cursor = db.execute(
        'INSERT INTO sleep_logs (week_number, hours, quality, note) VALUES (?, ?, ?, ?)',
        (week_number, hours, quality.lower() if quality else '', note)
    )
    db.commit()
    sleep_id = cursor.lastrowid
    
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="sleep", operation="create")
    
    return jsonify({"status": "success", "id": sleep_id, "message": "Sleep logged successfully"}), 201


@sleep_bp.route('/get_sleep_entries', methods=['GET'])
@handle_db_errors
def get_sleep_entries():
    db = open_db()
    week = request.args.get('week')
    
    if week:
        rows = db.execute('SELECT * FROM sleep_logs WHERE week_number = ? ORDER BY created_at DESC', (week,)).fetchall()
    else:
        rows = db.execute('SELECT * FROM sleep_logs ORDER BY created_at DESC').fetchall()
    
    return jsonify([dict(row) for row in rows]), 200


@sleep_bp.route('/update_sleep', methods=['PUT'])
@handle_db_errors
def update_sleep():
    db = open_db()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    sleep_id = data.get('id')
    if not sleep_id:
        return jsonify({"error": "Sleep ID is required"}), 400
    
    entry = db.execute('SELECT * FROM sleep_logs WHERE id = ?', (sleep_id,)).fetchone()
    if not entry:
        raise NotFoundError(resource="Sleep entry", resource_id=sleep_id)
    
    quality = data.get('quality', entry['quality'])
    if quality and quality.lower() not in VALID_QUALITY:
        return jsonify({"error": f"Invalid quality. Must be one of: {', '.join(VALID_QUALITY)}"}), 400
    
    db.execute(
        'UPDATE sleep_logs SET hours = ?, quality = ?, note = ? WHERE id = ?',
        (
            data.get('hours', entry['hours']),
            quality.lower() if quality else entry['quality'],
            data.get('note', entry['note']),
            sleep_id
        )
    )
    db.commit()
    
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="sleep", operation="update")
    
    return jsonify({"status": "success", "message": "Sleep updated successfully"}), 200


@sleep_bp.route('/delete_sleep', methods=['DELETE'])
@handle_db_errors
def delete_sleep():
    db = open_db()
    data = request.get_json()
    if not data or not data.get('id'):
        return jsonify({"error": "Sleep ID is required"}), 400
    
    sleep_id = data.get('id')
    entry = db.execute('SELECT * FROM sleep_logs WHERE id = ?', (sleep_id,)).fetchone()
    if not entry:
        raise NotFoundError(resource="Sleep entry", resource_id=sleep_id)
    
    db.execute('DELETE FROM sleep_logs WHERE id = ?', (sleep_id,))
    db.commit()
    
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="sleep", operation="delete")
    
    return jsonify({"status": "success", "message": "Sleep entry deleted successfully"}), 200
