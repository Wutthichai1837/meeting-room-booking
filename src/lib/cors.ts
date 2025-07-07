import { NextResponse } from 'next/server';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
};

export function handleOptions() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export function createCorsResponse(data: unknown, status: number = 200) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders,
  });
}

export function createErrorResponse(message: string, status: number = 500) {
  return NextResponse.json(
    { success: false, message },
    {
      status,
      headers: corsHeaders,
    }
  );
}
