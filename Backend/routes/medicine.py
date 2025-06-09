from flask import Blueprint, request, jsonify
from db.db import open_db

medicine_bp = Blueprint('medicine', __name__)

@medicine_bp.route('/set_medicine', methods=['POST'])
def add_medicine():
    db = open_db()
    data = request.json
    week = data.get('week_number')
    name = data.get('name')
    dose = data.get('dose')
    time = data.get('time')
    note = data.get('note')

    if not all([week, name, dose, time]):
        return jsonify({"error": "Missing fields"}), 400

    db.execute(
        'INSERT INTO weekly_medicine (week_number, name, dose, time, note) VALUES (?, ?, ?, ?, ?)',
        (week, name, dose, time, note)
    )
    db.commit()

    return jsonify({"status": "success", "message": "Medicine added"}), 200

@medicine_bp.route('/get_medicine', methods=['GET'])
def get_all_medicine():
    db = open_db()
    rows = db.execute('SELECT * FROM weekly_medicine').fetchall()
    return jsonify([dict(row) for row in rows]), 200

@medicine_bp.route('/medicine/<int:week>', methods=['GET'])
def get_week_medicine(week):
    db = open_db()
    rows = db.execute('SELECT * FROM weekly_medicine WHERE week_number = ?', (week,)).fetchall()
    return jsonify([dict(row) for row in rows]), 200
