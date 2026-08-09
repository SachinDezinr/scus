import { NextRequest, NextResponse } from 'next/server';
import { sql, ensureTablesExist } from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await ensureTablesExist();

    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const uploader_name = formData.get('uploader_name') as string;
    const course_name = formData.get('course_name') as string;
    const subject_name = formData.get('subject_name') as string;
    const tips = formData.get('tips') as string | null;
    const file = formData.get('file') as File | null;

    if (!uploader_name || !course_name || !subject_name || !file) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 5MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || 'application/pdf';
    const file_url = `data:${mime};base64,${buffer.toString('base64')}`;

    const [resource] = await sql`
      INSERT INTO resources (uploader_name, course_name, subject_name, file_url, file_name, tips, user_id)
      VALUES (${uploader_name}, ${course_name}, ${subject_name}, ${file_url}, ${file.name}, ${tips}, ${user.userId})
      RETURNING *
    `;

    return NextResponse.json({ resource });
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

    const { searchParams } = new URL(req.url);
    const course = searchParams.get('course');
    const subject = searchParams.get('subject');

    let resources;
    if (course && subject) {
      resources = await sql`
        SELECT * FROM resources
        WHERE course_name ILIKE ${'%' + course + '%'} AND subject_name ILIKE ${'%' + subject + '%'}
        ORDER BY created_at DESC
      `;
    } else if (course) {
      resources = await sql`
        SELECT * FROM resources
        WHERE course_name ILIKE ${'%' + course + '%'}
        ORDER BY created_at DESC
      `;
    } else if (subject) {
      resources = await sql`
        SELECT * FROM resources
        WHERE subject_name ILIKE ${'%' + subject + '%'}
        ORDER BY created_at DESC
      `;
    } else {
      resources = await sql`SELECT * FROM resources ORDER BY created_at DESC`;
    }

    return NextResponse.json({ resources });
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

    const { id, uploader_name, course_name, subject_name, tips } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await sql`SELECT user_id FROM resources WHERE id = ${id} LIMIT 1`;
    if (existing.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing[0].user_id !== user.userId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [updated] = await sql`
      UPDATE resources SET
        uploader_name = COALESCE(${uploader_name ?? null}, uploader_name),
        course_name = COALESCE(${course_name ?? null}, course_name),
        subject_name = COALESCE(${subject_name ?? null}, subject_name),
        tips = COALESCE(${tips ?? null}, tips)
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ resource: updated });
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

    const existing = await sql`SELECT user_id FROM resources WHERE id = ${id} LIMIT 1`;
    if (existing.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing[0].user_id !== user.userId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql`DELETE FROM resources WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}