import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const lead = await req.json();
    if (!lead || !lead.name || !lead.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // 1. If Supabase is connected, record lead in database
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('leads').insert({
        tour_id: lead.tourId,
        tour_slug: lead.tourSlug,
        company_slug: lead.companySlug,
        name: lead.name,
        email: lead.email,
        phone: lead.phone || null,
        preferred_date: lead.preferredDate || null,
        message: `${lead.preferredTime ? `Time: ${lead.preferredTime}. ` : ''}${lead.message || ''}`,
      });

      if (error) {
        console.warn('Supabase lead insert warning (table might need creation):', error.message);
      }
    }

    console.log('New Tour Inquiry Received:', {
      tour: lead.tourTitle,
      client: lead.clientName,
      leadName: lead.name,
      leadEmail: lead.email,
      phone: lead.phone,
      preferredDate: lead.preferredDate,
      time: lead.preferredTime,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Lead submission error:', err);
    return NextResponse.json({ error: err.message || 'Error recording lead' }, { status: 500 });
  }
}
