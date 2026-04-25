/**
 * Utility for loading and parsing Markdown content from the /content folder.
 * This can be used in Next.js Server Components or getStaticProps.
 */

import fs from 'fs';
import path from 'path';

const contentDirectory = path.join(process.cwd(), 'content');

export interface CMSContent {
  data: any;
  content: string;
}

/**
 * Gets the data from a specific markdown file.
 * Requires 'gray-matter' to be installed for parsing frontmatter.
 */
export async function getContentBySlug(folder: string, slug: string): Promise<CMSContent | null> {
  try {
    const fullPath = path.join(contentDirectory, folder, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    
    // Using a simple split for now to avoid dependency errors 
    // if gray-matter isn't added to package.json yet.
    // In production, recommend adding gray-matter.
    const parts = fileContents.split('---');
    const frontmatterRaw = parts[1] || "";
    const content = parts.slice(2).join('---').trim();
    
    const data: Record<string, string> = {};
    frontmatterRaw.split('\n').forEach(line => {
      const [key, ...val] = line.split(':');
      if (key && val) data[key.trim()] = val.join(':').trim();
    });

    return {
      data,
      content,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Lists all posts/notices in a folder.
 */
export async function getAllFromFolder(folder: string) {
  const dir = path.join(contentDirectory, folder);
  if (!fs.existsSync(dir)) return [];
  
  const files = fs.readdirSync(dir);
  return files.map(file => file.replace(/\.md$/, ''));
}
