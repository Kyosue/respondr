# Data Model Catalog

This document provides a comprehensive catalog of all data models used in the Respondr application database.

---

## Collection: `users`
**Document ID:** `{uid}`

### Fields

| FIELD | TYPE | NOTES | FORMAT | REQUIRED |
|-------|------|-------|--------|----------|
| `id` | String | Unique user identifier (matches Firebase Auth UID) | UUID | ✓ |
| `email` | String | User email address | xxxxxx@email.com | ✓ |
| `username` | String | Optional username for login | XXXXXX | |
| `fullName` | String | Complete user name | XXXXXX | ✓ |
| `displayName` | String | First + last name only | XXXXXX | ✓ |
| `userType` | String | Controls UI/permissions | admin \| supervisor \| operator | ✓ |
| `status` | String | Managed by admin | active \| inactive \| suspended | |
| `lastLoginAt` | Timestamp | Last login timestamp | ISO 8601 Date | |
| `lastActivityAt` | Timestamp | Last activity timestamp | ISO 8601 Date | |
| `createdAt` | Timestamp | Account creation date | ISO 8601 Date | |
| `updatedAt` | Timestamp | Last update timestamp | ISO 8601 Date | |
| `createdBy` | String | User ID who created this account | UUID | |
| `permissions` | Array[String] | Additional permissions array | ["permission1", "permission2"] | |
| `avatarUrl` | String | Profile picture URL | https://... | |

---

## Collection: `resources`
**Document ID:** `{resourceId}`

### Fields

| FIELD | TYPE | NOTES | FORMAT | REQUIRED |
|-------|------|-------|--------|----------|
| `id` | String | Unique resource identifier | UUID | ✓ |
| `name` | String | Resource name | XXXXXX | ✓ |
| `description` | String | Resource description | XXXXXX | ✓ |
| `category` | String | Resource category | vehicles \| medical \| equipment \| communication \| personnel \| tools \| supplies \| other | ✓ |
| `totalQuantity` | Number | Total available quantity | Integer ≥ 0 | ✓ |
| `availableQuantity` | Number | Currently available quantity | Integer ≥ 0 | ✓ |
| `images` | Array[String] | Image URLs or local paths | ["url1", "url2"] | |
| `location` | String | Storage location | XXXXXX | ✓ |
| `status` | String | Resource status | active \| inactive \| maintenance \| retired | ✓ |
| `condition` | String | Physical condition | excellent \| good \| fair \| poor \| needs_repair | ✓ |
| `lastMaintenance` | Date | Last maintenance date | ISO 8601 Date | |
| `nextMaintenance` | Date | Next scheduled maintenance | ISO 8601 Date | |
| `lastMaintenanceDate` | Date | Alternative maintenance date field | ISO 8601 Date | |
| `nextMaintenanceDate` | Date | Alternative next maintenance field | ISO 8601 Date | |
| `tags` | Array[String] | Searchable tags | ["tag1", "tag2"] | |
| `createdAt` | Date | Creation timestamp | ISO 8601 Date | ✓ |
| `updatedAt` | Date | Last update timestamp | ISO 8601 Date | ✓ |
| `createdBy` | String | User ID who created | UUID | ✓ |
| `updatedBy` | String | User ID who last updated | UUID | ✓ |
| `resourceType` | String | Resource ownership type | pdrrmo \| external | |
| `isBorrowable` | Boolean | Whether resource can be borrowed | true \| false | |
| `agencyId` | String | External agency ID (if external) | UUID | |
| `agencyName` | String | External agency name | XXXXXX | |
| `agencyAddress` | String | External agency address | XXXXXX | |
| `agencyContactNumbers` | Array[String] | External agency contacts | ["phone1", "phone2"] | |
| `notes` | String | General notes | XXXXXX | |
| `maintenanceNotes` | String | Maintenance-specific notes | XXXXXX | |
| `isActive` | Boolean | Active status flag | true \| false | |

---

## Collection: `transactions`
**Document ID:** `{transactionId}`

### Fields

