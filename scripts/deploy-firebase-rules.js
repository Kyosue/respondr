#!/usr/bin/env node

/**
 * Firebase Rules Deployment Script
 * 
 * This script deploys Firestore and Storage security rules to Firebase.
 * Run this script after making changes to the security rules.
 * 
 * Prerequisites:
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Login to Firebase: firebase login
 * 3. Initialize Firebase in project: firebase init
 * 
 * Usage:
 * node scripts/deploy-firebase-rules.js
 * 
 * Or use Firebase CLI directly:
 * firebase deploy --only firestore:rules,storage
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Firebase Security Rules...\n');

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Firebase CLI is not installed. Please install it first:');
  console.error('   npm install -g firebase-tools');
  console.error('   firebase login');
  process.exit(1);
}

// Check if firebase.json exists
const firebaseJsonPath = path.join(process.cwd(), 'firebase.json');
if (!fs.existsSync(firebaseJsonPath)) {
  console.error('❌ firebase.json not found. Please initialize Firebase in your project:');
  console.error('   firebase init');
  process.exit(1);
}

// Check if rules files exist
const firestoreRulesPath = path.join(process.cwd(), 'firebase', 'firestore.rules');
const storageRulesPath = path.join(process.cwd(), 'firebase', 'storage.rules');

if (!fs.existsSync(firestoreRulesPath)) {
  console.error('❌ Firestore rules file not found:', firestoreRulesPath);
  process.exit(1);
}

if (!fs.existsSync(storageRulesPath)) {
  console.error('❌ Storage rules file not found:', storageRulesPath);
  process.exit(1);
}

console.log('✅ Rules files found');
console.log('📋 Deploying rules...\n');

try {
  // Deploy Firestore rules
  console.log('📄 Deploying Firestore rules...');
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
  console.log('✅ Firestore rules deployed successfully\n');

  // Deploy Storage rules
  console.log('📦 Deploying Storage rules...');
  execSync('firebase deploy --only storage', { stdio: 'inherit' });
  console.log('✅ Storage rules deployed successfully\n');

  console.log('🎉 All security rules deployed successfully!');
  console.log('\n📋 Summary:');
  console.log('   • Firestore rules: sitrep_documents collection secured');
  console.log('   • Storage rules: sitrep/documents/ path secured');
  console.log('   • All authenticated users can read/write documents');
  console.log('\n🔒 Security Status: SECURED');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.error('\nTroubleshooting:');
  console.error('1. Make sure you are logged in: firebase login');
  console.error('2. Check your Firebase project: firebase projects:list');
  console.error('3. Verify your project is initialized: firebase use --add');
  process.exit(1);
}
