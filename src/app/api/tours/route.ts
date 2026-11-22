import { NextRequest, NextResponse } from 'next/server';
import { getAllTours, saveTour } from '@/lib/tour-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company') || undefined;
    const tours = await getAllTours(company);
    return NextResponse.json({ tours });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to list tours' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tour = await req.json();
    if (!tour || !tour.id || !tour.slug || !tour.title) {
      return NextResponse.json({ error: 'Missing required tour fields (id, slug, title)' }, { status: 400 });
    }

    const result = await saveTour(tour);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, tour });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save tour' }, { status: 500 });
  }
}
