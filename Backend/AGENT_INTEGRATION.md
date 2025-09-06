# BabyNest Agent Integration

This document explains the agentic system integration that provides fast, contextual responses to the frontend using the backend's sophisticated context management system.

## Architecture Overview

The system consists of several key components:

1. **Backend Agent System** - SQLite database + ChromaDB embeddings + LLM
2. **Context Cache** - Intelligent caching with database change detection
3. **Frontend Context Provider** - React context for state management
4. **API Endpoints** - RESTful endpoints for context and LLM responses

## Backend Components

### 1. Agent System (`agent/agent.py`)

The main agent orchestrates:
- **Context Management**: Caches user health data for fast access
- **Intent Classification**: Routes queries to specialized handlers
- **Vector Store**: Retrieves relevant pregnancy guidelines
- **LLM Integration**: Generates personalized responses

```python
# Example usage
agent = get_agent(db_path)
response = agent.run("What should I do in week 10?", user_id="default")
```

### 2. Context Cache (`agent/cache.py`)

Intelligent caching system that:
- **Detects Database Changes**: Uses hash-based change detection
- **Auto-refreshes**: Updates when health data changes
- **User-specific**: Maintains separate caches per user
- **Persistent**: Saves to disk for offline access

### 3. Manual Cache Management

Cache is manually updated when database changes occur:
- **Manual Invalidation**: Call `agent.refresh_cache_and_embeddings()` after DB changes
- **Updates Embeddings**: Refreshes ChromaDB vectors
- **Maintains Consistency**: Ensures context stays current

## Frontend Components

### 1. Agent Context Provider (`context/AgentContext.jsx`)

React context that provides:
- **Context Data**: User health information
- **LLM Responses**: Chat and recommendations
- **Cache Management**: Refresh and status functions
- **Error Handling**: Graceful error management

```javascript
const { context, chatWithAgent, getTaskRecommendations } = useAgentContext();
```

### 2. Enhanced Screens

#### TasksScreen (`Screens/TasksScreen.jsx`)
- **AI Recommendations**: LLM-powered task suggestions
- **Week Navigation**: Browse recommendations by pregnancy week
- **Context Display**: Shows current health data
- **Real-time Updates**: Refreshes when context changes

#### ChatScreen (`Screens/ChatScreen.jsx`)
- **Backend LLM**: Uses agent instead of local model
- **Context Awareness**: Personalized responses
- **Fast Responses**: No model download required
- **Health Integration**: Access to user's health data

## API Endpoints

### Context Endpoints

```http
GET /agent/context?user_id=default
```
Returns cached user context including:
- Current pregnancy week
- Recent health data
- Profile information
- Timestamp of last update

### Task Recommendations

```http
GET /agent/tasks/recommendations?user_id=default&week=10
```
Returns LLM-generated recommendations based on:
- Current pregnancy week
- User's health data
- Pregnancy guidelines
- Personalized advice

### Chat Endpoint

```http
POST /agent/chat
Content-Type: application/json

{
  "message": "What should I do this week?",
  "user_id": "default"
}
```
Returns contextual LLM response using:
- User's health context
- Pregnancy guidelines
- Personalized recommendations

### Cache Management

```http
POST /agent/refresh
GET /agent/cache/status
```
Manages context cache and provides status information.

## Data Flow

1. **User Action**: User interacts with app (adds weight, symptoms, etc.)
2. **Database Update**: SQLite database is updated
3. **Manual Cache Refresh**: Call `agent.refresh_cache_and_embeddings()` after DB changes
4. **Cache Invalidation**: Context cache is invalidated
5. **Embedding Update**: ChromaDB vectors are refreshed
6. **Frontend Update**: Context provider fetches new data
7. **UI Update**: Screens display updated information

## Performance Benefits

### Fast Responses
- **Cached Context**: No database queries for repeated requests
- **Pre-computed Embeddings**: Instant vector similarity search
- **Smart Caching**: Only updates when data changes

### Personalized Experience
- **Health Context**: Responses based on user's actual data
- **Pregnancy Week**: Recommendations specific to current week
- **Historical Data**: Considers past symptoms and trends

### Offline Capability
- **Local Database**: SQLite for offline data storage
- **Cached Responses**: Previous LLM responses available offline
- **Embedded Knowledge**: Pregnancy guidelines stored locally

## Testing

Run the integration test:

```bash
cd Backend
python test_agent_integration.py
```

This tests:
- Context endpoint functionality
- Task recommendations
- Chat responses
- Cache status

## Configuration

### Environment Variables

```bash
# Backend
BASE_URL=http://localhost:5000

# Frontend
BASE_URL=http://localhost:5000
```

### Database Setup

The system automatically:
- Creates SQLite database
- Initializes ChromaDB
- Sets up manual cache management
- Loads pregnancy guidelines

## Troubleshooting

### Common Issues

1. **Context Not Loading**
   - Check if user profile exists
   - Verify database connection
   - Check cache status endpoint

2. **Slow Responses**
   - Ensure ChromaDB is initialized
   - Check if embeddings are up to date
   - Verify LLM model is loaded

3. **Outdated Information**
   - Force refresh context
   - Check cache status
   - Verify cache invalidation

### Debug Commands

```bash
# Check cache status
curl http://localhost:5000/agent/cache/status

# Force refresh context
curl -X POST http://localhost:5000/agent/refresh

# Test chat
curl -X POST http://localhost:5000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "user_id": "default"}'
```

## Future Enhancements

1. **Multi-user Support**: Enhanced user management
2. **Real-time Updates**: WebSocket for live context updates
3. **Advanced Caching**: Redis for distributed caching
4. **Analytics**: Track user interactions and improve recommendations
5. **Offline LLM**: Local model fallback for offline use

## Security Considerations

- **Data Privacy**: User health data is stored locally
- **API Security**: Implement authentication for production
- **Input Validation**: Sanitize all user inputs
- **Error Handling**: Don't expose sensitive information in errors 