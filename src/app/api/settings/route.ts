import { NextResponse } from 'next/server';
import { getLocalCmsContent } from '@/lib/cms';

/**
 * API route to serve CMS settings to Client Components.
 * This bypasses the issue of the 'content' directory not being public.
 */
export async function GET() {
  try {
    const settings = await getLocalCmsContent('settings.json');
    return NextResponse.json(settings || {});
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}
