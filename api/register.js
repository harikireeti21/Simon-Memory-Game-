const { auth, db } = require("./firebaseAdmin");
const bcrypt = require("bcryptjs");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { username, password } = req.body;

    // Validate username
    if (!username || !/^[A-Za-z0-9_]{3,12}$/.test(username)) {
      return res.status(400).json({
        error:
          "Username must be 3-12 characters and use only letters, numbers, or _",
      });
    }

    // Validate password
    if (!password || password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters",
      });
    }

    const usernameKey = username.toLowerCase();

    // Check whether username already exists
    const userRef = db.collection("users").doc(usernameKey);
    const existingUser = await userRef.get();

    if (existingUser.exists) {
      return res.status(409).json({
        error: "Username already exists",
      });
    }

    // Create a Firebase UID
    const userRecord = await auth.createUser({
      displayName: username,
    });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Store user information
    await userRef.set({
      uid: userRecord.uid,
      username: username,
      passwordHash: passwordHash,
      createdAt: new Date().toISOString(),
    });

    // Create Firebase custom token
    const token = await auth.createCustomToken(userRecord.uid, {
      username: username,
    });

    return res.status(201).json({
      message: "Account created successfully",
      token: token,
      username: username,
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      error: "Unable to create account",
    });
  }
};
