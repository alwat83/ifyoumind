const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Base URL of your website
const BASE_URL = 'https://ifyoumind.com';

// Path to your service account key
// IMPORTANT: Make sure this path is correct and the file is not publicly accessible.
// You can also use environment variables for better security.
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Initialized Firebase Admin with service account from environment variable.');
  } else {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Initialized Firebase Admin with serviceAccountKey.json file.');
  }
} catch (error) {
    console.error('ERROR: Firebase Admin SDK initialization failed.');
    console.error('Please ensure you have either set the FIREBASE_SERVICE_ACCOUNT environment variable or have a valid serviceAccountKey.json file in the root directory.');
    console.error('Original error:', error);
    process.exit(1);
}


const db = admin.firestore();

async function generateSitemap() {
  console.log('Generating sitemap...');

  const urls = new Set();

  // 1. Add static routes
  urls.add(`${BASE_URL}/`);
  urls.add(`${BASE_URL}/profile`);
  urls.add(`${BASE_URL}/about`);
  urls.add(`${BASE_URL}/mission`);
  urls.add(`${BASE_URL}/faq`);
  urls.add(`${BASE_URL}/newbie-ideas`);
  // Add other static pages if you have them

  // 2. Add dynamic routes from Firestore (public ideas)
  try {
    const ideasSnapshot = await db.collection('ideas').where('isPublic', '==', true).get();
    ideasSnapshot.forEach(doc => {
      urls.add(`${BASE_URL}/idea/${doc.id}`);
    });
    console.log(`Added ${ideasSnapshot.size} public idea URLs.`);
  } catch (error) {
    console.error('Error fetching ideas from Firestore:', error);
    // Don't exit, we can still generate a sitemap with static URLs
  }
  

  // 3. Build the XML
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...urls].map(url => `
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>${url.includes('/idea/') ? '0.8' : '1.0'}</priority>
  </url>`).join('')}
</urlset>`;

  // 4. Write the file to the src directory
  const sitemapPath = path.join(__dirname, '..', 'src', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapXml);

  console.log(`Sitemap successfully generated at ${sitemapPath}`);
}

generateSitemap().then(() => {
    process.exit(0);
}).catch(err => {
    console.error('Sitemap generation failed:', err);
    process.exit(1);
});
