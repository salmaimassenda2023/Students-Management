// app/api/user-profile-setup/route.js
// Initial User Profile Creation & Role Assignment in Firebase Custom Claims:
// Call this API After createUserWithEmailAndPassword or signInWithPopup.

import { auth as adminAuth } from '@/firebase/firebase-admin'; // Ensure correct path
import { NextResponse } from 'next/server';
import { protectApi } from '@/utils/middleware'; // Ensure correct path (using your HOF pattern)

// POST method: Handles setting default Firebase Custom Claim for new users
export const POST = async (req) => { // NOTE: This POST is NOT wrapped by protectApi, it's for initial setup
    const { uid, email } = await req.json();

    if (!uid || !email) {
        return NextResponse.json({ message: 'UID and Email are required.' }, { status: 400 });
    }

    try {
        const userRecord = await adminAuth.getUser(uid);
        if (userRecord.customClaims && userRecord.customClaims.role) {
            console.log(`User ${uid} already has role '${userRecord.customClaims.role}'. Skipping assignment.`);
            return NextResponse.json({ message: 'User already has a role assigned.' }, { status: 200 });
        }

        const defaultRole = 'manager'; // Assign 'manager' role to all new signups
        await adminAuth.setCustomUserClaims(uid, { role: defaultRole });

        console.log(`Assigned role '${defaultRole}' to user ${uid}`);

        return NextResponse.json({ message: 'User profile and default role set successfully.' }, { status: 200 });

    } catch (error) {
        console.error("Error setting up user profile or default role:", error);
        return NextResponse.json({
            message: 'Failed to set up user profile.',
            details: error.message || error.toString()
        }, { status: 500 });
    }
};


// GET method: Allows fetching a SINGLE user's profile and role from Firebase Auth
// This route is protected, so only authenticated users can access it.
// app/api/user-profile-setup/route.js


export const GET = protectApi([])(async (req, context) => {
    console.log('--- API GET /api/user-profile-setup triggered ---');
    // Log the user context received from middleware
    console.log('Middleware context user:', context.user);

    const { searchParams } = new URL(req.url);
    const targetUid = searchParams.get('uid');

    let userIdToFetch = context.user?.uid; // Use optional chaining in case context.user is somehow null/undefined

    if (!userIdToFetch) {
        console.error("No UID found from requesting user in API context.");
        return NextResponse.json({ message: 'Unauthorized: User UID not found in token.' }, { status: 401 });
    }

    if (targetUid) {
        if (context.user?.role === 'admin') { // Also use optional chaining
            userIdToFetch = targetUid;
        } else {
            console.log('Forbidden: Non-admin attempted to fetch another user profile.');
            return NextResponse.json({ message: 'Forbidden: You can only view your own profile.' }, { status: 403 });
        }
    }
    console.log('Attempting to fetch user record for UID:', userIdToFetch);

    try {
        const userRecord = await adminAuth.getUser(userIdToFetch); // THIS IS THE LINE TO WATCH IN SERVER LOGS
        console.log('Successfully fetched user record for:', userRecord.uid);


        const userProfile = {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            role: userRecord.customClaims?.role || 'not a role assigned',
            createdAt: userRecord.metadata.creationTime,
            lastSignInTime: userRecord.metadata.lastSignInTime,
        };
        console.log('Returning user profile:', userProfile);
        return NextResponse.json({ user: userProfile }, { status: 200 });

    } catch (error) {
        console.error("Detailed Server-Side Error in user-profile-setup API:", error); // <-- THIS IS WHAT YOU NEED
        if (error.code === 'auth/user-not-found') {
            return NextResponse.json({ message: 'User profile not found.' }, { status: 404 });
        }
        return NextResponse.json({
            message: 'Failed to fetch user profile.',
            details: error.message || error.toString()
        }, { status: 500 });
    }
});