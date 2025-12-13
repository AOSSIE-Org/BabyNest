import sys
import os
import pytest
import json

# Add parent directory to path
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
            db.execute('DELETE FROM appointments')
            db.commit()
            close_db(db)
        yield client

def test_get_appointments_empty(client):
    """Test getting appointments when none exist"""
    response = client.get('/get_appointments')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 0

def test_add_appointment(client):
    """Test adding a new appointment"""
    appointment_data = {
        'title': 'Test Appointment',
        'content': 'This is a test appointment',
        'appointment_date': '2025-01-15',
        'appointment_time': '10:00',
        'appointment_location': 'Test Hospital'
    }
    response = client.post('/add_appointment', 
                          data=json.dumps(appointment_data),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'
    assert data['message'] == 'Appointment added successfully'

def test_add_appointment_missing_fields(client):
    """Test adding appointment with missing required fields"""
    appointment_data = {
        'title': 'Test Appointment',
        'content': 'This is a test appointment'
    }
    response = client.post('/add_appointment',
                          data=json.dumps(appointment_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_get_appointments_after_adding(client):
    """Test getting appointments after adding one"""
    # Add appointment
    appointment_data = {
        'title': 'Test Appointment 2',
        'content': 'This is another test appointment',
        'appointment_date': '2025-01-20',
        'appointment_time': '14:00',
        'appointment_location': 'Test Clinic'
    }
    client.post('/add_appointment',
               data=json.dumps(appointment_data),
               content_type='application/json')
    
    # Get appointments
    response = client.get('/get_appointments')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) > 0
    assert data[0]['title'] == 'Test Appointment 2'

def test_get_single_appointment(client):
    """Test getting a single appointment by ID"""
    # Add appointment first
    appointment_data = {
        'title': 'Test Appointment 3',
        'content': 'Single appointment test',
        'appointment_date': '2025-02-01',
        'appointment_time': '09:00',
        'appointment_location': 'Test Medical Center'
    }
    client.post('/add_appointment',
               data=json.dumps(appointment_data),
               content_type='application/json')
    
    # Get the appointment
    response = client.get('/get_appointment/1')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['title'] == 'Test Appointment 3'

def test_get_nonexistent_appointment(client):
    """Test getting an appointment that doesn't exist"""
    response = client.get('/get_appointment/999')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data

def test_update_appointment(client):
    """Test updating an existing appointment"""
    # Add appointment first
    appointment_data = {
        'title': 'Original Title',
        'content': 'Original content',
        'appointment_date': '2025-03-01',
        'appointment_time': '11:00',
        'appointment_location': 'Original Location'
    }
    client.post('/add_appointment',
               data=json.dumps(appointment_data),
               content_type='application/json')
    
    # Update the appointment
    updated_data = {
        'title': 'Updated Title',
        'content': 'Updated content',
        'appointment_date': '2025-03-02',
        'appointment_time': '12:00',
        'appointment_location': 'Updated Location',
        'appointment_status': 'completed'
    }
    response = client.put('/update_appointment/1',
                         data=json.dumps(updated_data),
                         content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'

def test_update_nonexistent_appointment(client):
    """Test updating an appointment that doesn't exist"""
    updated_data = {
        'title': 'Updated Title',
        'content': 'Updated content',
        'appointment_date': '2025-03-02',
        'appointment_time': '12:00',
        'appointment_location': 'Updated Location'
    }
    response = client.put('/update_appointment/999',
                         data=json.dumps(updated_data),
                         content_type='application/json')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data

def test_delete_appointment(client):
    """Test deleting an appointment"""
    # Add appointment first
    appointment_data = {
        'title': 'To Be Deleted',
        'content': 'This will be deleted',
        'appointment_date': '2025-04-01',
        'appointment_time': '15:00',
        'appointment_location': 'Delete Location'
    }
    client.post('/add_appointment',
               data=json.dumps(appointment_data),
               content_type='application/json')
    
    # Delete the appointment
    response = client.delete('/delete_appointment/1')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'

def test_delete_nonexistent_appointment(client):
    """Test deleting an appointment that doesn't exist"""
    response = client.delete('/delete_appointment/999')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data
