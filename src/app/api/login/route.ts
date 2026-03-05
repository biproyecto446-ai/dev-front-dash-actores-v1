import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const appToken = process.env.APP_ACCESS_TOKEN?.trim();
  if (!appToken) {
    return NextResponse.json({ error: 'Servidor no configurado (APP_ACCESS_TOKEN)' }, { status: 500 });
  }

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const token = (body.token ?? '').trim();
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
  if (token !== appToken) return NextResponse.json({ error: 'Token incorrecto' }, { status: 401 });

  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  return res;
}
