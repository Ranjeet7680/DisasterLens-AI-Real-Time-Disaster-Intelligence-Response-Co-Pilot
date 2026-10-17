import { NextResponse } from 'next/server';
import { getStoreIncidents, addStoreIncident } from '@/lib/mockStore';

export async function GET() {
  return NextResponse.json(getStoreIncidents());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = addStoreIncident(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
