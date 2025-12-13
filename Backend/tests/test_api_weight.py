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
            db.execute('DELETE FROM weekly_weight')
            db.commit()
            close_db(db)
        yield client

def test_log_weight(client):
    """Test logging a weight entry"""
    weight_data = {
        'week_number': 12,
        'weight': 65.5,
        'note': 'Feeling good'
    }
    response = client.post('/weight',
                          data=json.dumps(weight_data),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'

def test_log_weight_missing_fields(client):
    """Test logging weight with missing required fields"""
    weight_data = {
        'week_number': 12
        # missing weight
    }
    response = client.post('/weight',
                          data=json.dumps(weight_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_log_weight_invalid_week(client):
    """Test logging weight with invalid week number"""
    weight_data = {
        'week_number': 100,  # invalid week
        'weight': 65.5,
        'note': 'Test'
    }
    response = client.post('/weight',
                          data=json.dumps(weight_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_get_all_weights(client):
    """Test getting all weight entries"""
    # Add some weight entries
    weight_data_1 = {'week_number': 10, 'weight': 64.0, 'note': 'Week 10'}
    weight_data_2 = {'week_number': 11, 'weight': 64.5, 'note': 'Week 11'}
    
    client.post('/weight', data=json.dumps(weight_data_1), content_type='application/json')
    client.post('/weight', data=json.dumps(weight_data_2), content_type='application/json')
    
    response = client.get('/weight')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 2

def test_get_weight_by_week(client):
    """Test getting weight entry by week number"""
    weight_data = {'week_number': 15, 'weight': 66.0, 'note': 'Week 15'}
    client.post('/weight', data=json.dumps(weight_data), content_type='application/json')
    
    response = client.get('/weight/15')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['week_number'] == 15
    assert data['weight'] == 66.0

def test_get_weight_by_id(client):
    """Test getting weight entry by ID"""
    weight_data = {'week_number': 20, 'weight': 68.0, 'note': 'Week 20'}
    client.post('/weight', data=json.dumps(weight_data), content_type='application/json')
    
    response = client.get('/weight/1')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['week_number'] == 20

def test_update_weight(client):
    """Test updating a weight entry"""
    # Add weight entry
    weight_data = {'week_number': 25, 'weight': 70.0, 'note': 'Original'}
    client.post('/weight', data=json.dumps(weight_data), content_type='application/json')
    
    # Update weight entry
    updated_data = {'week_number': 25, 'weight': 70.5, 'note': 'Updated'}
    response = client.put('/weight/1',
                         data=json.dumps(updated_data),
                         content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'

def test_update_nonexistent_weight(client):
    """Test updating a weight entry that doesn't exist"""
    updated_data = {'week_number': 30, 'weight': 72.0, 'note': 'Test'}
    response = client.put('/weight/999',
                         data=json.dumps(updated_data),
                         content_type='application/json')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data

def test_delete_weight(client):
    """Test deleting a weight entry"""
    weight_data = {'week_number': 35, 'weight': 75.0, 'note': 'To be deleted'}
    client.post('/weight', data=json.dumps(weight_data), content_type='application/json')
    
    response = client.delete('/weight/1')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'

def test_delete_nonexistent_weight(client):
    """Test deleting a weight entry that doesn't exist"""
    response = client.delete('/weight/999')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data
