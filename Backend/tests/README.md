# BabyNest Backend Tests

This directory contains comprehensive test coverage for the BabyNest backend system, including both automated API tests and demo functionality.

## 🚀 Quick Start

```bash
# Install dependencies
cd Backend
pip install -r requirements.txt

# Run all API tests
python -m pytest tests/ -v

# Run with coverage report
python -m pytest tests/ --cov=routes --cov=app --cov-report=html
```

## 📋 Automated API Tests

### Test Coverage

Complete test coverage for **all 9 API routes** with **100+ test cases**:

#### 1. **Appointments API** (`test_api_appointments.py`)
- GET, POST, PUT, DELETE operations
- Validation tests for missing fields
- Error handling for non-existent records

#### 2. **Tasks API** (`test_api_tasks.py`)
- Full CRUD operations
- Priority and status handling
- Edge case validation

#### 3. **Profile API** (`test_api_profile.py`)
- Profile creation and management
- Due date calculation validation
- Location-based data

#### 4. **Weight API** (`test_api_weight.py`)
- Weekly weight logging
- Week number validation (1-52)
- Retrieval by week and ID

#### 5. **Medicine API** (`test_api_medicine.py`)
- Medicine tracking
- Dosage and timing
- Authentication tests

#### 6. **Symptoms API** (`test_api_symptoms.py`)
- Symptom logging
- Severity tracking
- Weekly symptom retrieval

#### 7. **Blood Pressure API** (`test_api_blood_pressure.py`)
- BP monitoring
- Systolic/diastolic validation
- Heart rate tracking

#### 8. **Discharge API** (`test_api_discharge.py`)
- Discharge logging
- Type and consistency tracking
- Color monitoring

#### 9. **Agent API** (`test_api_agent.py`)
- AI agent query testing
- Cache status monitoring
- Context management

### Running Specific Tests

```bash
# Run specific test file
python -m pytest tests/test_api_appointments.py -v

# Run tests matching a pattern
python -m pytest tests/ -k "appointment" -v

# Run with detailed output
python -m pytest tests/ -vv --tb=long

# Run master test suite
python tests/test_all_apis.py
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

Automated testing runs on:
- ✅ Every push to `main` or `develop`
- ✅ Every pull request
- ✅ Manual trigger via Actions tab

**File**: `.github/workflows/backend-tests.yml`

### Test Matrix
- Python 3.9, 3.10, 3.11
- Ubuntu latest
- Coverage reporting to Codecov

### Workflow Features
- 🔒 Dependency caching for faster builds
- 📊 Coverage reports (XML and HTML)
- 🎯 Test artifacts saved for 30 days
- ❌ Automatic failure notifications

## 📊 Demo Tests

### `demo_test.py`
A comprehensive demo that showcases all BabyNest backend functionality:

- **Agent Framework**: Complete RAG system with context awareness
- **Cache System**: High-performance caching with sub-millisecond response times
- **Database Integration**: SQLite with all pregnancy tracking tables
- **Vector Store**: ChromaDB with government pregnancy guidelines
- **Specialized Handlers**: Weight, appointments, symptoms, guidelines
- **Event-Driven Updates**: Automatic cache invalidation on database changes

Run the demo:
```bash
python tests/demo_test.py
```

## 🏗️ Test Structure

Each test file follows this pattern:

```python
import pytest
from app import app

@pytest.fixture
def client():
    """Setup test client"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        # Setup test database
        yield client

def test_endpoint(client):
    """Test description"""
    response = client.get('/endpoint')
    assert response.status_code == 200
```

## ➕ Adding New Tests

1. Create `tests/test_api_<feature>.py`
2. Import required modules
3. Create test fixtures
4. Write test functions
5. Run tests to verify
6. Update this README

## 🐛 Troubleshooting

**Import errors:**
```bash
cd Backend
python -m pytest tests/
```

**Database errors:**
```bash
mkdir -p db
```

**Missing dependencies:**
```bash
pip install -r requirements.txt
```

## 📈 Coverage Reports

Generate HTML coverage:
```bash
python -m pytest tests/ --cov=routes --cov=app --cov-report=html
# Open htmlcov/index.html
```

## 🎯 Future Enhancements

- [ ] Integration tests with external services
- [ ] Performance/load testing
- [ ] API documentation validation
- [ ] Security testing (OWASP)
- [ ] Database migration tests

## System Requirements

- Python 3.8+
- All dependencies from `requirements.txt`
- SQLite database
- ChromaDB for vector storage

## Notes

- Some handlers may show "application context" errors when run outside Flask
- This is expected behavior and doesn't affect core functionality
- The system is designed to work within the Flask application context
- All core features (cache, agent, vector store) work perfectly 