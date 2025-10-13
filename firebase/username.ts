import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./config";

/**
 * Check if a username already exists in the database
 * @param username The username to check
 * @returns A boolean indicating if the username exists
 */
export const checkUsernameExists = async (username: string): Promise<boolean> => {
  try {
    // Check in the usernames collection
    const usernameDoc = await getDoc(doc(db, 'usernames', username));
    return usernameDoc.exists();
  } catch (error) {
    console.error('Error checking username:', error);
    throw error;
  }
};

/**
 * Check if an email already exists in the database
 * @param email The email to check
 * @returns A boolean indicating if the email exists
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    // Query the users collection for the email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking email:', error);
    throw error;
  }
};