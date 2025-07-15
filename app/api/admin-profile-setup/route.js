
// This route is for admin to list all users and their roles from Firebase Authentication.

import { auth as adminAuth } from '@/firebase/firebase-admin'; // Ensure correct path
import { NextResponse } from 'next/server';
import { protectApi } from '@/utils/middleware'; // Ensure correct path (using your HOF pattern)

export const GET = protectApi(['admin'])(async (req, context) => { // Only 'admin' role can access this
    const { user: adminUser } = context; // The authenticated admin user

    try {
        const users = [];
        let nextPageToken;
        do {
            // List users from Firebase Authentication. Max 1000 per call.
            const listUsersResult = await adminAuth.listUsers(1000, nextPageToken);
            listUsersResult.users.forEach(userRecord => {
                users.push({
                    uid: userRecord.uid,
                    email: userRecord.email,
                    displayName: userRecord.displayName || 'N/A',
                    role: userRecord.customClaims?.role || 'user', // Default to 'user' if no role claim
                    createdAt: userRecord.metadata.creationTime,
                    lastSignInTime: userRecord.metadata.lastSignInTime,
                });
            });
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken); // Loop to fetch all users if more than 1000

        return NextResponse.json({ users: users }, { status: 200 });

    } catch (error) {
        console.error("Error listing users for admin dashboard:", error);
        return NextResponse.json({ message: 'Failed to retrieve users.' }, { status: 500 });
    }
});

// app/api/admin/set-user-role/route.js
// This route allows an admin to update another user's role via Firebase Custom Claims.
export const POST = protectApi(['admin'])(async (req, context) => { // Only 'admin' role can access
    const { user: adminUser } = context; // The authenticated admin user
    const { uid, role } = await req.json(); // The target user's UID and the new role

    if (!uid || !role) {
        return NextResponse.json({ message: 'User UID and Role are required.' }, { status: 400 });
    }

    const allowedRoles = ['user', 'manager', 'admin']; // Define your valid roles
    if (!allowedRoles.includes(role)) {
        return NextResponse.json({ message: 'Invalid role specified.' }, { status: 400 });
    }

    // Optional: Prevent an admin from demoting or locking themselves out
    if (adminUser.uid === uid && role !== 'admin') {
        return NextResponse.json({ message: 'Admin cannot demote themselves.' }, { status: 403 });
    }

    try {
        // Set custom claim using Firebase Admin SDK
        await adminAuth.setCustomUserClaims(uid, { role: role });
        return NextResponse.json({ message: `Role '${role}' assigned to user ${uid} successfully.` }, { status: 200 });
    } catch (error) {
        console.error("Error setting custom user claim:", error);
        if (error.code === 'auth/user-not-found') {
            return NextResponse.json({ message: 'Target user not found.' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Failed to set user role.' }, { status: 500 });
    }
});