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
    console.log("subscribe called with email:", email);

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email required" });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const url = `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`;
      console.log("Calling Resend URL:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, unsubscribed: false }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await response.json();
      console.log("Resend status:", response.status, "body:", JSON.stringify(data));

      if (response.ok) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(500).json({ error: data.message || "Failed to subscribe" });
      }
    } catch (err) {
      clearTimeout(timeout);
      console.error("Error calling Resend:", err.name, err.message);
      return res.status(500).json({ error: "Internal error" });
    }
  }
);
