from flask import Blueprint, request, jsonify
from db.db import open_db
import os
import sys
from error_handling.error_classes import MissingFieldError, NotFoundError
from error_handling.handlers import handle_db_errors
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent.agent import get_agent

symptoms_bp = Blueprint('symptoms', __name__)

# Create
@symptoms_bp.route('/symptoms', methods=['POST'])
@handle_db_errors
def add_symptom():
    db = open_db()
    data = request.get_json()
    week = data.get('week_number')
    symptom = data.get('symptom')
    note = data.get('note')

    if not (week and symptom):
        raise MissingFieldError(['week_number', 'symptom'])

    db.execute('INSERT INTO weekly_symptoms (week_number, symptom, note) VALUES (?, ?, ?)', (week, symptom, note))
    db.commit()

    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="symptoms", operation="create")

    return jsonify({"status": "success", "message": "Symptom added"}), 201

# Read all
@symptoms_bp.route('/symptoms', methods=['GET'])
@handle_db_errors
def get_all_symptoms():
    db = open_db()
    rows = db.execute('SELECT * FROM weekly_symptoms ORDER BY created_at DESC').fetchall()
    return jsonify([dict(row) for row in rows]), 200

# Read by week
@symptoms_bp.route('/symptoms/week/<int:week>', methods=['GET'])
@handle_db_errors
def get_week_symptoms(week):
    db = open_db()
    rows = db.execute('SELECT * FROM weekly_symptoms WHERE week_number = ? ORDER BY created_at DESC', (week,)).fetchall()
    return jsonify([dict(row) for row in rows]), 200

# Read by ID
@symptoms_bp.route('/symptoms/<int:id>', methods=['GET'])
@handle_db_errors
def get_symptom(id):
    db = open_db()
    symptom = db.execute('SELECT * FROM weekly_symptoms WHERE id = ?', (id,)).fetchone()
    if not symptom:
        raise NotFoundError(resource="Symptom entry", resource_id=id)
    return jsonify(dict(symptom)), 200

# Update by ID
@symptoms_bp.route('/symptoms/<int:id>', methods=['PATCH'])
@handle_db_errors
def update_symptom(id):
    db = open_db()
    data = request.get_json()
    symptom_entry = db.execute('SELECT * FROM weekly_symptoms WHERE id = ?', (id,)).fetchone()
    
    if not symptom_entry:
        raise NotFoundError(resource="Symptom entry", resource_id=id)

    db.execute(
        'UPDATE weekly_symptoms SET week_number=?, symptom=?, note=? WHERE id=?',
        (data.get('week_number', symptom_entry['week_number']),
         data.get('symptom', symptom_entry['symptom']),
         data.get('note', symptom_entry['note']),
         id)
    )
    db.commit()

    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="symptoms", operation="update")

    return jsonify({"status": "success", "message": "Symptom updated"}), 200

# Delete by ID
@symptoms_bp.route('/symptoms/<int:id>', methods=['DELETE'])
@handle_db_errors
def delete_symptom(id):
    db = open_db()
    symptom_entry = db.execute('SELECT * FROM weekly_symptoms WHERE id = ?', (id,)).fetchone()
    
    if not symptom_entry:
        raise NotFoundError(resource="Symptom entry", resource_id=id)

    db.execute('DELETE FROM weekly_symptoms WHERE id = ?', (id,))
    db.commit()

    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="symptoms", operation="delete")

    return jsonify({"status": "success", "message": "Symptom deleted"}), 200