import { NextRequest, NextResponse } from 'next/server';
import { sql, ensureTablesExist } from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp, sanitizeText, validateUploadedFile } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`complaint_create:${user.userId}:${ip}`, 10, 60 * 1000);
    if (!rateCheck.success && rateCheck.response) return rateCheck.response;

    await ensureTablesExist();

    const formData = await req.formData();
    const item_name = sanitizeText(formData.get('item_name') as string);
    const class_name = sanitizeText(formData.get('class_name') as string);
    const department = sanitizeText(formData.get('department') as string);
    const floor = sanitizeText(formData.get('floor') as string);
    const description = sanitizeText(formData.get('description') as string);
    const rawPriority = sanitizeText((formData.get('priority') as string) || 'medium');
    const photo = formData.get('photo') as File | null;

    if (!item_name || !class_name || !department || !floor || !description) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const priority = ['low', 'medium', 'high', 'urgent'].includes(rawPriority) ? rawPriority : 'medium';

    // File validation: Image files only, max 5MB
    if (photo && photo.size > 0) {
      const fileCheck = validateUploadedFile(photo, {
        maxSizeMB: 5,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
      if (!fileCheck.valid) {
        return NextResponse.json({ error: fileCheck.error }, { status: 400 });
      }
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
    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureTablesExist();

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
    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureTablesExist();

    const body = await req.json();
    const { id, status, priority, item_name, class_name, department, floor, description } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    if (status !== undefined) {
      if (user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      const cleanStatus = sanitizeText(status);
      if (!['pending', 'in progress', 'resolved'].includes(cleanStatus)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
      const [updated] = await sql`
        UPDATE complaints SET status = ${cleanStatus} WHERE id = ${id} RETURNING *
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
        item_name = COALESCE(${item_name ? sanitizeText(item_name) : null}, item_name),
        class_name = COALESCE(${class_name ? sanitizeText(class_name) : null}, class_name),
        department = COALESCE(${department ? sanitizeText(department) : null}, department),
        floor = COALESCE(${floor ? sanitizeText(floor) : null}, floor),
        description = COALESCE(${description ? sanitizeText(description) : null}, description),
        priority = COALESCE(${priority ? sanitizeText(priority) : null}, priority)
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
    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureTablesExist();

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