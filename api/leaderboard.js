const { auth, db } = require("./firebaseAdmin");

// =========================================================
// LEADERBOARD API
// =========================================================

module.exports = async (req, res) => {
  // =======================================================
  // GET REQUEST
  // =======================================================

  if (req.method === "GET") {
    try {
      // =================================================
      // GET CURRENT USER'S PERSONAL BEST
      // /api/leaderboard?mine=true
      // =================================================

      if (req.query && req.query.mine === "true") {
        const authHeader = req.headers.authorization || "";

        if (!authHeader.startsWith("Bearer ")) {
          return res.status(401).json({
            error: "Authentication required",
          });
        }

        const idToken = authHeader.substring(7);

        const decodedToken = await auth.verifyIdToken(idToken);

        const uid = decodedToken.uid;

        // ---------------------------------------------
        // Get all scores belonging to this user
        // ---------------------------------------------

        const snapshot = await db
          .collection("scores")
          .where("uid", "==", uid)
          .get();

        // ---------------------------------------------
        // No scores yet
        // ---------------------------------------------

        if (snapshot.empty) {
          return res.status(200).json({
            bestScore: 0,
          });
        }

        // ---------------------------------------------
        // Find user's highest score
        // ---------------------------------------------

        let bestScore = 0;

        snapshot.docs.forEach((doc) => {
          const data = doc.data();

          const score = Number(data.score);

          if (Number.isInteger(score) && score > bestScore) {
            bestScore = score;
          }
        });

        return res.status(200).json({
          bestScore: bestScore,
        });
      }

      // =================================================
      // GET GLOBAL TOP 20
      // =================================================

      const snapshot = await db
        .collection("scores")
        .orderBy("score", "desc")
        .limit(20)
        .get();

      const scores = snapshot.docs.map((doc) => {
        const data = doc.data();

        let timestamp = Date.now();

        // -------------------------------------
        // Convert Firestore timestamp
        // -------------------------------------

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

          score: Number(data.score),

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
  // =======================================================

  if (req.method === "POST") {
    try {
      // =================================================
      // CHECK LOGIN TOKEN
      // =================================================

      const authHeader = req.headers.authorization || "";

      if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          error: "Authentication required",
        });
      }

      const idToken = authHeader.substring(7);

      // =================================================
      // VERIFY FIREBASE USER
      // =================================================

      const decodedToken = await auth.verifyIdToken(idToken);

      const uid = decodedToken.uid;

      const username = decodedToken.username || decodedToken.name || "OPERATOR";

      // =================================================
      // READ SCORE
      // =================================================

      const score = Number(req.body.score);

      if (!Number.isInteger(score) || score <= 0 || score > 10000) {
        return res.status(400).json({
          error: "Invalid score",
        });
      }

      // =================================================
      // SAVE SCORE TO FIRESTORE
      // =================================================

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
  // METHOD NOT ALLOWED
  // =======================================================

  return res.status(405).json({
    error: "Method not allowed",
  });
};
