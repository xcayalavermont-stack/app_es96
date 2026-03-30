# Progress Report 3 — Lab Assignment Checkout Flow

**Date:** 2026-03-29
**Branch:** attempt-at-labs

---

## Overview

This session implemented a multi-lab checkout flow. Previously, tapping **Checkout** on the cart screen sent all items directly to `CheckoutScreen` as a flat list with no lab attribution. The new flow intercepts that navigation and guides the user through assigning items to one or more of their labs before confirming the order.

---

## New Navigation Flow

```
CartScreen (Checkout button)
    ↓
LabAssignmentQuestionScreen   "Are You Shopping For More Than One Lab?"
    ├── No  →  LabSelectOneScreen    (tap a lab → all items assigned → Checkout)
    └── Yes →  LabSelectManyScreen   (toggle ≥2 labs → NEXT)
                    ↓
               LabItemAssignScreen   (tap items for Lab 1 → Next)
                    ↓  (loops per remaining lab / remaining items)
               LabItemAssignScreen   (tap items for Lab 2 → Next)
                    ↓
               CheckoutScreen        (order summary grouped by lab)
```

---

## Files Changed

### `src/types/index.ts`
- Added `LabAssignments` type: `{ [labName: string]: CartItem[] }`
- Extended `RootStackParamList` with `memberLabs: string[]` on `LoginSuccess` and `Cart`
- Added nav param types for all four new screens:
  - `LabAssignmentQuestion`, `LabSelectOne`, `LabSelectMany`, `LabItemAssign`
- Made `labAssignments?: LabAssignments` an optional param on `Checkout` for backward compatibility

### `src/screens/LoginScreen.tsx`
- Now passes `member.labs` as `memberLabs` when navigating to `LoginSuccess` (both NFC and manual login paths)

### `src/screens/LoginSuccessScreen.tsx`
- Receives `memberLabs` from route params and forwards it to `Cart` on navigation

### `src/screens/CartScreen.tsx`
- Receives `memberLabs` from route params
- **Checkout button** now navigates to `LabAssignmentQuestion` (passing `cartItems`, `memberName`, `memberLabs`) instead of directly to `Checkout`

### `src/screens/CheckoutScreen.tsx`
- Accepts optional `labAssignments` param from navigation
- Order Summary renders in two modes:
  - **With `labAssignments`:** iterates over each lab, renders a crimson bold lab name header followed by a white card listing that lab's items
  - **Without `labAssignments`:** falls back to original flat item list (no regression for older flows)
- Grand total always reflects the full order across all labs
- Added `labHeader` style (crimson, bold, 18px)

### `src/navigation/AppNavigator.tsx`
- Registered all four new screens with `headerShown: false`

---

## New Files

### `src/screens/LabAssignmentQuestionScreen.tsx`
- Full-screen crimson header: "Are You Shopping For More Than One Lab?"
- Two large square crimson buttons: **Yes** / **No**, separated by a horizontal divider
- **No** → `LabSelectOne`; **Yes** → `LabSelectMany`
- Wyss Institute logo pinned to bottom

### `src/screens/LabSelectOneScreen.tsx`
- Crimson header: "Select Which Lab You're Shopping For"
- Vertical list of pill-shaped crimson buttons, one per lab in `member.labs`
- Tapping a lab immediately assigns all cart items to it and navigates to `Checkout` with `labAssignments: { [lab]: cartItems }`
- Wyss Institute logo pinned to bottom

### `src/screens/LabSelectManyScreen.tsx`
- Crimson header: "Select Which Labs You're Shopping For"
- Toggleable pill buttons for each lab in `member.labs`
  - Selected state: darker crimson (`#7a1525`) with white border and an absolutely-positioned checkmark (so label stays centered)
- Green **NEXT** pill button, disabled until ≥2 labs are selected
- On NEXT: navigates to `LabItemAssign` with `selectedLabs` array, empty `labAssignments`, and `currentLabIndex: 0`
- Wyss Institute logo pinned to bottom

### `src/screens/LabItemAssignScreen.tsx`
- Crimson header bar with lab name on the left and user name on the right; top padding respects safe area inset so text doesn't overlap the status bar
- Subtitle: "Tap The Items For This Lab"
- Scrollable list of white rounded cards showing item name, barcode, price; tapping toggles a crimson checkbox on the right
- Fixed footer: selected-items total + full-width green **Next** pill button
- **Loop logic on Next:**
  - Adds selected items to `labAssignments[currentLab]`
  - Removes selected items from the remaining pool
  - If more labs remain AND items remain → pushes a new `LabItemAssign` instance for the next lab
  - If all labs processed OR no items left → any leftover unassigned items are appended to the last lab, then navigates to `Checkout`

---

## Bug Fixes & Polish (same session)

### `LabSelectManyScreen` — button sizing & alignment
**Problem:** The NEXT button rendered as a tiny pill instead of full width. Lab button labels were pushed off-center by the checkmark.

**Root cause:** `alignItems: 'center'` on the ScrollView `contentContainerStyle` causes `width: '100%'` on children to resolve against the shrunk content width rather than the screen width.

**Fixes:**
- Changed scroll `alignItems` from `'center'` to `'stretch'` (removes the shrink-wrap behaviour)
- Removed explicit `width: '100%'` from buttons — they now stretch naturally
- Increased button padding: `paddingVertical 18 → 22`, added `paddingHorizontal: 32`
- Moved checkmark to `position: 'absolute', right: 24` so the label `textAlign: 'center'` is true-center

Same layout fixes applied to `LabSelectOneScreen` for consistency.

### `LabItemAssignScreen` — status bar overlap
**Problem:** "Select Items For [Lab]" header text rendered behind the phone's clock and status icons.

**Fix:** Applied `insets.top + 16` as dynamic `paddingTop` on the header view using the already-imported `useSafeAreaInsets` hook.

---

## Architecture Notes

- **Lab list source:** all new screens read labs from `member.labs` threaded through navigation params — no hardcoded lab names anywhere
- **Items already assigned don't reappear:** `LabItemAssignScreen` receives only the remaining unassigned pool on each loop iteration
- **Zero-item labs allowed:** a lab can have zero items assigned (user taps Next without selecting anything), enabling flexible splits
- **Backward compatibility:** `CheckoutScreen` gracefully handles the absence of `labAssignments` so any direct navigation to it still works
