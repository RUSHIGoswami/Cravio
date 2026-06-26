/**
 * Vendor auth SDK boundary — all Firebase/OAuth calls live here.
 * Swap stub implementations for real Firebase SDK when wiring live auth.
 */

export async function signInWithGoogle(): Promise<string> {
  // TODO: replace with real Firebase Google sign-in returning an ID token
  throw new Error('signInWithGoogle: not yet wired to Firebase SDK');
}

export async function signInWithApple(): Promise<string> {
  // TODO: replace with real Firebase Apple sign-in returning an ID token
  throw new Error('signInWithApple: not yet wired to Firebase SDK');
}

export async function signInWithOTP(_phoneNumber: string): Promise<string> {
  // TODO: replace with real Firebase OTP (Twilio/MSG91) returning an ID token
  throw new Error('signInWithOTP: not yet wired to Firebase SDK');
}
