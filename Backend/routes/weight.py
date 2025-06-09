from flask import Blueprint, request, jsonify
from db.db import open_db

weight_bp = Blueprint('weight', __name__)

@weight_bp.route('/weight', methods=['POST'])
def log_weight():
    db = open_db()
    data = request.json
    week = data.get('week_number')
    weight = data.get('weight')
    note = data.get('note')

    if not (week and weight):
        return jsonify({"error": "Missing week_number or weight"}), 400

    db.execute('INSERT INTO weekly_weight (week_number, weight, note) VALUES (?, ?, ?)', (week, weight, note))
    db.commit()
    return jsonify({"status": "success", "message": "Weight added"}), 200

@weight_bp.route('/weight', methods=['GET'])
def get_all_weights():
    db = open_db()
    weights = db.execute('SELECT * FROM weekly_weight').fetchall()
    return jsonify([dict(row) for row in weights]), 200

@weight_bp.route('/weight/<int:week>', methods=['GET'])
def get_week_weight(week):
    db = open_db()
    weights = db.execute('SELECT * FROM weekly_weight WHERE week_number = ?', (week,)).fetchall()
    return jsonify([dict(row) for row in weights]), 200
