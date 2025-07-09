import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const allowedOrigins = ['http://localhost:3000', 'https://yourdomain.com']; // ปรับตามจริง

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  const isAllowedOrigin = allowedOrigins.includes(origin);

  // สำหรับ preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204, // No content
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'null',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  // สำหรับ requests ปกติ
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? origin : 'null');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

export const config = {
  matcher: '/api/:path*', // รองรับเฉพาะ API routes
};
