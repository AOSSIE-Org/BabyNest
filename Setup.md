# SafeBump Setup Guide

This guide provides step-by-step instructions to set up the SafeBump app for Android and iOS, addressing platform-specific dependencies and configurations.

## Prerequisites
Ensure you have the following installed:
- *Node.js* (Latest LTS version)
- *React Native CLI*
- *Python 3.8+* (For Flask backend)
- *SQLite* (For local storage)
- *ChromaDB* (For vector search)
- *Git* (For version control)

## 1. Clone the Repository
sh
git clone https://github.com/yourusername/SafeBump.git
cd SafeBump


---
## Android Setup

### 2. Install Dependencies
sh
npm install


### 3. Set Up Android Development Environment
- Install *Android Studio* and ensure the latest SDK versions are installed.
- Set up an Android Virtual Device (AVD) or connect a physical device.
- Ensure ANDROID_HOME is set in your environment variables.
- Install dependencies:
  sh
  npx react-native doctor
  
- If needed, install missing dependencies.

### 4. Configure SQLite
SafeBump uses SQLite for local storage:
- Ensure react-native-sqlite-storage is installed:
  sh
  npm install react-native-sqlite-storage
  
- Link dependencies (if necessary):
  sh
  npx pod-install
  

### 5. Run the App on Android
sh
npx react-native run-android


---
## iOS Setup

### 2. Install Dependencies
sh
npm install


### 3. Set Up iOS Development Environment
- Install *Xcode* from the Mac App Store.
- Install *CocoaPods* (if not installed):
  sh
  sudo gem install cocoapods
  
- Install pods:
  sh
  cd ios
  pod install
  cd ..
  
- Set up a simulator or use a physical device.

### 4. Configure SQLite
SafeBump uses SQLite for local storage:
- Ensure react-native-sqlite-storage is installed:
  sh
  npm install react-native-sqlite-storage
  
- Link dependencies:
  sh
  npx pod-install
  

### 5. Run the App on iOS
sh
npx react-native run-ios


---
## Backend Setup (Offline Flask API)
SafeBump includes an offline backend using Flask.

### 1. Install Python Dependencies
sh
pip install flask flask-cors chromadb


### 2. Run the Backend Locally
sh
cd backend
python app.py


This will start the API locally.

---
## Handling Vector Search (ChromaDB)
SafeBump uses ChromaDB for offline vector search.
### 1. Install ChromaDB
sh
pip install chromadb

### 2. Run ChromaDB
sh
python -m chromadb

This starts the local vector database.

---
## Troubleshooting
### Android Issues
- If run-android fails, ensure:
  - Emulator or physical device is connected.
  - adb devices lists a device.
  - npx react-native start is running.
- If you encounter a Java heap space error, increase heap size:
  sh
  export NODE_OPTIONS=--max_old_space_size=4096
  
- If build fails with Gradle errors, try:
  sh
  cd android
  ./gradlew clean
  cd ..
  

### iOS Issues
- If the build fails, try:
  sh
  cd ios
  pod install --verbose
  cd ..
  
- Ensure Xcode command-line tools are installed:
  sh
  sudo xcode-select --install
  
- If the Metro bundler crashes, clear the cache:
  sh
  npx react-native start --reset-cache
  
- If CocoaPods fails with dependency issues, try:
  sh
  cd ios
  pod repo update
  pod install --verbose
  cd ..
  
- If you encounter Podfile.lock conflicts, remove and reinstall pods:
  sh
  cd ios
  rm -rf Pods Podfile.lock
  pod install
  cd ..
  
- If linking issues occur, ensure dependencies are correctly linked:
  sh
  npx react-native link
  

### Backend Issues
- If Flask doesn’t start, check dependencies:
  sh
  pip install -r backend/requirements.txt
  
- Ensure Python version is 3.8+.
- If Flask crashes with Address already in use, free the port:
  sh
  lsof -i :5000
  kill -9 <PID>
  

### Database Issues
- If SQLite doesn’t initialize, ensure:
  - The database file exists in the correct directory.
  - Correct permissions are set:
    sh
    chmod 777 database.db
    

---
## Conclusion
Once both the frontend and backend are running, SafeBump will be fully functional. For any issues, check logs and ensure dependencies are correctly installed.