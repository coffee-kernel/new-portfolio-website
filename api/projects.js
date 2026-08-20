// api/projects.js
// Vercel Serverless Function — GET /api/projects
// Returns the list of portfolio projects as JSON.
// No external dependencies required — runs on Vercel's Node.js runtime out of the box.

const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  // Basic security headers for this endpoint
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'projects.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const projects = JSON.parse(raw);

    const { featured } = req.query || {};
    const result =
      featured === 'true' ? projects.filter((p) => p.featured) : projects;

    return res.status(200).json({ count: result.length, projects: result });
  } catch (err) {
    console.error('Error loading projects:', err);
    return res.status(500).json({ error: 'Unable to load projects' });
  }
};
