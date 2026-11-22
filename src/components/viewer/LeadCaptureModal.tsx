'use client';

import React, { useState } from 'react';
import { Tour } from '@/types/tour';
import {
  Calendar,
  X,
  Send,
  CheckCircle2,
  Phone,
  Mail,
  User,
  Clock,
  MessageSquare,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour;
  currentSceneName?: string;
}

export function LeadCaptureModal({
  isOpen,
  onClose,
  tour,
  currentSceneName,
}: LeadCaptureModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('Morning (10:00 AM - 1:00 PM)');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId: tour.id,
          tourSlug: tour.slug,
          companySlug: tour.companySlug || 'default',
          tourTitle: tour.title,
          clientName: tour.client,
          currentScene: currentSceneName,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          preferredDate: date,
          preferredTime: time,
          message: message.trim(),
        }),
      });
    } catch (_) {}

    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => {
      // auto-reset after delay
    }, 4000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-forest border border-line/25 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-paper"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-ink/70 border-b border-line/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-saffron text-ink flex items-center justify-center font-bold shadow-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-display font-bold uppercase tracking-wider text-saffron">
                <Building2 className="w-3 h-3" />
                <span>{tour.client}</span>
              </div>
              <h3 className="text-base font-display font-extrabold text-paper">
                Schedule a Private Viewing
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-paper hover:bg-forest transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-saffron/20 border border-saffron/40 text-saffron flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-display font-extrabold text-paper">
                  Request Confirmed!
                </h4>
                <p className="text-xs text-muted max-w-sm mx-auto mt-1 leading-relaxed">
                  Thank you, <strong className="text-paper">{name}</strong>. An agent from{' '}
                  <strong className="text-saffron">{tour.client}</strong> will contact you at{' '}
                  <strong className="text-paper">{email}</strong> to confirm your viewing for{' '}
                  <strong className="text-paper">{tour.title}</strong>.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-saffron hover:bg-saffron-hover text-ink font-display font-bold text-xs shadow-lg transition-all"
              >
                Back to 360 Tour
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-muted leading-relaxed">
                Interested in experiencing <strong className="text-paper">{tour.title}</strong> in
                person? Fill out your details below to schedule an on-site walkthrough.
              </p>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-paper/90 mb-1">
                    Your Name <span className="text-saffron">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pablo Gebeta"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-ink/80 border border-line/25 rounded-xl text-xs text-paper placeholder-muted focus:outline-none focus:border-saffron"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-paper/90 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                    <input
                      type="tel"
                      placeholder="+251 91 234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-ink/80 border border-line/25 rounded-xl text-xs text-paper placeholder-muted focus:outline-none focus:border-saffron"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-paper/90 mb-1">
                  Email Address <span className="text-saffron">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-ink/80 border border-line/25 rounded-xl text-xs text-paper placeholder-muted focus:outline-none focus:border-saffron"
                  />
                </div>
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-paper/90 mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-ink/80 border border-line/25 rounded-xl text-xs text-paper focus:outline-none focus:border-saffron"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-paper/90 mb-1">
                    Preferred Time Slot
                  </label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 bg-ink/80 border border-line/25 rounded-xl text-xs text-paper focus:outline-none focus:border-saffron"
                  >
                    <option value="Morning (10:00 AM - 1:00 PM)">Morning (10am - 1pm)</option>
                    <option value="Afternoon (1:00 PM - 5:00 PM)">Afternoon (1pm - 5pm)</option>
                    <option value="Sunset / Evening (5:00 PM - 7:00 PM)">Sunset (5pm - 7pm)</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-paper/90 mb-1">
                  Questions or Special Requests (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Interested in property floor plan specs, pricing, and parking options..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-ink/80 border border-line/25 rounded-xl text-xs text-paper placeholder-muted focus:outline-none focus:border-saffron resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-line/15">
                <div className="flex items-center gap-1.5 text-[10px] text-muted font-display">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal" />
                  <span>Privacy protected. Direct to {tour.client}.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || !email.trim()}
                  className="px-5 py-2.5 rounded-full bg-saffron hover:bg-saffron-hover text-ink font-display font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Sending...' : 'Schedule Viewing'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
