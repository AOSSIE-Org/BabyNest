# BabyNest Frontend

A React Native application for pregnancy tracking and AI-powered assistance.

## 🚀 Features

- **AI-Powered Chat**: Local LLM with backend context integration
- **Task Management**: View tasks by pregnancy week with priority sorting
- **Health Tracking**: Weight, symptoms, medications, blood pressure
- **Personalized Recommendations**: Context-aware AI suggestions
- **Offline Capability**: Local GGUF model for chat responses

## 📋 Prerequisites

- Node.js (v16 or higher)
- React Native CLI
- Android Studio / Xcode
- Python 3.8+ (for backend)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BabyNest_aossie/Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the Frontend directory:
   ```env
   # API Configuration
   BASE_URL=http://localhost:5000
   
   # Model Configuration
   MODEL_NAME=llama-2-7b-chat
   HF_TO_GGUF=TheBloke/Llama-2-7B-Chat-GGUF
   GGUF_FILE=llama-2-7b-chat.gguf
   ```

4. **Install React Native dependencies**
   ```bash
   npx react-native link
   ```

## 🤖 AI Model Setup

### Model Download

The app uses a local GGUF model for chat responses. The model will be automatically downloaded on first use.

**Model Details:**
- **Model**: Llama-2-7B-Chat-GGUF
- **Repository**: TheBloke/Llama-2-7B-Chat-GGUF
- **File**: llama-2-7b-chat.gguf (~4GB)

### Model Configuration

The model is configured in `src/model/model.jsx`:
- **Context Window**: 2048 tokens
- **GPU Layers**: 0 (CPU only)
- **Stop Words**: Configured for chat completion

## 🔧 Backend Integration

### Required Backend Services

1. **Flask API** (Backend directory)
   - Agent context management
   - Health data storage
   - Task recommendations

2. **Database** (SQLite)
   - User profiles
   - Health records
   - Tasks and appointments

3. **Agent System**
   - Context caching
   - Vector embeddings (ChromaDB)
   - LLM integration

### API Endpoints

- `GET /agent/context` - Get user health context
- `GET /agent/tasks/recommendations` - Get AI task recommendations
- `POST /agent/refresh` - Refresh context cache
- `GET /agent/cache/status` - Check cache status

## 📱 App Structure

### Core Components

- **ChatScreen**: AI-powered pregnancy assistant
- **HomeScreen**: Dashboard with tasks and appointments
- **AllTasksScreen**: Comprehensive task management
- **AgentContext**: Backend context management

### Key Features

#### 1. AI Chat Integration
```javascript
// Context-aware conversation building
const contextAwareConversation = buildContextAwareConversation(conversation);
const response = await generateResponse(contextAwareConversation);
```

#### 2. Task Management
```javascript
// Priority-based task filtering
const filteredTasks = tasks
  .filter(task => task.starting_week <= currentWeek && task.ending_week >= currentWeek)
  .sort((a, b) => priorityOrder[b.task_priority] - priorityOrder[a.task_priority])
  .slice(0, 3);
```

#### 3. Health Context Integration
```javascript
// Backend context with frontend LLM
const { context } = useAgentContext();
// Context includes: pregnancy week, weight, symptoms, medications
```

## 🏃‍♀️ Running the App

### Development

1. **Start Metro bundler**
   ```bash
   npx react-native start
   ```

2. **Run on Android**
   ```bash
   npx react-native run-android
   ```

3. **Run on iOS**
   ```bash
   npx react-native run-ios
   ```

### Production

1. **Build Android APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

2. **Build iOS**
   ```bash
   cd ios
   xcodebuild -workspace BabyNest.xcworkspace -scheme BabyNest -configuration Release
   ```

## 🔄 Data Flow

### Chat System
1. **User Input** → ChatScreen
2. **Context Fetch** → Backend Agent
3. **Context-Aware Prompt** → Frontend LLM
4. **Response Generation** → Local GGUF Model
5. **Display Response** → ChatScreen

### Task System
1. **Health Data** → Backend Database
2. **Context Update** → Agent Cache
3. **Task Filtering** → Frontend Logic
4. **Priority Sorting** → UI Display

## 🧪 Testing

### Backend Integration Test
```bash
cd ../Backend
python test_agent_integration.py
```

### Frontend Testing
```bash
npm test
```

## 🔧 Troubleshooting

### Common Issues

1. **Model Not Loading**
   - Check internet connection for download
   - Verify sufficient storage space
   - Check `.env` file configuration

2. **Backend Connection Issues**
   - Ensure Flask server is running
   - Check `BASE_URL` in `.env`
   - Verify backend dependencies

3. **Context Not Loading**
   - Check backend agent initialization
   - Verify database setup
   - Check user profile exists

### Debug Commands

```bash
# Check model status
adb logcat | grep "Model"

# Check API calls
adb logcat | grep "fetch"

# Check context loading
adb logcat | grep "Context"
```

## 📚 API Documentation

### Agent Context
```javascript
const { context, loading, error } = useAgentContext();
// context: { current_week, recent_data, profile }
```

### Task Recommendations
```javascript
const { getTaskRecommendations } = useAgentContext();
const recommendations = await getTaskRecommendations(week);
```

### Model Management
```javascript
import { loadModel, generateResponse } from '../model/model';
const success = await loadModel(GGUF_FILE);
const response = await generateResponse(conversation);
```

## 🔒 Security Considerations

- **Local Model**: GGUF model runs locally, no data sent to external APIs
- **Health Data**: Stored locally in SQLite database
- **Context Privacy**: User health data only used for local AI responses
- **Offline Capability**: Chat works without internet connection

## 🚀 Performance Optimizations

- **Model Caching**: GGUF model loaded once per session
- **Context Caching**: Backend context cached with hash-based invalidation
- **Lazy Loading**: Model loads only when ChatScreen is accessed
- **Memory Management**: Automatic model cleanup on component unmount

## 📈 Future Enhancements

- [ ] Multi-user support
- [ ] Real-time health monitoring
- [ ] Advanced analytics dashboard
- [ ] Integration with health devices
- [ ] Offline model updates
- [ ] Voice chat interface

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 