# BabyNest Agent System

## Overview

The BabyNest agent system provides intelligent, personalized pregnancy assistance with high-performance caching and event-driven updates. The agent uses cached user context to provide fast, relevant responses without repeated database queries.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Query    │───▶│   Agent          │───▶│   LLM Response  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Context Cache   │
                       │  (Memory/Disk)   │
                       └──────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ Database Observer│
                       │ (Event Monitor)  │
                       └──────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   SQLite DB      │
                       └──────────────────┘
```

## Components

### Core Agent Files

- **`agent.py`** - Main agent class with caching integration
- **`cache.py`** - Context cache system for user data
- **`db_observer.py`** - Database change monitoring
- **`prompt.py`** - Enhanced prompt building with user context
- **`llm.py`** - LLM interface (replace with your LLM)
- **`intent.py`** - Intent classification
- **`context.py`** - Vector store context retrieval

### Handlers

- **`handlers/`** - Specialized handlers for different intents
  - `appointment.py` - Appointment management
  - `weight.py` - Weight tracking
  - `symptoms.py` - Symptom tracking
  - `guidelines.py` - Pregnancy guidelines

### Data Files

- **`guidelines.json`** - Pregnancy knowledge base
- **`guidelines_data.py`** - Guidelines data loader

## Features

### 🚀 **Performance Benefits**
- **Zero DB hits** for repeated queries when context hasn't changed
- **Memory + Disk caching** for persistence across app restarts
- **Thread-safe operations** for concurrent access

### 🔄 **Event-Driven Updates**
- **Automatic cache invalidation** when database changes
- **Real-time monitoring** of relevant tables
- **Hash-based change detection** for efficient updates

### 📊 **Rich Context Data**
- **User profile** (week, location, age, weight, due date)
- **Tracking data** (weight, medicine, symptoms, blood pressure, discharge)
- **Structured format** for easy consumption by the agent

## Usage

### Basic Usage

```python
from agent.agent import get_agent

# Initialize agent with database path
db_path = "path/to/database.db"
agent = get_agent(db_path)

# Use agent with cached context
response = agent.run("How am I doing this week?", "user_123")
```

### API Endpoints

#### Get Agent Response
```http
POST /agent
{
    "query": "What should I know about my current week?",
    "user_id": "user_123"
}
```

#### Force Cache Refresh
```http
POST /agent/refresh
{
    "user_id": "user_123"
}
```

#### Check Cache Status
```http
GET /agent/cache/status
```

## Cache System

### How It Works

1. **Context Retrieval**: Agent gets user context from cache (no DB hit if valid)
2. **Intent Classification**: Determines if specialized handler should be used
3. **Knowledge Retrieval**: Gets relevant information from vector store
4. **Response Generation**: Builds personalized prompt and gets LLM response

### Cache Benefits

- **Fast responses** - Sub-millisecond context retrieval
- **Reduced database load** - Fewer queries per user session
- **Automatic updates** - Cache invalidates when data changes
- **Persistent storage** - Survives app restarts

### Monitored Tables

The cache system automatically monitors:
- `profile` - User profile data
- `weekly_weight` - Weight tracking
- `weekly_medicine` - Medicine tracking
- `weekly_symptoms` - Symptom tracking
- `blood_pressure_logs` - Blood pressure data
- `discharge_logs` - Discharge tracking

## Configuration

### Cache Settings

- **Cache directory**: `Backend/agent/cache/`
- **Check interval**: 2 seconds for database changes
- **Memory cache**: In-memory storage for fastest access
- **Disk cache**: Persistent storage for app restarts

### Performance Tuning

```python
# Adjust observer check interval
observer._observer_loop()  # Modify sleep time

# Force cache refresh
agent.force_refresh_context("user_123")

# Invalidate specific user cache
agent.invalidate_cache("user_123")
```

## Testing

Run the test script to verify the system:

```bash
cd Backend
python test_cache_system.py
```

This tests:
- Context retrieval performance
- Cache invalidation on DB changes
- Agent response generation
- Force refresh functionality

## Benefits

### For Users
- **Faster responses** - No waiting for database queries
- **Consistent experience** - Same context across multiple queries
- **Real-time updates** - Changes reflected immediately

### For Developers
- **Reduced database load** - Fewer queries per user session
- **Scalable architecture** - Cache scales with user base
- **Easy debugging** - Cache files for inspection
- **Thread-safe** - No race conditions

### For System
- **Lower latency** - Sub-millisecond context retrieval
- **Better resource utilization** - Efficient memory usage
- **Automatic maintenance** - Self-updating cache

## Troubleshooting

### Cache Not Updating
1. Check if database observer is running
2. Verify table changes are being detected
3. Force refresh with `/agent/refresh` endpoint

### Performance Issues
1. Check cache file sizes in `Backend/agent/cache/`
2. Monitor memory usage
3. Adjust observer check interval if needed

### Context Missing
1. Verify user profile exists in database
2. Check cache files for corruption
3. Force refresh to rebuild cache

## Future Enhancements

- **Multi-user support** with user-specific caches
- **Cache compression** for large datasets
- **Redis integration** for distributed caching
- **Cache analytics** and monitoring
- **Predictive caching** based on user patterns 