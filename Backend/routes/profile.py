# Done
from flask import Blueprint, jsonify, request
from db.db import open_db
from datetime import datetime, timedelta
import os
import sys
from error_handling.error_classes import MissingFieldError, NotFoundError
from error_handling.handlers import handle_db_errors
from agent.agent import get_agent
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def calculate_due_date(lmp_str, cycle_length):
    lmp_date = datetime.strptime(lmp_str, "%Y-%m-%d")
    # Standard: LMP + 280 days for 28-day cycle. Adjust if cycle differs
    adjustment = int(cycle_length) - 28 if cycle_length else 0
    due_date = lmp_date + timedelta(days=280 + adjustment)
    return due_date.strftime("%Y-%m-%d")


profile_bp = Blueprint('profile', __name__)

DEFAULT_APPOINTMENTS = [
    {
        "title": "Initial OB Appointment",
        "content": "Confirm pregnancy and general health.",
        "days_after": 0,
        "time": "09:00 AM",
        "location": "City Clinic",
    },
    {
        "title": "Blood Work",
        "content": "Routine prenatal blood tests.",
        "days_after": 7,
        "time": "10:00 AM",
        "location": "LabCorp",
    },
    {
        "title": "Nutritional Counseling",
        "content": "Discuss prenatal diet and supplements.",
        "days_after": 14,
        "time": "11:00 AM",
        "location": "Wellness Center",
    },
    {
        "title": "First Ultrasound",
        "content": "Early scan to check for heartbeat.",
        "days_after": 21,
        "time": "10:30 AM",
        "location": "City Hospital",
    },
    {
        "title": "Routine Check-up",
        "content": "Weekly monitoring and vitals.",
        "days_after": 28,
        "time": "09:30 AM",
        "location": "OB-GYN Office",
    },
    {
        "title": "NT Scan Appointment",
        "content": "Nuchal translucency scan scheduling.",
        "days_after": 35,
        "time": "02:00 PM",
        "location": "Radiology Dept.",
    },
    {
        "title": "Screening Lab Visit",
        "content": "Down syndrome blood screening.",
        "days_after": 42,
        "time": "10:15 AM",
        "location": "Prenatal Lab",
    },
    {
        "title": "Follow-up Visit",
        "content": "Review test results and progress.",
        "days_after": 49,
        "time": "09:00 AM",
        "location": "HealthCare Clinic",
    },
    {
        "title": "Anomaly Scan Prep",
        "content": "Discuss upcoming detailed scan.",
        "days_after": 56,
        "time": "11:30 AM",
        "location": "OB-GYN Center",
    },
    {
        "title": "Mid-pregnancy Checkup",
        "content": "Weight, BP, baby growth tracking.",
        "days_after": 63,
        "time": "01:00 PM",
        "location": "Wellness Clinic",
    },
    {
        "title": "Vaccination Discussion",
        "content": "Discuss vaccines for pregnancy.",
        "days_after": 70,
        "time": "12:30 PM",
        "location": "OB-GYN Office",
    },
    {
        "title": "Mood & Sleep Check-in",
        "content": "Mental health & fatigue talk.",
        "days_after": 77,
        "time": "10:00 AM",
        "location": "Care Center",
    },
]


