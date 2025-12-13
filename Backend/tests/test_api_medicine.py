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
            db.execute('DELETE FROM weekly_medicine')
            db.commit()
            close_db(db)
        yield client

def test_add_medicine(client):
    """Test adding a medicine entry"""
    medicine_data = {
        'week_number': 10,
        'name': 'Prenatal Vitamin',
        'dose': '1 tablet',
        'time': '09:00',
        'note': 'Take with food'
    }
    response = client.post('/set_medicine',
                          data=json.dumps(medicine_data),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'

def test_add_medicine_missing_fields(client):
    """Test adding medicine with missing required fields"""
    medicine_data = {
        'week_number': 10,
        'name': 'Test Medicine'
        # missing dose and time
    }
    response = client.post('/set_medicine',
                          data=json.dumps(medicine_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_add_medicine_invalid_week(client):
    """Test adding medicine with invalid week number"""
    medicine_data = {
        'week_number': 100,  # invalid week
        'name': 'Test Medicine',
        'dose': '1 tablet',
        'time': '10:00',
        'note': 'Test'
    }
    response = client.post('/set_medicine',
                          data=json.dumps(medicine_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_get_all_medicine(client):
    """Test getting all medicine entries"""
    # Add some medicine entries
    med1 = {'week_number': 12, 'name': 'Vitamin D', 'dose': '1000 IU', 'time': '09:00', 'note': 'Morning'}
    med2 = {'week_number': 12, 'name': 'Iron', 'dose': '65 mg', 'time': '14:00', 'note': 'Afternoon'}
    
    client.post('/set_medicine', data=json.dumps(med1), content_type='application/json')
    client.post('/set_medicine', data=json.dumps(med2), content_type='application/json')
    
    response = client.get('/get_medicine')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 2

def test_get_medicine_by_week(client):
    """Test getting medicine entries by week number (requires auth)"""
    # Note: This endpoint requires authentication
    # In a real scenario, you'd need to setup session authentication
    med_data = {'week_number': 15, 'name': 'Folic Acid', 'dose': '400 mcg', 'time': '08:00', 'note': 'Daily'}
    client.post('/set_medicine', data=json.dumps(med_data), content_type='application/json')
    
    # This will fail without auth, which is expected
    response = client.get('/medicine/week/15')
    # Should return 401 unauthorized due to @require_auth decorator
    assert response.status_code == 401

def test_get_medicine_by_id(client):
    """Test getting medicine entry by ID (requires auth)"""
    med_data = {'week_number': 20, 'name': 'Calcium', 'dose': '500 mg', 'time': '12:00', 'note': 'Lunch'}
    client.post('/set_medicine', data=json.dumps(med_data), content_type='application/json')
    
    # This will fail without auth
    response = client.get('/medicine/1')
    assert response.status_code == 401

def test_update_medicine(client):
    """Test updating a medicine entry (requires auth)"""
    med_data = {'week_number': 25, 'name': 'Magnesium', 'dose': '200 mg', 'time': '20:00', 'note': 'Evening'}
    client.post('/set_medicine', data=json.dumps(med_data), content_type='application/json')
    
    updated_data = {'week_number': 25, 'name': 'Magnesium', 'dose': '250 mg', 'time': '20:00', 'note': 'Evening - Updated'}
    response = client.put('/medicine/1',
                         data=json.dumps(updated_data),
                         content_type='application/json')
    # Should return 401 unauthorized
    assert response.status_code == 401

def test_delete_medicine(client):
    """Test deleting a medicine entry (requires auth)"""
    med_data = {'week_number': 30, 'name': 'Omega-3', 'dose': '1000 mg', 'time': '10:00', 'note': 'Morning'}
    client.post('/set_medicine', data=json.dumps(med_data), content_type='application/json')
    
    response = client.delete('/medicine/1')
    # Should return 401 unauthorized
    assert response.status_code == 401

def test_add_medicine_empty_name(client):
    """Test adding medicine with empty name"""
    medicine_data = {
        'week_number': 10,
        'name': '   ',  # empty string
        'dose': '1 tablet',
        'time': '09:00',
        'note': 'Test'
    }
    response = client.post('/set_medicine',
                          data=json.dumps(medicine_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
