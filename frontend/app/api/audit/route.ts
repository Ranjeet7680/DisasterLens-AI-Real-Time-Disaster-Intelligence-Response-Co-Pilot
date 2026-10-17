import { NextResponse } from 'next/server';
import { getStoreAudit } from '@/lib/mockStore';

export async function GET() {
  return NextResponse.json(getStoreAudit());
}
