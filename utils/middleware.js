// utils/authMiddleware.js
import { auth } from '@/firebase/firebase-admin'; // Your Firebase Admin SDK setup
import { NextResponse } from 'next/server';

export const protectApi = (handler) => async (req, context) => {

    // 1. Get the ID token from the request header
    const authHeader = req.headers.get('authorization');
    console.log("protectApi: Authorization header received:", authHeader ? "Present" : "Missing");

    const idToken = authHeader?.split('Bearer ')[1];

    if (!idToken) {
        return NextResponse.json({ message: 'No authentication token provided.' }, { status: 401 });
    }


    try {
        // 2. Verify the ID token using Firebase Admin SDK
        const decodedToken = await auth.verifyIdToken(idToken);
        console.log("protectApi: Token successfully verified. User UID:", decodedToken.uid); // Log successful verification

        // 3. If verification is successful, proceed to the actual API handler
        return handler(req, { ...context, user: decodedToken });

    } catch (error) {
        console.error('protectApi: Error verifying Firebase ID token:', error.message); // Log the specific error message
        // Differentiate between common token errors (403) and other server errors (500)
        if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error' || error.code === 'auth/invalid-credential') {
            console.warn("protectApi: Token is invalid or expired. Returning 403.");
            return NextResponse.json({ message: 'Unauthorized: Invalid or expired token.' }, { status: 403 });
        }
        console.error("protectApi: Unexpected error during token verification. Returning 500.");
        return NextResponse.json({ message: 'Internal Server Error: Token verification failed.' }, { status: 500 });
    }
};