# Respondr Mobile Application User Manual

**Version 1.0.0**  
**PDRRMO Davao Oriental**

---

## Table of Contents

| Section | Title |
|---------|-------|
| 1.0 | Introduction |
| 1.1 | System Requirements |
| 1.2 | Installation |
| 2.0 | Getting Started |
| 2.1 | Launching the Application |
| 2.2 | Main Components |
| 3.0 | User Registration and Authentication |
| 3.1 | Creating an Account |
| 3.2 | Signing In |
| 3.3 | Signing Out |
| 4.0 | Dashboard |
| 5.0 | Operations |
| 5.1 | Viewing the Operations Map |
| 5.2 | Creating an Operation |
| 5.3 | Managing Operations |
| 6.0 | Resources |
| 6.1 | Adding Resources |
| 6.2 | Borrowing and Returning Resources |
| 7.0 | Situation Reports (SitRep) |
| 8.0 | Documents |
| 9.0 | Weather Station |
| 10.0 | User Management |
| 11.0 | Profile and Settings |
| 11.1 | Profile |
| 11.2 | Notifications |
| 11.3 | App Settings |
| 12.0 | User Roles |
| 13.0 | Working Offline |
| 14.0 | Help and Support |

---

## 1.0 Introduction

**Respondr** is the official mobile application of the Provincial Disaster Risk Reduction and Management Office (PDRRMO) of Davao Oriental. It helps authorized personnel coordinate emergency response during disasters and rain-induced incidents such as floods and landslides.

### What You Can Do

- Track emergency **operations** across all municipalities
- Manage and borrow **resources** (vehicles, equipment, supplies, personnel)
- Upload and share **Situation Reports (SitRep)**
- Distribute and acknowledge internal **documents and memos**
- Monitor **weather conditions** and PAGASA advisories
- Receive real-time **notifications** on operations and alerts

> *Insert screenshot: App logo and login screen*

---

## 1.1 System Requirements

### Supported Devices

| Platform | Minimum Requirement |
|----------|---------------------|
| **Android** | Android 8.0 (Oreo) or later |
| **iOS** | iOS 13.0 or later |
| **Tablet** | Supported on both platforms |

### Network

- **Internet required** for first-time login, sign-up, and file uploads/downloads
- **Offline mode** available after initial sign-in (see Section 13.0)

### Storage

- At least **100 MB** free storage recommended

### Permissions

The app may request access to:

- **Camera** — profile photo and resource documentation
- **Storage / Photos** — file uploads and downloads
- **Notifications** — push alerts (optional, can be toggled in Settings)

> *Insert screenshot: Device compatibility or permissions prompt*

---

## 1.2 Installation

### Android

1. Obtain the **Respondr APK** from your PDRRMO IT administrator.
2. On your device, go to **Settings → Security** and enable **Install from Unknown Sources** (if prompted).
3. Open the APK file and tap **Install**.
4. Once installed, tap **Open** to launch Respondr.

### iOS

1. Obtain the app link from your PDRRMO IT administrator (TestFlight or direct distribution).
2. Follow the on-screen instructions to install.
3. Trust the developer certificate if prompted under **Settings → General → VPN & Device Management**.

### After Installation

- Ensure you have an **active internet connection** for your first sign-in.
- Contact your administrator if you do not yet have login credentials.

> *Insert screenshot: Install prompt or app icon on home screen*

---

## 2.0 Getting Started

After installation, Respondr opens to the **Sign In** screen. You must have an account activated by an administrator before you can access the app.

### First-Time Users

1. Tap **Sign Up** to create an account (Section 3.1).
2. Wait for an administrator to **activate** your account.
3. Return to the app and **Sign In** (Section 3.2).

### Returning Users

1. Open the Respondr app.
2. Enter your username or email and password.
3. Tap **Sign In**.

> *Insert screenshot: Sign In screen overview*

---

## 2.1 Launching the Application

1. Locate the **Respondr** icon on your home screen or app drawer.
2. Tap to open the app.
3. If already signed in, you are taken directly to the **Dashboard**.
4. If signed out, the **Sign In** screen appears.

### Session Behavior

- Your session stays active until you tap **Logout**.
- Closing the app does not sign you out automatically.

> *Insert screenshot: App icon and launch to Dashboard*

---

## 2.2 Main Components

### Bottom Navigation (Mobile)

| Tab | Purpose |
|-----|---------|
| **Dashboard** | Overview of resources, operations, and alerts |
| **Operation** | Interactive map of Davao Oriental operations |
| **Resources** | Inventory, borrowing, and returns |
| **SitRep** | Situation reports and documents |

