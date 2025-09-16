# Cache Management System

## Overview

The BabyNest cache system now includes comprehensive management features to prevent cache files from growing too large and consuming excessive resources. The system automatically monitors, limits, and cleans up cache data to maintain optimal performance.

## 🎯 **Problem Solved**

### **Before (Issues):**
- ❌ Cache files could grow indefinitely
- ❌ No limits on tracking data entries
- ❌ Memory cache could consume too much RAM
- ❌ Old cache files never cleaned up
- ❌ No monitoring or statistics
- ❌ Risk of hitting LLM context limits

### **After (Solutions):**
- ✅ Automatic data limiting (max 10 entries per type)
- ✅ File size monitoring (max 10MB per file)
- ✅ Memory cache management (max 50 users)
- ✅ Old file cleanup (max 30 days age)
- ✅ Comprehensive statistics and monitoring
- ✅ Automatic cleanup after updates

## 🔧 **Configuration Settings**

### **Cache Limits (Configurable)**
```python
# In ContextCache.__init__()
self.max_cache_size_mb = 10          # Maximum cache file size in MB
self.max_tracking_entries = 10       # Maximum entries per tracking type
self.max_cache_age_days = 30         # Maximum cache age before cleanup
self.max_memory_cache_size = 50      # Maximum number of users in memory cache
```

### **Data Type Limits**
- **Weight entries**: Max 10 most recent entries
- **Medicine entries**: Max 10 most recent entries
- **Symptoms entries**: Max 10 most recent entries
- **Blood pressure logs**: Max 10 most recent entries
- **Discharge logs**: Max 10 most recent entries

## 🚀 **Automatic Management Features**

### **1. Data Limiting**
```python
# Automatically limits tracking data to prevent excessive growth
def _limit_tracking_data(self, data: list, data_type: str) -> list:
    if len(data) <= self.max_tracking_entries:
        return data
    
    # Keep only the most recent entries
    limited_data = data[:self.max_tracking_entries]
    return limited_data
```

### **2. File Size Monitoring**
```python
# Checks cache file size after each update
def _check_and_cleanup_cache(self, user_id: str):
    file_size_mb = os.path.getsize(cache_file) / (1024 * 1024)
    if file_size_mb > self.max_cache_size_mb:
        self._cleanup_large_cache_file(user_id)
```

### **3. Memory Cache Management**
```python
# Removes least recently used users from memory cache
def _cleanup_memory_cache(self):
    if len(self.memory_cache) > self.max_memory_cache_size:
        # Remove oldest entries based on last_updated timestamp
        sorted_users = sorted(self.memory_cache.items(), 
                            key=lambda x: x[1].get('last_updated', '1970-01-01'))
        # Remove oldest users
```

### **4. Old File Cleanup**
```python
# Removes cache files older than max_cache_age_days
def _cleanup_old_cache_files(self):
    current_time = time.time()
    max_age_seconds = self.max_cache_age_days * 24 * 60 * 60
    
    for filename in os.listdir(self.cache_dir):
        file_age = current_time - os.path.getmtime(file_path)
        if file_age > max_age_seconds:
            os.remove(file_path)
```

## 📊 **Monitoring and Statistics**

### **Cache Statistics API**
```http
GET /agent/cache/stats
```

**Response:**
```json
{
  "cache_management": "enabled",
  "statistics": {
    "memory_cache_size": 5,
    "max_memory_cache_size": 50,
    "max_cache_size_mb": 10,
    "max_tracking_entries": 10,
    "max_cache_age_days": 30,
    "cache_files": 3,
    "total_cache_size_mb": 2.45,
    "oldest_cache_file": "2024-01-15T10:30:00",
    "newest_cache_file": "2024-01-20T14:22:00"
  },
  "limits": {
    "max_cache_size_mb": 10,
    "max_tracking_entries": 10,
    "max_cache_age_days": 30,
    "max_memory_cache_size": 50
  },
  "current_usage": {
    "memory_cache_size": 5,
    "cache_files": 3,
    "total_cache_size_mb": 2.45
  }
}
```

### **Manual Cleanup API**
```http
POST /agent/cache/cleanup
```

