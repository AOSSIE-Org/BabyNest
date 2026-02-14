import sqlite3
import logging
import re
from datetime import datetime

from flask import Blueprint, jsonify, request
from cerberus import Validator

from db.db import open_db, close_db

appointments_bp = Blueprint('appointments', __name__)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def make_error(message, status_code=400, details=None):
    """Consistent structured error response."""
    payload = {"error": {"message": message}}
    if details:
        payload["error"]["details"] = details
    return jsonify(payload), status_code


# ---- Cerberus Validator ----

class AppointmentValidator(Validator):
    """Custom Cerberus validator with date/time rules."""

    def _validate_is_date(self, is_date, field, value):
        """
        The rule 'is_date': True enforces YYYY-MM-DD format.
        """
        if is_date:
            try:
                datetime.strptime(value, "%Y-%m-%d")
            except ValueError:
                self._error(field, "Invalid date format. Expected YYYY-MM-DD")

    def _validate_is_time(self, is_time, field, value):
        """
        The rule 'is_time': True enforces HH:MM AM/PM.
        """
        if is_time:
            pattern = r"^(0[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$"
            if not re.match(pattern, value):
                self._error(field, "Invalid time format. Expected HH:MM AM/PM")


appointment_schema = {
    # Required fields
    "title": {
        "type": "string",
        "required": True,
        "empty": False
    },
    "date": {
        "type": "string",
        "required": True,
        "is_date": True  # custom rule
    },
    "time": {
        "type": "string",
        "required": True,
        "is_time": True  # custom rule
    },
    "location": {
        "type": "string",
        "required": True,
        "empty": False
    },

    # Optional fields
    "status": {
        "type": "string",
        "required": False,
        "allowed": ["Pending", "Completed", "Cancelled"]
    },
    "description": {
        "type": "string",
        "required": False
    }
}


def parse_json_body():
    """Get JSON body safely."""
    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        return None, make_error(
            "Invalid or missing JSON body. Ensure Content-Type is application/json",
            400
        )
    return data, None


def validate_appointment_payload(data):
    """
    Validate appointment payload using Cerberus.
    Returns (is_valid, error_response | None).
    """
    v = AppointmentValidator(appointment_schema, allow_unknown=False)

    if not v.validate(data):
        errors = v.errors

        # Detect missing required fields
        missing_fields = [
            field for field, msgs in errors.items()
            if any("required field" in str(m) for m in msgs)
        ]
        if missing_fields:
            return False, make_error(
                "Missing required fields",
                400,
                details={"fields": missing_fields}
            )

        # Specific time format error
        if "time" in errors:
            # Our custom message is already "Invalid time format. Expected HH:MM AM/PM"
            return False, make_error(
                "Invalid time format. Expected HH:MM AM/PM",
                400
            )

        # Specific status value error
        if "status" in errors:
            return False, make_error(
                "Invalid status value",
                400,
                details={"allowed_values": ["Pending", "Completed", "Cancelled"]}
            )

        # Generic validation error (collect all)
        return False, make_error(
            "Invalid input data",
            400,
            details={"validation_errors": errors}
        )

    return True, None


# ---- Routes ----

@appointments_bp.route('/get_appointments', methods=['GET'])
def get_appointments():
    db = open_db()
    try:
        try:
            appointments = db.execute('SELECT * FROM appointments').fetchall()
        except sqlite3.OperationalError:
            logger.exception("Database operational error while fetching all appointments")
            return make_error("Database error", 500)

        appointments_list = [dict(appt) for appt in appointments]
        return jsonify(appointments_list), 200

    except Exception:
        logger.exception("Unexpected error while fetching appointments")
        return make_error("Internal server error", 500)
    finally:
        close_db(db)


@appointments_bp.route('/get_appointment/<int:appointment_id>', methods=['GET'])
def get_appointment(appointment_id):
    if appointment_id <= 0:
        return make_error("Invalid appointment ID", 400)

    db = open_db()
    try:
        try:
            appointment = db.execute(
                'SELECT * FROM appointments WHERE id = ?',
                (appointment_id,)
            ).fetchone()
        except sqlite3.OperationalError:
            logger.exception("Database operational error while fetching appointment")
            return make_error("Database error", 500)

        if not appointment:
            return make_error("Appointment not found", 404)

        return jsonify(dict(appointment)), 200

    except Exception:
        logger.exception("Unexpected error while fetching appointment")
        return make_error("Internal server error", 500)
    finally:
        close_db(db)


