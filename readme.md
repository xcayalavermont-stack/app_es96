# Mobile Stockroom Access App

## Overview
This mobile application enables users to securely access a stockroom, select items, and manage inventory usage through a simple tap-and-go workflow. The app is designed for quick authentication, intuitive item selection, and seamless checkout with full logging of transactions.

---

## Core Features

- **Authentication**
  - Tap-to-login (e.g., NFC / badge / phone tap)
  - Manual login fallback (username/password)
  - Login validation with success/failure handling

- **Stockroom Access Control**
  - Physical authentication via phone tap at stockroom entry
  - Prevents unauthorized access

- **Inventory Interaction**
  - Tap item to select
  - Specify quantity
  - Add items to cart

- **Cart Management**
  - View current cart
  - Edit quantities
  - Remove items
  - Dynamic updates

- **Checkout System**
  - Finalize item usage
  - View summary before confirming
  - Generate receipt

- **Session Reset**
  - After checkout, app returns to login screen

---

## User Flow

### 1. Login Screen
- User selects:
  - **Tap to Login** OR
  - **Manual Login**
- If authentication fails:
  - Prompt user to retry

### 2. Login Success
- Display prompt:
  > "Tap phone to pad to access stockroom"

### 3. Stockroom Authentication
- User taps device to physical pad
- On success:
  - Transition to inventory interface

### 4. Item Selection
- Display prompt:
  > "Tap item to begin"
- User actions:
  - Select item
  - Enter quantity
  - Add to cart

### 5. Cart System
- Cart is dynamically built as items are added
- User can:
  - View cart
  - Modify quantities
  - Remove items

### 6. Checkout
- User selects:
  - **Finish / View Cart**
- Display:
  - List of items
  - Quantities
- User confirms checkout

### 7. Receipt Screen
- Display:
  - Items used
  - Quantities
  - Timestamp
- After viewing:
  - App returns to login screen
