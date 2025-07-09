// Firebase Cloud Functions
const index = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.assignDefaultRole = index.auth.user().onCreate(async (user) => {
    // Set default role for new users
    const defaultRole = 'manager'; // for manage students
    await admin.auth().setCustomUserClaims(user.uid, { role: defaultRole });
    console.log(`Assigned role '${defaultRole}' to user ${user.uid}`);
    // You might also want to save more user info to Firestore/Realtime DB here
    await admin.firestore().collection('users').doc(user.uid).set({
        email: user.email,
        role: defaultRole,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
});