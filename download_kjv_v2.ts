import fs from 'fs';
import https from 'https';
import path from 'path';

// A reliable source for KJV in TXT format from Open Bible.
const sources = [
  'https://www.openbible.info/data/kjv.txt',
  'https://raw.githubusercontent.com/OpenBibleInfo/Bible-Data/master/kjv.txt',
  'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json'
];
const outputPath = path.join(process.cwd(), 'public', 'kjv.txt');

// Ensure assets directory exists
const assetsDir = path.join(process.cwd(), 'src', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

function cleanVerseText(text: string): string {
  return text || '';
}

function download(sourceIndex: number = 0) {
  if (sourceIndex >= sources.length) {
    console.error('All sources failed.');
    process.exit(1);
  }

  const url = sources[sourceIndex];
  console.log(`Attempting to download KJV from ${url}...`);

  https.get(url, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      console.log(`Redirecting to ${res.headers.location}`);
      downloadFromUrl(res.headers.location!, sourceIndex);
      return;
    }

    if (res.statusCode !== 200) {
      console.warn(`Source ${url} returned status ${res.statusCode}. Trying next source...`);
      download(sourceIndex + 1);
      return;
    }

    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      try {
        // Strip BOM if present
        if (body.charCodeAt(0) === 0xFEFF) {
          body = body.slice(1);
        }

        let plainText = '';
        if (url.endsWith('.txt')) {
          const lines = body.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            // Format: Book Chapter:Verse Text
            const match = trimmed.match(/^(.+)\s(\d+):(\d+)\s(.*)$/);
            if (match) {
              const bookName = match[1].trim();
              const chapter = match[2];
              const verse = match[3];
              const text = cleanVerseText(match[4]);
              if (text) {
                plainText += `${bookName} ${chapter}:${verse} ${text}\n`;
              }
            }
          }
        } else {
          // JSON format (thiagobodruk)
          const data = JSON.parse(body);
          if (Array.isArray(data)) {
            data.forEach((book: any) => {
              const bookName = book.name;
              book.chapters.forEach((chapter: any[], cIdx: number) => {
                chapter.forEach((verseText: string, vIdx: number) => {
                  const cleaned = cleanVerseText(verseText);
                  if (cleaned) {
                    plainText += `${bookName} ${cIdx + 1}:${vIdx + 1} ${cleaned}\n`;
                  }
                });
              });
            });
          }
        }

        if (plainText) {
          fs.writeFileSync(outputPath, plainText);
          console.log(`Download and conversion complete from ${url}.`);
          const stats = fs.statSync(outputPath);
          console.log(`File size: ${stats.size} bytes`);
          console.log('First 5 lines of downloaded file:');
          console.log(plainText.split('\n').slice(0, 5).join('\n'));
        } else {
          throw new Error('No verses parsed from this source.');
        }
      } catch (err: any) {
        console.warn(`Error processing source ${url}: ${err.message}. Trying next source...`);
        download(sourceIndex + 1);
      }
    });
  }).on('error', (err) => {
    console.warn(`Error downloading from ${url}: ${err.message}. Trying next source...`);
    download(sourceIndex + 1);
  });
}

function downloadFromUrl(url: string, sourceIndex: number) {
  https.get(url, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      downloadFromUrl(res.headers.location!, sourceIndex);
      return;
    }
    // ... rest of the logic is similar, but for simplicity I'll just use the main download function
    // Actually, I should just make download take a URL directly.
  });
}

// Refactoring to be cleaner
function startDownload(sourceIndex: number = 0) {
  if (sourceIndex >= sources.length) {
    console.error('All sources failed.');
    process.exit(1);
  }

  const url = sources[sourceIndex];
  console.log(`Attempting to download KJV from ${url}...`);

  const handleResponse = (res: any) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      https.get(res.headers.location, handleResponse).on('error', (err) => {
        console.warn(`Error on redirect: ${err.message}. Trying next source...`);
        startDownload(sourceIndex + 1);
      });
      return;
    }

    if (res.statusCode !== 200) {
      console.warn(`Source ${url} returned status ${res.statusCode}. Trying next source...`);
      startDownload(sourceIndex + 1);
      return;
    }

    let body = '';
    res.on('data', (chunk: any) => { body += chunk; });
    res.on('end', () => {
      try {
        if (body.charCodeAt(0) === 0xFEFF) body = body.slice(1);
        let plainText = '';
        if (url.endsWith('.txt')) {
          const lines = body.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            const match = trimmed.match(/^(.+)\s(\d+):(\d+)\s(.*)$/);
            if (match) {
              const text = cleanVerseText(match[4]);
              if (text) plainText += `${match[1].trim()} ${match[2]}:${match[3]} ${text}\n`;
            }
          }
        } else {
          const data = JSON.parse(body);
          if (Array.isArray(data)) {
            data.forEach((book: any) => {
              book.chapters.forEach((chapter: any[], cIdx: number) => {
                chapter.forEach((verseText: string, vIdx: number) => {
                  const cleaned = cleanVerseText(verseText);
                  if (cleaned) plainText += `${book.name} ${cIdx + 1}:${vIdx + 1} ${cleaned}\n`;
                });
              });
            });
          }
        }
        if (plainText) {
          fs.writeFileSync(outputPath, plainText);
          console.log(`Success from ${url}. Size: ${fs.statSync(outputPath).size} bytes`);
        } else {
          throw new Error('No verses parsed.');
        }
      } catch (err: any) {
        console.warn(`Error: ${err.message}. Trying next...`);
        startDownload(sourceIndex + 1);
      }
    });
  };

  https.get(url, handleResponse).on('error', (err) => {
    console.warn(`Error: ${err.message}. Trying next...`);
    startDownload(sourceIndex + 1);
  });
}

startDownload(0);
