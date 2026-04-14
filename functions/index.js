const { onRequest } = require("firebase-functions/v2/https");

const RESEND_API_KEY = "re_FWnBdwxJ_KR4y6RCYRqsf3BSBw2JPd5Tt";
const RESEND_AUDIENCE_ID = "07ea7778-9d16-4c98-af51-2c2543b88c9b";

exports.subscribe = onRequest(
  { cors: ["https://flvx-ai.web.app", "https://flvx.ai", "https://flvx-ai.firebaseapp.com"] },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email required" });
    }

    const response = await fetch(
      `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      }
    );

    if (response.ok) {
      return res.status(200).json({ success: true });
    } else {
      const err = await response.json();
      return res.status(500).json({ error: err.message || "Failed to subscribe" });
    }
  }
);
