const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '..', 'images');
const out = path.join(__dirname, '..', 'images.json');

const exts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const existing = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : [];
const existingByFile = new Map(existing.map(entry => [entry.file, entry]));

const files = fs.readdirSync(imagesDir).filter(f => exts.includes(path.extname(f).toLowerCase()));

const manifest = files.map(f => {
  const previous = existingByFile.get(f) || {};
  return {
    file: f,
    alt: previous.alt || path.basename(f, path.extname(f)).replace(/[-_]/g, ' '),
    caption: previous.caption || '',
    captionNe: previous.captionNe || ''
  };
});

fs.writeFileSync(out, JSON.stringify(manifest, null, 2));
console.log('Wrote', out);
