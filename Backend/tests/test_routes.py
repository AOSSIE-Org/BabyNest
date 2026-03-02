"""
Unit tests for BabyNest Backend API routes.

Tests cover CRUD operations for:
- Appointments
- Tasks
- Symptoms
- Weight

Each test class uses an isolated in-memory SQLite database
to ensure test independence and avoid side effects.
"""

import pytest
import sqlite3
import json
import os
import sys
from unittest.mock import MagicMock, patch

# Add Backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ─── Mock heavy dependencies BEFORE importing routes ────────────────────────
# Routes like symptoms.py, weight.py import agent.agent at module level,
# which in turn imports chromadb and other ML packages not needed for route tests.

mock_agent = MagicMock()
mock_agent.update_cache = MagicMock()
sys.modules['agent'] = MagicMock()
sys.modules['agent.agent'] = MagicMock()
sys.modules['agent.agent'].get_agent = MagicMock(return_value=mock_agent)

from flask import Flask, g, jsonify
from routes.appointments import appointments_bp
from routes.tasks import tasks_bp
from routes.symptoms import symptoms_bp
from routes.weight import weight_bp
from error_handling.handlers import handle_missing_field_error, handle_not_found_error
from error_handling.error_classes import MissingFieldError, NotFoundError


# ─── Test Schema (mirrors schema.sql, without mock data) ────────────────────

