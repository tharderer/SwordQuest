import fs from 'fs';
import https from 'https';
import path from 'path';

// Another common source for plain text KJV.
const url = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/king_james_version.txt';
const outputPath = path.join(process.cwd(), 'src', 'assets', 'kjv.txt');

// Ensure assets directory exists
const assetsDir = path.join(process.cwd(), 'src', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log(`Downloading clean KJV from ${url}...`);

function download(url: string) {
  https.get(url, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      console.log(`Redirecting to ${res.headers.location}`);
      download(res.headers.location!);
      return;
    }

    if (res.statusCode !== 200) {
      console.error(`Failed to download: ${res.statusCode}`);
      process.exit(1);
    }

    const file = fs.createWriteStream(outputPath);
    res.pipe(file);

    file.on('finish', () => {
      file.close();
      console.log('Download complete.');
      const stats = fs.statSync(outputPath);
      console.log(`File size: ${stats.size} bytes`);
      
      // Peek at the first few lines
      const data = fs.readFileSync(outputPath, 'utf8');
      console.log('First 5 lines of downloaded file:');
      console.log(data.split('\n').slice(0, 5).join('\n'));
    });
  }).on('error', (err) => {
    console.error('Error downloading KJV:', err.message);
    process.exit(1);
  });
}

download(url);
