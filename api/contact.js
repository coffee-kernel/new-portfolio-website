// api/contact.js
// Vercel Serverless Function — POST /api/contact
// Validates and processes contact form submissions.
//
// Email delivery (optional): if a RESEND_API_KEY environment variable is set,
// this function will forward the message via the Resend HTTPS API using the
// built-in fetch — no extra npm package required. Without the key, submissions
// are simply validated and logged, so the endpoint works out of the box.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Extremely small in-memory rate limiter (per serverless instance).
// For production-grade rate limiting, use Vercel Edge Config/KV or a service like Upstash.
const submissions = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = submissions.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_LIMIT_WINDOW_MS) {
    submissions.set(ip, { count: 1, start: now });
    return false;
  }
  entry.count += 1;
  submissions.set(ip, entry);
  return entry.count > RATE_LIMIT_MAX;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ip =
    req.headers['x-forwarded-for']?.toString().split(',')[0] ||
    req.socket?.remoteAddress ||
    'unknown';

  if (isRateLimited(ip)) {
    return res
      .status(429)
      .json({ error: 'Too many requests. Please try again in a minute.' });
  }

  try {
    const { name, email, message, company } = req.body || {};

    // Honeypot field — bots tend to fill every input, humans never see/fill "company".
    if (company) {
      return res.status(200).json({ success: true });
    }

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
      return res.status(400).json({ error: 'Please provide a valid name.' });
    }
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (typeof message !== 'string' || message.trim().length < 10 || message.length > 2000) {
      return res.status(400).json({ error: 'Message must be between 10 and 2000 characters.' });
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      receivedAt: new Date().toISOString(),
    };

    const apiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL;

    if (apiKey && toEmail) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Portfolio Contact Form <onboarding@resend.dev>',
          to: [toEmail],
          reply_to: payload.email,
          subject: `New portfolio message from ${payload.name}`,
          text: `From: ${payload.name} (${payload.email})\n\n${payload.message}`,
        }),
      });

      if (!emailResponse.ok) {
        const errBody = await emailResponse.text();
        console.error('Resend API error:', errBody);
        // Don't fail the whole request just because the email provider hiccupped.
      }
    } else {
      // No email provider configured — log so the submission isn't silently lost.
      console.log('Contact form submission (no email provider configured):', payload);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error processing contact submission:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};
