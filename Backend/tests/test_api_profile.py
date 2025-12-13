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
            db.execute('DELETE FROM profile')
            db.commit()
            close_db(db)
        yield client

def test_set_profile(client):
    """Test setting a new profile"""
    profile_data = {
        'lmp': '2024-12-01',
        'cycleLength': 28,
        'periodLength': 5,
        'age': 28,
        'weight': 65,
        'location': 'New York'
    }
    response = client.post('/set_profile',
                          data=json.dumps(profile_data),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'
    assert 'dueDate' in data

def test_set_profile_missing_required_fields(client):
    """Test setting profile with missing required fields"""
    profile_data = {
        'lmp': '2024-12-01'
        # missing location
    }
    response = client.post('/set_profile',
                          data=json.dumps(profile_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_get_profile(client):
    """Test getting profile after setting it"""
    # Set profile first
    profile_data = {
        'lmp': '2024-11-15',
        'cycleLength': 30,
        'periodLength': 6,
        'age': 30,
        'weight': 70,
        'location': 'Los Angeles'
    }
    client.post('/set_profile',
               data=json.dumps(profile_data),
               content_type='application/json')
    
    # Get profile
    response = client.get('/get_profile')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'due_date' in data
    assert data['location'] == 'Los Angeles'

def test_get_profile_not_found(client):
    """Test getting profile when none exists"""
    response = client.get('/get_profile')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data

def test_update_profile(client):
    """Test updating an existing profile"""
    # Set profile first
    profile_data = {
        'lmp': '2024-10-01',
        'cycleLength': 28,
        'periodLength': 5,
        'age': 25,
        'weight': 60,
        'location': 'Chicago'
    }
    client.post('/set_profile',
               data=json.dumps(profile_data),
               content_type='application/json')
    
    # Update profile
    updated_data = {
        'lmp': '2024-10-05',
        'cycle_length': 30,
        'period_length': 6,
        'age': 26,
        'weight': 62,
        'location': 'Chicago'
    }
    response = client.put('/update_profile',
                         data=json.dumps(updated_data),
                         content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'

def test_delete_profile(client):
    """Test deleting a profile"""
    # Set profile first
    profile_data = {
        'lmp': '2024-09-01',
        'cycleLength': 28,
        'periodLength': 5,
        'age': 27,
        'weight': 68,
        'location': 'Boston'
    }
    client.post('/set_profile',
               data=json.dumps(profile_data),
               content_type='application/json')
    
    # Delete profile
    response = client.delete('/delete_profile')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'
    
    # Verify profile is deleted
    response = client.get('/get_profile')
    assert response.status_code == 404

def test_due_date_calculation(client):
    """Test that due date is calculated correctly"""
    profile_data = {
        'lmp': '2024-12-01',
        'cycleLength': 28,
        'periodLength': 5,
        'age': 28,
        'weight': 65,
        'location': 'Seattle'
    }
    response = client.post('/set_profile',
                          data=json.dumps(profile_data),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'dueDate' in data
    # Due date should be approximately 280 days from LMP
    assert data['dueDate'] == '2025-09-07'
