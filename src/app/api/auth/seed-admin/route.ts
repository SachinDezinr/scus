import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql, ensureTablesExist } from '@/lib/db';

export async function POST() {
  try {
    await ensureTablesExist();

    const existing = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json({ message: 'Admin already exists' });
    }

    const password_hash = await bcrypt.hash('Admin@2026', 12);

    await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ('admin@smartstudent.com', ${password_hash}, 'System Admin', 'admin')
    `;

    return NextResponse.json({ message: 'Admin created successfully' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}