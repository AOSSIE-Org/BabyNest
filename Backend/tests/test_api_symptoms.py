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
            db.execute('DELETE FROM weekly_symptoms')
            db.commit()
            close_db(db)
        yield client

def test_log_symptom(client):
    """Test logging a symptom entry"""
    symptom_data = {
        'week_number': 10,
        'symptom': 'Morning sickness',
        'severity': 'moderate',
        'note': 'Happens mostly in the morning'
    }
    response = client.post('/symptoms',
                          data=json.dumps(symptom_data),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'

def test_log_symptom_missing_fields(client):
    """Test logging symptom with missing required fields"""
    symptom_data = {
        'week_number': 10
        # missing symptom and severity
    }
    response = client.post('/symptoms',
                          data=json.dumps(symptom_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_log_symptom_invalid_week(client):
    """Test logging symptom with invalid week number"""
    symptom_data = {
        'week_number': 100,  # invalid week
        'symptom': 'Fatigue',
        'severity': 'mild',
        'note': 'Test'
    }
    response = client.post('/symptoms',
                          data=json.dumps(symptom_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_get_all_symptoms(client):
    """Test getting all symptom entries"""
    # Add some symptom entries
    symptom1 = {'week_number': 12, 'symptom': 'Nausea', 'severity': 'moderate', 'note': 'After breakfast'}
    symptom2 = {'week_number': 13, 'symptom': 'Fatigue', 'severity': 'mild', 'note': 'Afternoon'}
    
    client.post('/symptoms', data=json.dumps(symptom1), content_type='application/json')
    client.post('/symptoms', data=json.dumps(symptom2), content_type='application/json')
    
    response = client.get('/symptoms')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 2

def test_get_symptoms_by_week(client):
    """Test getting symptom entries by week number (requires auth)"""
    symptom_data = {'week_number': 15, 'symptom': 'Back pain', 'severity': 'moderate', 'note': 'Lower back'}
    client.post('/symptoms', data=json.dumps(symptom_data), content_type='application/json')
    
    # This will fail without auth
    response = client.get('/symptoms/week/15')
    assert response.status_code == 401

def test_get_symptom_by_id(client):
    """Test getting symptom entry by ID (requires auth)"""
    symptom_data = {'week_number': 20, 'symptom': 'Headache', 'severity': 'mild', 'note': 'Morning'}
    client.post('/symptoms', data=json.dumps(symptom_data), content_type='application/json')
    
    # This will fail without auth
    response = client.get('/symptoms/1')
    assert response.status_code == 401

def test_update_symptom(client):
    """Test updating a symptom entry (requires auth)"""
    symptom_data = {'week_number': 25, 'symptom': 'Swelling', 'severity': 'mild', 'note': 'Feet'}
    client.post('/symptoms', data=json.dumps(symptom_data), content_type='application/json')
    
    updated_data = {'week_number': 25, 'symptom': 'Swelling', 'severity': 'moderate', 'note': 'Feet and ankles'}
    response = client.put('/symptoms/1',
                         data=json.dumps(updated_data),
                         content_type='application/json')
    assert response.status_code == 401

def test_delete_symptom(client):
    """Test deleting a symptom entry (requires auth)"""
    symptom_data = {'week_number': 30, 'symptom': 'Cramps', 'severity': 'mild', 'note': 'Legs'}
    client.post('/symptoms', data=json.dumps(symptom_data), content_type='application/json')
    
    response = client.delete('/symptoms/1')
    assert response.status_code == 401

def test_log_symptom_empty_description(client):
    """Test logging symptom with empty description"""
    symptom_data = {
        'week_number': 10,
        'symptom': '   ',  # empty string
        'severity': 'mild',
        'note': 'Test'
    }
    response = client.post('/symptoms',
                          data=json.dumps(symptom_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