@profile_bp.route('/set_profile', methods=['POST'])
@handle_db_errors
def set_profile():
    db = open_db()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    lmp = data.get('lmp')
    cycleLength = data.get('cycleLength')
    periodLength = data.get('periodLength')
    age = data.get('age')
    weight = data.get('weight')
    location = data.get('location')

    if not lmp or not location:
        raise MissingFieldError(['lmp', 'location'])

    if (not cycleLength or not isinstance(cycleLength, int)):
        return jsonify({"error": "cycleLength must be a valid integer"}), 400
    if (not isinstance(lmp, str)):
        return jsonify({"error": "lmp must be a valid date string"}), 400

    try:
        due_date = calculate_due_date(lmp, cycleLength)
    except ValueError:
        return jsonify({"error": "Invalid lmp date format, expected YYYY-MM-DD"}), 400

    cursor = db.execute(
        'INSERT INTO profile (lmp, cycleLength, periodLength, age, weight, user_location, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?)',
        (lmp, cycleLength, periodLength, age, weight, location, due_date)
    )
    user_id = cursor.lastrowid

    for appointment in DEFAULT_APPOINTMENTS:
        appointment_date = datetime.strptime(lmp, "%Y-%m-%d").date() + timedelta(
            days=appointment["days_after"]
        )

        cursor.execute(
            """
            INSERT INTO appointments (
                user_id,
                title,
                content,
                appointment_date,
                appointment_time,
                appointment_location,
                appointment_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                appointment["title"],
                appointment["content"],
                appointment_date.isoformat(),
                appointment["time"],
                appointment["location"],
                "pending",
            )
        )

    db.commit()
    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(user_id=str(user_id), data_type="profile", operation="create")
    return jsonify({"status": "success", "message": "Profile set successfully with due date","dueDate": due_date, "user_id": str(user_id)}), 200


@profile_bp.route('/get_profile', methods=['GET'])
@handle_db_errors
def get_profile():
    db = open_db()

    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return jsonify({"error": "user_id must be a valid integer"}), 400

    profile = db.execute(
        'SELECT * FROM profile WHERE id = ?',
        (user_id,)
    ).fetchone()

    if profile is None:
        raise NotFoundError(resource="Profile")

    return jsonify(dict(profile)), 200


@profile_bp.route('/delete_profile', methods=['DELETE'])
@handle_db_errors
def delete_profile():
    db = open_db()

    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return jsonify({"error": "user_id must be a valid integer"}), 400

    cursor = db.execute(
        'DELETE FROM profile WHERE id = ?',
        (user_id,)
    )

    if cursor.rowcount == 0:
        raise NotFoundError(resource="Profile")

    db.execute(
        'DELETE FROM appointments WHERE user_id = ?',
        (user_id,)
    )

    db.commit()

    # Update cache after database update
    db_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "db",
        "database.db"
    )

    agent = get_agent(db_path)
    agent.update_cache(
        user_id=str(user_id),
        data_type="profile",
        operation="delete"
    )

    return jsonify({
        "status": "success",
        "message": "Profile deleted successfully"
    }), 200


@profile_bp.route('/update_profile', methods=['PATCH'])
@handle_db_errors
def update_profile():
    db = open_db()
    user_id = request.args.get('user_id')
    profile = db.execute('SELECT * FROM profile WHERE id = ?', (user_id,)).fetchone()
    data = request.get_json()
    print("Data", data)
    if not data:
        return jsonify({"error": "No data provided"}), 400
    if profile is None:
        raise NotFoundError(resource="Profile")
    lmp = data.get('LMP', profile['lmp'])
    cycleLength = data.get('cycleLength', profile['cycleLength'])
    periodLength = data.get('periodLength', profile['periodLength'])
    age = data.get('age', profile['age'])
    weight = data.get('weight', profile['weight'])
    location = data.get('location', profile['user_location'])
    user_name = data.get('name', profile['user_name'])

    if (not cycleLength or not isinstance(int(cycleLength, base=10), int)):
        return jsonify({"error": "cycleLength must be a valid integer"}), 400
    if (not isinstance(lmp, str)):
        return jsonify({"error": "lmp must be a valid date string"}), 400

    try:
        due_date = calculate_due_date(lmp, cycleLength)
    except ValueError:
        return jsonify({"error": "Invalid lmp date format, expected YYYY-MM-DD"}), 400

    db.execute(
        'UPDATE profile SET dueDate = ?, user_location = ?, lmp = ?, cycleLength = ?, periodLength = ?, age = ?, weight = ?, user_name = ?',
        (due_date, location, lmp, cycleLength, periodLength, age, weight, user_name)
    )
    db.commit()

    # Update cache after database update
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(str(user_id), data_type="profile", operation="update")

    return jsonify({"status": "success", "message": "Profile updated successfully"}), 200
