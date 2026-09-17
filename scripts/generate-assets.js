const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesDir = path.join(__dirname, '..', 'images');
const outDir = path.join(imagesDir, 'optimized');
const manifestPath = path.join(__dirname, '..', 'images.json');
const sizes = [400, 800, 1200, 2000];

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function processImage(file) {
  const name = path.basename(file, path.extname(file));
  const ext = '.jpg';
  const srcset = [];
  const webpSet = [];

  for (const w of sizes) {
    const outJ = path.join(outDir, `${name}-${w}.jpg`);
    const outW = path.join(outDir, `${name}-${w}.webp`);
    await sharp(path.join(imagesDir, file))
      .resize({ width: w })
      .jpeg({ quality: 80 })
      .toFile(outJ);
    await sharp(path.join(imagesDir, file))
      .resize({ width: w })
      .webp({ quality: 75 })
      .toFile(outW);
    srcset.push(`./images/optimized/${name}-${w}.jpg ${w}w`);
    webpSet.push(`./images/optimized/${name}-${w}.webp ${w}w`);
  }

  return {
    file,
    display: `./images/optimized/${name}-${sizes[sizes.length-1]}.jpg`,
    srcset: srcset.join(', '),
    webpSrcset: webpSet.join(', '),
  };
}

(async () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (let i = 0; i < manifest.length; i++) {
    const entry = manifest[i];
    try {
      const out = await processImage(entry.file);
      manifest[i] = Object.assign({}, entry, out, {
        caption: entry.caption || '',
        captionNe: entry.captionNe || '',
        sizes: '(min-width: 900px) 60vw, 100vw'
      });
      console.log('Processed', entry.file);
    } catch (e) {
      console.error('Failed', entry.file, e);
    }
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('Updated manifest:', manifestPath);
})();
