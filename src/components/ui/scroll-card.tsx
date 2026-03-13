'use client';
import { ReactLenis } from 'lenis/react';
import React, { forwardRef } from 'react';

interface FeatureCardData {
  title: string;
  description: string;
  icon: string;
  color: string;
  rotation: string;
  tag: string;
}

const featureCardsData: FeatureCardData[] = [
  {
    title: 'Launch Campaigns Faster',
    description:
      'Stop spending weeks coordinating outreach manually. Neo auto-discovers the right creators, drafts personalised briefs, and sends them — all within hours. Your next campaign can go live before the competition even starts planning.',
    icon: '🚀',
    color: '#dbeafe', // light blue
    rotation: 'rotate-3',
    tag: '70% faster setup',
  },
  {
    title: 'No Context Loss Between Steps',
    description:
      "Tired of re-explaining your brand to every tool you switch to? Neo retains full context across every step — from brief creation to creator outreach to performance tracking. Everything stays connected, so nothing falls through the cracks.",
    icon: '🧠',
    color: '#ede9fe', // light purple
    rotation: '-rotate-2',
    tag: 'End-to-end memory',
  },
  {
    title: '10x Less Manual Effort',
    description:
      "Most campaign managers juggle 6+ tools just to run one campaign. Neo replaces them all — scheduling, follow-ups, reporting, payments. What used to take a team of three now takes one person and an afternoon.",
    icon: '⚡',
    color: '#fce7f3', // light pink
    rotation: 'rotate-1',
    tag: 'Replace 6 tools with 1',
  },
  {
    title: 'Clear ROI, Not Guesswork',
    description:
      "Every rupee you spend on influencer marketing should be trackable. Neo gives you real-time analytics on reach, engagement, conversions, and cost-per-result so you always know what's working — and what to cut.",
    icon: '📊',
    color: '#dcfce7', // light green
    rotation: '-rotate-3',
    tag: 'Real-time attribution',
  },
];

const ScrollCard = forwardRef<HTMLElement>((props, ref) => {
  return (
    <ReactLenis root>
      <main className='bg-background' ref={ref}>

        {/* Stacking cards section */}
        <section className='text-foreground w-full bg-background'>
          <div className='flex items-start justify-between px-8 md:px-12 lg:px-24 xl:px-32 gap-16 lg:gap-32 max-w-[1400px] mx-auto'>

            {/* Left/Middle: sticky label */}
            <div className='sticky top-0 h-screen flex flex-col items-start justify-center flex-1'>
              <p className='text-sm font-semibold uppercase tracking-widest text-primary mb-4'>What we offer</p>
              <h2 className='text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight'>
                Everything <br /> Neo handles <br />
                <span className='bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent'>
                  for you
                </span>
              </h2>
              <p className='mt-6 text-lg text-muted-foreground max-w-md'>
                From discovery to outreach and real-time tracking, Neo runs your entire influencer campaign end-to-end.
              </p>
            </div>

            {/* Right: stacking cards */}
            <div className='grid gap-6 flex-shrink-0 w-full max-w-[38rem]'>
              {featureCardsData.map((card, i) => (
                <figure key={i} className='sticky top-0 h-screen grid place-content-center'>
                  <article
                    className={`h-[28rem] w-full rounded-3xl ${card.rotation} p-10 flex flex-col justify-start gap-6 shadow-xl border border-black/5`}
                    style={{ backgroundColor: card.color }}
                  >
                    <div className='flex items-center gap-4'>
                      <span className='text-6xl'>{card.icon}</span>
                      <span className='text-sm font-bold uppercase tracking-widest text-gray-500 bg-white/60 px-4 py-1.5 rounded-full'>
                        {card.tag}
                      </span>
                    </div>
                    <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 leading-tight'>{card.title}</h2>
                    <p className='text-gray-800 text-lg lg:text-xl leading-relaxed font-medium'>{card.description}</p>
                  </article>
                </figure>
              ))}
            </div>

          </div>
        </section>

      </main>
    </ReactLenis>
  );
});

ScrollCard.displayName = 'ScrollCard';

export default ScrollCard;
