# Build the Android APK

This project packages the Vite game into an Android app with Capacitor. The built web files are bundled inside the APK, so gameplay does not need a website or internet connection.

1. Push this folder to a GitHub repository on the `main` branch.
2. Open the repository's **Actions** tab.
3. Run **Build Shoaib Theft Simulator 3D APK** (or wait for the build after pushing to `main`).
4. Open the completed workflow run and download the `shoaib-theft-simulator-3d-apk` artifact.
5. Extract the artifact ZIP and install `app-debug.apk` on your Android phone.

The debug APK is for personal testing. A signed release APK needs a private signing key.
