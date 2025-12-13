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
            # Setup profile for agent context
            db.execute('DELETE FROM profile')
            db.execute(
                'INSERT INTO profile (lmp, cycleLength, periodLength, age, weight, user_location, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ('2024-12-01', 28, 5, 28, 65, 'New York', '2025-09-07')
            )
            db.commit()
            close_db(db)
        yield client

def test_agent_endpoint_valid_query(client):
    """Test agent endpoint with valid query"""
    query_data = {
        'query': 'What should I eat during pregnancy?',
        'user_id': 'test_user'
    }
    response = client.post('/agent',
                          data=json.dumps(query_data),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'response' in data

def test_agent_endpoint_missing_query(client):
    """Test agent endpoint with missing query"""
    query_data = {
        'user_id': 'test_user'
        # missing query
    }
    response = client.post('/agent',
                          data=json.dumps(query_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_agent_endpoint_invalid_json(client):
    """Test agent endpoint with invalid JSON"""
    response = client.post('/agent',
                          data='not json',
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_agent_endpoint_no_data(client):
    """Test agent endpoint with no data"""
    response = client.post('/agent',
                          data='',
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_agent_cache_status(client):
    """Test getting agent cache status"""
    response = client.get('/agent/cache/status?user_id=test_user')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'cache_system' in data
    assert 'cache_status' in data
    assert data['cache_system'] == 'event_driven'

def test_agent_context(client):
    """Test getting agent context"""
    response = client.get('/agent/context?user_id=test_user')
    # May return 404 if context not initialized, or 200 if context exists
    assert response.status_code in [200, 404]
    data = json.loads(response.data)
    if response.status_code == 200:
        assert 'context' in data
    else:
        assert 'error' in data

def test_agent_endpoint_default_user_id(client):
    """Test agent endpoint with default user_id"""
    query_data = {
        'query': 'What exercises are safe during pregnancy?'
        # no user_id provided, should use 'default'
    }
    response = client.post('/agent',
                          data=json.dumps(query_data),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'response' in data
