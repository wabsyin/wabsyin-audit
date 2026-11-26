# Mobile Application Hardening & App Store / Play Store Compliance Audit

#### When to use this file

Use this Track 2 companion whenever the repository contains a mobile or hybrid client application: **React Native, Expo (`app.json` / `app.config.*` / `eas.json`), Flutter (`pubspec.yaml`), Capacitor / Ionic / Cordova, Kotlin / Java Native Android (`android/`), or Swift / Objective-C Native iOS (`ios/`)**.

Vibe coders building mobile apps face two painful failure modes: (1) shipping secrets/tokens insecurely inside downloadable `.apk`/`.ipa` binaries, and (2) spending weeks stuck in **Google Play Console** or **Apple App Store Review** rejections over mandatory policy rules they never knew existed.

Use Track 1's `DESKTOP-MOBILE-AND-LOCAL-IPC.md` for exploitable deep-link, WebView-bridge, and exported-IPC vulnerabilities (`findings.json`). Use this file to produce deterministic mobile hardening and store-readiness checks in `compliance-findings.json` (`framework: "MOBILE_STORES"`). If no mobile app exists in the repository, record `MOBSTORE-00` as `not_applicable`.

---

## Mandatory Check Catalogue (`MOBSTORE-*`)

### `MOBSTORE-01` — Mandatory In-App Account Deletion & Public Web Deletion URL (Apple Guideline 5.1.1(v) & Google Play Policy)
- **Why it blocks launch:** Both **Apple App Store** and **Google Play Store** strictly reject ANY app that allows users to create an account inside the app unless users can also **initiate complete account and personal-data deletion directly inside the app**. Furthermore, **Google Play Console** additionally requires a **publicly accessible web URL** where users can request or trigger account/data deletion even after uninstalling the app!
- **What to check:**
  1. If the mobile app supports signup/account creation (including OAuth/phone OTP signup): verify an explicit **Delete Account** screen/button exists inside mobile Profile/Settings UI (not merely "Logout" and not merely a `mailto:` link!).
  2. Verify the mobile button calls a real backend deletion endpoint that permanently deletes/schedules deletion of the user's account and associated data (not just clearing local device storage).
  3. For Android/Play Store targets: verify whether the project's web frontend (or linked docs/routes) provides a public `/delete-account` or `/data-deletion` web page explaining and enabling web-based account deletion without reinstalling the app.
- **Verdict guide:** `blocker` `fail` if account creation exists without in-app account deletion; `high` `fail` if targeting Android/Google Play without a public web account-deletion route/page.

