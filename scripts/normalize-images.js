const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '..', 'images');

const files = fs.readdirSync(imagesDir, { withFileTypes: true });

for (const f of files) {
  if (!f.isFile()) continue;
  const oldName = f.name;
  const newName = oldName.toLowerCase();
  if (oldName === newName) continue;
  const oldPath = path.join(imagesDir, oldName);
  const newPath = path.join(imagesDir, newName);
  if (fs.existsSync(newPath)) {
    // On case-insensitive filesystems (Windows) a case-only change needs a temp rename
    if (oldPath.toLowerCase() === newPath.toLowerCase()) {
      const tempPath = path.join(imagesDir, `${newName}.renametmp${Date.now()}`);
      fs.renameSync(oldPath, tempPath);
      fs.renameSync(tempPath, newPath);
      console.log(`Renamed ${oldName} -> ${newName} (case-only update)`);
    } else {
      console.log(`Skipping ${oldName} -> ${newName} (target exists)`);
    }
    continue;
  }
  fs.renameSync(oldPath, newPath);
  console.log(`Renamed ${oldName} -> ${newName}`);
}

console.log('Normalization complete');
