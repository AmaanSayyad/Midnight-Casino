'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';

const SHEET_HEADER =
  'Name,Email,Wallet Address,Product Rating,Liked Most,Missing Feature,Bugs / UX Friction,Would Recommend,Feedback Summary,Date';

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function FeedbackPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    wallet: '',
    rating: '5',
    liked: '',
    missing: '',
    bugs: '',
    recommend: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const summary = useMemo(() => {
    const bits = [
      form.liked && `Liked: ${form.liked}`,
      form.missing && `Missing: ${form.missing}`,
      form.bugs && `Friction: ${form.bugs}`,
    ].filter(Boolean);
    return bits.join(' · ').slice(0, 240);
  }, [form.liked, form.missing, form.bugs]);

  const onChange = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.wallet.trim()) {
      setError('Name, email, and Preprod wallet address are required.');
      return;
    }
    if (!form.liked.trim() || !form.missing.trim() || !form.bugs.trim()) {
      setError('Please answer the three feedback questions.');
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    const row = [
      form.name,
      form.email,
      form.wallet,
      form.rating,
      form.liked,
      form.missing,
      form.bugs,
      form.recommend,
      summary,
      date,
    ]
      .map(csvEscape)
      .join(',');

    const blob = new Blob([`${SHEET_HEADER}\n${row}\n`], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `midnight-casino-feedback-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    try {
      const key = 'mc-l5-feedback-rows';
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      prev.push({ ...form, summary, date });
      localStorage.setItem(key, JSON.stringify(prev));
    } catch {
      /* ignore quota */
    }

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#070005] text-white px-4 py-10 md:px-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#c4a1ff]">
            Rise In · Level 5
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold mt-2">
            Preprod feedback
          </h1>
          <p className="mt-3 text-white/70">
            Leave product feedback on our website: identity, Preprod wallet,
            rating, and three product questions. Submitting downloads a CSV row
            for [`docs/feedback-sheet.csv`](docs/feedback-sheet.csv).
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/onboard" className="underline text-white/70 hover:text-white">
            Onboarding checklist
          </Link>
          <Link
            href="/l5-fund"
            className="underline text-white/70 hover:text-white"
          >
            Fund wallets (1AM)
          </Link>
          <Link
            href="/game/privacy-wheel"
            className="underline text-white/70 hover:text-white"
          >
            Play Privacy Wheel
          </Link>
        </div>

        {submitted ? (
          <div className="border border-emerald-500/40 bg-emerald-500/10 p-6 space-y-3">
            <p className="text-emerald-200 font-medium">Thanks — response captured.</p>
            <p className="text-sm text-white/70">
              CSV downloaded. Send it to the maintainer or paste into the public
              sheet. Your wallet will be listed in USERS.md for L5.
            </p>
            <button
              type="button"
              className="underline text-sm text-white/80"
              onClick={() => setSubmitted(false)}
            >
              Submit another
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 border border-white/10 bg-white/5 p-6">
            <label className="block text-sm text-white/70">
              Name *
              <input
                className="mt-1 w-full bg-black/40 border border-white/20 px-3 py-2"
                value={form.name}
                onChange={onChange('name')}
                autoComplete="name"
              />
            </label>
            <label className="block text-sm text-white/70">
              Email *
              <input
                type="email"
                className="mt-1 w-full bg-black/40 border border-white/20 px-3 py-2"
                value={form.email}
                onChange={onChange('email')}
                autoComplete="email"
              />
            </label>
            <label className="block text-sm text-white/70">
              Wallet Address (Lace / 1AM Preprod) *
              <input
                className="mt-1 w-full bg-black/40 border border-white/20 px-3 py-2 font-mono text-xs"
                value={form.wallet}
                onChange={onChange('wallet')}
                placeholder="mn_shield-addr_preprod1…"
              />
            </label>
            <label className="block text-sm text-white/70">
              Product Rating (1–5) *
              <select
                className="mt-1 w-full bg-black/40 border border-white/20 px-3 py-2"
                value={form.rating}
                onChange={onChange('rating')}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-white/70">
              Which feature did you like the most? *
              <textarea
                className="mt-1 w-full bg-black/40 border border-white/20 px-3 py-2 min-h-[72px]"
                value={form.liked}
                onChange={onChange('liked')}
              />
            </label>
            <label className="block text-sm text-white/70">
              What feature do you think is missing? *
              <textarea
                className="mt-1 w-full bg-black/40 border border-white/20 px-3 py-2 min-h-[72px]"
                value={form.missing}
                onChange={onChange('missing')}
              />
            </label>
            <label className="block text-sm text-white/70">
              Did you encounter any bugs or UX friction? *
              <textarea
                className="mt-1 w-full bg-black/40 border border-white/20 px-3 py-2 min-h-[72px]"
                value={form.bugs}
                onChange={onChange('bugs')}
              />
            </label>
            <label className="block text-sm text-white/70">
              Would you recommend this product? (optional)
              <textarea
                className="mt-1 w-full bg-black/40 border border-white/20 px-3 py-2 min-h-[56px]"
                value={form.recommend}
                onChange={onChange('recommend')}
              />
            </label>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] py-3 font-medium"
            >
              Submit feedback
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
