# Development Progress Report — UI & Session Management Overhaul
## Wyss Institute Inventory Management Application
**Platform:** React Native (Expo) · **Target:** Android
**Session Date:** March 25, 2026

---

## Abstract

This report documents a focused development session in which the application's visual identity was comprehensively redesigned to align with Wyss Institute and Harvard University branding standards, and a suite of session management behaviours were introduced to improve security and operational continuity. The changes described herein span the authentication interface, post-login transition screen, cart management interactions, and order confirmation lifecycle.

---

## 1. Introduction

Prior to this session, the application presented a generic blue-themed interface with no institutional branding, a card-based login form incompatible with the NFC-first interaction model, and no mechanism for automatically returning the device to its idle state following a completed transaction. This session addressed all three concerns through a systematic redesign of the user-facing layer.

---

## 2. Typography — Oswald Font Integration

### 2.1 Rationale

The Oswald typeface was selected as the application's primary typographic system. Its condensed proportions and strong geometric weight are well-suited to a kiosk-style interface intended to be read at arm's length, and the face carries appropriate institutional gravitas consistent with the Wyss Institute's visual standards.

### 2.2 Implementation

The `@expo-google-fonts/oswald` and `expo-font` packages were installed as runtime dependencies. Font loading was integrated at the application root in `App.tsx` using the `useFonts` hook from the Google Fonts package. Three weights were loaded:

| Token | Weight |
|---|---|
| `Oswald_400Regular` | Body and subtitle text |
| `Oswald_600SemiBold` | Labels and button text |
| `Oswald_700Bold` | Headings and banner text |

The `expo-splash-screen` package was configured to hold the splash screen until font loading completed, preventing any flash of unstyled text on application launch. Both `expo-font` and `expo-splash-screen` were pinned to versions compatible with Expo SDK 54 (`~14.0.11` and `~31.0.13` respectively) following version mismatch warnings surfaced by the Metro bundler.

---

## 3. Login Screen Redesign

### 3.1 Visual Overhaul

The login interface was rebuilt from first principles to match a provided design specification. The previous generic card-on-blue-background layout was replaced with the following structure:

- **Background:** Full-screen Harvard Crimson fill (`#A51C30`), consistent with the university's official colour identity.
- **Header:** Wyss Institute wordmark rendered via the production logo asset (`wysslogo-black-short.png`), loaded as a native `Image` component.
- **Hero Element:** Harvard shield mark (`Screenshot 2026-03-25 192202.png`) presented at 180×180 logical pixels in the vertical centre of the screen.
- **NFC Prompt:** The text "Tap HUID To Begin" set in `Oswald_700Bold` at 28pt, with a secondary line "Tap HUID on NFC Tap Point To Login" in `Oswald_400Regular` at 14pt.
- **Manual Login:** A compact input row anchored to the bottom of the screen, comprising a translucent HUID text field and a dark green "Go" button with white label text.

### 3.2 Asset Management

An `assets/` directory was created and the two logo files deposited therein. The `app.json` configuration was revised to remove references to non-existent default Expo asset files (`icon.png`, `splash.png`, `adaptive-icon.png`) that had been causing bundler failures.

---

## 4. Login Success Screen

### 4.1 Screen Design

A dedicated `LoginSuccessScreen` was authored at `src/screens/LoginSuccessScreen.tsx`. The screen presents:

- A full-width Harvard Crimson banner reading "Login Successful" with the authenticated member's name displayed beneath it.
- The Wyss Institute wordmark.
- A large crimson circle (280px diameter) carrying the instruction "Tap Phone on Keypad to Unlock Stock Room", which acts as the primary interactive element.
- A "Return To Login" button in dark charcoal at the foot of the screen.

### 4.2 Entry Animation

On screen mount, the crimson circle is animated from `scale: 0` to `scale: 1` using a spring animation (`tension: 60`, `friction: 7`) running in parallel with a 200ms opacity fade. A 100ms delay was prepended to the sequence to allow the screen render to settle before the animation begins. This produces a natural pop-in effect that draws attention to the primary interaction target.

The animation was implemented using React Native's built-in `Animated` API with `useNativeDriver: true`, ensuring the transform executes on the UI thread and does not compete with JavaScript execution.

### 4.3 Navigation Registration

The `LoginSuccess` route was added to `RootStackParamList` in `src/types/index.ts` with a required `memberName` string parameter. The route was registered in `AppNavigator.tsx` with `headerShown: false`. The Login screen was updated to navigate to `LoginSuccess` on successful authentication rather than proceeding directly to `Cart`.

---

## 5. Colour Scheme Standardisation

All instances of the application's former primary colour (`#1a56db`, a generic blue) were replaced with Harvard Crimson (`#a62035`) across:

- `CartScreen.tsx` — scan input border, Add button, item price text, quantity control icons, total amount text.
- `CheckoutScreen.tsx` — line item prices, grand total value, "Return To Login" button.
- `AppNavigator.tsx` — the native navigation header background colour applied globally across all stack screens.

---

## 6. Cart Screen — Swipe-to-Delete

### 6.1 Feature Design

A swipe-to-delete gesture was introduced to complement the existing ✕ button on each cart row. The interaction was designed with two distinct behaviours depending on swipe distance:

