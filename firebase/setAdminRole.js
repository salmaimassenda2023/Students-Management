

const admin = require('firebase-admin');

const serviceAccount = require('./service-account-key.json'); // <--- IMPORTANT: Update this filename!

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const targetUid = 'oqHbYiDJ9MbEQaDZ9ENj8AWUIyl1'; // Replace with the actual UID of your target user
const role = 'admin';

admin.auth().setCustomUserClaims(targetUid, { role: role })
    .then(() => {
        console.log(`Successfully set custom claim 'role: ${role}' for user ${targetUid}`);
        process.exit(0); // Exit successfully
    })
    .catch((error) => {
        console.error('Error setting custom claim:', error);
        process.exit(1); // Exit with an error code
    });