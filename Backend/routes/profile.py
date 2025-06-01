import sqlite3
from flask import Blueprint, jsonify, request
from db.db import open_db
from datetime import datetime, timedelta

def calculate_due_date(lmp_str, cycle_length):
    lmp_date = datetime.strptime(lmp_str, "%Y-%m-%d")
    # Standard: LMP + 280 days for 28-day cycle. Adjust if cycle differs
    adjustment = int(cycle_length) - 28 if cycle_length else 0
    due_date = lmp_date + timedelta(days=280 + adjustment)
    return due_date.strftime("%Y-%m-%d")

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/set_profile', methods=['POST'])
def set_profile():
    db = open_db()
    try:
        data = request.json
        lmp = data.get('lmp')
        cycleLength = data.get('cycleLength')
        periodLength = data.get('periodLength')
        age = data.get('age')
        weight = data.get('weight')
        location = data.get('location')

        if not lmp or not location:
            return jsonify({"error": "Last menstrual period and location are required"}), 400
        
        due_date = calculate_due_date(lmp, cycleLength)

        db.execute('DELETE FROM profile')
        db.execute(
            'INSERT INTO profile (lmp, cycleLength, periodLength, age, weight, user_location, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?)',
            (lmp, cycleLength, periodLength, age, weight, location, due_date)
        )
        db.commit()

        return jsonify({"status": "success", "message": "Profile set successfully with due date","dueDate": due_date}), 200
    
    except sqlite3.OperationalError as error:
        return jsonify({"error": str(error)}), 500

@profile_bp.route('/get_profile', methods=['GET'])
def get_profile():
    db = open_db()

    try: 
        profile = db.execute('SELECT * FROM profile').fetchone()
        if profile is None:
            return jsonify({"error": "Profile not found"}), 404
        
        return jsonify({
            "due_date": profile[7],
            "location": profile[6]
        }), 200
    
    except sqlite3.OperationalError:
        return jsonify({"error": "Database Error"}), 500

@profile_bp.route('/delete_profile', methods=['DELETE'])
def delete_profile():
    db = open_db()

    try:
        db.execute('DELETE FROM profile')
        db.commit()
        return jsonify({"status": "success", "message": "Profile deleted successfully"}), 200
    except sqlite3.OperationalError:
        return jsonify({"error": "Database Error"}), 500    
    
@profile_bp.route('/update_profile', methods=['PUT'])
def update_profile():
    db = open_db()  

    try: 
        db.execute('SELECT * FROM profile')
        data = request.json
        lmp = data.get('lmp')
        cycle_length = data.get('cycle_length')
        period_length = data.get('period_length')
        age = data.get('age')
        weight = data.get('weight')
        location = data.get('location') 

        if not lmp or not location:
            return jsonify({"error": "Last menstrual period and location are required"}), 400
        
        db.execute(
            'UPDATE profile SET due_date = ?, user_location = ?',
            (lmp, cycle_length, period_length, age, weight, location)    
        )
        db.commit()
        return jsonify({"status": "success", "message": "Profile updated successfully"}), 200
    except sqlite3.OperationalError:    
        return jsonify({"error": "Database Error"}), 500    