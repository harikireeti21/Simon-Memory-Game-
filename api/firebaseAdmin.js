const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId) {
  throw new Error("FIREBASE_PROJECT_ID is missing");
}

if (!clientEmail) {
  throw new Error("FIREBASE_CLIENT_EMAIL is missing");
}

if (!privateKey) {
  throw new Error("FIREBASE_PRIVATE_KEY is missing");
}

if (!privateKey.includes("BEGIN PRIVATE KEY")) {
  throw new Error("FIREBASE_PRIVATE_KEY is invalid");
}

const firebaseApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      })
    : getApps()[0];

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

module.exports = { db, auth };
