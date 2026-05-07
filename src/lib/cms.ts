/**
 * Utility for loading and parsing JSON content from the /content folder
 * managed by Decap CMS.
 */

import fs from 'fs';
import path from 'path';

const contentDirectory = path.join(process.cwd(), 'content');

export async function getLocalCmsContent(fileName: string) {
  try {
    const fullPath = path.join(contentDirectory, fileName);
    if (!fs.existsSync(fullPath)) return null;
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(fileContents);
  } catch (e) {
    console.error(`CMS Fetch Error (${fileName}):`, e);
    return null;
  }
}

export async function getAllSevaPrograms() {
  try {
    const sevaDir = path.join(contentDirectory, 'seva');
    if (!fs.existsSync(sevaDir)) return [];
    const files = fs.readdirSync(sevaDir);
    return files.map(file => {
      const content = fs.readFileSync(path.join(sevaDir, file), 'utf8');
      return JSON.parse(content);
    });
  } catch (e) {
    return [];
  }
}
