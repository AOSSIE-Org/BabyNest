# Quick Start Guide: Backend API Testing

## 🚀 Getting Started in 3 Steps

### 1. Install Dependencies
```bash
cd Backend
pip install -r requirements.txt
```

### 2. Run Tests
```bash
# Run all tests
python -m pytest tests/ -v

# Or use the test runner
python run_tests.py --all
```

### 3. View Results
Tests will show PASS/FAIL status for each endpoint.

## 📊 What's Being Tested

- ✅ **9 API Routes** - All backend endpoints
- ✅ **100+ Test Cases** - Comprehensive coverage
- ✅ **CRUD Operations** - Create, Read, Update, Delete
- ✅ **Error Handling** - Invalid inputs, missing data
- ✅ **Edge Cases** - Boundary conditions

## 🔄 Automatic Testing (CI/CD)

Tests run automatically on:
- Every pull request
- Every merge to main/develop
- Manual trigger from GitHub Actions

**Location**: `.github/workflows/backend-tests.yml`

## 📁 Test Files

```
Backend/tests/
├── test_api_appointments.py     # Appointment management
├── test_api_tasks.py           # Task management  
├── test_api_profile.py         # User profiles
├── test_api_weight.py          # Weight tracking
├── test_api_medicine.py        # Medicine logging
├── test_api_symptoms.py        # Symptom tracking
├── test_api_blood_pressure.py  # BP monitoring
├── test_api_discharge.py       # Discharge logging
├── test_api_agent.py           # AI agent
└── test_all_apis.py            # Master suite
```

## 🎯 Common Commands

```bash
# Run specific test file
python -m pytest tests/test_api_appointments.py -v

# Run with coverage report
python -m pytest tests/ --cov=routes --cov-report=html

# Run tests for specific feature
python run_tests.py --appointments --verbose

# Run multiple test suites
python run_tests.py --appointments --tasks --profile
```

## ✅ Expected Output

```
===== test session starts =====
tests/test_api_appointments.py::test_get_appointments_empty PASSED
tests/test_api_appointments.py::test_add_appointment PASSED
tests/test_api_appointments.py::test_add_appointment_missing_fields PASSED
...
===== X passed in Y.YYs =====
```

## 🐛 Troubleshooting

**Import errors?**
```bash
cd Backend
python -m pytest tests/
```

**Missing dependencies?**
```bash
pip install -r requirements.txt
```

**Database errors?**
```bash
mkdir -p db
```

## 📚 More Information

- **Detailed docs**: `Backend/tests/README.md`
- **Implementation summary**: `IMPLEMENTATION_ISSUE_109.md`
- **CI/CD config**: `.github/workflows/backend-tests.yml`

## 🎉 Success Criteria

When all tests pass, you'll see:
- ✅ Green checkmarks for all tests
- ✅ CI/CD pipeline passes
- ✅ Coverage report generated
- ✅ No breaking changes detected

---

**Need help?** Check the detailed README in `Backend/tests/README.md`
