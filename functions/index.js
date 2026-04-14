const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { Resend } = require("resend");
const crypto = require("crypto");

initializeApp();
const db = getFirestore();
const resend = new Resend("re_BryHqghP_GKRMqdYeZE3MipABv1roAjMz");

const AUDIENCE_ID = "07ea7778-9d16-4c98-af51-2c2543b88c9b";
const SITE_URL = "https://flvx.ai";
const FROM_EMAIL = "FLVX <waitlist@flvx.ai>"; // requires flvx.ai verified in Resend
const TALLY_FORM_URL = "TALLY_PLACEHOLDER"; // replace with your Tally form URL
const INSTAGRAM_URL = "https://instagram.com/flvx_ai";

const CORS_ORIGINS = [
  "https://flvx-ai.web.app",
  "https://flvx.ai",
  "https://flvx-ai.firebaseapp.com",
];

// ── Subscribe: store pending signup + send opt-in email ──
exports.subscribe = onRequest({ cors: CORS_ORIGINS }, async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, ref } = req.body;
  if (!email || !email.includes("@")) return res.status(400).json({ error: "Valid email required" });

  const emailLower = email.toLowerCase().trim();
  const docRef = db.collection("signups").doc(emailLower);
  const existing = await docRef.get();

  if (existing.exists) {
    if (existing.data().confirmed) {
      return res.status(200).json({ success: true });
    }
    // Resend opt-in email if not yet confirmed
    await sendOptInEmail(emailLower, existing.data().token);
    return res.status(200).json({ success: true });
  }

  const token = crypto.randomBytes(32).toString("hex");

  await docRef.set({
    email: emailLower,
    token,
    referredBy: ref || null,
    confirmed: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  await sendOptInEmail(emailLower, token);
  return res.status(200).json({ success: true });
});

// ── Confirm: validate token, assign position, send welcome email ──
exports.confirm = onRequest({ cors: true }, async (req, res) => {
  const { token } = req.query;
  if (!token) return res.redirect(`${SITE_URL}?confirmed=error`);

  const snapshot = await db.collection("signups").where("token", "==", token).limit(1).get();
  if (snapshot.empty) return res.redirect(`${SITE_URL}?confirmed=error`);

  const doc = snapshot.docs[0];
  const data = doc.data();

  if (data.confirmed) {
    return res.redirect(`${SITE_URL}?confirmed=already&position=${data.position}`);
  }

  // Assign waitlist position atomically
  const counterRef = db.collection("meta").doc("counter");
  const position = await db.runTransaction(async (t) => {
    const counter = await t.get(counterRef);
    const next = (counter.exists ? counter.data().count : 0) + 1;
    t.set(counterRef, { count: next }, { merge: true });
    return next;
  });

  const referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();

  await doc.ref.update({
    confirmed: true,
    confirmedAt: FieldValue.serverTimestamp(),
    position,
    referralCode,
  });

  // Add to Resend audience
  await resend.contacts.create({ email: data.email, audienceId: AUDIENCE_ID });

  // Credit referrer
  if (data.referredBy) {
    const referrerSnap = await db
      .collection("signups")
      .where("referralCode", "==", data.referredBy)
      .limit(1)
      .get();
    if (!referrerSnap.empty) {
      await referrerSnap.docs[0].ref.update({ referralCount: FieldValue.increment(1) });
    }
  }

  await sendWelcomeEmail(data.email, position, referralCode);

  return res.redirect(`${SITE_URL}?confirmed=true&position=${position}&ref=${referralCode}`);
});

// ── Emails ──

async function sendOptInEmail(email, token) {
  const confirmUrl = `${SITE_URL}/confirm?token=${token}`;
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Confirm your spot on the FLVX waitlist",
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:48px 24px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <tr><td style="padding-bottom:32px;">
    <span style="font-family:Arial Black,sans-serif;font-size:22px;font-weight:900;letter-spacing:0.15em;color:#fff;">FLVX</span>
  </td></tr>
  <tr><td style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:48px 40px;">
    <p style="font-size:24px;font-weight:700;color:#fff;margin:0 0 16px;">One step away.</p>
    <p style="font-size:16px;color:rgba(255,255,255,0.6);line-height:1.6;margin:0 0 32px;">
      Confirm your email to secure your place on the FLVX waitlist.
    </p>
    <a href="${confirmUrl}" style="display:inline-block;background:#007aff;color:#fff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.05em;padding:16px 36px;border-radius:100px;">
      CONFIRM MY SPOT
    </a>
    <p style="font-size:13px;color:rgba(255,255,255,0.3);margin:32px 0 0;line-height:1.6;">
      If you didn't sign up for FLVX, you can ignore this email.
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
  });
}

async function sendWelcomeEmail(email, position, referralCode) {
  const referralUrl = `${SITE_URL}?ref=${referralCode}`;
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `You're #${position} on the FLVX waitlist`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:48px 24px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <tr><td style="padding-bottom:32px;">
    <span style="font-family:Arial Black,sans-serif;font-size:22px;font-weight:900;letter-spacing:0.15em;color:#fff;">FLVX</span>
  </td></tr>
  <tr><td style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:48px 40px;">
    <p style="font-size:13px;font-family:monospace;letter-spacing:0.2em;color:#007aff;text-transform:uppercase;margin:0 0 12px;">You're in</p>
    <p style="font-size:32px;font-weight:800;color:#fff;margin:0 0 8px;">#${position}</p>
    <p style="font-size:16px;color:rgba(255,255,255,0.6);line-height:1.6;margin:0 0 32px;">
      You're on the FLVX waitlist. Welcome.
    </p>

    <p style="font-size:13px;font-family:monospace;letter-spacing:0.2em;color:rgba(255,255,255,0.4);text-transform:uppercase;margin:0 0 12px;">How it works</p>
    <p style="font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;margin:0 0 32px;">
      We onboard artists in waves as cohorts form. Each cohort gets access to FLVX tools, distribution, and our A&R pipeline. The more engaged you are, the better your chances of making the next wave.
    </p>

    <p style="font-size:13px;font-family:monospace;letter-spacing:0.2em;color:rgba(255,255,255,0.4);text-transform:uppercase;margin:0 0 16px;">Increase your chances</p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr><td>
        <a href="${INSTAGRAM_URL}" style="display:inline-block;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.08em;padding:14px 28px;border-radius:100px;">
          FOLLOW @FLVX_AI
        </a>
      </td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr><td>
        <a href="${TALLY_FORM_URL}" style="display:inline-block;background:#007aff;color:#fff;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.08em;padding:14px 28px;border-radius:100px;">
          COMPLETE YOUR PROFILE
        </a>
      </td></tr>
    </table>

    <div style="background:rgba(0,122,255,0.08);border:1px solid rgba(0,122,255,0.2);border-radius:14px;padding:24px;">
      <p style="font-size:13px;font-family:monospace;letter-spacing:0.15em;color:#007aff;text-transform:uppercase;margin:0 0 8px;">Your referral link</p>
      <p style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;margin:0 0 12px;">
        Know someone who makes electronic music? Share your link — they'll jump the queue.
      </p>
      <p style="font-size:13px;font-family:monospace;color:rgba(255,255,255,0.5);margin:0;word-break:break-all;">${referralUrl}</p>
    </div>
  </td></tr>
  <tr><td style="padding-top:24px;">
    <p style="font-size:12px;color:rgba(255,255,255,0.2);text-align:center;margin:0;">
      FLVX Music · London · <a href="${SITE_URL}" style="color:rgba(255,255,255,0.3);">flvx.ai</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
  });
}