### `MOBSTORE-02` — Sign in with Apple Requirement When Third-Party Social Login Exists (Apple Guideline 4.8)
- **Why it blocks launch:** Apple App Store Guideline 4.8 mandates that if an iOS app offers *any* third-party or social login service (Google Sign-In, Facebook, GitHub, Twitter/X, LinkedIn) as a primary login option, it **must also offer Sign in with Apple** as an equivalent option (unless the app exclusively uses the company's own first-party enterprise/education/government credentials).
- **What to check:** On iOS targets (`ios/`, Expo iOS config, Flutter iOS), check auth screens and dependencies (`@react-native-google-signin`, `expo-auth-session`, `google_sign_in`, Supabase/Firebase Google/Facebook OAuth). If third-party social login is enabled on iOS without `expo-apple-authentication` / `sign_in_with_apple` / Apple OAuth provider + `com.apple.developer.applesignin` entitlement, flag it!
- **Verdict guide:** `blocker` `fail` for iOS targets offering Google/Facebook/third-party social login without Sign in with Apple.

### `MOBSTORE-03` — Digital Goods Billing Policy Compliance (Apple Guideline 3.1.1 & Google Play Payments Policy)
- **Why it blocks launch:** Using Stripe, Razorpay, Cashfree, PhonePe, or an embedded checkout WebView inside an iOS or Android app to sell **digital goods, in-app subscriptions, AI credits, pro features, virtual coins, or unlockable digital content** triggers immediate App Store / Play Store rejection or app takedown unless compliant with Apple In-App Purchase / Google Play Billing (`react-native-iap`, `expo-in-app-purchases`, `in_app_purchase`, `purchases_flutter` / RevenueCat) or a specific regional/reader-app exemption! (Physical goods, food delivery, ride-hailing, real-world event tickets, and 1:1 live human tutoring/services must *not* use IAP and may use Razorpay/Stripe).
- **What to check:** Inspect what the mobile app sells. If it sells digital subscriptions, AI tokens, or in-app pro unlocks on iOS/Android via direct Razorpay/Stripe SDKs or checkout WebViews without Store IAP / RevenueCat, flag it clearly!
- **Verdict guide:** `blocker` `fail` when digital in-app goods/subscriptions are billed via external web/PG SDKs inside mobile builds without IAP support.

### `MOBSTORE-04` — Encrypted Credential & Token Storage on Device
- **What to check:** Inspect where JWTs, Supabase session tokens, refresh tokens, API keys, biometric secrets, or sensitive PII are persisted on mobile:
  - Flag plaintext storage (`@react-native-async-storage/async-storage`, unencrypted `react-native-mmkv`, Android `SharedPreferences`, Flutter `shared_preferences`, Capacitor `Preferences` / `localStorage`) holding bearer tokens, refresh tokens, or sensitive secrets.
  - Require hardware-backed encrypted storage: `expo-secure-store`, `react-native-keychain`, `EncryptedSharedPreferences` / Android Keystore, iOS Keychain (`kSecAttrAccessibleWhenUnlockedThisDeviceOnly`), or `flutter_secure_storage` (Note: if Supabase session payload exceeds Expo SecureStore's 2048-byte limit, verify AES-key-in-SecureStore + encrypted payload in AsyncStorage/MMKV pattern!).
- **Verdict guide:** `high` `fail` if auth/refresh tokens or sensitive secrets are stored in unencrypted `AsyncStorage` / `SharedPreferences` / `localStorage`.

### `MOBSTORE-05` — Bundled Secrets in APK / AAB / IPA Assets & Build Configs
- **What to check:** Anyone can unzip an `.apk` or `.ipa` in 5 seconds and run `strings` or `jadx`!
  - Check `app.json`, `app.config.ts` (`extra`), `eas.json`, `EXPO_PUBLIC_*`, Flutter `pubspec.yaml` `assets:` (never bundle `.env` inside `assets:`!), `android/gradle.properties`, `local.properties`, `Info.plist`, and committed `*.jks` / `*.keystore` / `*.p12` / `*.mobileprovision` / service-account files.
  - Ensure zero private backend keys (`OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `STRIPE_SECRET_KEY`, `AWS_SECRET_ACCESS_KEY`) or release signing keystores/passwords are bundled or committed to version control.
- **Verdict guide:** `blocker` `fail` if private API secrets are bundled into mobile client config/assets or release signing keys/passwords are committed to git.

### `MOBSTORE-06` — Android Manifest, Cleartext Traffic, Backup & Restricted Permissions (`AndroidManifest.xml` / `app.json`)
- **What to check:**
  1. `android:debuggable="true"` must never appear in main/release manifests.
  2. `android:usesCleartextTraffic="true"` (or `expo-build-properties` `usesCleartextTraffic: true`) allowing unencrypted `http://` traffic in release builds without domain-scoped `network_security_config.xml` restriction for localhost dev only.
  3. `android:allowBackup="true"` without `android:fullBackupContent` / `android:dataExtractionRules` excluding sensitive auth/database files.
  4. **Google Play High-Risk Permission Blockers:** Flag `MANAGE_EXTERNAL_STORAGE`, `QUERY_ALL_PACKAGES`, `READ_SMS`, `RECEIVE_SMS`, `READ_CALL_LOG`, `ACCESS_BACKGROUND_LOCATION`, `REQUEST_INSTALL_PACKAGES`, or legacy `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` (Google Play now rejects broad photo/video permissions for one-time/infrequent uploads and requires **Android Photo Picker** instead!).
  5. Release R8/ProGuard shrinking (`isMinifyEnabled = true` / `enableProguardInReleaseBuilds`) and target SDK currency check (`targetSdkVersion` meeting current Google Play requirement).
- **Verdict guide:** `blocker` `fail` for `debuggable="true"` in release or unjustified Play-restricted permissions (`MANAGE_EXTERNAL_STORAGE`, `QUERY_ALL_PACKAGES`, `READ_MEDIA_*` where Photo Picker is mandated); `high` `fail` for global `usesCleartextTraffic="true"`; `medium` `fail` for unrestricted `allowBackup="true"` or disabled release minification.

### `MOBSTORE-07` — iOS `Info.plist` Usage Descriptions, ATS & Privacy Manifest (`PrivacyInfo.xcprivacy`)
- **What to check:**
  1. **Purpose Strings (`NS*UsageDescription`):** Every native capability imported in dependencies/code (Camera, Photo Library, Microphone, Location, Contacts, Bluetooth, FaceID, Notifications, Tracking) has a corresponding `NS*UsageDescription` in `Info.plist` / `app.json` `ios.infoPlist` with a **specific, user-comprehensible example** (Apple rejects vague strings like *"Needed for app functionality"* or *"Allow camera access"*; require concrete copy like *"Used to take a photo for your profile avatar and scan receipts"*).
  2. **Apple Privacy Manifest (`PrivacyInfo.xcprivacy`):** Mandatory for all iOS submissions! Check whether `PrivacyInfo.xcprivacy` (or Expo `privacyManifests` in `app.json`) is configured declaring `NSPrivacyAccessedAPITypes` (UserDefaults `CA92.1`, File Timestamp `C617.1`, System Boot Time `35F9.1`, Disk Space `E174.1`), `NSPrivacyCollectedDataTypes`, and `NSPrivacyTracking`.
  3. **App Transport Security (ATS):** Flag `NSAllowsArbitraryLoads: true` in production `Info.plist`.
  4. **App Tracking Transparency (ATT):** If ad/attribution SDKs (`react-native-fbsdk-next`, `AppsFlyer`, `Adjust`, `google_mobile_ads` IDFA tracking) are installed, verify `NSUserTrackingUsageDescription` and ATT prompt call before tracking.
- **Verdict guide:** `blocker` `fail` for missing/placeholder `NS*UsageDescription`, missing `PrivacyInfo.xcprivacy` / `privacyManifests` on iOS, or IDFA tracking without ATT; `high` `fail` for global `NSAllowsArbitraryLoads: true`.

### `MOBSTORE-08` — Deep Links, Universal Links / App Links & Reviewer Readiness
- **What to check:**
  1. If OAuth, magic links, or payment redirects use custom URI schemes (`myapp://`), check whether Universal Links (`applinks:`) / Android App Links (`autoVerify: true`) + `.well-known/apple-app-site-association` and `.well-known/assetlinks.json` are configured so another app cannot hijack auth/payment callbacks.
  2. Check mobile Settings/About screen for accessible in-app links to **Privacy Policy**, **Terms of Service**, and **Support/Contact**.
  3. Emit `MOBSTORE-08M` (`needs_manual_check`) reminding the developer to prepare **App Review Demo Account credentials** (non-OTP test account or static reviewer test phone+OTP bypass scoped strictly to a designated dummy review number, never globally!), accurate **Google Play Data Safety / Apple Privacy Nutrition Labels** matching installed SDKs, and non-placeholder store screenshots.
