import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  signOut as firebaseSignOut,
  PhoneAuthProvider,
  Auth
} from "firebase/auth";
import { auth } from "./firebase";
import { apiRequest } from "./queryClient";

// Store the verification ID for OTP confirmation
let confirmationResult: ConfirmationResult | null = null;

// Initialize the reCAPTCHA verifier
export const initRecaptchaVerifier = (containerId: string) => {
  try {
    if (!auth) {
      throw new Error("Firebase Auth not initialized");
    }
    return new RecaptchaVerifier(auth as Auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        console.log("reCAPTCHA verified");
      },
      'expired-callback': () => {
        // Response expired. Ask user to solve reCAPTCHA again.
        console.log("reCAPTCHA expired");
      }
    });
  } catch (error) {
    console.error("Failed to initialize reCAPTCHA:", error);
    throw error;
  }
};

// Send OTP to the provided phone number
export const sendOTP = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
  try {
    // Format the phone number with country code if not already formatted
    const formattedPhone = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `+91${phoneNumber}`; // Default to India country code

    // Check if the phone number exists
    const response = await apiRequest('POST', '/api/auth/verify-phone', { phoneNumber: formattedPhone });
    const data = await response.json();

    if (!auth) {
      throw new Error("Firebase Auth not initialized");
    }

    // Send OTP using Firebase
    confirmationResult = await signInWithPhoneNumber(auth as Auth, formattedPhone, recaptchaVerifier);
    
    return { success: true, exists: data.exists };
  } catch (error) {
    console.error("Error sending OTP:", error);
    return { success: false, error: error };
  }
};

// Verify the OTP entered by the user
export const verifyOTP = async (otp: string) => {
  try {
    if (!confirmationResult) {
      throw new Error("No confirmation result found. Please send OTP first.");
    }

    const result = await confirmationResult.confirm(otp);
    const user = result.user;

    // Get the phone number from the user
    const phoneNumber = user.phoneNumber;

    if (!phoneNumber) {
      throw new Error("Phone number not found in user object");
    }

    // Login/Register with backend
    try {
      const loginResponse = await apiRequest('POST', '/api/auth/login', { phoneNumber });
      
      if (loginResponse.status === 404) {
        // User doesn't exist in our DB, create a new user
        const userCredential = PhoneAuthProvider.credentialFromResult(result);
        
        // Generate a username from phone number
        const username = `user_${phoneNumber.replace(/\D/g, '').slice(-10)}`;
        
        // Create a new user in our DB
        const registerResponse = await apiRequest('POST', '/api/auth/register', {
          username,
          phoneNumber,
          password: Math.random().toString(36).slice(2), // Generate a random password
          displayName: user.displayName || username,
          photoURL: user.photoURL
        });

        return {
          success: true,
          user: await registerResponse.json()
        };
      }

      return {
        success: true,
        user: await loginResponse.json()
      };
    } catch (error) {
      console.error("Error in backend authentication:", error);
      return { success: false, error };
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { success: false, error };
  }
};

// Sign out the user
export const signOut = async () => {
  try {
    if (!auth) {
      return { success: true }; // If auth is not initialized, we're already "signed out"
    }
    await firebaseSignOut(auth as Auth);
    return { success: true };
  } catch (error) {
    console.error("Error signing out:", error);
    return { success: false, error };
  }
};
