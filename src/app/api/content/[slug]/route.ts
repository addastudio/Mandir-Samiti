import { NextResponse } from 'next/server';
import { getLocalCmsContent, getAllSevaPrograms } from '@/lib/cms';

/**
 * Generic API route to serve CMS JSON content to the frontend.
 * Usage: /api/content/hero, /api/content/about, /api/content/seva
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    // Special case for Seva which is a directory of files
    if (slug === 'seva') {
      const programs = await getAllSevaPrograms();
      return NextResponse.json(programs);
    }

    // Standard case for single JSON files
    const content = await getLocalCmsContent(`${slug}.json`);
    return NextResponse.json(content || {});
  } catch (error) {
    return NextResponse.json({ error: `Failed to load ${slug}` }, { status: 500 });
  }
}
