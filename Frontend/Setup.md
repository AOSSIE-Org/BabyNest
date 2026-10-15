# BabyNest — Android Setup Guide

This guide explains how to set up, build, and run the BabyNest mobile application locally on Android.

## Prerequisites

Before getting started, make sure you have installed and configured:

- **Node.js and npm** — to install dependencies and run the JavaScript tooling.
- **JDK 17** — for the Android Gradle build.
- **Android Studio** — including the Android SDK and platform tools.
- **Android SDK Platform 35** — required by the current project configuration.
- **Android SDK Build-Tools** — the version required by the project.
- **Android device or emulator** — to run the application.

Follow the official [React Native environment setup guide](https://reactnative.dev/docs/set-up-your-environment) and select **React Native CLI → Android**.

## Step 1: Clone the Repository

Clone the BabyNest repository and navigate to its root directory.

```bash
git clone https://github.com/AOSSIE-Org/BabyNest
cd BabyNest
```

## Step 2: Install Dependencies

Install the JavaScript dependencies from the `Root` directory:

```bash
npm install
```

## Step 3: Configure Your Android Device

You can run BabyNest on either a physical Android device or an emulator.

### Option A: Physical Android Device

1. Enable **Developer options** on your Android phone.
2. Enable **USB debugging**.
3. Connect your phone to your computer using a USB cable.
4. Accept the USB debugging authorization prompt on your phone.
5. Verify that your device is detected:

```bash
adb devices
```

Your device should appear with the status `device`.

If it appears as `unauthorized`, unlock your phone and accept the debugging prompt.

### Option B: Android Emulator

1. Open Android Studio.
2. Open **Device Manager**.
3. Create or start an Android Virtual Device (AVD).
4. Wait for the emulator to finish booting.
5. Verify that it is detected:

```bash
adb devices
```

## Step 4: Start the Metro Development Server

From the root directory, start Metro, the JavaScript bundler used by React Native:

```bash
npm start
```

Keep this terminal running while developing and testing the application.

## Step 5: Build and Run BabyNest on Android

Open a second terminal in the root directory and run:

```bash
npm run android
```

This command builds the Android application, installs it on the connected device or running emulator, and launches it.

### Alternative: Build Using Gradle

On Windows PowerShell, you can build the debug APK directly:

```powershell
cd android
.\gradlew.bat assembleDebug
```

On macOS or Linux:

```bash
cd android
./gradlew assembleDebug
```

The generated debug APK is normally located at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

To install the APK on a connected Android device:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Run the installation command from the `android` directory. Alternatively, run it from `root` using the full relative path:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Step 6: Reload the Application During Development

BabyNest supports React Native Fast Refresh, which updates the application when you save changes to your JavaScript or TypeScript files.

If you need to reload the application manually:

- **Android:** Open the React Native Developer Menu using `Ctrl + M` on Windows/Linux, or shake the physical device if supported, then select **Reload**.
- **Metro:** Press `r` in the Metro terminal to request a reload.

If you modify native Android code or native dependencies, rebuild the application when necessary.

## Step 7: Troubleshooting

### Device Not Detected

Check the USB connection and USB debugging settings, then run:

```bash
adb devices
```

If necessary, restart the ADB server:

```bash
adb kill-server
adb start-server
adb devices
```

### Android Build Fails

Run the Gradle build directly to see more detailed error messages:

```powershell
cd android
.\gradlew.bat assembleDebug --stacktrace
```

Check that your JDK, Android SDK, Gradle configuration, and native dependencies match the project requirements.

### Metro or JavaScript Cache Issues

Stop Metro and restart it with a cleared cache:

```bash
npm start -- --reset-cache
```

If a previous Android build is causing problems, clean the Gradle build and rebuild:

```powershell
cd android
.\gradlew.bat clean
.\gradlew.bat assembleDebug
```

Return to the `root` directory before running other npm commands.

**Note:** Avoid deleting dependency folders or lockfiles as a first troubleshooting step. Try clearing the relevant cache and rebuilding before changing dependency versions.

## Additional Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Native Android Environment Setup](https://reactnative.dev/docs/set-up-your-environment)
- [Android Studio](https://developer.android.com/studio)
- [Android Debug Bridge (ADB)](https://developer.android.com/tools/adb)

Once these steps are complete, BabyNest should be ready to build and run on your Android device or emulator.
