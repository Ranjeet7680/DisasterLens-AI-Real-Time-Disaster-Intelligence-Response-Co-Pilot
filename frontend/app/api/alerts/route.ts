import { NextResponse } from 'next/server';
import { getStoreAlerts } from '@/lib/mockStore';

export async function GET() {
  return NextResponse.json(getStoreAlerts());
}
