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
            db.execute('DELETE FROM discharge_logs')
            db.commit()
            close_db(db)
        yield client

def test_log_discharge(client):
    """Test logging a discharge entry"""
    discharge_data = {
        'week_number': 15,
        'discharge_type': 'normal',
        'color': 'white',
        'consistency': 'thin',
        'note': 'No odor'
    }
    response = client.post('/discharge',
                          data=json.dumps(discharge_data),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'

def test_log_discharge_missing_fields(client):
    """Test logging discharge with missing required fields"""
    discharge_data = {
        'week_number': 15,
        'discharge_type': 'normal'
        # missing other required fields
    }
    response = client.post('/discharge',
                          data=json.dumps(discharge_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_log_discharge_invalid_week(client):
    """Test logging discharge with invalid week number"""
    discharge_data = {
        'week_number': 100,  # invalid week
        'discharge_type': 'normal',
        'color': 'white',
        'consistency': 'thin'
    }
    response = client.post('/discharge',
                          data=json.dumps(discharge_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_get_all_discharge(client):
    """Test getting all discharge entries"""
    discharge1 = {'week_number': 12, 'discharge_type': 'normal', 'color': 'white', 'consistency': 'thin', 'note': 'Normal'}
    discharge2 = {'week_number': 13, 'discharge_type': 'normal', 'color': 'clear', 'consistency': 'watery', 'note': 'Slight increase'}
    
    client.post('/discharge', data=json.dumps(discharge1), content_type='application/json')
    client.post('/discharge', data=json.dumps(discharge2), content_type='application/json')
    
    response = client.get('/discharge')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 2

def test_get_discharge_by_week(client):
    """Test getting discharge entries by week number (requires auth)"""
    discharge_data = {'week_number': 20, 'discharge_type': 'normal', 'color': 'white', 'consistency': 'thick', 'note': 'Test'}
    client.post('/discharge', data=json.dumps(discharge_data), content_type='application/json')
    
    # This will fail without auth
    response = client.get('/discharge/week/20')
    assert response.status_code == 401

def test_get_discharge_by_id(client):
    """Test getting discharge entry by ID (requires auth)"""
    discharge_data = {'week_number': 25, 'discharge_type': 'mucus', 'color': 'clear', 'consistency': 'sticky', 'note': 'Test'}
    client.post('/discharge', data=json.dumps(discharge_data), content_type='application/json')
    
    # This will fail without auth
    response = client.get('/discharge/1')
    assert response.status_code == 401

def test_update_discharge(client):
    """Test updating a discharge entry (requires auth)"""
    discharge_data = {'week_number': 30, 'discharge_type': 'normal', 'color': 'white', 'consistency': 'thin', 'note': 'Original'}
    client.post('/discharge', data=json.dumps(discharge_data), content_type='application/json')
    
    updated_data = {'week_number': 30, 'discharge_type': 'mucus', 'color': 'clear', 'consistency': 'thick', 'note': 'Updated'}
    response = client.put('/discharge/1',
                         data=json.dumps(updated_data),
                         content_type='application/json')
    assert response.status_code == 401

def test_delete_discharge(client):
    """Test deleting a discharge entry (requires auth)"""
    discharge_data = {'week_number': 35, 'discharge_type': 'normal', 'color': 'white', 'consistency': 'thin', 'note': 'To delete'}
    client.post('/discharge', data=json.dumps(discharge_data), content_type='application/json')
    
    response = client.delete('/discharge/1')
    assert response.status_code == 401

def test_log_discharge_empty_type(client):
    """Test logging discharge with empty type"""
    discharge_data = {
        'week_number': 15,
        'discharge_type': '   ',  # empty string
        'color': 'white',
        'consistency': 'thin'
    }
    response = client.post('/discharge',
                          data=json.dumps(discharge_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