| FIELD | TYPE | NOTES | FORMAT | REQUIRED |
|-------|------|-------|--------|----------|
| `id` | String | Unique transaction identifier | UUID | ✓ |
| `resourceId` | String | Reference to resource | UUID | ✓ |
| `userId` | String | User who created transaction | UUID | ✓ |
| `type` | String | Transaction type | borrow \| return \| checkout \| checkin \| transfer | ✓ |
| `quantity` | Number | Quantity involved | Integer > 0 | ✓ |
| `status` | String | Transaction status | pending \| approved \| active \| completed \| cancelled \| overdue | ✓ |
| `notes` | String | Transaction notes | XXXXXX | |
| `dueDate` | Date | Expected return date | ISO 8601 Date | |
| `returnedDate` | Date | Actual return date | ISO 8601 Date | |
| `returnedQuantity` | Number | Quantity returned (for partial returns) | Integer ≥ 0 | |
| `returnedCondition` | String | Condition when returned | excellent \| good \| fair \| poor \| needs_repair | |
| `returnNotes` | String | Notes specific to return | XXXXXX | |
| `borrowerName` | String | Name of borrower | XXXXXX | ✓ |
| `borrowerPicture` | String | Borrower picture URL | https://... | |
| `borrowerContact` | String | Borrower contact info | Phone/Email | |
| `borrowerDepartment` | String | Borrower department | XXXXXX | |
| `createdAt` | Date | Creation timestamp | ISO 8601 Date | ✓ |
| `updatedAt` | Date | Last update timestamp | ISO 8601 Date | ✓ |

---

## Collection: `multiTransactions`
**Document ID:** `{multiTransactionId}`

### Fields

| FIELD | TYPE | NOTES | FORMAT | REQUIRED |
|-------|------|-------|--------|----------|
| `id` | String | Unique transaction identifier | UUID | ✓ |
| `userId` | String | User who created transaction | UUID | ✓ |
| `type` | String | Transaction type | borrow \| return \| checkout \| checkin \| transfer | ✓ |
| `status` | String | Overall transaction status | pending \| approved \| active \| completed \| cancelled \| overdue | ✓ |
| `notes` | String | Transaction notes | XXXXXX | |
| `borrowerName` | String | Name of borrower | XXXXXX | ✓ |
| `borrowerPicture` | String | Borrower picture URL | https://... | |
| `borrowerContact` | String | Borrower contact info | Phone/Email | |
| `borrowerDepartment` | String | Borrower department | XXXXXX | |
| `createdAt` | Date | Creation timestamp | ISO 8601 Date | ✓ |
| `updatedAt` | Date | Last update timestamp | ISO 8601 Date | ✓ |
| `items` | Array[Object] | Array of transaction items | See MultiResourceTransactionItem | ✓ |

### MultiResourceTransactionItem Fields

| FIELD | TYPE | NOTES | FORMAT | REQUIRED |
|-------|------|-------|--------|----------|
| `id` | String | Item identifier | UUID | ✓ |
| `resourceId` | String | Reference to resource | UUID | ✓ |
| `quantity` | Number | Quantity for this item | Integer > 0 | ✓ |
| `dueDate` | Date | Expected return date | ISO 8601 Date | |
| `returnedDate` | Date | Actual return date | ISO 8601 Date | |
| `returnedQuantity` | Number | Quantity returned | Integer ≥ 0 | |
| `returnedCondition` | String | Condition when returned | excellent \| good \| fair \| poor \| needs_repair | |
| `returnNotes` | String | Return-specific notes | XXXXXX | |
| `status` | String | Item status | pending \| approved \| active \| completed \| cancelled \| overdue | ✓ |
| `notes` | String | Item-specific notes | XXXXXX | |

---

## Collection: `borrowers`
**Document ID:** `{borrowerId}`

### Fields

| FIELD | TYPE | NOTES | FORMAT | REQUIRED |
|-------|------|-------|--------|----------|
| `id` | String | Unique borrower identifier | UUID | ✓ |
| `name` | String | Borrower full name | XXXXXX | ✓ |
| `contact` | String | Contact information | Phone/Email | |
| `department` | String | Department/Organization | XXXXXX | |
| `picture` | String | Profile picture URL | https://... | |
| `lastBorrowDate` | Date | Last borrow date | ISO 8601 Date | |
| `createdAt` | Date | Creation timestamp | ISO 8601 Date | ✓ |
| `updatedAt` | Date | Last update timestamp | ISO 8601 Date | ✓ |

---

## Collection: `agencies`
**Document ID:** `{agencyId}`

### Fields

| FIELD | TYPE | NOTES | FORMAT | REQUIRED |
|-------|------|-------|--------|----------|
| `id` | String | Unique agency identifier | UUID | ✓ |
| `name` | String | Agency name | XXXXXX | ✓ |
| `address` | String | Agency address | XXXXXX | ✓ |
| `contactNumbers` | Array[String] | Contact phone numbers | ["phone1", "phone2"] | ✓ |
| `createdAt` | Date | Creation timestamp | ISO 8601 Date | ✓ |
| `updatedAt` | Date | Last update timestamp | ISO 8601 Date | ✓ |