TEST_SCHEMA = """
CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    appointment_location TEXT NOT NULL,
    appointment_status TEXT CHECK(appointment_status IN ('pending', 'completed')) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    starting_week INTEGER NOT NULL,
    ending_week INTEGER NOT NULL,
    task_priority TEXT CHECK(task_priority IN ('low', 'medium', 'high')) DEFAULT 'low',
    isOptional BOOLEAN DEFAULT 0 NOT NULL,
    isAppointmentMade BOOLEAN DEFAULT 0,
    task_status TEXT CHECK(task_status IN ('pending', 'completed')) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS weekly_symptoms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_number INTEGER NOT NULL,
    symptom TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS weekly_weight (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_number INTEGER NOT NULL,
    weight REAL NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""


# ─── Fixtures ────────────────────────────────────────────────────────────────

def create_test_app():
    """Create a minimal Flask app for testing (avoids app.py's argparse/agent init)."""
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['ENV'] = 'development'

    # Register only the blueprints we're testing (no agent dependency)
    app.register_blueprint(appointments_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(symptoms_bp)
    app.register_blueprint(weight_bp)

    # Register custom error handlers
    app.register_error_handler(MissingFieldError, handle_missing_field_error)
    app.register_error_handler(NotFoundError, handle_not_found_error)

    @app.teardown_appcontext
    def teardown_db(exception):
        db = g.pop("db", None)
        if db is not None:
            db.close()

    return app


@pytest.fixture
def app():
    """Create application for testing."""
    app = create_test_app()
    return app


@pytest.fixture
def client(app):
    """Create a test client with a fresh in-memory database per test."""
    with app.test_client() as client:
        with app.app_context():
            # Create in-memory DB and store it in Flask's g object
            db = sqlite3.connect(":memory:")
            db.row_factory = sqlite3.Row
            db.executescript(TEST_SCHEMA)
            g.db = db
            yield client


@pytest.fixture
def client_with_data(app):
    """Create a test client pre-populated with sample data."""
    with app.test_client() as client:
        with app.app_context():
            db = sqlite3.connect(":memory:")
            db.row_factory = sqlite3.Row
            db.executescript(TEST_SCHEMA)

            # Insert sample appointments
            db.execute(
                "INSERT INTO appointments (title, content, appointment_date, appointment_time, appointment_location, appointment_status) VALUES (?, ?, ?, ?, ?, ?)",
                ("Prenatal Checkup", "Routine visit", "2025-06-15", "10:00 AM", "City Clinic", "pending")
            )
            # Insert sample tasks
            db.execute(
                "INSERT INTO tasks (title, content, starting_week, ending_week, task_priority, isOptional, isAppointmentMade, task_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                ("First Ultrasound", "Early scan", 6, 8, "high", 0, 0, "pending")
            )
            # Insert sample symptoms
            db.execute(
                "INSERT INTO weekly_symptoms (week_number, symptom, note) VALUES (?, ?, ?)",
                (8, "Morning Sickness", "Worse after waking up")
            )
            # Insert sample weight
            db.execute(
                "INSERT INTO weekly_weight (week_number, weight, note) VALUES (?, ?, ?)",
                (8, 60.5, "Feeling okay")
            )
            db.commit()
            g.db = db
            yield client


# ─── Helper ──────────────────────────────────────────────────────────────────

def post_json(client, url, data):
    """Helper to send a POST request with JSON body."""
    return client.post(url, data=json.dumps(data), content_type="application/json")


def patch_json(client, url, data):
    """Helper to send a PATCH request with JSON body."""
    return client.patch(url, data=json.dumps(data), content_type="application/json")


def put_json(client, url, data):
    """Helper to send a PUT request with JSON body."""
    return client.put(url, data=json.dumps(data), content_type="application/json")


# ═════════════════════════════════════════════════════════════════════════════
# APPOINTMENT ROUTE TESTS
# ═════════════════════════════════════════════════════════════════════════════

class TestGetAppointments:
    """Tests for GET /get_appointments"""

    def test_get_appointments_empty(self, client):
        response = client.get("/get_appointments")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_get_appointments_with_data(self, client_with_data):
        response = client_with_data.get("/get_appointments")
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 1
        assert data[0]["title"] == "Prenatal Checkup"


class TestGetAppointmentById:
    """Tests for GET /get_appointment/<id>"""

    def test_get_appointment_found(self, client_with_data):
        response = client_with_data.get("/get_appointment/1")
        assert response.status_code == 200
        data = response.get_json()
        assert data["title"] == "Prenatal Checkup"
        assert data["appointment_location"] == "City Clinic"

    def test_get_appointment_not_found(self, client_with_data):
        response = client_with_data.get("/get_appointment/999")
        assert response.status_code == 404
        data = response.get_json()
        assert "not found" in data["error"].lower()


class TestAddAppointment:
    """Tests for POST /add_appointment"""

    def test_add_appointment_success(self, client):
        payload = {
            "title": "Blood Work",
            "content": "Routine tests",
            "appointment_date": "2025-07-01",
            "appointment_time": "09:00 AM",
            "appointment_location": "LabCorp"
        }
        response = post_json(client, "/add_appointment", payload)
        assert response.status_code == 201
        assert response.get_json()["status"] == "success"

        # Verify it was actually inserted
        verify = client.get("/get_appointments")
        assert len(verify.get_json()) == 1

    def test_add_appointment_missing_fields(self, client):
        payload = {"title": "Blood Work"}  # Missing required fields
        response = post_json(client, "/add_appointment", payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "missing" in data["error"].lower()

    def test_add_appointment_missing_title(self, client):
        payload = {
            "content": "Some content",
            "appointment_date": "2025-07-01",
            "appointment_time": "09:00 AM",
            "appointment_location": "Hospital"
        }
        response = post_json(client, "/add_appointment", payload)
        assert response.status_code == 400


class TestUpdateAppointment:
    """Tests for PATCH /update_appointment/<id>"""

    def test_update_appointment_success(self, client_with_data):
        payload = {"title": "Updated Checkup", "appointment_status": "completed"}
        response = patch_json(client_with_data, "/update_appointment/1", payload)
        assert response.status_code == 200
        assert response.get_json()["status"] == "success"

    def test_update_appointment_not_found(self, client_with_data):
        payload = {"title": "Updated"}
        response = patch_json(client_with_data, "/update_appointment/999", payload)
        assert response.status_code == 404


class TestDeleteAppointment:
    """Tests for DELETE /delete_appointment/<id>"""

    def test_delete_appointment_success(self, client_with_data):
        response = client_with_data.delete("/delete_appointment/1")
        assert response.status_code == 200
        assert response.get_json()["status"] == "success"

        # Verify it's gone
        verify = client_with_data.get("/get_appointments")
        assert len(verify.get_json()) == 0

    def test_delete_appointment_not_found(self, client_with_data):
        response = client_with_data.delete("/delete_appointment/999")
        assert response.status_code == 404


# ═════════════════════════════════════════════════════════════════════════════
# TASK ROUTE TESTS
# ═════════════════════════════════════════════════════════════════════════════

class TestGetTasks:
    """Tests for GET /get_tasks"""

    def test_get_tasks_empty(self, client):
        response = client.get("/get_tasks")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_get_tasks_with_data(self, client_with_data):
        response = client_with_data.get("/get_tasks")
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 1
        assert data[0]["title"] == "First Ultrasound"


class TestGetTaskById:
    """Tests for GET /get_task/<id>"""

    def test_get_task_found(self, client_with_data):
        response = client_with_data.get("/get_task/1")
        assert response.status_code == 200
        data = response.get_json()
        assert data["title"] == "First Ultrasound"
        assert data["task_priority"] == "high"

    def test_get_task_not_found(self, client_with_data):
        response = client_with_data.get("/get_task/999")
        assert response.status_code == 404


class TestAddTask:
    """Tests for POST /add_task"""

    def test_add_task_success(self, client):
        payload = {
            "title": "Blood Tests",
            "content": "Check hemoglobin",
            "starting_week": 8,
            "ending_week": 10
        }
        response = post_json(client, "/add_task", payload)
        assert response.status_code == 200
        assert response.get_json()["status"] == "success"

    def test_add_task_with_optional_fields(self, client):
        payload = {
            "title": "Hospital Tour",
            "content": "Visit maternity ward",
            "starting_week": 33,
            "ending_week": 34,
            "task_priority": "low",
            "isOptional": True
        }
        response = post_json(client, "/add_task", payload)
        assert response.status_code == 200

    def test_add_task_missing_required_fields(self, client):
        payload = {"title": "Incomplete Task"}
        response = post_json(client, "/add_task", payload)
        assert response.status_code == 400


class TestUpdateTask:
    """Tests for PATCH /update_task/<id>"""

    def test_update_task_success(self, client_with_data):
        payload = {"task_status": "completed", "task_priority": "medium"}
        response = patch_json(client_with_data, "/update_task/1", payload)
        assert response.status_code == 200

    def test_update_task_not_found(self, client_with_data):
        payload = {"title": "Nope"}
        response = patch_json(client_with_data, "/update_task/999", payload)
        assert response.status_code == 404


class TestDeleteTask:
    """Tests for DELETE /delete_task/<id>"""

    def test_delete_task_success(self, client_with_data):
        response = client_with_data.delete("/delete_task/1")
        assert response.status_code == 200

    def test_delete_task_not_found(self, client_with_data):
        response = client_with_data.delete("/delete_task/999")
        assert response.status_code == 404


class TestMoveTaskToAppointment:
    """Tests for PUT /move_to_appointment/<id>"""

    def test_move_to_appointment_success(self, client_with_data):
        payload = {
            "appointment_date": "2025-07-01",
            "appointment_time": "10:00 AM",
            "appointment_location": "City Hospital"
        }
        response = put_json(client_with_data, "/move_to_appointment/1", payload)
        assert response.status_code == 200

        # Verify appointment was created
        appts = client_with_data.get("/get_appointments")
        # Should have the original + the one moved from task
        assert len(appts.get_json()) == 2

    def test_move_to_appointment_task_not_found(self, client_with_data):
        payload = {
            "appointment_date": "2025-07-01",
            "appointment_time": "10:00 AM",
            "appointment_location": "Hospital"
        }
        response = put_json(client_with_data, "/move_to_appointment/999", payload)
        assert response.status_code == 404

    def test_move_to_appointment_missing_fields(self, client_with_data):
        payload = {"appointment_date": "2025-07-01"}  # Missing time and location
        response = put_json(client_with_data, "/move_to_appointment/1", payload)
        assert response.status_code == 400


# ═════════════════════════════════════════════════════════════════════════════
# SYMPTOM ROUTE TESTS
# ═════════════════════════════════════════════════════════════════════════════

class TestGetSymptoms:
    """Tests for GET /symptoms"""

    def test_get_symptoms_empty(self, client):
        response = client.get("/symptoms")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_get_symptoms_with_data(self, client_with_data):
        response = client_with_data.get("/symptoms")
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 1
        assert data[0]["symptom"] == "Morning Sickness"


class TestGetSymptomById:
    """Tests for GET /symptoms/<id>"""

    def test_get_symptom_found(self, client_with_data):
        response = client_with_data.get("/symptoms/1")
        assert response.status_code == 200
        data = response.get_json()
        assert data["symptom"] == "Morning Sickness"

    def test_get_symptom_not_found(self, client_with_data):
        response = client_with_data.get("/symptoms/999")
        assert response.status_code == 404


class TestGetSymptomsByWeek:
    """Tests for GET /symptoms/week/<week>"""

    def test_get_symptoms_by_week(self, client_with_data):
        response = client_with_data.get("/symptoms/week/8")
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 1

    def test_get_symptoms_by_week_empty(self, client_with_data):
        response = client_with_data.get("/symptoms/week/99")
        assert response.status_code == 200
        assert response.get_json() == []


class TestAddSymptom:
    """Tests for POST /symptoms"""

    def test_add_symptom_success(self, client):
        payload = {
            "week_number": 10,
            "symptom": "Fatigue",
            "note": "Very tired in the evenings"
        }
        response = post_json(client, "/symptoms", payload)
        assert response.status_code == 201
        assert response.get_json()["status"] == "success"

    def test_add_symptom_missing_fields(self, client):
        payload = {"note": "Some note"}  # Missing week_number and symptom
        response = post_json(client, "/symptoms", payload)
        assert response.status_code == 400


class TestUpdateSymptom:
    """Tests for PATCH /symptoms/<id>"""

    def test_update_symptom_success(self, client_with_data):
        payload = {"symptom": "Updated Nausea", "note": "Getting better"}
        response = patch_json(client_with_data, "/symptoms/1", payload)
        assert response.status_code == 200

    def test_update_symptom_not_found(self, client_with_data):
        payload = {"symptom": "Ghost"}
        response = patch_json(client_with_data, "/symptoms/999", payload)
        assert response.status_code == 404


class TestDeleteSymptom:
    """Tests for DELETE /symptoms/<id>"""

    def test_delete_symptom_success(self, client_with_data):
        response = client_with_data.delete("/symptoms/1")
        assert response.status_code == 200

    def test_delete_symptom_not_found(self, client_with_data):
        response = client_with_data.delete("/symptoms/999")
        assert response.status_code == 404


# ═════════════════════════════════════════════════════════════════════════════
# WEIGHT ROUTE TESTS
# ═════════════════════════════════════════════════════════════════════════════

class TestGetWeights:
    """Tests for GET /weight"""

    def test_get_weights_empty(self, client):
        response = client.get("/weight")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_get_weights_with_data(self, client_with_data):
        response = client_with_data.get("/weight")
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 1
        assert data[0]["weight"] == 60.5


class TestGetWeightById:
    """Tests for GET /weight/<id>"""

    def test_get_weight_found(self, client_with_data):
        response = client_with_data.get("/weight/1")
        assert response.status_code == 200
        data = response.get_json()
        assert data["weight"] == 60.5

    def test_get_weight_not_found(self, client_with_data):
        response = client_with_data.get("/weight/999")
        assert response.status_code == 404


class TestGetWeightByWeek:
    """Tests for GET /weight/week/<week>"""

    def test_get_weight_by_week(self, client_with_data):
        response = client_with_data.get("/weight/week/8")
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 1

    def test_get_weight_by_week_empty(self, client_with_data):
        response = client_with_data.get("/weight/week/99")
        assert response.status_code == 200
        assert response.get_json() == []


class TestLogWeight:
    """Tests for POST /weight"""

    def test_log_weight_success(self, client):
        payload = {"week_number": 10, "weight": 62.0, "note": "Feeling good"}
        response = post_json(client, "/weight", payload)
        assert response.status_code == 201
        assert response.get_json()["status"] == "success"

    def test_log_weight_missing_fields(self, client):
        payload = {"note": "No weight or week"}
        response = post_json(client, "/weight", payload)
        assert response.status_code == 400

    def test_log_weight_invalid_week(self, client):
        payload = {"week_number": 0, "weight": 60.0}
        response = post_json(client, "/weight", payload)
        assert response.status_code == 400

    def test_log_weight_negative_weight(self, client):
        payload = {"week_number": 10, "weight": -5}
        response = post_json(client, "/weight", payload)
        assert response.status_code == 400

    def test_log_weight_week_over_52(self, client):
        payload = {"week_number": 53, "weight": 60.0}
        response = post_json(client, "/weight", payload)
        assert response.status_code == 400


class TestUpdateWeight:
    """Tests for PATCH /weight/<id>"""

    def test_update_weight_success(self, client_with_data):
        payload = {"weight": 61.0, "note": "Updated"}
        response = patch_json(client_with_data, "/weight/1", payload)
        assert response.status_code == 200

    def test_update_weight_not_found(self, client_with_data):
        payload = {"weight": 61.0}
        response = patch_json(client_with_data, "/weight/999", payload)
        assert response.status_code == 404

    def test_update_weight_invalid_value(self, client_with_data):
        payload = {"weight": -10}
        response = patch_json(client_with_data, "/weight/1", payload)
        assert response.status_code == 400


class TestDeleteWeight:
    """Tests for DELETE /weight/<id>"""

    def test_delete_weight_success(self, client_with_data):
        response = client_with_data.delete("/weight/1")
        assert response.status_code == 200

    def test_delete_weight_not_found(self, client_with_data):
        response = client_with_data.delete("/weight/999")
        assert response.status_code == 404


# ═════════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTION TESTS
# ═════════════════════════════════════════════════════════════════════════════

class TestValidateWeekNumber:
    """Tests for utils.validate_week_number"""

    def test_valid_week(self):
        from utils import validate_week_number
        result = validate_week_number(10)
        assert result["status"] is True

    def test_week_too_low(self):
        from utils import validate_week_number
        result = validate_week_number(0)
        assert result["status"] is False

    def test_week_too_high(self):
        from utils import validate_week_number
        result = validate_week_number(53)
        assert result["status"] is False

    def test_week_non_integer(self):
        from utils import validate_week_number
        result = validate_week_number("abc")
        assert result["status"] is False

    def test_week_boundary_1(self):
        from utils import validate_week_number
        assert validate_week_number(1)["status"] is True

    def test_week_boundary_52(self):
        from utils import validate_week_number
        assert validate_week_number(52)["status"] is True


class TestValidateWeightValue:
    """Tests for utils.validate_weight_value"""

    def test_valid_weight(self):
        from utils import validate_weight_value
        result = validate_weight_value(65.5)
        assert result["status"] is True

    def test_zero_weight(self):
        from utils import validate_weight_value
        result = validate_weight_value(0)
        assert result["status"] is False

    def test_negative_weight(self):
        from utils import validate_weight_value
        result = validate_weight_value(-10)
        assert result["status"] is False

    def test_excessive_weight(self):
        from utils import validate_weight_value
        result = validate_weight_value(1001)
        assert result["status"] is False

    def test_non_numeric_weight(self):
        from utils import validate_weight_value
        result = validate_weight_value("heavy")
        assert result["status"] is False


class TestValidateBpData:
    """Tests for utils.validate_bp_data"""

    def test_valid_bp(self):
        from utils import validate_bp_data
        errors = validate_bp_data({"week_number": 10, "systolic": 120, "diastolic": 80})
        assert errors == {}

    def test_invalid_systolic(self):
        from utils import validate_bp_data
        errors = validate_bp_data({"systolic": 400})
        assert "systolic" in errors

    def test_invalid_diastolic(self):
        from utils import validate_bp_data
        errors = validate_bp_data({"diastolic": 250})
        assert "diastolic" in errors

    def test_invalid_week_in_bp(self):
        from utils import validate_bp_data
        errors = validate_bp_data({"week_number": -1})
        assert "week_number" in errors
