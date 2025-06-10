from flask import Blueprint, request, jsonify
from db.db import open_db

discharge_bp = Blueprint('discharge', __name__)

# Create
@discharge_bp.route('/set_discharge_log', methods=['POST'])
def add_discharge_log():
    data = request.get_json()
    required = ['week_number', 'type', 'color', 'bleeding']

    if not all(field in data and data[field] for field in required):
        return jsonify({"error": "Missing required fields"}), 400

    db = open_db()
    db.execute(
        '''INSERT INTO discharge_logs (week_number, type, color, bleeding, note)
           VALUES (?, ?, ?, ?, ?)''',
        (data['week_number'], data['type'], data['color'], data['bleeding'], data.get('note'))
    )
    db.commit()
    return jsonify({"status": "success", "message": "Discharge entry added"}), 201

# Read all
@discharge_bp.route('/get_discharge_logs', methods=['GET'])
def get_discharge_logs():
    db = open_db()
    rows = db.execute('SELECT * FROM discharge_logs ORDER BY created_at DESC').fetchall()
    return jsonify([dict(row) for row in rows]), 200

# Read by week
@discharge_bp.route('/get_discharge_logs/<int:week>', methods=['GET'])
def get_discharge_logs_by_week(week):
    db = open_db()
    rows = db.execute('SELECT * FROM discharge_logs WHERE week_number = ? ORDER BY created_at DESC', (week,)).fetchall()
    return jsonify([dict(row) for row in rows]), 200

# Read by ID
@discharge_bp.route('/discharge_log/<int:id>', methods=['GET'])
def get_discharge_log(id):
    db = open_db()
    entry = db.execute('SELECT * FROM discharge_logs WHERE id = ?', (id,)).fetchone()
    if not entry:
        return jsonify({"error": "Entry not found"}), 404
    return jsonify(dict(entry)), 200

# Update
@discharge_bp.route('/discharge_log/<int:id>', methods=['PUT'])
def update_discharge_log(id):
    data = request.get_json()
    db = open_db()
    entry = db.execute('SELECT * FROM discharge_logs WHERE id = ?', (id,)).fetchone()
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

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
    return jsonify({"status": "success", "message": "Entry updated"}), 200

# Delete
@discharge_bp.route('/discharge_log/<int:id>', methods=['DELETE'])
def delete_discharge_log(id):
    db = open_db()
    entry = db.execute('SELECT * FROM discharge_logs WHERE id = ?', (id,)).fetchone()
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    db.execute('DELETE FROM discharge_logs WHERE id = ?', (id,))
    db.commit()
    return jsonify({"status": "success", "message": "Entry deleted"}), 200