- **Partial swipe (< 55% of screen width):** The row snaps open to reveal a red "Delete" label. The user must tap this label to confirm removal.
- **Full swipe (≥ 55% of screen width):** The row is deleted automatically upon release, without requiring a secondary tap.

### 6.2 Implementation

The `Swipeable` component from `react-native-gesture-handler` was used as the gesture primitive. The `renderRightActions` callback receives a `dragX` animated interpolation value; a listener attached to this value sets a per-item boolean flag (`isFullSwipe`) when the drag translation exceeds the full-swipe threshold.

A critical implementation subtlety was identified and resolved during development: as the swipeable row snaps from the full-drag position back to the open position (80px), the `dragX` listener fires a final time with the settled value, resetting the flag to `false` before `onSwipeableOpen` could inspect it. This was corrected by making the flag strictly monotonic within a swipe gesture — it can only be set to `true` during a drag and is reset to `false` only in the `onSwipeableClose` callback, which fires when the row returns fully to the closed position.

The delete action background colour interpolates from standard red (`#dc2626`) to deep red (`#7f1d1d`) as the drag approaches the full-swipe threshold, providing visual feedback that a destructive action is imminent.

### 6.3 Gesture Infrastructure

The `Swipeable` component requires `GestureHandlerRootView` as an ancestor in the component tree. An initial error arose because `GestureHandlerRootView` was rendered conditionally — only after font loading completed — meaning that during the loading phase no gesture root existed. This was resolved by restructuring `App.tsx` so that `GestureHandlerRootView` is always rendered as the outermost element, with the navigation tree conditionally rendered inside it.

### 6.4 Safe Area Compliance

The cart footer (total row and checkout button) was updated to consume the device's bottom safe area inset via `useSafeAreaInsets` from `react-native-safe-area-context`. The inset value is applied additively to the footer's base padding, ensuring the footer is not obscured by gesture navigation bars on Android devices with on-screen navigation.

---

## 7. Checkout Screen Revisions

### 7.1 Tax Removal

The tax calculation (`subtotal × 0.08`) and its associated line item were removed from the order summary. The totals card now presents a single "Total" row. The `subtotal` and `tax` variables were consolidated into a single `total` constant computed directly from the items array.

### 7.2 Post-Submission Navigation

The "Start New Cart" button on the order confirmation screen was relabelled "Return To Login" and its navigation target changed from `Cart` to `Login`, reflecting the intended operational flow in which the device returns to the idle authentication state between transactions.

---

## 8. Session Auto-Termination

### 8.1 Rationale

In a laboratory kiosk deployment, there is a meaningful risk that a user completes their order submission but does not manually return the device to the login screen. Two automatic return triggers were implemented to mitigate this:

1. **Inactivity timeout** — If the order confirmation screen remains visible for 15 consecutive minutes, the application navigates automatically to the Login screen.
2. **Charging detection** — If the device is connected to a power source while the confirmation screen is visible, the application interprets this as a "returning the tablet to its dock" event and navigates to Login immediately.

### 8.2 Implementation

Because the session management logic requires `useEffect` hooks, and the order confirmation view had previously been rendered as an inline conditional within the `CheckoutScreen` component body (precluding hook usage at that render level), the confirmation view was extracted into a dedicated `SuccessView` sub-component.

The countdown is implemented as a `setInterval` ticking once per second, decrementing a `secondsLeft` state variable initialised to 900. When the value reaches zero the `onDone` callback is invoked.

Charging state is monitored via `Battery.addBatteryStateListener` from the `expo-battery` package. The listener fires `onDone` when `batteryState` equals `BatteryState.CHARGING` or `BatteryState.FULL`. Both subscriptions are torn down in their respective `useEffect` cleanup functions to prevent memory leaks and spurious navigation events.

### 8.3 Countdown Display

A live countdown is rendered in small (12pt) light grey (`#bbb`) text positioned at the bottom of the confirmation screen:

> *Returning to login in 14:59*

The time remaining is formatted as zero-padded `MM:SS` by the `formatTime` utility function.

---

## 9. Summary of Files Modified

| File | Nature of Change |
|---|---|
| `App.tsx` | Oswald font loading; `GestureHandlerRootView` restructure |
| `app.json` | Removed missing asset references; added NFC permissions |
| `src/types/index.ts` | Added `LoginSuccess`, `memberName` params to navigation types |
| `src/navigation/AppNavigator.tsx` | Registered `LoginSuccess` and `Admin` routes; crimson header |
| `src/screens/LoginScreen.tsx` | Full visual redesign; real logo assets; Oswald typography |
| `src/screens/LoginSuccessScreen.tsx` | New screen; pop-in animation; member name display |
| `src/screens/CartScreen.tsx` | Swipe-to-delete; crimson palette; safe area footer |
| `src/screens/CheckoutScreen.tsx` | Tax removal; session timeout; charging detection; relabelled button |

---

## 10. Conclusion

This session produced a production-quality visual identity aligned with Wyss Institute and Harvard University standards, a gesture-driven cart management interaction consistent with platform conventions, and an automated session lifecycle ensuring the device reliably returns to an unauthenticated state following each transaction. The application is now suitable for supervised pilot deployment within a laboratory setting.

---

*Report compiled from development session — Wyss Institute Inventory App, March 25, 2026.*
