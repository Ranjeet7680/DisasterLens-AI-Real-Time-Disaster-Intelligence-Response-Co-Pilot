import { NextResponse } from 'next/server';
import { getStoreResources } from '@/lib/mockStore';

export async function GET() {
  return NextResponse.json(getStoreResources());
}
