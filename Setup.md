# BabyNest Setup Guide

This guide provides step-by-step instructions to set up the BabyNest app for Android and iOS, addressing platform-specific dependencies and configurations.

## Prerequisites

Ensure you have the following installed:

- _Node.js_ (Latest LTS version)
- _React Native CLI_
- _Python 3.8+_ (For Flask backend)
- _SQLite_ (For local storage)
- _ChromaDB_ (For vector search)
- _Git_ (For version control)

## 1) Clone the Repository

```sh
git clone https://github.com/AOSSIE-Org/BabyNest.git
cd BabyNest
```

---

## Android Setup

### 2) Install Dependencies

```sh
cd Frontend
npm install
```

### 3) Set Up Android Development Environment

- Install _Android Studio_ and ensure the latest SDK versions are installed.
- Set up an Android Virtual Device (AVD) or connect a physical device.
- Ensure ANDROID_HOME is set in your environment variables.
  Install dependencies:
  ```sh
  npx react-native doctor
  ```
- If needed, install missing dependencies.

### 4. Configure SQLite

BabyNest uses SQLite for local storage:
Ensure react-native-sqlite-storage is installed:

```sh
npm install react-native-sqlite-storage
```

Link dependencies (if necessary):

```sh
npx pod-install
```

### 5) Run the App on Android

```sh
npx react-native start
npx react-native run-android
```

---

## iOS Setup

### 2) Install Dependencies

```sh
cd Frontend
npm install
```

### 3) Set Up iOS Development Environment

- Install _Xcode_ from the Mac App Store.
  Install _CocoaPods_ (if not installed):
  ```sh
  sudo gem install cocoapods
  ```

Install pods:

```sh
cd ios
pod install
cd ..
```

- Set up a simulator or use a physical device.

### 4. Configure SQLite

BabyNest uses SQLite for local storage:
Ensure react-native-sqlite-storage is installed:

```sh
npm install react-native-sqlite-storage
```

Link dependencies:

```sh
npx pod-install
```

### 5) Run the App on iOS

```sh
npx react-native start
npx react-native run-ios
```

---

## Backend Setup (Offline Flask API)

BabyNest includes an offline backend using Flask

### 6) Install Python Dependencies

```sh
cd Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 7) Run the Backend Locally

```sh
cd Backend
python app.py
```

This will start the API locally.

---

## Handling Vector Search (ChromaDB)

BabyNest uses ChromaDB for offline vector search.

### 1) Install ChromaDB

```sh
pip install chromadb
```

### 2) Run ChromaDB

```sh
python -m chromadb
```

This starts the local vector database.

---

## Troubleshooting

### Android Issues

- If run-android fails, ensure:
  - Emulator or physical device is connected.
  - adb devices lists a device.
  - npx react-native start is running.
- If you encounter a Java heap space error, increase heap size:
  ```sh
  export NODE_OPTIONS=--max_old_space_size=4096
  ```
- If build fails with Gradle errors, try:
  ```sh
  cd android
  ./gradlew clean
  cd ..
  ```

### iOS Issues

- Try uninstalling any app in ios simulator and close the terminal and run all the commands again as mentioned here.

- If the issues still persist and build fails, try:
  ```sh
  cd ios
  pod install --verbose
  cd ..
  ```
- Ensure Xcode command-line tools are installed:
  ```sh
  sudo xcode-select --install
  ```
- If the Metro bundler crashes, clear the cache:
  ```sh
  npx react-native start --reset-cache
  ```
- If CocoaPods fails with dependency issues, try:
  ```sh
  cd ios
  pod repo update
  pod install --verbose
  cd ..
  ```
- If you encounter Podfile.lock conflicts, remove and reinstall pods:
  ```sh
  cd ios
  rm -rf Pods Podfile.lock
  pod install
  cd ..
  ```
- If linking issues occur, ensure dependencies are correctly linked:
  ```sh
  npx react-native link
  ```

### Backend Issues

- If Flask doesn’t start, check dependencies:
  ```sh
  cd Backend
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
  ```
- Ensure Python version is 3.8+.
- If Flask crashes with Address already in use, free the port:
  ```sh
  lsof -i :5000
  kill -9 <PID>
  ```

### Database Issues

- If SQLite doesn’t initialize, ensure:
  - The database file exists in the correct directory.
  - Correct permissions are set:
    ```sh
    chmod 777 database.db
    ```

---

## Conclusion

Once both the frontend and backend are running, BabyNest will be fully functional. For any issues, check logs and ensure dependencies are correctly installed.
