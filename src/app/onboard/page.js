'use client';

import React from 'react';
import Link from 'next/link';

const STEPS = [
  {
    title: 'Install wallet',
    body: 'Install 1AM (https://1am.xyz/) or Lace. Unlock it in Chrome.',
  },
  {
    title: 'Switch to Preprod',
    body: 'In the wallet, set Midnight network to Preprod. Point proof server at http://127.0.0.1:6300 when doing on-chain Compact calls.',
  },
  {
    title: 'Fund tNIGHT / tDUST',
    body: 'Use the Preprod faucet, then Generate tDUST in the wallet for fees.',
    href: 'https://midnight-tmnight-preprod.nethermind.dev/',
    hrefLabel: 'Open faucet',
  },
  {
    title: 'Play the MVP',
    body: 'Open Privacy Wheel — private choice/amount stay witnesses; public ledger only sees commitments until settle.',
    href: '/game/privacy-wheel',
    hrefLabel: 'Privacy Wheel',
  },
  {
    title: 'Optional on-chain Join',
    body: 'Run npm run proof:up && npm run midnight:dapp:preprod, then Join 33d34f168e360498df9b9e08baca1c999cdf50e61642f8af2888eaed7ec4be92.',
  },
  {
    title: 'Leave feedback',
    body: 'Name, email, Preprod wallet, rating, and three product questions. Required for Rise In L5.',
    href: '/feedback',
    hrefLabel: 'Feedback form',
  },
];

export default function OnboardPage() {
  return (
    <div className="min-h-screen bg-[#070005] text-white px-4 py-10 md:px-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#c4a1ff]">
            Rise In · Level 5
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold mt-2">
            Onboard to Preprod MVP
          </h1>
          <p className="mt-3 text-white/70 max-w-2xl">
            Six steps from zero to a counted Preprod user. Same MVP as Level 4 —
            sealed bets on contract{' '}
            <code className="text-xs md:text-sm break-all text-white/90">
              33d34f168e360498df9b9e08baca1c999cdf50e61642f8af2888eaed7ec4be92
            </code>
            .
          </p>
        </div>

        <ol className="space-y-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="border border-white/10 bg-white/5 p-5 flex gap-4"
            >
              <span className="text-[#c4a1ff] font-mono text-sm shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="space-y-2">
                <h2 className="text-lg font-medium">{step.title}</h2>
                <p className="text-sm text-white/70">{step.body}</p>
                {step.href && (
                  step.href.startsWith('http') ? (
                    <a
                      href={step.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-sm underline text-emerald-300/90"
                    >
                      {step.hrefLabel}
                    </a>
                  ) : (
                    <Link
                      href={step.href}
                      className="inline-block text-sm underline text-emerald-300/90"
                    >
                      {step.hrefLabel}
                    </Link>
                  )
                )}
              </div>
            </li>
          ))}
        </ol>

        <p className="text-sm text-white/50">
          Maintainers track wallets in{' '}
          <a
            className="underline"
            href="https://github.com/AmaanSayyad/Midnight-Casino/blob/main/USERS.md"
            target="_blank"
            rel="noreferrer"
          >
            USERS.md
          </a>
          .
        </p>
      </div>
    </div>
  );
}