**Response:**
```json
{
  "status": "success",
  "message": "Cache cleanup completed",
  "statistics": { ... }
}
```

## 🔄 **Automatic Cleanup Triggers**

### **1. After Cache Updates**
```python
def update_cache(self, user_id: str = "default", data_type: str = None, operation: str = "update"):
    # ... update logic ...
    
    # Check if cache needs cleanup after update
    self._check_and_cleanup_cache(user_id)
```

### **2. On Agent Initialization**
```python
def __init__(self, db_path: str, cache_dir: str = "cache"):
    # ... initialization ...
    
    # Initialize cache and cleanup old files
    self._load_cache()
    self._cleanup_old_cache_files()
```

### **3. Manual Triggers**
```python
# Via agent
agent.cleanup_cache()

# Via API
POST /agent/cache/cleanup
```

## 📈 **Performance Benefits**

### **Memory Usage**
- **Before**: Unlimited memory cache growth
- **After**: Max 50 users in memory (configurable)

### **Disk Usage**
- **Before**: Unlimited cache file growth
- **After**: Max 10MB per cache file (configurable)

### **Data Volume**
- **Before**: Unlimited tracking data entries
- **After**: Max 10 entries per data type (configurable)

### **File Management**
- **Before**: Old files never cleaned up
- **After**: Automatic cleanup of files older than 30 days

## 🛠️ **Usage Examples**

### **Check Cache Status**
```python
# Get cache statistics
stats = agent.get_cache_stats()
print(f"Cache files: {stats['cache_files']}")
print(f"Total size: {stats['total_cache_size_mb']:.2f} MB")
print(f"Memory users: {stats['memory_cache_size']}")
```

### **Manual Cleanup**
```python
# Trigger manual cleanup
agent.cleanup_cache()
```

### **Monitor Cache Health**
```python
# Check if cache is within limits
stats = agent.get_cache_stats()
if stats['total_cache_size_mb'] > stats['max_cache_size_mb'] * 0.8:
    print("⚠️ Cache approaching size limit")
```

## 🔍 **Troubleshooting**

### **Cache File Too Large**
```
⚠️ Cache file too large (12.5MB), cleaning up...
✂️ Trimmed weight entries to 10
✂️ Trimmed medicine entries to 10
✅ Cleaned up cache file for user default
```

### **Memory Cache Too Large**
```
⚠️ Memory cache too large (55 users), cleaning up...
🗑️ Removed user old_user_1 from memory cache
🗑️ Removed user old_user_2 from memory cache
```

### **Old File Cleanup**
```
🗑️ Removed old cache file: context_old_user.json (age: 35.2 days)
🗑️ Removed oversized cache file: context_large_user.json (size: 15.3MB)
```

## 📋 **Best Practices**

### **1. Monitor Cache Health**
- Regularly check `/agent/cache/stats` endpoint
- Set up alerts for cache size approaching limits
- Monitor memory usage in production

### **2. Adjust Limits Based on Usage**
- Increase `max_tracking_entries` if you need more historical data
- Increase `max_cache_size_mb` for users with more data
- Adjust `max_cache_age_days` based on user activity patterns

### **3. Regular Maintenance**
- Run manual cleanup during low-traffic periods
- Monitor cache statistics for trends
- Consider archiving old data if needed

## 🚨 **Important Notes**

1. **Data Loss Prevention**: The system keeps the most recent entries, so important recent data is preserved
2. **Performance Impact**: Cleanup operations are lightweight and don't block user requests
3. **Configurability**: All limits can be adjusted based on your specific needs
4. **Monitoring**: Use the statistics API to monitor cache health in production
5. **Backup**: Consider backing up important cache data before major cleanup operations

## 🎉 **Benefits Summary**

- ✅ **Prevents disk space issues** - Automatic file size management
- ✅ **Reduces memory usage** - Limited memory cache size
- ✅ **Maintains performance** - Data limiting prevents slowdowns
- ✅ **Automatic cleanup** - No manual intervention required
- ✅ **Comprehensive monitoring** - Full visibility into cache health
- ✅ **Configurable limits** - Adjust based on your needs
- ✅ **LLM context safety** - Prevents context window overflow
- ✅ **Production ready** - Robust error handling and logging
