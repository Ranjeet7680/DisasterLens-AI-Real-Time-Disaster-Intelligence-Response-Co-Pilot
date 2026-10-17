import { NextResponse } from 'next/server';
import { getStoreIncidentDetail } from '@/lib/mockStore';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const detail = getStoreIncidentDetail(id);
  if (!detail) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(detail);
}
