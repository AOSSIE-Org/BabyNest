from flask import Blueprint, request, jsonify
from db.db import open_db

medicine_bp = Blueprint('medicine', __name__)

# Create
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

# Read all
@medicine_bp.route('/get_medicine', methods=['GET'])
def get_all_medicine():
    db = open_db()
    rows = db.execute('SELECT * FROM weekly_medicine').fetchall()
    return jsonify([dict(row) for row in rows]), 200

# Read by week
@medicine_bp.route('/medicine/<int:week>', methods=['GET'])
def get_week_medicine(week):
    db = open_db()
    rows = db.execute('SELECT * FROM weekly_medicine WHERE week_number = ?', (week,)).fetchall()
    return jsonify([dict(row) for row in rows]), 200

# Read by ID
@medicine_bp.route('/medicine/<int:id>', methods=['GET'])
def get_medicine(id):
    db = open_db()
    entry = db.execute('SELECT * FROM weekly_medicine WHERE id = ?', (id,)).fetchone()
    if not entry:
        return jsonify({"error": "Entry not found"}), 404
    return jsonify(dict(entry)), 200

# Update by ID
@medicine_bp.route('/medicine/<int:id>', methods=['PUT'])
def update_medicine(id):
    db = open_db()
    data = request.json
    entry = db.execute('SELECT * FROM weekly_medicine WHERE id = ?', (id,)).fetchone()
    
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    db.execute(
        '''UPDATE weekly_medicine SET week_number=?, name=?, dose=?, time=?, note=? WHERE id=?''',
        (
            data.get('week_number', entry['week_number']),
            data.get('name', entry['name']),
            data.get('dose', entry['dose']),
            data.get('time', entry['time']),
            data.get('note', entry['note']),
            id
        )
    )
    db.commit()

    return jsonify({"status": "success", "message": "Medicine updated"}), 200

# Delete by ID
@medicine_bp.route('/medicine/<int:id>', methods=['DELETE'])
def delete_medicine(id):
    db = open_db()
    entry = db.execute('SELECT * FROM weekly_medicine WHERE id = ?', (id,)).fetchone()
    
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    db.execute('DELETE FROM weekly_medicine WHERE id = ?', (id,))
    db.commit()

    return jsonify({"status": "success", "message": "Medicine entry deleted"}), 200