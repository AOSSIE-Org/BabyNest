import sqlite3
from flask import Blueprint, jsonify, request
from db.db import open_db
from datetime import datetime, timedelta
import os
import sys
from error_handling.error_classes import MissingFieldError, NotFoundError
from error_handling.handlers import handle_db_errors
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent.agent import get_agent

def calculate_due_date(lmp_str, cycle_length):
    lmp_date = datetime.strptime(lmp_str, "%Y-%m-%d")
    # Standard: LMP + 280 days for 28-day cycle. Adjust if cycle differs
    adjustment = int(cycle_length) - 28 if cycle_length else 0
    due_date = lmp_date + timedelta(days=280 + adjustment)
    return due_date.strftime("%Y-%m-%d")

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/set_profile', methods=['POST'])
@handle_db_errors
def set_profile():
    db = open_db()
    data = request.get_json()
    lmp = data.get('lmp')
    cycleLength = data.get('cycleLength')
    periodLength = data.get('periodLength')
    age = data.get('age')
    weight = data.get('weight')
    location = data.get('location')

    if not lmp or not location:
        raise MissingFieldError(['lmp', 'location'])
    
    if(not cycleLength or not isinstance(cycleLength, int)):
        return jsonify({"error": "cycleLength must be a valid integer"}), 400
    if (not isinstance(lmp, str)):
        return jsonify({"error": "lmp must be a valid date string"}), 400
    
    try:
        due_date = calculate_due_date(lmp, cycleLength)
    except ValueError:
        return jsonify({"error": "Invalid lmp date format, expected YYYY-MM-DD"}), 400
    
    db.execute('DELETE FROM profile')
    db.execute(
        'INSERT INTO profile (lmp, cycleLength, periodLength, age, weight, user_location, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?)',
        (lmp, cycleLength, periodLength, age, weight, location, due_date)
    )
    db.commit()
    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="profile", operation="create")
    return jsonify({"status": "success", "message": "Profile set successfully with due date","dueDate": due_date}), 200


@profile_bp.route('/get_profile', methods=['GET'])
@handle_db_errors
def get_profile():
    db = open_db()
    profile = db.execute('SELECT * FROM profile').fetchone()
    if profile is None:
        raise NotFoundError(resource="Profile")
    
    return jsonify({
        "due_date": profile['dueDate'],
        "location": profile['user_location'],
    }), 200
    

@profile_bp.route('/delete_profile', methods=['DELETE'])
@handle_db_errors
def delete_profile():
    db = open_db()
    db.execute('DELETE FROM profile')
    db.commit()

    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="profile", operation="delete")
    
    return jsonify({"status": "success", "message": "Profile deleted successfully"}), 200
    
    
@profile_bp.route('/update_profile', methods=['PATCH'])
@handle_db_errors
def update_profile():
    db = open_db()  

    profile = db.execute('SELECT * FROM profile').fetchone()
    data = request.get_json()
    if profile is None:
        raise NotFoundError(resource="Profile")
    lmp = data.get('lmp', profile['lmp'])
    cycleLength = data.get('cycleLength', profile['cycleLength'])
    periodLength = data.get('periodLength', profile['periodLength'])
    age = data.get('age', profile['age'])
    weight = data.get('weight', profile['weight'])
    location = data.get('location', profile['user_location']) 
    
    if(not cycleLength or not isinstance(cycleLength, int)):
        return jsonify({"error": "cycleLength must be a valid integer"}), 400
    if (not isinstance(lmp, str)):
        return jsonify({"error": "lmp must be a valid date string"}), 400
    
    try:
        due_date = calculate_due_date(lmp, cycleLength)
    except ValueError:
        return jsonify({"error": "Invalid lmp date format, expected YYYY-MM-DD"}), 400


    db.execute(
        'UPDATE profile SET dueDate = ?, user_location = ?, lmp = ?, cycleLength = ?, periodLength = ?, age = ?, weight = ?',
        (due_date, location, lmp, cycleLength, periodLength, age, weight)  
    )
    db.commit()
    
    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="profile", operation="update")
    
    return jsonify({"status": "success", "message": "Profile updated successfully"}), 200
   