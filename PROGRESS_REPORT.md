# Development Progress Report
## Wyss Institute Inventory Management Application
**Platform:** React Native (Expo) · **Target:** Android
**Date:** March 2026

---

## Abstract

This report documents the iterative development of a mobile inventory management application for the Wyss Institute at Harvard University. The application integrates Near Field Communication (NFC) technology with a persistent member identity system to enable card-based authentication, laboratory access management, and administrative oversight. The following sections describe each development phase, the technical decisions made, and the resulting system architecture.

---

## 1. Introduction

The application was conceived to serve as a point-of-access control and inventory tracking tool for Wyss Institute laboratory spaces. Members carry Harvard University Identification (HUID) cards based on the NXP MIFARE Classic 4k standard — a contactless smartcard technology operating at 13.56 MHz. The card's publicly broadcast 4-byte Unique Identifier (UID), which requires no cryptographic authentication to read, serves as the primary identity token within this system.

The core technical challenge lies in the fact that the UID-to-HUID mapping is not publicly accessible through Harvard's access control backend. The solution adopted herein is the construction and maintenance of an internal mapping database, administered through a dedicated in-application panel.

---

## 2. System Architecture Overview

The application is built on the following technology stack:

| Layer | Technology |
|---|---|
| Framework | React Native 0.81.5 via Expo SDK 54 |
| Language | TypeScript 5.1 |
| Navigation | React Navigation v6 (Native Stack) |
| Persistence | AsyncStorage (`@react-native-async-storage/async-storage` 2.2.0) |
| NFC | `react-native-nfc-manager` |
| Typography | Expo Google Fonts — Oswald (400, 600, 700) |
| Build System | Gradle 8.14 / Android SDK 36 |

---

## 3. Phase 1 — Member Identity Database

### 3.1 Design Rationale

Rather than attempting to query Harvard's proprietary access control backend — which is neither publicly accessible nor intended for third-party integration — the team elected to maintain an internal UID-to-HUID mapping table. This approach requires a single manual enrolment step per member but thereafter enables fully autonomous, offline-capable authentication.

### 3.2 Implementation

A static seed file was created at `src/data/huidDatabase.ts` defining the `MemberRecord` interface:

```typescript
export interface MemberRecord {
  cardUid: string;   // NFC UID, e.g. "8A:AA:16:43"
  huid: string;      // 8-digit Harvard University ID
  name: string;      // Member full name
  labs: string[];    // Laboratory affiliations
}
```

Two helper functions, `lookupByCardUid()` and `lookupByHuid()`, provide O(n) lookup against the in-memory seed array. This file serves as the canonical default dataset and is used as a fallback when no persisted data exists.

### 3.3 Persistent Store

To enable runtime modification of the member database without requiring a recompilation of the application, a separate persistence layer was introduced at `src/data/memberStore.ts`. This module wraps AsyncStorage with typed CRUD operations:

- **`loadMembers()`** — Retrieves the member list from AsyncStorage; falls back to the seed database on first launch.
- **`saveMembers()`** — Serialises the member array to JSON and writes to the `@huid_members` key.
- **`addMember()`**, **`updateMember()`**, **`deleteMember()`** — Atomic operations that load, mutate, and persist in a single call.

This architecture ensures that all administrative changes survive application restarts without requiring a backend server.

---

## 4. Phase 2 — Administrative Panel

### 4.1 Access Control

The administrative panel is accessed by entering the PIN `1111` into the manual login field on the Login screen. This credential is validated locally and routes the navigator to the `Admin` screen rather than the standard `LoginSuccess` route. The `Admin` route was added to `RootStackParamList` in `src/types/index.ts` and registered in `src/navigation/AppNavigator.tsx`.

### 4.2 Feature Set

The Admin screen (`src/screens/AdminScreen.tsx`) provides the following capabilities:

