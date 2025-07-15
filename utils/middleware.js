// utils/authMiddleware.js
import { auth as adminAuth } from '@/firebase/firebase-admin'; // Ensure this path is correct, e.g., '@/lib/firebase-admin'
import { NextResponse } from 'next/server';

// This higher-order function takes the required roles and returns the actual middleware.
export const protectApi = (requiredRoles = []) => {
    // This is the actual middleware that wraps your API route handler.
    // It accepts the 'handler' (your GET, POST, PUT, DELETE function).
    // The 'handler' parameter here IS the async (req, context) => {...} function
    // that you export in your route.js file.
    return (handler) => { // No 'async' here on this outer return
        // This is the function that Next.js will actually invoke when the route is hit.
        // It's the middleware's execution logic.
        return async (req, context) => { // This inner function MUST be async
            const authHeader = req.headers.get('authorization');
            const idToken = authHeader?.split('Bearer ')[1];

            if (!idToken) {
                console.warn('No authentication token provided.');
                return NextResponse.json({ message: 'No authentication token provided.' }, { status: 401 });
            }

            try {
                const decodedToken = await adminAuth.verifyIdToken(idToken);
                const userRole = decodedToken.role;

                if (requiredRoles.length > 0 && (!userRole || !requiredRoles.includes(userRole))) {
                    console.warn(`Forbidden: User ${decodedToken.uid} with role '${userRole}' attempted to access route requiring roles: [${requiredRoles.join(', ')}]`);
                    return NextResponse.json({ message: 'Forbidden: Insufficient permissions.' }, { status: 403 });
                }

                // Correctly pass the request and context (with the added user info)
                // to your actual API route handler and await its result.
                return await handler(req, { ...context, user: decodedToken });

            } catch (error) {
                console.error('Error verifying Firebase ID token in middleware:', error.message);
                if (error.code === 'auth/id-token-expired') {
                    return NextResponse.json({ message: 'Unauthorized: Session expired.', code: 'token-expired' }, { status: 401 });
                } else if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-id-token') {
                    return NextResponse.json({ message: 'Unauthorized: Invalid token.', code: 'invalid-token' }, { status: 401 });
                }
                return NextResponse.json({ message: 'Internal Server Error: Authentication failed.', code: 'server-error' }, { status: 500 });
            }
        };
    };
};