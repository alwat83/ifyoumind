// Admin setup script for ifYouMind
// Run this after upgrading to Blaze plan and deploying functions

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to download service account key)
// Download from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function makeAdmin(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`✅ User ${uid} is now an admin!`);
    console.log('⚠️  They need to sign out and back in to refresh their token.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function makeModerator(uid) {
  try {
    const user = await admin.auth().getUser(uid);
    const currentClaims = (user.customClaims || {}) as Record<string, unknown>;
    const newClaims = { ...currentClaims, moderator: true };
    await admin.auth().setCustomUserClaims(uid, newClaims);
    console.log(`✅ User ${uid} is now a moderator!`);
    console.log('⚠️  They need to sign out and back in to refresh their token.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Usage examples:
makeAdmin('hD2auI87gCOB3kUByHFnsLIVOC32');
// makeModerator('another-uid-here');

console.log('🔧 Admin setup script loaded.');
console.log('📝 To use:');
console.log('   1. Download service account key from Firebase Console');
console.log('   2. Save as service-account-key.json in this directory');
console.log('   3. Uncomment and modify the function calls below');
console.log('   4. Run: node admin-setup.js');

// Uncomment and modify these lines with actual UIDs:
// makeAdmin('REPLACE_WITH_YOUR_UID');
// makeModerator('REPLACE_WITH_MODERATOR_UID');


