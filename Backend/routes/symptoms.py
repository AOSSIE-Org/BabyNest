from flask import Blueprint, request, jsonify
from db.db import open_db

symptoms_bp = Blueprint('symptoms', __name__)

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

    return jsonify({"status": "success", "message": "Symptom added"}), 200
@symptoms_bp.route('/symptoms', methods=['GET'])
def get_all_symptoms():
    db = open_db()
    rows = db.execute('SELECT * FROM weekly_symptoms').fetchall()
    return jsonify([dict(row) for row in rows]), 200

@symptoms_bp.route('/symptoms/<int:week>', methods=['GET'])
def get_week_symptoms(week):
    db = open_db()
    rows = db.execute('SELECT * FROM weekly_symptoms WHERE week_number = ?', (week,)).fetchall()
    return jsonify([dict(row) for row in rows]), 200
