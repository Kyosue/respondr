import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Initialize Firebase Admin SDK
admin.initializeApp();

/**
 * Cloud Function to create a new user by admin
 * This function creates a user without signing them in, preserving the admin's session
 */
export const createUserByAdmin = functions.https.onCall(async (data, context) => {
  try {
    // Verify that the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const adminUid = context.auth.uid;
    const { email, password, fullName, displayName, userType, status = 'active' } = data;

    // Validate required fields
    if (!email || !password || !fullName || !displayName || !userType) {
      throw new functions.https.HttpsError('invalid-argument', 'All required fields must be provided');
    }

    // Verify that the requesting user has admin privileges
    const adminDoc = await admin.firestore().collection('users').doc(adminUid).get();
    if (!adminDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Admin user not found');
    }

    const adminData = adminDoc.data();
    if (adminData?.userType !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can create users');
    }

    // Check if user already exists
    try {
      await admin.auth().getUserByEmail(email);
      throw new functions.https.HttpsError('already-exists', 'User with this email already exists');
    } catch (error: any) {
      if (error.code === 'user-not-found') {
        // User doesn't exist, continue with creation
      } else if (error.code === 'already-exists') {
        throw error;
      } else {
        throw new functions.https.HttpsError('internal', 'Error checking user existence');
      }
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: fullName,
      disabled: false,
    });

    // Create user data object
    const userData = {
      id: userRecord.uid,
      fullName,
      displayName,
      email,
      userType,
      status,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      createdBy: adminUid,
    };

    // Save user data to Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set(userData);

    // Log the user creation
    console.log(`User created by admin ${adminUid}: ${userRecord.uid} (${email})`);

    return {
      success: true,
      userData: {
        ...userData,
        // Convert Firestore timestamps to regular objects for client
        createdAt: userData.createdAt.toDate(),
        updatedAt: userData.updatedAt.toDate(),
      },
    };
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'An error occurred while creating the user');
  }
});

/**
 * Cloud Function for self-signup
 * This function creates a user account without automatically signing them in
 * New users are created with 'inactive' status and must wait for admin activation
 */