### Header Bar

| Element | Purpose |
|---------|---------|
| **Menu (☰)** | Opens sidebar: User Management, Weather Station, Documents, Settings, Logout |
| **User Name** | Displays your name |
| **Bell Icon** | In-app notifications |
| **Profile Avatar** | View and edit your profile |

> *Insert screenshot: Annotated main screen with bottom nav and header*

---

## 3.0 User Registration and Authentication

Respondr uses secure account-based access. All users must be registered and activated before signing in.

### Account Status

| Status | Meaning |
|--------|---------|
| **Active** | You can sign in and use the app |
| **Inactive** | Account created but not yet activated — cannot sign in |
| **Suspended** | Access blocked — contact your administrator |

### Authentication Rules

- Sign in with **username** or **email** plus **password**
- Password must be at least **6 characters**
- New accounts require **administrator activation** before first login

> *Insert screenshot: Sign Up and Sign In screens side by side*

---

## 3.1 Creating an Account

1. On the Sign In screen, tap **Sign Up**.
2. Fill in the form:

   | Field | Requirement |
   |-------|-------------|
   | Full Name | Your complete name |
   | Username | 3–20 characters (letters, numbers, underscore) |
   | Email | Valid email address |
   | Password | Min. 6 chars; include uppercase, lowercase, number, and special character |
   | Confirm Password | Must match password |

3. Tap **Sign Up**.
4. A confirmation message appears — your account is **inactive** until an administrator activates it.
5. Contact your PDRRMO administrator to request activation.

> *Insert screenshot: Sign Up form*

---

## 3.2 Signing In

1. Open Respondr and go to the **Sign In** screen.
2. Enter your **Username or Email**.
3. Enter your **Password**.
4. Tap **Sign In**.

### If Sign In Fails

| Message | Action |
|---------|--------|
| Pending activation | Wait for administrator to activate your account |
| Account deactivated | Contact your administrator |
| Account suspended | Contact your administrator |
| Wrong credentials | Check username/email and password |

A **network status indicator** appears when you are offline or on a slow connection.

> *Insert screenshot: Sign In form with network indicator*

---

## 3.3 Signing Out

1. Tap the **Menu (☰)** icon, then **Logout**  
   — or tap your **Profile Avatar**, then **Logout**.
2. A confirmation dialog appears: *"Are you sure you want to logout?"*
3. Tap **Logout** to confirm, or **Cancel** to stay signed in.
4. You are returned to the **Sign In** screen.

> *Insert screenshot: Logout confirmation dialog*

---

## 4.0 Dashboard

The **Dashboard** is your home screen after sign-in. It provides a quick snapshot of current activity.

### Widgets

| Widget | Shows |
|--------|-------|
| **Resource Overview** | Summary of available inventory |
| **Recent Operations** | Latest active operations — tap **View All** to open Operations |
| **Activity Stream** | Recent operations, documents, and resource transactions |
| **System Alerts** | Important system-level notifications |

### Actions

- Tap any widget to navigate to the related section.
- Tap **Retry** if data fails to load.

> *Insert screenshot: Dashboard with all widgets visible*

---

## 5.0 Operations

The **Operation** tab lets you view and manage emergency operations across Davao Oriental using an interactive map.

### Who Can Do What

| Action | Administrator | Supervisor | Operator |
|--------|:-------------:|:----------:|:--------:|
| View operations | ✓ | ✓ | ✓ |
| Create / edit operations | ✓ | ✓ | — |
| Conclude operations | ✓ | ✓ | — |
| Delete history records | ✓ | ✓ | — |

> *Insert screenshot: Operations map overview*

---

## 5.1 Viewing the Operations Map

1. Tap **Operation** in the bottom navigation.
2. The map displays all municipalities in Davao Oriental.
3. Tap a **municipality** or **barangay** to open its detail view.
4. The **Municipality Detail** panel shows:
   - Weather summary for that area
   - **Current** tab — active operations
   - **History** tab — concluded operations

> *Insert screenshot: Map with municipality selected and detail panel open*

---

## 5.2 Creating an Operation

*Available to Administrators and Supervisors only.*

1. Open a municipality on the map.
2. In the **Current** tab, tap **Add Operation**.
3. Fill in the form:

   | Field | Description |
   |-------|-------------|
   | Operation Type | e.g., Flood Response, Landslide |
   | Operation Title | Short descriptive title |
   | Description | Details of the situation |
   | Start Date | When the operation began |
   | Barangay | Affected barangay within the municipality |
   | Personnel / Resources | Assign teams and equipment (optional) |

