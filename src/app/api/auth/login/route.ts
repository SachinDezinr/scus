import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql, ensureTablesExist } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp, isValidEmail, sanitizeUserPayload } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Rate limit: Max 5 login attempts per 15 minutes per IP
    const rateCheck = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
    if (!rateCheck.success && rateCheck.response) {
      return rateCheck.response;
    }

    await ensureTablesExist();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
    }

    const users = await sql`
      SELECT * FROM users WHERE email = ${cleanEmail} LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
    }

    const user = users[0];
    const valid = await bcrypt.compare(String(password), user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const safeUser = sanitizeUserPayload(user);

    return NextResponse.json({
      user: { id: safeUser.id, email: safeUser.email, name: safeUser.name, role: safeUser.role },
      token,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}