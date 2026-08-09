import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql, ensureTablesExist } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await ensureTablesExist();

    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const [user] = await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (${email.toLowerCase()}, ${password_hash}, ${name}, 'user')
      RETURNING id, email, name, role
    `;

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return NextResponse.json({ user, token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}