**Member List View**
- Displays all enrolled members as card components, each showing the member's name, HUID, Card UID, and laboratory affiliations rendered as coloured chip elements.
- Members with no enrolled NFC card display "Not enrolled" in place of a UID.

**Add Member Modal**
- Accepts HUID (numeric), full name, optional NFC Card UID, and laboratory affiliations.
- Validates that the HUID field is non-empty and that no duplicate HUID exists in the current dataset prior to insertion.
- Includes a hint directing the administrator to leave the Card UID blank if physical enrolment will occur later.

**Edit Member Modal**
- Pre-populates all fields from the selected member record.
- Supports modification of name, Card UID, and laboratory affiliations.
- Provides a destructive "Delete Member" action gated behind an `Alert` confirmation dialogue.

**Laboratory Management**
- Seven preset laboratory designations are available as quick-add chip elements: Soft Robotics, Bioinspired, Microfluidics, Biofabrication, Living Materials, Imaging, and Machine Shop.
- Custom laboratory names may be entered via a free-text input field.
- Existing affiliations are rendered as removable chips with an inline dismiss control.

### 4.3 Design Language

The administrative panel follows the application's established visual identity: Harvard Crimson (`#A51C30`) as the primary colour, dark green (`#4a5e1a`) for affirmative actions, the Oswald typeface family throughout, white card surfaces on a light grey (`#f2f2f2`) background, and 12px border radii with subtle elevation shadows.

---

## 5. Phase 3 — NFC Integration

### 5.1 Hardware Context

The target card is the NXP MIFARE Classic 4k, which presents to Android's NFC subsystem under two technology classes simultaneously: `android.nfc.tech.NfcA` (the base ISO 14443-3A layer) and `android.nfc.tech.MifareClassic`. The 4-byte UID (`8A:AA:16:43` in the documented example) is broadcast without authentication and is thus trivially readable by any NFC-capable device.

### 5.2 Native Module Installation

The `react-native-nfc-manager` library was installed as a native dependency. Because this module requires linkage against Android's NFC framework, it cannot function within the Expo Go sandbox; a fully compiled native build is required.

### 5.3 Config Plugin

A custom Expo config plugin was authored at `plugins/withNfc.js` to automate the necessary modifications to the generated Android project during `expo prebuild`. The plugin performs two operations:

1. **Intent Filter Injection** — Adds a `TECH_DISCOVERED` intent filter to `MainActivity` within `AndroidManifest.xml`. Without this filter, the Android NFC Tag Dispatch System has no basis on which to route incoming tag events to the application, resulting in the "No supported application for this NFC tag" system dialogue.

2. **Technology Filter Resource** — Writes `res/xml/nfc_tech_filter.xml` declaring both `NfcA` and `MifareClassic` technology classes. This file is referenced by the intent filter's `meta-data` element and instructs the dispatch system on which tag types the application is prepared to handle.

The plugin was registered in `app.json` and executed automatically during the subsequent `expo prebuild --platform android` invocation.

### 5.4 NFC Scan Hook

A reusable hook, `src/hooks/useNfcScan.ts`, encapsulates all NFC lifecycle management:

```typescript
export function useNfcScan() {
  // Initialises NfcManager on mount; queries hardware support
  // Returns: { scan, cancel, scanning, supported }
}
```

The initial implementation using `NfcManager.requestTechnology(NfcTech.NfcA)` was found to be unreliable for MIFARE Classic cards in practice — the NFC system sound would play (confirming hardware detection) but `tag.id` would not be populated. This was resolved by migrating to an event-listener model using `NfcManager.registerTagEvent()` and `NfcEvents.DiscoverTag`, which operates passively and is agnostic to the specific technology class presented by the card.

The UID is extracted from the tag's `id` field and formatted as a colon-delimited uppercase hexadecimal string (e.g. `8A:AA:16:43`) for consistency with the database schema.

### 5.5 Administrative Enrolment Flow

