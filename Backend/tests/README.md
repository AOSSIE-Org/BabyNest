# BabyNest Backend Tests

This directory contains test files for the BabyNest backend system.

## Available Tests

### `demo_test.py`
A comprehensive demo that showcases all BabyNest backend functionality:

- **Agent Framework**: Complete RAG system with context awareness
- **Cache System**: High-performance caching with sub-millisecond response times
- **Database Integration**: SQLite with all pregnancy tracking tables
- **Vector Store**: ChromaDB with government pregnancy guidelines
- **Specialized Handlers**: Weight, appointments, symptoms, guidelines
- **Event-Driven Updates**: Automatic cache invalidation on database changes

## How to Run

From the Backend directory:
```bash
python tests/demo_test.py
```

## What the Demo Shows

1. **Weight Tracking**: Personalized analysis with user context
2. **Appointment Management**: Current appointments and scheduling
3. **Symptom Tracking**: Advice based on reported symptoms
4. **Government Guidelines**: Location-specific pregnancy recommendations
5. **Week-Specific Guidance**: Tailored advice for current pregnancy week
6. **Performance Metrics**: Cache speed and system responsiveness

## Expected Output

The demo will show:
- User profile information (Week 40, Mumbai, India)
- Real-time agent responses
- Government guidelines for pregnancy
- Performance metrics
- System status summary

## System Requirements

- Python 3.8+
- All dependencies from `requirements.txt`
- SQLite database with sample data
- ChromaDB for vector storage

## Notes

- Some handlers may show "application context" errors when run outside Flask
- This is expected behavior and doesn't affect core functionality
- The system is designed to work within the Flask application context
- All core features (cache, agent, vector store) work perfectly 