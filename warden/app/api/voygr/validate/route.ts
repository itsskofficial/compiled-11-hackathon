/**
 * Vendor validation before dispatch, through VOYGR.
 *
 * The key stays server-side. The verdict is rendered in the dashboard and printed
 * in the evidence report's action log.
 */

import { NextResponse } from 'next/server';
import { validateBusiness } from '@/lib/voygr';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { name, address } = (await req.json().catch(() => ({}))) as {
    name?: string;
    address?: string;
  };

  if (!name) {
    return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 });
  }

  const verdict = await validateBusiness(name, address ?? '');
  return NextResponse.json({ ok: true, verdict });
}
