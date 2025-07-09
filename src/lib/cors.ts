import { NextResponse } from 'next/server';

// Set allowed origins explicitly if needed for security
const allowedOrigins = ['http://localhost:3000', 'https://yourdomain.com']; // ✅ ปรับตามจริง

export function getCorsHeaders(origin: string = '*') {
  const isAllowedOrigin = allowedOrigins.includes(origin) || origin === undefined;

  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function handleOptions(request: Request) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204, // No Content for OPTIONS
    headers: getCorsHeaders(origin),
  });
}

export function createCorsResponse(data: unknown, request: Request, status: number = 200) {
  const origin = request.headers.get('origin') || '*';
  return NextResponse.json(data, {
    status,
    headers: getCorsHeaders(origin),
  });
}

export function createErrorResponse(message: string, request?: Request, status: number = 500) {
  const origin = request?.headers.get('origin') || '*';
  return NextResponse.json(
    { success: false, message },
    {
      status,
      headers: getCorsHeaders(origin), // ✅ fixed here
    }
  );
}
