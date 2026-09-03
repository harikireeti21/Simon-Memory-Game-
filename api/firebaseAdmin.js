const admin = require("firebase-admin");

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

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
