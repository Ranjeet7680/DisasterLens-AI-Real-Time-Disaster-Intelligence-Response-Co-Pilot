import { NextResponse } from 'next/server';
import { getStoreMetrics } from '@/lib/mockStore';

export async function GET() {
  return NextResponse.json(getStoreMetrics());
}
