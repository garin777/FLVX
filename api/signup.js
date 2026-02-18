module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email, source, city, country } = req.body || {};

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const location = [city, country].filter(Boolean).join(', ') || 'Unknown';

  // Welcome email to the user
  const welcomeRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'FLVX <team@flvx.ai>',
      to: email,
      subject: 'Welcome to FLVX',
      text: "Welcome to the future of the music business. We'll be in touch soon.\n\n— FLVX",
    }),
  });

  if (!welcomeRes.ok) {
    return res.status(500).json({ error: 'Email send failed' });
  }

  // Internal notification to the team
  if (process.env.NOTIFY_EMAIL) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FLVX Waitlist <team@flvx.ai>',
        to: process.env.NOTIFY_EMAIL,
        subject: `New signup: ${email}`,
        text: `Email: ${email}\nLocation: ${location}\nSource: ${source || 'direct'}`,
      }),
    });
  }

  return res.status(200).json({ ok: true });
};
