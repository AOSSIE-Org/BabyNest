import os
import sys
import uuid


# Ensure Backend/ is importable when tests are run from Backend/
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


def _unique(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


def test_api_smoke():
    """Minimal smoke test covering the core backend API surface.

    Goal: catch breaking changes (500s / missing routes) without relying on external services.
    """

    # Import lazily so sys.path is configured first.
    from app import app

    client = app.test_client()

    # Root should respond (it proxies appointments right now).
    r = client.get("/")
    assert r.status_code == 200

    # Tasks: GET + POST
    task_title = _unique("ci-task")
    r = client.get("/get_tasks")
    assert r.status_code == 200
    assert isinstance(r.get_json(), list)

    r = client.post(
        "/add_task",
        json={
            "title": task_title,
            "content": "created by CI smoke test",
            "starting_week": 5,
            "ending_week": 6,
            "task_status": "pending",
            "task_priority": "low",
            "isOptional": False,
            "isAppointmentMade": False,
        },
    )
    assert r.status_code == 200
    assert r.get_json().get("status") == "success"

    # Appointments: GET + POST
    appt_title = _unique("ci-appt")
    r = client.get("/get_appointments")
    assert r.status_code == 200
    assert isinstance(r.get_json(), list)

    r = client.post(
        "/add_appointment",
        json={
            "title": appt_title,
            "content": "created by CI smoke test",
            "appointment_date": "2025-12-14",
            "appointment_time": "10:00 AM",
            "appointment_location": "CI Clinic",
        },
    )
    assert r.status_code == 200
    assert r.get_json().get("status") == "success"

    # Profile: set + get (needed for agent context)
    r = client.post(
        "/set_profile",
        json={
            "lmp": "2025-01-01",
            "cycleLength": 28,
            "periodLength": 5,
            "age": 22,
            "weight": 60,
            "location": "Jaipur",
        },
    )
    assert r.status_code == 200
    data = r.get_json()
    assert data.get("status") == "success"
    assert "dueDate" in data

    r = client.get("/get_profile")
    assert r.status_code == 200
    data = r.get_json()
    assert "due_date" in data
    assert data.get("location") == "Jaipur"

    # Weight: POST + GET
    r = client.post("/weight", json={"week_number": 8, "weight": 62.5, "note": "pytest"})
    assert r.status_code == 200
    assert r.get_json().get("status") == "success"

    r = client.get("/weight")
    assert r.status_code == 200
    assert isinstance(r.get_json(), list)

    # Symptoms: POST + GET
    r = client.post("/symptoms", json={"week_number": 8, "symptom": "nausea", "note": "pytest"})
    assert r.status_code in (200, 201)

    r = client.get("/symptoms")
    assert r.status_code == 200
    assert isinstance(r.get_json(), list)

    # Medicine: POST + GET (non-auth routes)
    r = client.post(
        "/set_medicine",
        json={
            "week_number": 8,
            "name": "Prenatal Vitamin",
            "dose": "1 tablet",
            "time": "08:00",
            "note": "pytest",
        },
    )
    assert r.status_code == 200
    assert r.get_json().get("status") == "success"

    r = client.get("/get_medicine")
    assert r.status_code == 200
    assert isinstance(r.get_json(), list)

    # Blood pressure: POST + GET
    r = client.post(
        "/blood_pressure",
        json={
            "week_number": 8,
            "systolic": 120,
            "diastolic": 80,
            "time": "08:00",
            "note": "pytest",
        },
    )
    assert r.status_code in (200, 201)

    r = client.get("/blood_pressure")
    assert r.status_code == 200
    assert isinstance(r.get_json(), list)

    # Discharge: POST + GET
    r = client.post(
        "/set_discharge_log",
        json={
            "week_number": 8,
            "type": "normal",
            "color": "clear",
            "bleeding": "no",
            "note": "pytest",
        },
    )
    assert r.status_code in (200, 201)

    r = client.get("/get_discharge_logs")
    assert r.status_code == 200
    assert isinstance(r.get_json(), list)

    # Agent endpoints (no external LLM required; uses offline stub)
    r = client.get("/agent/cache/status?user_id=default")
    assert r.status_code == 200
    assert r.get_json().get("cache_status") == "active"

    r = client.get("/agent/context?user_id=default")
    assert r.status_code in (200, 404)
    if r.status_code == 200:
        ctx = r.get_json()
        assert "context" in ctx

    # Agent task recommendations and stats should be reachable.
    r = client.get("/agent/tasks/recommendations?user_id=default")
    assert r.status_code in (200, 404)
    if r.status_code == 200:
        payload = r.get_json()
        assert "recommendations" in payload

    r = client.get("/agent/cache/stats")
    assert r.status_code == 200
    assert "statistics" in r.get_json()

    r = client.post("/agent", json={"query": "What should I do in week 8?", "user_id": "default"})
    assert r.status_code == 200
    assert "response" in r.get_json()
