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
            db.execute('DELETE FROM tasks')
            db.commit()
            close_db(db)
        yield client

def test_get_tasks_empty(client):
    """Test getting tasks when none exist"""
    response = client.get('/get_tasks')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 0

def test_add_task(client):
    """Test adding a new task"""
    task_data = {
        'title': 'Test Task',
        'description': 'This is a test task',
        'due_date': '2025-01-15',
        'priority': 'high'
    }
    response = client.post('/add_task',
                          data=json.dumps(task_data),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'

def test_add_task_missing_fields(client):
    """Test adding task with missing required fields"""
    task_data = {
        'title': 'Test Task'
    }
    response = client.post('/add_task',
                          data=json.dumps(task_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_get_tasks_after_adding(client):
    """Test getting tasks after adding one"""
    task_data = {
        'title': 'Test Task 2',
        'description': 'Another test task',
        'due_date': '2025-02-01',
        'priority': 'medium'
    }
    client.post('/add_task',
               data=json.dumps(task_data),
               content_type='application/json')
    
    response = client.get('/get_tasks')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) > 0
    assert data[0]['title'] == 'Test Task 2'

def test_get_single_task(client):
    """Test getting a single task by ID"""
    task_data = {
        'title': 'Single Task Test',
        'description': 'Test single task retrieval',
        'due_date': '2025-03-01',
        'priority': 'low'
    }
    client.post('/add_task',
               data=json.dumps(task_data),
               content_type='application/json')
    
    response = client.get('/get_task/1')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['title'] == 'Single Task Test'

def test_get_nonexistent_task(client):
    """Test getting a task that doesn't exist"""
    response = client.get('/get_task/999')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data

def test_update_task(client):
    """Test updating an existing task"""
    task_data = {
        'title': 'Original Task',
        'description': 'Original description',
        'due_date': '2025-04-01',
        'priority': 'high'
    }
    client.post('/add_task',
               data=json.dumps(task_data),
               content_type='application/json')
    
    updated_data = {
        'title': 'Updated Task',
        'description': 'Updated description',
        'due_date': '2025-04-02',
        'priority': 'medium',
        'status': 'completed'
    }
    response = client.put('/update_task/1',
                         data=json.dumps(updated_data),
                         content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'

def test_update_nonexistent_task(client):
    """Test updating a task that doesn't exist"""
    updated_data = {
        'title': 'Updated Task',
        'description': 'Updated description',
        'due_date': '2025-04-02',
        'priority': 'medium'
    }
    response = client.put('/update_task/999',
                         data=json.dumps(updated_data),
                         content_type='application/json')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data

def test_delete_task(client):
    """Test deleting a task"""
    task_data = {
        'title': 'To Be Deleted',
        'description': 'This task will be deleted',
        'due_date': '2025-05-01',
        'priority': 'low'
    }
    client.post('/add_task',
               data=json.dumps(task_data),
               content_type='application/json')
    
    response = client.delete('/delete_task/1')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'

def test_delete_nonexistent_task(client):
    """Test deleting a task that doesn't exist"""
    response = client.delete('/delete_task/999')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data
