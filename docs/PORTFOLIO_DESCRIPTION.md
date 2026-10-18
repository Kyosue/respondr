# Respondr — Portfolio & Resume Copy

## Overview

Respondr is a cross-platform (iOS, Android, Web) disaster response management system built for the Provincial Disaster Risk Reduction and Management Office (PDRRMO) of Davao Oriental, enabling real-time coordination of emergency operations, resource allocation, and situation reporting in low-connectivity field environments. Built with Expo/React Native, TypeScript, Firebase (Auth, Firestore, Storage, Cloud Functions), and Leaflet/GeoJSON mapping.

## Resume / Portfolio Bullets

- Engineered an offline-first sync layer using NetInfo, AsyncStorage-backed operation queues, and a SyncManager with exponential backoff so responders can create and update resource transactions after login even when cellular coverage drops during disasters.
- Built municipality-level operations tracking on Leaflet + OpenStreetMap with platform-specific rendering (DOM Leaflet on web, WebView-injected Leaflet on native) and Firestore `onSnapshot` listeners to surface active vs. concluded response sites across Davao Oriental in real time.
- Implemented role-based access (admin / supervisor / operator) with Expo SecureStore session restore and Firebase callable Cloud Functions for admin-safe user provisioning, preventing client-side `createUser` from hijacking the admin’s Auth session.
- Delivered SitRep Word-compatible HTML `.doc` export (letterhead, base64 images, multi-section casualty/response data) and PAGASA-aligned rainfall advisories with on-device multivariate regression plus SheetJS Excel export for historical weather analysis.

## Alternate Shorter Set (3 bullets)

- Built a cross-platform disaster response app (Expo, TypeScript, Firebase) for PDRRMO Davao Oriental covering inventory, operations maps, SitReps, and weather advisories.
- Designed offline resilience with AsyncStorage queues, CacheManager TTLs, and resilient Firestore service wrappers so field staff keep working without continuous internet.
- Shipped GeoJSON/Leaflet operations maps, RBAC with Cloud Functions user lifecycle, and automated SitRep/Excel document generation for post-incident reporting.

## One-Line Tagline (optional)

Cross-platform emergency coordination for PDRRMO — offline-capable resource ops, live municipal maps, and automated situation reports.
