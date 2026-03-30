# Setup Instructions (University Computer)

## Prerequisites

### 1. Node.js (portable — no install needed)
Download the **Windows Binary (.zip)** from nodejs.org (not the installer).
Extract to: `C:\Users\<you>\Downloads\node-v24.14.1-win-x64\node-v24.14.1-win-x64`

### 2. Android Platform Tools (portable — no install needed)
Download **SDK Platform Tools** zip from developer.android.com/studio/releases/platform-tools.
Extract to: `C:\Users\<you>\Downloads\platform-tools-latest-windows\platform-tools`

---

## Every Time You Open a New Terminal

Open **Command Prompt** (not PowerShell — scripts are blocked on university machines).

In VS Code: click the `+` dropdown next to the terminal type and select **Command Prompt**.

Run these two lines to add Node and ADB to your PATH:

```cmd
set PATH=C:\Users\xaa105\Downloads\node-v24.14.1-win-x64\node-v24.14.1-win-x64;%PATH%
set PATH=C:\Users\xaa105\Downloads\platform-tools-latest-windows\platform-tools;%PATH%
```

Then navigate to the project:

```cmd
cd C:\Users\xaa105\Documents\GitHub\app_es96
```

---

## First Time Only — Install Dependencies

```cmd
npm install
```

Only needed once (or after pulling changes that modify package.json).

---

## Running the App

### On your phone (recommended for NFC features)
1. Enable **Developer Options**: Settings → About Phone → tap Build Number 7 times
2. Enable **USB Debugging**: Settings → Developer Options → USB Debugging ON
3. Plug phone in via USB and tap **Allow** on the popup
4. Verify phone is connected:
   ```cmd
   adb devices
   ```
   Should show your device as `device` (not `unauthorized`)
5. Start the app:
   ```cmd
   npx expo start --android
   ```

### In the browser (no phone needed, NFC won't work)
```cmd
npx expo start
```
Then press `w` to open in browser.

---

## Quick Reference — Full Startup Sequence

```cmd
set PATH=C:\Users\xaa105\Downloads\node-v24.14.1-win-x64\node-v24.14.1-win-x64;%PATH%
set PATH=C:\Users\xaa105\Downloads\platform-tools-latest-windows\platform-tools;%PATH%
cd C:\Users\xaa105\Documents\GitHub\app_es96
adb devices
npx expo start --android
```
