import { NextRequest, NextResponse } from 'next/server';
import { getAllCompanies, saveCompany } from '@/lib/tour-service';

export async function GET() {
  try {
    const companies = await getAllCompanies();
    return NextResponse.json({ companies });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to list companies' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const company = await req.json();
    if (!company.name || !company.slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const cleanCompany = {
      ...company,
      id: company.id || `comp_${Date.now()}`,
      slug: company.slug.trim().toLowerCase(),
    };

    const result = await saveCompany(cleanCompany);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, company: cleanCompany });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create company' }, { status: 500 });
  }
}
