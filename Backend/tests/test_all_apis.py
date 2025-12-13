"""
Master test runner for all API tests
Run with: python -m pytest tests/test_all_apis.py
"""
import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import all test modules
from tests import (
    test_api_appointments,
    test_api_tasks,
    test_api_profile,
    test_api_weight,
    test_api_medicine,
    test_api_symptoms,
    test_api_blood_pressure,
    test_api_discharge,
    test_api_agent
)

def run_all_tests():
    """Run all API tests with coverage report"""
    pytest.main([
        'tests/',
        '-v',
        '--tb=short',
        '--cov=routes',
        '--cov=app',
        '--cov-report=term-missing',
        '--cov-report=html',
        '-p', 'no:warnings'
    ])

if __name__ == '__main__':
    run_all_tests()