@appointments_bp.route('/add_appointment', methods=['POST'])
def add_appointment():
    data, error_response = parse_json_body()
    if error_response:
        return error_response

    is_valid, error_response = validate_appointment_payload(data)
    if not is_valid:
        return error_response

    # Map API fields → DB columns
    title = data["title"].strip()
    appointment_date = data["date"].strip()
    appointment_time = data["time"].strip()
    appointment_location = data["location"].strip()
    appointment_status = data.get("status", "Pending")
    description = data.get("description", "") or ""
    description = description.strip()

    db = open_db()
    try:
        try:
            db.execute(
                '''
                INSERT INTO appointments 
                (title, content, appointment_date, appointment_time, appointment_location, appointment_status)
                VALUES (?, ?, ?, ?, ?, ?)
                ''',
                (title, description, appointment_date, appointment_time, appointment_location, appointment_status)
            )
            db.commit()
        except sqlite3.OperationalError:
            logger.exception("Database operational error while adding appointment")
            return make_error("Database error", 500)

        return jsonify({
            "status": "success",
            "message": "Appointment added successfully"
        }), 200

    except Exception:
        logger.exception("Unexpected error while adding appointment")
        return make_error("Internal server error", 500)
    finally:
        close_db(db)


@appointments_bp.route('/update_appointment/<int:appointment_id>', methods=['PUT'])
def update_appointment(appointment_id):
    if appointment_id <= 0:
        return make_error("Invalid appointment ID", 400)

    data, error_response = parse_json_body()
    if error_response:
        return error_response

    is_valid, error_response = validate_appointment_payload(data)
    if not is_valid:
        return error_response

    title = data["title"].strip()
    appointment_date = data["date"].strip()
    appointment_time = data["time"].strip()
    appointment_location = data["location"].strip()
    appointment_status = data.get("status", "Pending")
    description = data.get("description", "") or ""
    description = description.strip()

    db = open_db()
    try:
        try:
            existing_appointment = db.execute(
                'SELECT * FROM appointments WHERE id = ?',
                (appointment_id,)
            ).fetchone()
        except sqlite3.OperationalError:
            logger.exception("Database operational error while checking appointment for update")
            return make_error("Database error", 500)

        if not existing_appointment:
            return make_error("Appointment not found", 404)

        try:
            db.execute(
                '''
                UPDATE appointments 
                SET title = ?, content = ?, appointment_date = ?, appointment_time = ?, 
                    appointment_location = ?, appointment_status = ?
                WHERE id = ?
                ''',
                (title, description, appointment_date, appointment_time,
                 appointment_location, appointment_status, appointment_id)
            )
            db.commit()
        except sqlite3.OperationalError:
            logger.exception("Database operational error while updating appointment")
            return make_error("Database error", 500)

        return jsonify({
            "status": "success",
            "message": "Appointment updated successfully"
        }), 200

    except Exception:
        logger.exception("Unexpected error while updating appointment")
        return make_error("Internal server error", 500)
    finally:
        close_db(db)


@appointments_bp.route('/delete_appointment/<int:appointment_id>', methods=['DELETE'])
def delete_appointment(appointment_id):
    if appointment_id <= 0:
        return make_error("Invalid appointment ID", 400)

    db = open_db()
    try:
        try:
            existing_appointment = db.execute(
                'SELECT * FROM appointments WHERE id = ?',
                (appointment_id,)
            ).fetchone()
        except sqlite3.OperationalError:
            logger.exception("Database operational error while checking appointment for deletion")
            return make_error("Database error", 500)

        if not existing_appointment:
            return make_error("Appointment not found", 404)

        try:
            db.execute('DELETE FROM appointments WHERE id = ?', (appointment_id,))
            db.commit()
        except sqlite3.OperationalError:
            logger.exception("Database operational error while deleting appointment")
            return make_error("Database error", 500)

        return jsonify({
            "status": "success",
            "message": "Appointment deleted successfully"
        }), 200

    except Exception:
        logger.exception("Unexpected error while deleting appointment")
        return make_error("Internal server error", 500)
    finally:
        close_db(db)