4. Tap **Create**.
5. All active users receive a notification about the new operation.

> *Insert screenshot: Add Operation form*

---

## 5.3 Managing Operations

### Edit an Active Operation

1. Open the operation from the **Current** tab.
2. Tap to edit, update fields as needed.
3. Tap **Save**.

### Conclude an Operation

1. Open the active operation.
2. Tap **Conclude** (Administrator / Supervisor only).
3. The operation moves to the **History** tab.

### Delete a History Record

1. Go to the **History** tab.
2. Select the operation and tap **Delete Operation**.
3. Confirm with **Delete Operation** or tap **Cancel**.

> *Insert screenshot: Operation detail with Edit and Conclude buttons*

---

## 6.0 Resources

The **Resources** tab manages PDRRMO inventory and external agency resources.

### Resource Types

| Type | Description |
|------|-------------|
| **PDRRMO Resource** | Internal inventory — can be borrowed by authorized personnel |
| **External Resource** | Resources owned by partner agencies |

### Categories

Vehicles · Medical · Equipment · Communication · Personnel · Tools · Supplies · Other

> *Insert screenshot: Resources list view*

---

## 6.1 Adding Resources

*Available to Administrators and Supervisors only.*

1. Tap **Resources** in the bottom navigation.
2. Tap **Add Resources** in the header.
3. Choose **PDRRMO Resource** or **External Resource**.
4. Fill in resource details (name, category, quantity, condition, agency if external).
5. Optionally attach a photo.
6. Tap **Save**.

### Filtering Resources

Tap the **filter icon** to sort by category, type, agency, status, or condition.

> *Insert screenshot: Add Resource modal*

---

## 6.2 Borrowing and Returning Resources

*All roles can borrow and return resources.*

### Borrow a Resource

1. Find the resource in the list.
2. Tap **Borrow**.
3. Complete the borrower form (name, purpose, optional photo).
4. Submit — the resource status updates to **Borrowed**.

### Return a Resource

1. Open the borrowed resource or go to the **Borrower Dashboard**.
2. Tap **Return**.
3. Select condition: Excellent · Good · Fair · Poor · Needs Repair.
4. Add return notes and submit.

### Borrower Dashboard

View **Active Borrowed** and **History** tabs to track all your transactions.

> *Insert screenshot: Borrow and Return flow*

---

## 7.0 Situation Reports (SitRep)

The **SitRep** tab manages emergency documents and situation reports.

### Header Actions

| Button | Action | Who |
|--------|--------|-----|
| **Generate** | Create a structured SitRep from operation data | Admin, Supervisor |
| **Upload** | Upload a document file | All roles |
| **Multi-select** | Select multiple documents for bulk delete | Admin, Supervisor |

### Upload a Document

1. Tap the **Upload** icon.
2. Select a file from your device.
3. Enter a **title** and **description**.
4. Tap **Upload Document**.

### Download or Delete

- Tap **Download** on any document card.
- Tap **Delete** to remove (Admin / Supervisor only) — confirm when prompted.

> *Insert screenshot: SitRep document list with action buttons*

---

## 8.0 Documents

Access internal memos and official communications via **Menu (☰) → Documents**.

### Features

- View uploaded memos and circulars
- **Search and filter** documents
- **Acknowledge** documents assigned to you
- **Distribute** documents to specific users (Admin / Supervisor)

### Operator Access

Operators can **view** and **acknowledge** documents but cannot assign or delete them.

> *Insert screenshot: Documents screen with search and acknowledge button*

---

## 9.0 Weather Station

Access real-time weather data via **Menu (☰) → Weather Station**.

### Features

| Feature | Description |
|---------|-------------|
| **Station Switcher** | Select any municipality weather station |
| **Live Metrics** | Temperature, humidity, rainfall, wind speed |
| **7-Day Analytics** | Trend charts for weather patterns |
| **Historical Data** | Tabular weather history |
| **PAGASA Alerts** | Official rainfall advisories |

Weather data helps inform operation decisions in the field.

> *Insert screenshot: Weather Station with live metrics and analytics*

---

## 10.0 User Management

*Administrator access only — Menu (☰) → User Management.*

### User Groups

Administrators · Supervisors · Operators

### Common Tasks

| Task | Steps |
|------|-------|
| **Add User** | Tap **Add User** → fill form → set role and status → save |
| **Activate Account** | Find inactive user → tap **Activate User** |
| **Deactivate Account** | Tap **Pause** or **Deactivate User** on user card |
| **Edit User** | Open user → change role or status → save |
| **Delete User** | Open user → Delete → enter admin password to confirm |

