from flask import Blueprint, request, jsonify
from db.db import open_db

symptoms_bp = Blueprint('symptoms', __name__)

# Create
@symptoms_bp.route('/symptoms', methods=['POST'])
def add_symptom():
    db = open_db()
    data = request.json
    week = data.get('week_number')
    symptom = data.get('symptom')
    note = data.get('note')

    if not (week and symptom):
        return jsonify({"error": "Missing week_number or symptom"}), 400

    db.execute('INSERT INTO weekly_symptoms (week_number, symptom, note) VALUES (?, ?, ?)', (week, symptom, note))
    db.commit()

    return jsonify({"status": "success", "message": "Symptom added"}), 201

# Read all
@symptoms_bp.route('/symptoms', methods=['GET'])
def get_all_symptoms():
    db = open_db()
    rows = db.execute('SELECT * FROM weekly_symptoms ORDER BY created_at DESC').fetchall()
    return jsonify([dict(row) for row in rows]), 200

# Read by week
@symptoms_bp.route('/symptoms/<int:week>', methods=['GET'])
def get_week_symptoms(week):
    db = open_db()
    rows = db.execute('SELECT * FROM weekly_symptoms WHERE week_number = ? ORDER BY created_at DESC', (week,)).fetchall()
    return jsonify([dict(row) for row in rows]), 200

# Read by ID
@symptoms_bp.route('/symptoms/<int:id>', methods=['GET'])
def get_symptom(id):
    db = open_db()
    symptom = db.execute('SELECT * FROM weekly_symptoms WHERE id = ?', (id,)).fetchone()
    if not symptom:
        return jsonify({"error": "Symptom entry not found"}), 404
    return jsonify(dict(symptom)), 200

# Update by ID
@symptoms_bp.route('/symptoms/<int:id>', methods=['PUT'])
def update_symptom(id):
    db = open_db()
    data = request.json
    symptom_entry = db.execute('SELECT * FROM weekly_symptoms WHERE id = ?', (id,)).fetchone()
    
    if not symptom_entry:
        return jsonify({"error": "Symptom entry not found"}), 404

    db.execute(
        'UPDATE weekly_symptoms SET week_number=?, symptom=?, note=? WHERE id=?',
        (data.get('week_number', symptom_entry['week_number']),
         data.get('symptom', symptom_entry['symptom']),
         data.get('note', symptom_entry['note']),
         id)
    )
    db.commit()

    return jsonify({"status": "success", "message": "Symptom updated"}), 200

# Delete by ID
@symptoms_bp.route('/symptoms/<int:id>', methods=['DELETE'])
def delete_symptom(id):
    db = open_db()
    symptom_entry = db.execute('SELECT * FROM weekly_symptoms WHERE id = ?', (id,)).fetchone()
    
    if not symptom_entry:
        return jsonify({"error": "Symptom entry not found"}), 404

    db.execute('DELETE FROM weekly_symptoms WHERE id = ?', (id,))
    db.commit()

    return jsonify({"status": "success", "message": "Symptom deleted"}), 200