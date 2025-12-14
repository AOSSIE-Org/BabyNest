# Event-Driven Cache System

## Overview

The BabyNest agent uses an **event-driven cache system** that automatically updates the context cache whenever database changes are detected. This eliminates the need for manual cache refresh and ensures optimal performance.

## Key Features

### 🚀 Automatic Updates
- **No manual intervention required**: Cache updates automatically when database changes occur
- **Manual refresh**: Cache is updated when database changes occur
- **Immediate invalidation**: Cache is cleared and rebuilt when changes are detected

### 📊 Monitored Tables
The system monitors these tables for changes:
- `profile` - User profile information
- `weekly_weight` - Weight tracking data (includes dates)
- `weekly_medicine` - Medicine tracking data (includes dates)
- `weekly_symptoms` - Symptom tracking data (includes dates)
- `blood_pressure_logs` - Blood pressure readings (includes dates)
- `discharge_logs` - Discharge tracking data (includes dates)

### ⚡ Performance Benefits
- **Reduced latency**: Cached context is served instantly
- **No recalculations**: Context is pre-built and stored
- **Fast responses**: AI agent replies are much faster
- **Efficient resource usage**: Database queries are minimized

## How It Works

### 1. Manual Cache Management
```python
# Cache is manually invalidated when database changes occur
agent.refresh_cache_and_embeddings()
```

### 2. Cache Invalidation
```python
def refresh_cache_and_embeddings(self):
    """Manually refresh cache and regenerate embeddings after database changes."""
    print("🔄 Manually refreshing cache and regenerating embeddings...")
    self.context_cache.invalidate_cache()
    update_guildelines_in_vector_store()
```

### 4. Context Rebuilding
- Cache is automatically rebuilt on next request
- New context includes latest database data with dates
- Vector store embeddings are regenerated
- Temporal context helps AI understand data timeline

## Enhanced Context with Dates

The cache system now includes date information for all tracking data, providing better temporal context for the AI agent:

### Context Data Structure
```json
{
  "current_week": 25,
  "location": "New York",
  "age": 25,
  "weight": 65.5,
  "due_date": "2024-10-01",
  "tracking_data": {
    "weight": [
      {
        "week": 20,
        "weight": 65.5,
        "note": "Normal weight gain",
        "date": "2024-01-15 10:30:00"
      }
    ],
    "medicine": [
      {
        "week": 20,
        "name": "Folic Acid",
        "dose": "400mg",
        "time": "Morning",
        "taken": true,
        "note": "Daily supplement",
        "date": "2024-01-15 08:00:00"
      }
    ],
    "symptoms": [
      {
        "week": 20,
        "symptom": "Morning sickness",
        "note": "Mild nausea",
        "date": "2024-01-15 09:00:00"
      }
    ],
    "blood_pressure": [
      {
        "week": 20,
        "systolic": 120,
        "diastolic": 80,
        "time": "Morning",
        "note": "Normal reading",
        "date": "2024-01-15 07:00:00"
      }
    ],
    "discharge": [
      {
        "week": 20,
        "type": "Normal",
        "color": "Clear",
        "bleeding": false,
        "note": "Regular discharge",
        "date": "2024-01-15 11:00:00"
      }
    ]
  }
}
```

### Benefits of Date Inclusion
- **Temporal Analysis**: AI can understand when symptoms occurred
- **Trend Analysis**: Track changes over time more effectively
- **Better Recommendations**: Context-aware advice based on timing
- **Data Validation**: Verify data freshness and relevance

## API Endpoints

### Cache Status
```http
GET /agent/cache/status?user_id=default
```

Response:
```json
{
  "cache_system": "event_driven",
  "cache_status": "active",
  "auto_update": true,
  "has_context": true,
  "context_week": 25,
  "context_location": "New York",
  "last_updated": "2024-01-15T10:30:00",
  "monitored_tables": [
    "profile", "weekly_weight", "weekly_medicine", 
    "weekly_symptoms", "blood_pressure_logs", "discharge_logs"
  ],
  "note": "Cache automatically updates when database changes are detected"
}
```

## Testing

Run the test script to verify the event-driven system:

```bash
cd Backend
python test_event_driven_cache.py
```

Expected output:
```
🧪 Testing event-driven cache system...
📊 Initial cache state:
   - Has context: True
   - Current week: 25
   - Weight: 65.5
📝 Making database changes...
⏳ Waiting for cache invalidation...
✅ Cache invalidation triggered!
✅ SUCCESS: Cache was automatically invalidated!
   - New weight: 66.0
   - Weight entries: 2
🎯 Test completed!
🎉 Event-driven cache system is working correctly!
```

## Benefits Over Manual Refresh

### Before (Manual System)
- ❌ Required manual cache refresh endpoint
- ❌ Users had to remember to refresh
- ❌ Stale data could be served
- ❌ Inconsistent user experience

### After (Event-Driven System)
- ✅ Automatic cache updates
- ✅ Always fresh data
- ✅ No user intervention needed
- ✅ Consistent performance
- ✅ Reduced API complexity

## Implementation Details

### Cache Storage
- **Memory cache**: Fast access for active sessions
- **Disk cache**: Persistent storage across restarts
- **Thread-safe**: Locked access for concurrent requests

### Cache Performance
- **1-second polling**: Fast response to changes
- **File modification time**: Quick initial check
- **Table state comparison**: Accurate change detection
- **Background thread**: Non-blocking operation

### Error Handling
- **Manual control**: System updates cache when explicitly requested
- **State file recovery**: Handles corrupted state files
- **Table validation**: Prevents SQL injection
- **Connection management**: Proper database connection handling

## Monitoring

The system provides detailed logging:
```
🔄 Cache system ready - call refresh_cache_and_embeddings() after DB changes
📊 Database changes detected, invalidating cache...
✅ Cache invalidation triggered!
```

## Future Enhancements

- [ ] Webhook-based notifications for external database changes
- [ ] Cache warming for frequently accessed contexts
- [ ] Cache compression for large datasets
- [ ] Cache analytics and performance metrics 