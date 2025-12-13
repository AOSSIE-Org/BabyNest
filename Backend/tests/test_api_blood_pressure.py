import sys
import os
import pytest
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from db.db import open_db, close_db

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        with app.app_context():
            # Setup test database
            db = open_db()
            db.execute('DELETE FROM blood_pressure_logs')
            db.commit()
            close_db(db)
        yield client

def test_log_blood_pressure(client):
    """Test logging a blood pressure entry"""
    bp_data = {
        'week_number': 15,
        'systolic': 120,
        'diastolic': 80,
        'heart_rate': 75,
        'note': 'Normal reading'
    }
    response = client.post('/blood_pressure',
                          data=json.dumps(bp_data),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'

def test_log_bp_missing_fields(client):
    """Test logging BP with missing required fields"""
    bp_data = {
        'week_number': 15,
        'systolic': 120
        # missing diastolic and heart_rate
    }
    response = client.post('/blood_pressure',
                          data=json.dumps(bp_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_log_bp_invalid_week(client):
    """Test logging BP with invalid week number"""
    bp_data = {
        'week_number': 100,  # invalid week
        'systolic': 120,
        'diastolic': 80,
        'heart_rate': 75
    }
    response = client.post('/blood_pressure',
                          data=json.dumps(bp_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_get_all_blood_pressure(client):
    """Test getting all blood pressure entries"""
    bp1 = {'week_number': 12, 'systolic': 118, 'diastolic': 78, 'heart_rate': 72, 'note': 'Morning'}
    bp2 = {'week_number': 13, 'systolic': 122, 'diastolic': 82, 'heart_rate': 76, 'note': 'Evening'}
    
    client.post('/blood_pressure', data=json.dumps(bp1), content_type='application/json')
    client.post('/blood_pressure', data=json.dumps(bp2), content_type='application/json')
    
    response = client.get('/blood_pressure')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 2

def test_get_bp_by_week(client):
    """Test getting BP entries by week number (requires auth)"""
    bp_data = {'week_number': 20, 'systolic': 125, 'diastolic': 85, 'heart_rate': 78, 'note': 'After exercise'}
    client.post('/blood_pressure', data=json.dumps(bp_data), content_type='application/json')
    
    # This will fail without auth
    response = client.get('/blood_pressure/week/20')
    assert response.status_code == 401

def test_get_bp_by_id(client):
    """Test getting BP entry by ID (requires auth)"""
    bp_data = {'week_number': 25, 'systolic': 130, 'diastolic': 88, 'heart_rate': 80, 'note': 'Test'}
    client.post('/blood_pressure', data=json.dumps(bp_data), content_type='application/json')
    
    # This will fail without auth
    response = client.get('/blood_pressure/1')
    assert response.status_code == 401

def test_update_bp(client):
    """Test updating a BP entry (requires auth)"""
    bp_data = {'week_number': 30, 'systolic': 120, 'diastolic': 80, 'heart_rate': 75, 'note': 'Original'}
    client.post('/blood_pressure', data=json.dumps(bp_data), content_type='application/json')
    
    updated_data = {'week_number': 30, 'systolic': 122, 'diastolic': 82, 'heart_rate': 77, 'note': 'Updated'}
    response = client.put('/blood_pressure/1',
                         data=json.dumps(updated_data),
                         content_type='application/json')
    assert response.status_code == 401

def test_delete_bp(client):
    """Test deleting a BP entry (requires auth)"""
    bp_data = {'week_number': 35, 'systolic': 128, 'diastolic': 86, 'heart_rate': 79, 'note': 'To delete'}
    client.post('/blood_pressure', data=json.dumps(bp_data), content_type='application/json')
    
    response = client.delete('/blood_pressure/1')
    assert response.status_code == 401

def test_log_bp_invalid_values(client):
    """Test logging BP with invalid systolic/diastolic values"""
    bp_data = {
        'week_number': 15,
        'systolic': 0,  # invalid
        'diastolic': 0,  # invalid
        'heart_rate': 75
    }
    response = client.post('/blood_pressure',
                          data=json.dumps(bp_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
