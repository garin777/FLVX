const { onRequest } = require("firebase-functions/v2/https");
const { Resend } = require("resend");

const resend = new Resend("re_BryHqghP_GKRMqdYeZE3MipABv1roAjMz");
const AUDIENCE_ID = "07ea7778-9d16-4c98-af51-2c2543b88c9b";

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

    try {
      const { data, error } = await resend.contacts.create({
        email,
        audienceId: AUDIENCE_ID,
      });

      if (error) {
        console.error("Resend error:", JSON.stringify(error));
        return res.status(500).json({ error: error.message });
      }

      console.log("Resend success:", JSON.stringify(data));
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Unexpected error:", err.message);
      return res.status(500).json({ error: "Internal error" });
    }
  }
);
