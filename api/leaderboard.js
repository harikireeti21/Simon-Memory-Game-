const { auth, db } = require("./firebaseAdmin");

// =========================================================
// LEADERBOARD API
// =========================================================

module.exports = async (req, res) => {
  // =======================================================
  // GET TOP 20
  // Anyone can view the global leaderboard
  // =======================================================

  if (req.method === "GET") {
    try {
      const snapshot = await db
        .collection("scores")
        .orderBy("score", "desc")
        .limit(20)
        .get();

      const scores = snapshot.docs.map((doc) => {
        const data = doc.data();

        let timestamp = Date.now();

        if (data.createdAt) {
          if (typeof data.createdAt.toMillis === "function") {
            timestamp = data.createdAt.toMillis();
          } else if (data.createdAt._seconds) {
            timestamp = data.createdAt._seconds * 1000;
          }
        }

        return {
          id: doc.id,
          name: data.username || "OPERATOR",
          score: data.score,
          timestamp: timestamp,
        };
      });

      return res.status(200).json(scores);
    } catch (error) {
      console.error("Leaderboard GET error:", error);

      return res.status(500).json({
        error: "Unable to load leaderboard",
      });
    }
  }

  // =======================================================
  // POST SCORE
  // Only logged-in users can submit scores
  // =======================================================

  if (req.method === "POST") {
    try {
      // -------------------------------------------------
      // Get Firebase ID token
      // -------------------------------------------------

      const authHeader = req.headers.authorization || "";

      if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          error: "Authentication required",
        });
      }

      const idToken = authHeader.substring(7);

      // -------------------------------------------------
      // Verify token
      // -------------------------------------------------

      const decodedToken = await auth.verifyIdToken(idToken);

      const uid = decodedToken.uid;

      const username = decodedToken.username || decodedToken.name || "OPERATOR";

      // -------------------------------------------------
      // Get score
      // -------------------------------------------------

      const score = Number(req.body.score);

      if (!Number.isInteger(score) || score <= 0 || score > 10000) {
        return res.status(400).json({
          error: "Invalid score",
        });
      }

      // -------------------------------------------------
      // Save score to Firestore
      // -------------------------------------------------

      const scoreRef = await db.collection("scores").add({
        uid: uid,

        username: username,

        score: score,

        createdAt: new Date(),
      });

      return res.status(201).json({
        message: "Score saved successfully",

        id: scoreRef.id,

        name: username,

        score: score,
      });
    } catch (error) {
      console.error("Leaderboard POST error:", error);

      return res.status(401).json({
        error: "Unable to save score",
      });
    }
  }

  // =======================================================
  // OTHER METHODS
  // =======================================================

  return res.status(405).json({
    error: "Method not allowed",
  });
};
