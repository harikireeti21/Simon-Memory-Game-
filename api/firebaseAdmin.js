const { initializeApp, cert } = require("firebase-admin/app");
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

const app = initializeApp({
  credential: cert({
    projectId: projectId,
    clientEmail: clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore(app);
const auth = getAuth(app);

module.exports = { db, auth };
