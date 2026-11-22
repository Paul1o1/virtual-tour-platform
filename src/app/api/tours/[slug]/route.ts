import { NextRequest, NextResponse } from 'next/server';
import { getTourBySlug } from '@/lib/tour-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const tour = await getTourBySlug(slug);

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    return NextResponse.json({ tour });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching tour' }, { status: 500 });
  }
}