### Filters

Filter by **Role**, **Status** (Active / Inactive / Suspended), or **Sort** order.

> *Insert screenshot: User Management list with role badges*

---

## 11.0 Profile and Settings

Manage your personal account and app preferences from the header and side menu.

### Quick Access

| Item | Location |
|------|----------|
| Profile | Header → **Profile Avatar** |
| Notifications | Header → **Bell Icon** |
| Settings | Menu (☰) → **Settings** |

> *Insert screenshot: Header with profile, bell, and menu highlighted*

---

## 11.1 Profile

1. Tap your **Profile Avatar** in the header.
2. View your name, email, username, and role badge.
3. Tap the avatar to change your photo (camera or gallery).
4. Tap **Edit Profile** to update your Full Name, Email, or Username.
5. Tap **Save Changes** when done.

> *Insert screenshot: Profile panel with Edit Profile button*

---

## 11.2 Notifications

1. Tap the **Bell Icon** in the header.
2. View unread and read notifications.

### Notification Types

- New or updated **operations**
- **Resource** requests, assignments, and overdue items
- **Document** assignments requiring acknowledgment
- New **SitRep** uploads
- **Weather** alerts and advisories
- **System** alerts

### Actions

- Tap a notification to navigate to the related content.
- Mark individual notifications as read, or **Mark All Read**.
- Delete notifications you no longer need.

> *Insert screenshot: Notifications dropdown*

---

## 11.3 App Settings

Go to **Menu (☰) → Settings**.

| Setting | Description |
|---------|-------------|
| **Push Notifications** | Toggle on/off — receive alerts on your device |
| **Theme** | Switch between Light and Dark mode |
| **App Version** | Shows current version (1.0.0) |
| **Help & Support** | Contact information and support details |
| **Terms of Service** | App usage terms |

> *Insert screenshot: Settings screen with toggles*

---

## 12.0 User Roles

Respondr uses role-based access to protect sensitive functions.

| Role | Badge Color | Primary Responsibilities |
|------|-------------|--------------------------|
| **Administrator** | Red | Full system access — users, resources, operations, documents |
| **Supervisor** | Orange | Manage operations, resources, documents; no user management |
| **Operator** | Blue | View operations; borrow/return resources; upload SitRep; acknowledge documents |

### Permission Summary

| Feature | Admin | Supervisor | Operator |
|---------|:-----:|:----------:|:--------:|
| User Management | ✓ | — | — |
| Create / edit resources | ✓ | ✓ | — |
| Borrow / return resources | ✓ | ✓ | ✓ |
| Manage operations | ✓ | ✓ | View only |
| SitRep upload | ✓ | ✓ | ✓ |
| SitRep delete | ✓ | ✓ | — |
| Document distribution | ✓ | ✓ | — |
| Weather Station | ✓ | ✓ | ✓ |
| Settings | ✓ | ✓ | View only |

> *Insert screenshot: Role badges on profile and user cards*

---

## 13.0 Working Offline

Respondr is designed for field use in areas with limited connectivity.

### Requires Internet

- First-time **sign-in** and **sign-up**
- **File uploads** and **downloads**
- **Account activation** checks

### Works Offline (After Sign-In)

- View cached resources, operations, and documents
- Create or update operations (synced when online)
- Borrow and return resources (queued for sync)

### Sync Behavior

- Changes made offline are **queued automatically**.
- When connection is restored, data **syncs in the background**.
- A **network status indicator** shows offline, slow connection, or sync progress.
- Tap **Retry** or **Force Sync** if sync does not start automatically.

> *Insert screenshot: Network status indicator (offline / syncing)*

---

## 14.0 Help and Support

### In-App Help

Go to **Settings → Help & Support** for contact details and guidance.

### IT Support

| | |
|---|---|
| **Email** | it-support@pdrrmo.davaooriental.gov.ph |
| **Phone** | (087) 388-3000 |
| **Hours** | Monday – Friday, 8:00 AM – 5:00 PM |

### Emergency Operations Center

For urgent operational issues during an active disaster, contact your **PDRRMO Emergency Operations Center** supervisor directly.

### Common Issues

| Issue | Solution |
|-------|----------|
| Cannot sign in | Verify credentials; confirm account is activated |
| Data not updating | Check internet connection; tap Retry or Force Sync |
| Upload failed | Ensure you are online; retry the upload |
| Notifications not received | Enable Push Notifications in Settings |

> *Insert screenshot: Help & Support modal*

---

*End of Manual*