---

## Collection: `resourceHistory`
**Document ID:** `{historyId}`

### Fields

| FIELD | TYPE | NOTES | FORMAT | REQUIRED |
|-------|------|-------|--------|----------|
| `id` | String | Unique history entry identifier | UUID | ✓ |
| `resourceId` | String | Reference to resource | UUID | ✓ |
| `action` | String | Action performed | created \| updated \| borrowed \| returned \| maintenance \| transferred \| deleted \| status_changed | ✓ |
| `userId` | String | User who performed action | UUID | ✓ |
| `details` | String | Action details/description | XXXXXX | ✓ |
| `timestamp` | Date | When action occurred | ISO 8601 Date | ✓ |
| `metadata` | Object | Additional action metadata | {key: value} | |

---

## Collection: `operations`
**Document ID:** `{operationId}`

### Fields

| FIELD | TYPE | NOTES | FORMAT | REQUIRED |
|-------|------|-------|--------|----------|
| `id` | String | Unique operation identifier | UUID | ✓ |
| `municipalityId` | String | Municipality identifier | UUID | ✓ |
| `operationType` | String | Type of operation | XXXXXX | ✓ |
| `title` | String | Operation title | XXXXXX | ✓ |
| `description` | String | Operation description | XXXXXX | ✓ |
| `priority` | String | Operation priority level | low \| medium \| high \| critical | ✓ |
| `status` | String | Operation status | active \| concluded | ✓ |
| `startDate` | Date | Operation start date | ISO 8601 Date | ✓ |
| `endDate` | Date | Operation end date | ISO 8601 Date | |
| `exactLocation` | Object | Detailed location information | See Location Object | ✓ |
| `resources` | Array[Object] | Resources allocated to operation | See OperationResourceRef | ✓ |
| `assignedPersonnel` | Array[String] | User IDs of assigned personnel | [UUID, UUID] | ✓ |
| `notes` | String | Operation notes | XXXXXX | |
| `createdAt` | Date | Creation timestamp | ISO 8601 Date | ✓ |
| `updatedAt` | Date | Last update timestamp | ISO 8601 Date | ✓ |
| `createdBy` | String | User ID who created | UUID | |
| `updatedBy` | String | User ID who last updated | UUID | |

### Location Object Fields

| FIELD | TYPE | NOTES | FORMAT | REQUIRED |
|-------|------|-------|--------|----------|
| `barangay` | String | Barangay name | XXXXXX | ✓ |
| `purok` | String | Purok name | XXXXXX | ✓ |
| `specificAddress` | String | Specific address details | XXXXXX | |

### OperationResourceRef Fields

| FIELD | TYPE | NOTES | FORMAT | REQUIRED |
|-------|------|-------|--------|----------|
| `resourceId` | String | Reference to resource | UUID | ✓ |
| `resourceName` | String | Resource name | XXXXXX | ✓ |
| `category` | String | Resource category | vehicles \| medical \| equipment \| ... | ✓ |
| `quantity` | Number | Quantity allocated | Integer > 0 | ✓ |
| `status` | String | Allocation status | requested \| allocated \| in_use \| returned | ✓ |

---

## Collection: `sitrep_documents`
**Document ID:** `{documentId}`

### Fields

| FIELD | TYPE | NOTES | FORMAT | REQUIRED |
|-------|------|-------|--------|----------|
| `id` | String | Unique document identifier | UUID | ✓ |
| `title` | String | Situation report title | XXXXXX | ✓ |
| `description` | String | Report description | XXXXXX | ✓ |
| `status` | String | Report status | draft \| submitted \| under_review \| approved \| rejected \| archived | ✓ |
| `priority` | String | Report priority | low \| medium \| high \| critical | ✓ |
| `category` | String | Report category | emergency \| disaster \| security \| infrastructure \| personnel \| logistics \| medical \| communication \| other | ✓ |
| `location` | String | Incident location | XXXXXX | ✓ |
| `reporter` | String | Reporter name | XXXXXX | ✓ |
| `reporterContact` | String | Reporter contact information | Phone/Email | |
| `images` | Array[String] | Image URLs | ["url1", "url2"] | |
| `attachments` | Array[Object] | Document attachments | See SitRepAttachment | |
| `tags` | Array[String] | Searchable tags | ["tag1", "tag2"] | |
| `createdAt` | Date | Creation timestamp | ISO 8601 Date | ✓ |
| `updatedAt` | Date | Last update timestamp | ISO 8601 Date | ✓ |
| `createdBy` | String | User ID who created | UUID | ✓ |
| `updatedBy` | String | User ID who last updated | UUID | ✓ |
| `isDraft` | Boolean | Draft flag | true \| false | ✓ |
| `isArchived` | Boolean | Archived flag | true \| false | ✓ |