Both the Add Member and Edit Member modals in the Admin screen expose a "Tap Card" button adjacent to the Card UID input field. Pressing this button initiates a passive NFC scan; upon successful tag detection, the formatted UID is automatically populated into the field. A spinner replaces the button label during the active scan. The button is disabled on devices that report no NFC hardware support.

---

## 6. Phase 4 — Authenticated Login Flow

### 6.1 NFC Login

The Login screen was extended to initiate a continuous NFC listening loop immediately upon mount, contingent on hardware support. When a card tap is detected, the UID is resolved against the member database. A successful lookup navigates the user to the `LoginSuccess` screen; an unrecognised card surfaces an `Alert` prompting manual entry.

The listening loop is implemented with a `while (active)` construct governed by a cleanup flag set in the `useEffect` destructor, preventing state updates on unmounted components.

### 6.2 Manual HUID Validation

Prior to this phase, the manual login field accepted any non-empty numeric string. Following the introduction of the member database, manual login now validates the entered HUID against `loadMembers()`, rejecting credentials not present in the enrolled member list.

### 6.3 Member Identity Propagation

The authenticated member's name is threaded through the navigation parameter system to all downstream screens:

| Screen | Display Location |
|---|---|
| `LoginSuccess` | Subtitle beneath the "Login Successful" banner |
| `Cart` | Native header — right-aligned via `navigation.setOptions` |
| `Checkout` | Native header — right-aligned via `navigation.setOptions` |

The `RootStackParamList` type definitions were updated accordingly to enforce the presence of `memberName` as a required navigation parameter on `LoginSuccess`, `Cart`, and `Checkout` routes.

---

## 7. Build Environment Configuration

The following environment issues were encountered and resolved during the native build process:

| Issue | Resolution |
|---|---|
| 32-bit JRE (Java 8) insufficient heap allocation | Set `org.gradle.java.home` in `android/gradle.properties` to Android Studio's bundled 64-bit JBR |
| Android SDK path not found | Created `android/local.properties` with explicit `sdk.dir` |
| `expo-barcode-scanner` Kotlin compilation failure | Package removed (deprecated; not referenced in codebase) |
| NFC Tag Dispatch routing failure | Authored `plugins/withNfc.js` config plugin; rebuilt native project |
| `requestTechnology` approach unreliable for MIFARE Classic | Migrated to `registerTagEvent` / `DiscoverTag` event model |

---

## 8. File Structure Summary

```
src/
├── data/
│   ├── huidDatabase.ts       # MemberRecord interface & seed data
│   └── memberStore.ts        # AsyncStorage-backed CRUD layer
├── hooks/
│   └── useNfcScan.ts         # NFC lifecycle & UID extraction hook
├── navigation/
│   └── AppNavigator.tsx      # Stack navigator (Login → Admin / LoginSuccess → Cart → Checkout)
├── screens/
│   ├── AdminScreen.tsx       # Member management panel
│   ├── CartScreen.tsx        # Barcode scanning & cart management
│   ├── CheckoutScreen.tsx    # Order review & submission
│   ├── LoginScreen.tsx       # NFC + manual HUID authentication
│   └── LoginSuccessScreen.tsx# Post-authentication transition screen
└── types/
    └── index.ts              # Shared TypeScript interfaces & navigation types

plugins/
└── withNfc.js                # Expo config plugin — Android NFC manifest modifications

android/
├── gradle.properties         # JVM & build configuration
└── local.properties          # Android SDK path (local, not version-controlled)
```

---

## 9. Conclusion

The application successfully demonstrates a self-contained NFC-based authentication system operating entirely without dependency on Harvard's proprietary identity infrastructure. The administrative panel enables real-time enrolment and management of member records with full persistence, and the authenticated identity is carried through the complete user session from login to checkout. The system is deployed as a native Android APK with Metro Bundler hot-reload support for continued iterative development.

---

*Report generated from development session — Wyss Institute Inventory App, March 2026.*
