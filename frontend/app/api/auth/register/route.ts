import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Invalid input format.' }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: 'Password must include at least one uppercase letter.' }, { status: 400 });
    }
    if (!/[a-z]/.test(password)) {
      return NextResponse.json({ error: 'Password must include at least one lowercase letter.' }, { status: 400 });
    }
    if (!/\d/.test(password)) {
      return NextResponse.json({ error: 'Password must include at least one number.' }, { status: 400 });
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
      return NextResponse.json({ error: 'Password must include at least one special character (!@#$%^&* etc.).' }, { status: 400 });
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

    const trimmedName = String(name).trim();

    await kv.hset(`user:${normalizedEmail}`, {
      id: userId,
      email: normalizedEmail,
      name: trimmedName,
      password: hashedPassword,
    });

    await kv.sadd('all-users', normalizedEmail);

    // Create initial profile with signup data so profile page is pre-filled
    await kv.hset(`profile:${normalizedEmail}`, {
      full_name: trimmedName,
      organization_name: '',
      organization_type: '',
      focus_areas: '[]',
      keywords: '[]',
      location_state: '',
      location_county: '',
      grant_amount_min: '',
      grant_amount_max: '',
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