### SitRepAttachment Fields

| FIELD | TYPE | NOTES | FORMAT | REQUIRED |
|-------|------|-------|--------|----------|
| `id` | String | Attachment identifier | UUID | ✓ |
| `name` | String | File name | XXXXXX.xxx | ✓ |
| `type` | String | Attachment type | image \| document \| video \| audio \| other | ✓ |
| `url` | String | File URL | https://... | ✓ |
| `size` | Number | File size in bytes | Integer ≥ 0 | ✓ |
| `uploadedAt` | Date | Upload timestamp | ISO 8601 Date | ✓ |

---

## Collection: `memo_documents`
**Document ID:** `{documentId}`

### Fields

| FIELD | TYPE | NOTES | FORMAT | REQUIRED |
|-------|------|-------|--------|----------|
| `id` | String | Unique document identifier | UUID | ✓ |
| `title` | String | Memo title | XXXXXX | ✓ |
| `description` | String | Memo description | XXXXXX | |
| `fileName` | String | Original file name | XXXXXX.xxx | ✓ |
| `fileSize` | Number | File size in bytes | Integer ≥ 0 | ✓ |
| `fileType` | String | File extension/type | pdf \| doc \| docx \| ... | ✓ |
| `mimeType` | String | MIME type | application/pdf \| ... | ✓ |
| `downloadUrl` | String | File download URL | https://... | ✓ |
| `storagePath` | String | Storage path | path/to/file | ✓ |
| `uploadedBy` | String | User ID who uploaded | UUID | ✓ |
| `uploadedAt` | Date | Upload timestamp | ISO 8601 Date | ✓ |
| `lastModified` | Date | Last modification date | ISO 8601 Date | ✓ |
| `memoNumber` | String | Memo reference number | XXXXXX | ✓ |
| `issuingAgency` | String | Agency that issued memo | XXXXXX | ✓ |
| `agencyLevel` | String | Agency level | national \| regional \| provincial \| municipal \| barangay | ✓ |
| `documentType` | String | Document type | memorandum \| circular \| advisory \| directive \| executive-order \| ordinance \| policy | ✓ |
| `effectiveDate` | Date | When document takes effect | ISO 8601 Date | ✓ |
| `expirationDate` | Date | When document expires | ISO 8601 Date | |
| `priority` | String | Document priority | urgent \| high \| normal \| low | ✓ |
| `distributionList` | Array[String] | User IDs for distribution | [UUID, UUID] | ✓ |
| `acknowledgmentRequired` | Boolean | Whether acknowledgment is required | true \| false | ✓ |
| `acknowledgments` | Array[Object] | User acknowledgments | See MemoAcknowledgment | ✓ |
| `relatedOperations` | Array[String] | Related operation IDs | [UUID, UUID] | |
| `supersedes` | String | Document ID this supersedes | UUID | |
| `supersededBy` | String | Document ID that supersedes this | UUID | |
| `tags` | Array[String] | Searchable tags | ["tag1", "tag2"] | |
| `isPublic` | Boolean | Public visibility flag | true \| false | ✓ |

### MemoAcknowledgment Fields

| FIELD | TYPE | NOTES | FORMAT | REQUIRED |
|-------|------|-------|--------|----------|
| `userId` | String | User who acknowledged | UUID | ✓ |
| `userName` | String | User's name | XXXXXX | ✓ |
| `acknowledgedAt` | Date | Acknowledgment timestamp | ISO 8601 Date | ✓ |
| `comments` | String | Optional comments | XXXXXX | |

---

## Notes

- All timestamps are stored as Firestore Timestamps and converted to JavaScript Date objects in the application
- UUID format refers to unique identifiers (typically Firestore document IDs)
- Arrays are stored as Firestore arrays
- Optional fields may be `null` or `undefined` depending on context
- Document IDs are auto-generated by Firestore unless specified
- All collections require authentication for read/write operations (see `firestore.rules`)

