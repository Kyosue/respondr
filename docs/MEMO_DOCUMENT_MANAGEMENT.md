# Memo Document Management Feature

## Overview

The Memo Document Management feature allows emergency management agencies to upload, organize, and access memoranda from national, regional, and local agencies for easy internal dissemination and reference.

This feature is separate from the Situation Report (SitRep) document system and is specifically designed for managing policy documents, directives, and agency issuances.

## Architecture

### Components

1. **Type Definitions** (`types/MemoDocument.ts`)
   - `MemoDocument` interface with memo-specific fields
   - `MemoAcknowledgment` for tracking user acknowledgments
   - `MemoFilter` for search and filtering
   - `MemoUploadOptions` for upload handling

2. **Firebase Service** (`firebase/memos.ts`)
   - `MemoService` class for all document operations
   - Separate from SitRep documents (uses `memo_documents` collection)
   - File validation and security
   - Upload, download, update, delete operations
   - Acknowledgment tracking

3. **React Context** (`contexts/MemoContext.tsx`)
   - Global state management for memo documents
   - Provides hooks and actions for components
   - Handles loading, errors, and state updates

4. **Reports Component** (`components/reports/Reports.tsx`)
   - Main UI for document library
   - Document list display
   - Quick stats dashboard
   - Empty and loading states

### Data Model

#### MemoDocument Fields

**Basic Document Info:**
- `id`, `title`, `description`
- `fileName`, `fileSize`, `fileType`, `mimeType`
- `downloadUrl`, `storagePath`
- `uploadedBy`, `uploadedAt`, `lastModified`
- `tags`, `isPublic`

**Memo-Specific Fields:**
- `memoNumber` - Reference number
- `issuingAgency` - Agency that issued the document
- `agencyLevel` - Level: national, regional, provincial, municipal, barangay
- `documentType` - Type: memorandum, circular, advisory, directive, executive-order, ordinance, policy
- `effectiveDate` - When the document takes effect
- `expirationDate` - Optional expiration date
- `priority` - urgent, high, normal, low

**Distribution & Tracking:**
- `distributionList` - Array of user IDs who should receive this
- `acknowledgmentRequired` - Whether acknowledgment is mandatory
- `acknowledgments` - Array of acknowledgment records

**Relationships:**
- `relatedOperations` - Links to related operations
- `supersedes` - Reference to superseded memo
- `supersededBy` - Reference to superseding memo

### Firebase Collections

#### Firestore
- Collection: `memo_documents`
- Security: Authenticated users can read/write

#### Storage
- Path: `memos/{fileName}`
- Supports: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, images, archives
- Max file size: 50MB

## Implementation Phases

### Phase 1: Core Infrastructure ✅

**Completed:**
- Created `MemoDocument` type definitions
- Implemented `MemoService` for Firebase operations
- Created `MemoContext` for state management
- Built basic `Reports` component UI
- Integrated `MemoProvider` into app layout
- Updated Firebase documentation

**Features:**
- Document listing
- Basic UI with stats
- Empty and loading states
- Document card display with priority badges

### Phase 2: Document Upload ✅

**Completed:**
- Upload modal component with full metadata entry
- File picker integration for web
- Form validation and error handling
- Progress indicator during upload
- Agency level and document type selection
- Priority and date management

**Components Created:**
- `components/reports/modals/MemoUploadModal.tsx` - Full upload interface
- Integrated with MemoContext for state management
- File selection and metadata entry
- Progress tracking during upload

### Phase 3: Document Library (Planned)

**To Implement:**
- Advanced search and filtering
- Agency-level filters
- Priority filters
- Date range filters
- Document type filters
- Full-text search

**Components to Create:**
- `components/reports/filters/MemoFilters.tsx`
- Search bar with autocomplete
- Filter panel

### Phase 4: Distribution System (Planned)

**To Implement:**
- User assignment interface
- Acknowledgment tracking
- Notification system
- Distribution reports
- Compliance monitoring

**Components to Create:**
- `components/reports/modals/DistributionModal.tsx`
- Acknowledgment interface
- Distribution tracking dashboard
- Notification badges

### Phase 5: Document Viewer (Planned)

**To Implement:**
- In-app document viewer
- PDF rendering
- Document preview
- Download functionality
- Print support

**Components to Create:**
- `components/reports/viewer/DocumentViewer.tsx`
- Document actions (download, share, print)

## Usage

### Uploading a Document

```typescript
const { uploadDocument } = useMemo();

await uploadDocument(file, {
  title: 'Office Memorandum No. 2024-001',
  description: 'Disaster preparedness guidelines',
  memoNumber: 'OM-2024-001',
  issuingAgency: 'DILG Central Office',
  agencyLevel: 'national',
  documentType: 'memorandum',
  effectiveDate: new Date('2024-01-01'),
  priority: 'urgent',
  distributionList: ['user1', 'user2'],
  acknowledgmentRequired: true,
  tags: ['disaster', 'preparedness'],
  isPublic: false,
});
```

### Fetching Documents

```typescript
const { documents, fetchDocuments, loading } = useMemo();

// Fetch with filters
await fetchDocuments({
  agencyLevel: 'national',
  priority: 'urgent',
  searchQuery: 'disaster',
});
```

### Acknowledging a Document

```typescript
const { acknowledgeDocument } = useMemo();

await acknowledgeDocument(documentId, 'Acknowledged and noted.');
```

## Security

### Firestore Rules
```javascript
match /memo_documents/{documentId} {
  allow read, write: if request.auth != null;
}
```

### Storage Rules
```javascript
match /memos/{fileName} {
  allow read, write: if request.auth != null;
}
```

## Best Practices

1. **File Naming**: Use descriptive names with memo numbers
2. **Metadata**: Always include complete metadata for easy retrieval
3. **Distribution**: Assign documents to relevant users only
4. **Priority**: Use appropriate priority levels
5. **Acknowledgment**: Enable for important documents
6. **Expiration**: Set expiration dates for time-sensitive documents
7. **Tags**: Use consistent tagging for better search

## Future Enhancements

1. **Advanced Search**: Full-text search within documents
2. **AI Classification**: Auto-categorize documents
3. **Duplicate Detection**: Identify similar documents
4. **Version Control**: Track document revisions
5. **Analytics**: Document access and engagement metrics
6. **Mobile Optimization**: Offline viewing capabilities
7. **Integration**: Link with operations and resource management

