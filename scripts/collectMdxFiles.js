import fs from 'fs';
import path from 'path';

function collectMdxFiles(dirPath, fileList = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      // Recurse into subdirectory
      collectMdxFiles(entryPath, fileList);
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      fileList.push(entryPath);
    }
  }
  return fileList;
}

export default collectMdxFiles;