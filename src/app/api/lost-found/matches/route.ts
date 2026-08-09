import { NextRequest, NextResponse } from 'next/server';
import { sql, ensureTablesExist } from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await ensureTablesExist();

    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await sql`DELETE FROM matched_items WHERE expires_at < NOW()`;

    const matches = await sql`SELECT * FROM matched_items ORDER BY created_at DESC`;
    return NextResponse.json({ matches });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}