export const createUserSelfSignup = functions.https.onCall(async (data, context) => {
  try {
    // No authentication required for self-signup
    // But we can add rate limiting or other security measures here if needed

    const { email, password, fullName, displayName, username: rawUsername } = data;

    // Log received data for debugging
    console.log('Received signup data:', {
      email: email ? 'present' : 'missing',
      password: password ? 'present' : 'missing',
      fullName: fullName ? 'present' : 'missing',
      displayName: displayName ? 'present' : 'missing',
      username: rawUsername ? `present: "${rawUsername}"` : 'missing'
    });

    // Validate required fields
    if (!email || !password || !fullName || !displayName || !rawUsername) {
      console.error('Missing required fields:', {
        email: !!email,
        password: !!password,
        fullName: !!fullName,
        displayName: !!displayName,
        username: !!rawUsername
      });
      throw new functions.https.HttpsError('invalid-argument', 'All required fields must be provided');
    }

    // Trim and normalize username
    const username = rawUsername.trim().toLowerCase();

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      throw new functions.https.HttpsError('invalid-argument', 'Username must be 3-20 characters and contain only letters, numbers, and underscores');
    }

    // Check if username already exists
    const usernameQuery = await admin.firestore().collection('users').where('username', '==', username).limit(1).get();
    if (!usernameQuery.empty) {
      throw new functions.https.HttpsError('already-exists', 'Username already taken');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters long');
    }

    // Check if user already exists
    try {
      await admin.auth().getUserByEmail(email);
      // If we get here, user already exists
      throw new functions.https.HttpsError('already-exists', 'User with this email already exists');
    } catch (error: any) {
      // If user doesn't exist, Firebase Admin SDK throws an error with code 'auth/user-not-found'
      // We should continue with user creation in this case
      if (error.code === 'auth/user-not-found' || error.code === 'user-not-found') {
        // User doesn't exist, continue with creation - this is what we want
      } else if (error instanceof functions.https.HttpsError) {
        // Re-throw HttpsErrors (like 'already-exists')
        throw error;
      } else {
        // Log unexpected errors for debugging
        console.error('Unexpected error checking user existence:', error);
        // For any other error, we'll try to create the user anyway
        // If the email is truly taken, createUser will fail with a more specific error
      }
    }

    // Create user in Firebase Auth (this does NOT sign them in)
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: fullName,
      disabled: false,
    });

    // Create user data object with inactive status
    const userData = {
      id: userRecord.uid,
      fullName,
      displayName,
      username: username, // Ensure username is included
      email,
      userType: 'operator' as const, // Default to operator for self-signup
      status: 'inactive' as const, // New accounts are inactive by default
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    // Log the user data before saving (for debugging)
    console.log(`Creating user with data:`, {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      fullName: userData.fullName
    });

    // Explicitly verify username is present before saving
    if (!username || username.trim() === '') {
      console.error('ERROR: Username is empty or undefined before saving!');
      throw new functions.https.HttpsError('invalid-argument', 'Username cannot be empty');
    }

    console.log(`About to save user with username: "${username}"`);

    // Save user data to Firestore - use set() to ensure all fields are saved
    await admin.firestore().collection('users').doc(userRecord.uid).set(userData, { merge: false });

    // Verify the data was saved correctly
    const savedUser = await admin.firestore().collection('users').doc(userRecord.uid).get();
    if (!savedUser.exists) {
      throw new functions.https.HttpsError('internal', 'Failed to save user data');
    }
    
    const savedData = savedUser.data();
    console.log(`User saved successfully. Full saved data:`, JSON.stringify(savedData, null, 2));
    console.log(`Username in saved data:`, savedData?.username);
    
    if (!savedData?.username) {
      console.error('ERROR: Username was not saved to Firestore!');
      // Try to update with username
      await admin.firestore().collection('users').doc(userRecord.uid).update({ username: username });
      console.log('Attempted to update username field');
    }

    // Log the user creation
    console.log(`User self-signup: ${userRecord.uid} (${email}) with username: ${username}`);

    return {
      success: true,
      message: 'Account created successfully. Please wait for admin activation before signing in.',
      userId: userRecord.uid,
      // Return user data with timestamps converted to dates
      userData: {
        id: userData.id,
        fullName: userData.fullName,
        displayName: userData.displayName,
        username: userData.username, // Explicitly include username
        email: userData.email,
        userType: userData.userType,
        status: userData.status,
        createdAt: userData.createdAt.toDate(),
        updatedAt: userData.updatedAt.toDate(),
      },
    };
  } catch (error: any) {
    console.error('Error during self-signup:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'An error occurred while creating your account');
  }
});

/**
 * Cloud Function to update user data by admin
 */
export const updateUserByAdmin = functions.https.onCall(async (data, context) => {
  try {
    // Verify that the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const adminUid = context.auth.uid;
    const { userId, updates } = data;

    // Verify that the requesting user has admin privileges
    const adminDoc = await admin.firestore().collection('users').doc(adminUid).get();
    if (!adminDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Admin user not found');
    }

    const adminData = adminDoc.data();
    if (adminData?.userType !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can update users');
    }

    // Update user data in Firestore
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.Timestamp.now(),
    };

    await admin.firestore().collection('users').doc(userId).update(updateData);

    console.log(`User ${userId} updated by admin ${adminUid}`);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'An error occurred while updating the user');
  }
});

/**
 * Cloud Function to delete user by admin
 */
export const deleteUserByAdmin = functions.https.onCall(async (data, context) => {
  try {
    // Verify that the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const adminUid = context.auth.uid;
    const { userId, hardDelete = false } = data;

    // Verify that the requesting user has admin privileges
    const adminDoc = await admin.firestore().collection('users').doc(adminUid).get();
    if (!adminDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Admin user not found');
    }

    const adminData = adminDoc.data();
    if (adminData?.userType !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can delete users');
    }

    // Prevent admin from deleting themselves
    if (userId === adminUid) {
      throw new functions.https.HttpsError('invalid-argument', 'Cannot delete your own account');
    }

    if (hardDelete) {
      // Hard delete - remove from Firebase Auth and Firestore
      await admin.auth().deleteUser(userId);
      await admin.firestore().collection('users').doc(userId).delete();
      console.log(`User ${userId} hard deleted by admin ${adminUid}`);
    } else {
      // Soft delete - mark as inactive
      await admin.firestore().collection('users').doc(userId).update({
        status: 'inactive',
        updatedAt: admin.firestore.Timestamp.now(),
      });
      console.log(`User ${userId} soft deleted by admin ${adminUid}`);
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'An error occurred while deleting the user');
  }
});

