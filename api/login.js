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

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
      });
    }

    const usernameKey = username.toLowerCase();

    // Find the user
    const userRef = db.collection("users").doc(usernameKey);
    const userSnapshot = await userRef.get();

    // Use the same message for both cases
    // so we don't reveal whether a username exists.
    if (!userSnapshot.exists) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    const userData = userSnapshot.data();

    // Check password
    const passwordCorrect = await bcrypt.compare(
      password,
      userData.passwordHash,
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    // Create Firebase custom token
    const token = await auth.createCustomToken(userData.uid, {
      username: userData.username,
    });

    return res.status(200).json({
      message: "Login successful",
      token: token,
      username: userData.username,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      error: "Unable to login",
    });
  }
};
