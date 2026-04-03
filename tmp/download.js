const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/kjv/kjv.txt';
const dest = path.join(process.cwd(), 'public', 'kjv_full.txt');

console.log(`Downloading from ${url} to ${dest}...`);

const file = fs.createWriteStream(dest);
https.get(url, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to download: ${response.statusCode}`);
    process.exit(1);
  }
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download complete.');
    process.exit(0);
  });
}).on('error', (err) => {
  fs.unlink(dest, () => {});
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
