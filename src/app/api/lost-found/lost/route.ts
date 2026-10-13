import { NextRequest, NextResponse } from 'next/server';
import { sql, ensureTablesExist } from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';
import { validateUploadedFile } from '@/lib/security';

function computeMatchScore(lost: Record<string, string | null>, found: Record<string, string | null>): number {
  let score = 0;
  const maxScore = 100;

  if (lost.brand && found.brand && lost.brand.toLowerCase() === found.brand.toLowerCase()) score += 40;
  if (lost.item_name && found.item_name) {
    const lostName = lost.item_name.toLowerCase();
    const foundName = found.item_name.toLowerCase();
    if (lostName === foundName) score += 30;
    else if (lostName.includes(foundName) || foundName.includes(lostName)) score += 20;
  }
  if (lost.color && found.color && lost.color.toLowerCase() === found.color.toLowerCase()) score += 20;
  if (lost.location && found.location) {
    const lostLoc = lost.location.toLowerCase();
    const foundLoc = found.location.toLowerCase();
    if (lostLoc === foundLoc) score += 10;
    else if (lostLoc.includes(foundLoc) || foundLoc.includes(lostLoc)) score += 5;
  }
  return (score / maxScore) * 100;
}

export async function POST(req: NextRequest) {
  try {
    await ensureTablesExist();

    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const item_name = formData.get('item_name') as string;
    const color = formData.get('color') as string;
    const brand = formData.get('brand') as string | null;
    const location = formData.get('location') as string;
    const remark = formData.get('remark') as string | null;
    const owner_name = formData.get('owner_name') as string;
    const phone = formData.get('phone') as string;
    const image = formData.get('image') as File | null;

    if (!item_name || !color || !location || !owner_name || !phone) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    if (image && image.size > 0) {
      const fileCheck = validateUploadedFile(image, {
        maxSizeMB: 5,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
      if (!fileCheck.valid) {
        return NextResponse.json({ error: fileCheck.error }, { status: 400 });
      }
    }

    let image_url: string | null = null;
    if (image && image.size > 0) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const mime = image.type || 'image/jpeg';
      image_url = `data:${mime};base64,${buffer.toString('base64')}`;
    }

    const [lostItem] = await sql`
      INSERT INTO lost_items (item_name, color, brand, location, remark, owner_name, phone, image_url, user_id)
      VALUES (${item_name}, ${color}, ${brand}, ${location}, ${remark}, ${owner_name}, ${phone}, ${image_url}, ${user.userId}::uuid)
      RETURNING *
    `;

    const foundItems = await sql`SELECT * FROM found_items`;
    let bestMatch = null;
    let bestScore = 0;

    for (const found of foundItems) {
      const score = computeMatchScore(lostItem, found);
      if (score >= 40 && score > bestScore) {
        bestScore = score;
        bestMatch = found;
      }
    }

    if (bestMatch) {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await sql`
        INSERT INTO matched_items (lost_item_id, found_item_id, match_score, lost_item_data, found_item_data, expires_at)
        VALUES (${lostItem.id}::uuid, ${bestMatch.id}::uuid, ${bestScore}, ${JSON.stringify(lostItem)}::jsonb, ${JSON.stringify(bestMatch)}::jsonb, ${expiresAt}::timestamptz)
      `;
    }

    return NextResponse.json({ item: lostItem, match: bestMatch ? { found: bestMatch, score: bestScore } : null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTablesExist();

    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const items = await sql`SELECT * FROM lost_items ORDER BY created_at DESC`;
    return NextResponse.json({ items });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureTablesExist();

    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, item_name, color, brand, location, remark, owner_name, phone } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await sql`SELECT user_id FROM lost_items WHERE id = ${id}::uuid LIMIT 1`;
    if (existing.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing[0].user_id !== user.userId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [updated] = await sql`
      UPDATE lost_items SET
        item_name = COALESCE(${item_name ?? null}, item_name),
        color = COALESCE(${color ?? null}, color),
        brand = COALESCE(${brand ?? null}, brand),
        location = COALESCE(${location ?? null}, location),
        remark = COALESCE(${remark ?? null}, remark),
        owner_name = COALESCE(${owner_name ?? null}, owner_name),
        phone = COALESCE(${phone ?? null}, phone)
      WHERE id = ${id}::uuid
      RETURNING *
    `;

    return NextResponse.json({ item: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureTablesExist();

    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await sql`SELECT user_id FROM lost_items WHERE id = ${id}::uuid LIMIT 1`;
    if (existing.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing[0].user_id !== user.userId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql`DELETE FROM lost_items WHERE id = ${id}::uuid`;
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}