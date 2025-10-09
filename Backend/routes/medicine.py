from flask import Blueprint, request, jsonify, session
from functools import wraps
from db.db import open_db
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent.agent import get_agent

medicine_bp = Blueprint('medicine', __name__)

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

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

    # Validate data types and ranges
    try:
       week = int(week)
       if week < 1 or week > 52:
           return jsonify({"error": "Week number must be between 1 and 52"}), 400
    except (ValueError, TypeError):
       return jsonify({"error": "Week number must be a valid integer"}), 400
   
    if not isinstance(name, str) or len(name.strip()) == 0:
       return jsonify({"error": "Medicine name must be a non-empty string"}), 400
   
    if not isinstance(dose, str) or len(dose.strip()) == 0:
       return jsonify({"error": "Dose must be a non-empty string"}), 400

    db.execute(
        'INSERT INTO weekly_medicine (week_number, name, dose, time, note) VALUES (?, ?, ?, ?, ?)',
        (week, name, dose, time, note)
    )
    db.commit()

    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="medicine", operation="create")

    return jsonify({"status": "success", "message": "Medicine added"}), 200

# Read all
@medicine_bp.route('/get_medicine', methods=['GET'])
def get_all_medicine():
    db = open_db()
    rows = db.execute('SELECT * FROM weekly_medicine').fetchall()
    return jsonify([dict(row) for row in rows]), 200

# Read by week
@medicine_bp.route('/medicine/week/<int:week>', methods=['GET'])
@require_auth
def get_week_medicine(week):
    db = open_db()
    rows = db.execute('SELECT * FROM weekly_medicine WHERE week_number = ?', (week,)).fetchall()
    return jsonify([dict(row) for row in rows]), 200

# Read by ID
@medicine_bp.route('/medicine/<int:id>', methods=['GET'])
@require_auth
def get_medicine(id):
    db = open_db()
    entry = db.execute('SELECT * FROM weekly_medicine WHERE id = ?', (id,)).fetchone()
    if not entry:
        return jsonify({"error": "Entry not found"}), 404
    return jsonify(dict(entry)), 200

# Update by ID
@medicine_bp.route('/medicine/<int:id>', methods=['PUT'])
@require_auth
def update_medicine(id):
    db = open_db()
    data = request.json
    entry = db.execute('SELECT * FROM weekly_medicine WHERE id = ?', (id,)).fetchone()
    
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    # Validate week_number if provided
    if 'week_number' in data:
        try:
            week = int(data['week_number'])
            if week < 1 or week > 52:
                return jsonify({"error": "Week number must be between 1 and 52"}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "Week number must be a valid integer"}), 400
    
    # Validate other fields if provided
    if 'name' in data and (not isinstance(data['name'], str) or len(data['name'].strip()) == 0):
        return jsonify({"error": "Medicine name must be a non-empty string"}), 400
    
    if 'dose' in data and (not isinstance(data['dose'], str) or len(data['dose'].strip()) == 0):
        return jsonify({"error": "Dose must be a non-empty string"}), 400

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

    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="medicine", operation="update")

    return jsonify({"status": "success", "message": "Medicine updated"}), 200

# Delete by ID
@medicine_bp.route('/medicine/<int:id>', methods=['DELETE'])
@require_auth
def delete_medicine(id):
    db = open_db()
    entry = db.execute('SELECT * FROM weekly_medicine WHERE id = ?', (id,)).fetchone()
    
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    db.execute('DELETE FROM weekly_medicine WHERE id = ?', (id,))
    db.commit()

    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="medicine", operation="delete")

    return jsonify({"status": "success", "message": "Medicine entry deleted"}), 200