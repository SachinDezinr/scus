import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Map userId -> id for consistency with login response
  return NextResponse.json({
    user: {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    }
  });
}
