from flask import Blueprint, request, jsonify
from db.db import open_db
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent.agent import get_agent
from error_handling.handlers import handle_db_errors
from error_handling.error_classes import MissingFieldError, NotFoundError

mood_bp = Blueprint('mood', __name__)

VALID_MOODS = ['happy', 'sad', 'anxious', 'calm', 'excited', 'tired', 'irritable', 'hopeful', 'stressed', 'relaxed']

@mood_bp.route('/log_mood', methods=['POST'])
@handle_db_errors
def add_mood():
    db = open_db()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    week_number = data.get('week_number')
    mood = data.get('mood')
    note = data.get('note', '')
    
    if not week_number or not mood:
        raise MissingFieldError(['week_number', 'mood'])
    
    if mood.lower() not in VALID_MOODS:
        return jsonify({"error": f"Invalid mood. Must be one of: {', '.join(VALID_MOODS)}"}), 400
    
    cursor = db.execute(
        'INSERT INTO mood_logs (week_number, mood, note) VALUES (?, ?, ?)',
        (week_number, mood.lower(), note)
    )
    db.commit()
    mood_id = cursor.lastrowid
    
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="mood", operation="create")
    
    return jsonify({"status": "success", "id": mood_id, "message": "Mood logged successfully"}), 201


@mood_bp.route('/get_mood_entries', methods=['GET'])
@handle_db_errors
def get_mood_entries():
    db = open_db()
    week = request.args.get('week')
    
    if week:
        rows = db.execute('SELECT * FROM mood_logs WHERE week_number = ? ORDER BY created_at DESC', (week,)).fetchall()
    else:
        rows = db.execute('SELECT * FROM mood_logs ORDER BY created_at DESC').fetchall()
    
    return jsonify([dict(row) for row in rows]), 200


@mood_bp.route('/update_mood', methods=['PUT'])
@handle_db_errors
def update_mood():
    db = open_db()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    mood_id = data.get('id')
    if not mood_id:
        return jsonify({"error": "Mood ID is required"}), 400
    
    entry = db.execute('SELECT * FROM mood_logs WHERE id = ?', (mood_id,)).fetchone()
    if not entry:
        raise NotFoundError(resource="Mood entry", resource_id=mood_id)
    
    mood = data.get('mood', entry['mood'])
    if mood and mood.lower() not in VALID_MOODS:
        return jsonify({"error": f"Invalid mood. Must be one of: {', '.join(VALID_MOODS)}"}), 400
    
    db.execute(
        'UPDATE mood_logs SET mood = ?, note = ? WHERE id = ?',
        (mood.lower() if mood else entry['mood'], data.get('note', entry['note']), mood_id)
    )
    db.commit()
    
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="mood", operation="update")
    
    return jsonify({"status": "success", "message": "Mood updated successfully"}), 200


@mood_bp.route('/delete_mood', methods=['DELETE'])
@handle_db_errors
def delete_mood():
    db = open_db()
    data = request.get_json()
    if not data or not data.get('id'):
        return jsonify({"error": "Mood ID is required"}), 400
    
    mood_id = data.get('id')
    entry = db.execute('SELECT * FROM mood_logs WHERE id = ?', (mood_id,)).fetchone()
    if not entry:
        raise NotFoundError(resource="Mood entry", resource_id=mood_id)
    
    db.execute('DELETE FROM mood_logs WHERE id = ?', (mood_id,))
    db.commit()
    
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="mood", operation="delete")
    
    return jsonify({"status": "success", "message": "Mood entry deleted successfully"}), 200
