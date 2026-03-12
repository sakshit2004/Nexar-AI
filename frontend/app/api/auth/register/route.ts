import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    let kv: Awaited<ReturnType<typeof import('@/lib/kv')['getRedis']>>;
    try {
      const kvModule = await import('@/lib/kv');
      kv = kvModule.getRedis();
    } catch {
      return NextResponse.json(
        { error: 'Registration is not available at this time.' },
        { status: 503 },
      );
    }

    const existing = await kv.hgetall(`user:${normalizedEmail}`);
    if (existing && Object.keys(existing).length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = `user-${crypto.randomUUID()}`;

    await kv.hset(`user:${normalizedEmail}`, {
      id: userId,
      email: normalizedEmail,
      name: String(name).trim(),
      password: hashedPassword,
    });

    await kv.sadd('all-users', normalizedEmail);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
