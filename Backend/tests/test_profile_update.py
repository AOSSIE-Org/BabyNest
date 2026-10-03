import os
import sqlite3
import pytest
from unittest.mock import patch, MagicMock

# Import app and schema
import sys
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Mock chromadb only if not installed in lightweight test environments
try:
    import chromadb
    import chromadb.utils
    import chromadb.config
except ImportError:
    mock_chroma = MagicMock()
    mock_chroma.__path__ = []
    mock_chroma_utils = MagicMock()
    mock_chroma_utils.__path__ = []
    sys.modules["chromadb"] = mock_chroma
    sys.modules["chromadb.utils"] = mock_chroma_utils
    sys.modules["chromadb.config"] = MagicMock()

from app import app
from db.db import first_time_setup


@pytest.fixture
def client(tmp_path):
    """Set up an isolated SQLite test database for each test run."""
    test_db = str(tmp_path / "test_database.db")
    schema_path = os.path.join(backend_dir, "schema.sql")

    with open(schema_path, "r") as f:
        schema_sql = f.read()

    with sqlite3.connect(test_db) as conn:
        conn.executescript(schema_sql)
        conn.commit()

    app.config["TESTING"] = True

    # Patch DATABASE path in db.db and routes.profile to test_db
    with patch("db.db.DATABASE", test_db), \
         patch("routes.profile.get_agent") as mock_get_agent:
        mock_agent_instance = MagicMock()
        mock_get_agent.return_value = mock_agent_instance

        with app.test_client() as test_client:
            with app.app_context():
                yield test_client, test_db


def test_update_profile_multi_user_isolation(client):
    """Verify updating one user's profile does NOT mutate other users' profiles."""
    test_client, test_db = client

    # Verify initial profiles exist
    with sqlite3.connect(test_db) as conn:
        conn.row_factory = sqlite3.Row
        user1 = conn.execute("SELECT * FROM profile WHERE id = 1").fetchone()
        user2 = conn.execute("SELECT * FROM profile WHERE id = 2").fetchone()
        assert user1["user_name"] == "John Doe"
        assert user2["user_name"] == "Jane Smith"
        original_user2_name = user2["user_name"]
        original_user2_weight = user2["weight"]

    # Update only User 1
    update_payload = {
        "name": "Updated John",
        "weight": 75,
        "location": "San Francisco",
        "cycleLength": 29,
        "lmp": "2025-01-05"
    }
    res = test_client.patch("/update_profile?user_id=1", json=update_payload)
    assert res.status_code == 200
    assert res.get_json()["status"] == "success"

    # Assert User 1 was updated
    with sqlite3.connect(test_db) as conn:
        conn.row_factory = sqlite3.Row
        updated_user1 = conn.execute("SELECT * FROM profile WHERE id = 1").fetchone()
        updated_user2 = conn.execute("SELECT * FROM profile WHERE id = 2").fetchone()

        assert updated_user1["user_name"] == "Updated John"
        assert updated_user1["weight"] == 75
        assert updated_user1["user_location"] == "San Francisco"
        assert updated_user1["cycleLength"] == 29

        # Crucial check: User 2 MUST remain unchanged
        assert updated_user2["user_name"] == original_user2_name
        assert updated_user2["weight"] == original_user2_weight


def test_update_profile_integer_cycle_length(client):
    """Ensure integer cycleLength in JSON does not cause TypeError: int() with base 10."""
    test_client, _ = client

    payload = {
        "cycleLength": 28,
        "lmp": "2025-01-01"
    }
    res = test_client.patch("/update_profile?user_id=1", json=payload)
    assert res.status_code == 200
    assert res.get_json()["status"] == "success"


def test_update_profile_string_cycle_length(client):
    """Ensure valid string cycleLength (e.g. '30') is accepted and parsed."""
    test_client, _ = client

    payload = {
        "cycleLength": "30",
        "lmp": "2025-01-01"
    }
    res = test_client.patch("/update_profile?user_id=1", json=payload)
    assert res.status_code == 200
    assert res.get_json()["status"] == "success"


def test_update_profile_invalid_cycle_length(client):
    """Ensure non-numeric, non-positive, bool, float, or non-ASCII cycleLength returns 400 Bad Request."""
    test_client, _ = client

    for invalid in ["not_a_number", 0, -5, True, False, 28.9, "٣٠"]:
        res = test_client.patch("/update_profile?user_id=1", json={"cycleLength": invalid})
        assert res.status_code == 400
        assert "cycleLength must be a valid integer" in res.get_json()["error"]


def test_update_profile_missing_user_id(client):
    """Ensure missing user_id returns 400 with clear error message."""
    test_client, _ = client

    res = test_client.patch("/update_profile", json={"name": "Alice"})
    assert res.status_code == 400
    assert "user_id is required" in res.get_json()["error"]


def test_update_profile_non_numeric_user_id(client):
    """Ensure non-integer or non-ASCII user_id returns 400."""
    test_client, _ = client

    for invalid in ["abc", "٣٠", "1.5"]:
        res = test_client.patch(f"/update_profile?user_id={invalid}", json={"name": "Alice"})
        assert res.status_code == 400
        assert "user_id must be a valid integer" in res.get_json()["error"]


def test_update_profile_nonexistent_user(client):
    """Ensure updating a non-existent user returns 404 NotFoundError."""
    test_client, _ = client

    res = test_client.patch("/update_profile?user_id=9999", json={"name": "Alice"})
    assert res.status_code == 404


def test_update_profile_no_data(client):
    """Ensure empty payload returns 400."""
    test_client, _ = client

    res = test_client.patch("/update_profile?user_id=1", json={})
    assert res.status_code == 400
    assert "No data provided" in res.get_json()["error"]
