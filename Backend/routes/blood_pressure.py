from flask import Blueprint, request, jsonify
from db.db import open_db

bp_bp = Blueprint('blood_pressure', __name__)

# Create
@bp_bp.route('/set_bp_log', methods=['POST'])
def add_bp_log():
    data = request.get_json()
    required = ['week_number', 'systolic', 'diastolic', 'time']

    if not all(field in data and data[field] for field in required):
        return jsonify({"error": "Missing required fields"}), 400

    db = open_db()
    db.execute(
        '''INSERT INTO blood_pressure_logs (week_number, systolic, diastolic, time, note)
           VALUES (?, ?, ?, ?, ?)''',
        (data['week_number'], data['systolic'], data['diastolic'], data['time'], data.get('note'))
    )
    db.commit()
    return jsonify({"status": "success", "message": "Blood pressure entry added"}), 201

# Read all
@bp_bp.route('/get_bp_logs', methods=['GET'])
def get_bp_logs():
    db = open_db()
    rows = db.execute('SELECT * FROM blood_pressure_logs ORDER BY created_at DESC').fetchall()
    return jsonify([dict(row) for row in rows]), 200

# Read by week
@bp_bp.route('/get_bp_logs/<int:week>', methods=['GET'])
def get_bp_logs_by_week(week):
    db = open_db()
    rows = db.execute('SELECT * FROM blood_pressure_logs WHERE week_number = ? ORDER BY created_at DESC', (week,)).fetchall()
    return jsonify([dict(row) for row in rows]), 200

# Read by ID
@bp_bp.route('/bp_log/<int:id>', methods=['GET'])
def get_bp_log(id):
    db = open_db()
    entry = db.execute('SELECT * FROM blood_pressure_logs WHERE id = ?', (id,)).fetchone()
    if not entry:
        return jsonify({"error": "Entry not found"}), 404
    return jsonify(dict(entry)), 200

# Update
@bp_bp.route('/bp_log/<int:id>', methods=['PUT'])
def update_bp_log(id):
    data = request.get_json()
    db = open_db()
    entry = db.execute('SELECT * FROM blood_pressure_logs WHERE id = ?', (id,)).fetchone()
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    db.execute(
        '''UPDATE blood_pressure_logs SET week_number=?, systolic=?, diastolic=?, time=?, note=? WHERE id=?''',
        (
            data.get('week_number', entry['week_number']),
            data.get('systolic', entry['systolic']),
            data.get('diastolic', entry['diastolic']),
            data.get('time', entry['time']),
            data.get('note', entry['note']),
            id
        )
    )
    db.commit()
    return jsonify({"status": "success", "message": "Entry updated"}), 200

# Delete
@bp_bp.route('/bp_log/<int:id>', methods=['DELETE'])
def delete_bp_log(id):
    db = open_db()
    entry = db.execute('SELECT * FROM blood_pressure_logs WHERE id = ?', (id,)).fetchone()
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    db.execute('DELETE FROM blood_pressure_logs WHERE id = ?', (id,))
    db.commit()
    return jsonify({"status": "success", "message": "Entry deleted"}), 200
