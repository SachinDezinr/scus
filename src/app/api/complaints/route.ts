import { NextRequest, NextResponse } from 'next/server';
import { sql, ensureTablesExist } from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await ensureTablesExist();

    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const item_name = formData.get('item_name') as string;
    const class_name = formData.get('class_name') as string;
    const department = formData.get('department') as string;
    const floor = formData.get('floor') as string;
    const description = formData.get('description') as string;
    const priority = (formData.get('priority') as string) || 'medium';
    const photo = formData.get('photo') as File | null;

    if (!item_name || !class_name || !department || !floor || !description) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    let photo_url: string | null = null;
    if (photo && photo.size > 0) {
      const buffer = Buffer.from(await photo.arrayBuffer());
      const mime = photo.type || 'image/jpeg';
      photo_url = `data:${mime};base64,${buffer.toString('base64')}`;
    }

    const [complaint] = await sql`
      INSERT INTO complaints (item_name, class_name, department, floor, description, photo_url, priority, user_id, status)
      VALUES (${item_name}, ${class_name}, ${department}, ${floor}, ${description}, ${photo_url}, ${priority}, ${user.userId}, 'pending')
      RETURNING *
    `;

    return NextResponse.json({ complaint });
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

    let complaints;
    if (user.role === 'admin') {
      complaints = await sql`SELECT * FROM complaints ORDER BY created_at DESC`;
    } else {
      complaints = await sql`SELECT * FROM complaints WHERE user_id = ${user.userId} ORDER BY created_at DESC`;
    }

    return NextResponse.json({ complaints });
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

    const body = await req.json();
    const { id, status, priority, item_name, class_name, department, floor, description } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    if (status !== undefined) {
      if (user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      const [updated] = await sql`
        UPDATE complaints SET status = ${status} WHERE id = ${id} RETURNING *
      `;
      return NextResponse.json({ complaint: updated });
    }

    const existing = await sql`SELECT user_id FROM complaints WHERE id = ${id} LIMIT 1`;
    if (existing.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing[0].user_id !== user.userId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [updated] = await sql`
      UPDATE complaints SET
        item_name = COALESCE(${item_name || null}, item_name),
        class_name = COALESCE(${class_name || null}, class_name),
        department = COALESCE(${department || null}, department),
        floor = COALESCE(${floor || null}, floor),
        description = COALESCE(${description || null}, description),
        priority = COALESCE(${priority || null}, priority)
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ complaint: updated });
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

    const existing = await sql`SELECT user_id FROM complaints WHERE id = ${id} LIMIT 1`;
    if (existing.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing[0].user_id !== user.userId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql`DELETE FROM complaints WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}