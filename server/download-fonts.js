const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap';

// Set User-Agent so Google Fonts serves woff2 formats
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function downloadFonts() {
  const fontsDir = path.join(__dirname, 'public', 'fonts');
  const publicDir = path.join(__dirname, 'public');

  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
  }

  console.log('Downloading Google Fonts CSS...');
  try {
    const res = await fetch(GOOGLE_FONTS_URL, {
      headers: { 'User-Agent': USER_AGENT }
    });

    if (!res.ok) {
      throw new Error(`Google Fonts returned HTTP ${res.status}`);
    }

    let cssContent = await res.text();
    console.log('Google Fonts CSS downloaded. Extracting font files...');

    // Regex to match URLs: url(https://fonts.gstatic.com/s/...)
    const urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/s\/[^)]+)\)/g;
    let match;
    const downloadQueue = [];

    while ((match = urlRegex.exec(cssContent)) !== null) {
      const remoteUrl = match[1];
      const fileName = path.basename(remoteUrl);
      const localPath = path.join(fontsDir, fileName);
      const localUrl = `fonts/${fileName}`;

      downloadQueue.push({ remoteUrl, localPath, localUrl });
    }

    console.log(`Found ${downloadQueue.length} font files to download.`);

    // Download each font file and rewrite CSS content
    for (const item of downloadQueue) {
      if (!fs.existsSync(item.localPath)) {
        console.log(`Downloading ${path.basename(item.remoteUrl)}...`);
        const fontRes = await fetch(item.remoteUrl);
        if (!fontRes.ok) {
          throw new Error(`Failed to download font: ${item.remoteUrl}`);
        }
        const buffer = await fontRes.buffer();
        fs.writeFileSync(item.localPath, buffer);
      } else {
        console.log(`Font ${path.basename(item.remoteUrl)} already exists, skipping.`);
      }

      // Replace remote URL with local path in CSS
      cssContent = cssContent.replaceAll(item.remoteUrl, item.localUrl);
    }

    // Save final CSS file
    const cssPath = path.join(publicDir, 'fonts.css');
    fs.writeFileSync(cssPath, cssContent, 'utf8');
    console.log(`Local fonts.css generated at: ${cssPath}`);
    console.log('Font download completed successfully!');
  } catch (error) {
    console.error('Failed to download fonts:', error);
    process.exit(1);
  }
}

downloadFonts();
