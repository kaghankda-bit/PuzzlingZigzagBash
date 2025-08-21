// firebase.js
// Updated Firebase Admin SDK initialization with environment variables and better error handling

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Get service account path from environment variable
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;

if (!serviceAccountPath) {
  throw new Error(
    "❌ FIREBASE_SERVICE_ACCOUNT_KEY_PATH is not set in environment variables.",
  );
}

// Resolve absolute path
const resolvedPath = path.resolve(serviceAccountPath);

// Check if file exists
if (!fs.existsSync(resolvedPath)) {
  throw new Error(
    `❌ Firebase service account key file not found at: ${resolvedPath}`,
  );
}

// Load service account
const serviceAccount = require(resolvedPath);

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // You can add more Firebase services here if needed
    // storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    // databaseURL: process.env.FIREBASE_DATABASE_URL
  });

  console.log("✅ Firebase Admin SDK initialized successfully.");
}

module.exports = admin;
