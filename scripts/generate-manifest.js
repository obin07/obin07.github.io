const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '..', 'images');
const out = path.join(__dirname, '..', 'images.json');

const exts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

const files = fs.readdirSync(imagesDir).filter(f => exts.includes(path.extname(f).toLowerCase()));

const manifest = files.map(f => ({
  file: f,
  alt: path.basename(f, path.extname(f)).replace(/[-_]/g, ' ')
}));

fs.writeFileSync(out, JSON.stringify(manifest, null, 2));
console.log('Wrote', out);
