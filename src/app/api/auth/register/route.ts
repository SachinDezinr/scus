import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql, ensureTablesExist } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp, isValidEmail, sanitizeText, sanitizeUserPayload } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Rate limit: Max 3 registration attempts per 15 minutes per IP
    const rateCheck = checkRateLimit(`register:${ip}`, 3, 15 * 60 * 1000);
    if (!rateCheck.success && rateCheck.response) {
      return rateCheck.response;
    }

    await ensureTablesExist();

    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = sanitizeText(String(name));

    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (String(password).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (cleanName.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${cleanEmail} LIMIT 1`;

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Hash password with salt round 12
    const password_hash = await bcrypt.hash(String(password), 12);

    // Explicitly lock role to 'user' to prevent role-tampering
    const [newUser] = await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (${cleanEmail}, ${password_hash}, ${cleanName}, 'user')
      RETURNING id, email, name, role
    `;

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    return NextResponse.json({ user: newUser, token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}