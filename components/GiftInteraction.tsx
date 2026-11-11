'use client';

import { useState } from 'react';

const interactions = {
  birthday: {
    title: 'Birthday balloons',
    instruction: 'Pop each balloon to uncover a birthday wish.',
    action: 'Pop balloon',
    items: [
      ['🎈', 'A year full of good surprises'],
      ['🎈', 'More days with your favourite people'],
      ['🎈', 'A wish that comes true'],
    ],
    complete: 'All three wishes are yours.',
  },
  diwali: {
    title: 'Light the diyas',
    instruction: 'Light each diya to reveal a wish for the year ahead.',
    action: 'Light diya',
    items: [
      ['🪔', 'Light for the days ahead'],
      ['🪔', 'Warmth for your home'],
      ['🪔', 'Joy to share with the people you love'],
    ],
    complete: 'May your Diwali be filled with light.',
  },
  love: {
    title: 'Little reasons I love you',
    instruction: 'Open each note to see what they wrote for you.',
    action: 'Open note',
    items: [['♡', ''], ['♡', ''], ['♡', '']],
    complete: 'You’ve opened every note.',
  },
  'favourite-light': {
    title: 'A sky of lanterns',
    instruction: 'Open a lantern to find a memory.',
    action: 'Open lantern',
    items: [
      ['🏮', 'For the moments that made us laugh'],
      ['🏮', 'For the quiet days we shared'],
      ['🏮', 'For all the memories still to come'],
    ],
    complete: 'Every lantern is glowing.',
  },
  garba: {
    title: 'Will you come to Garba with me?',
    instruction: 'Open the invitation details.',
    action: 'Open',
    items: [
      ['♪', 'I’d love to share the dance floor with you.'],
      ['✦', 'Let’s choose a venue together.'],
      ['♡', 'Let’s find a night that works for both of us.'],
    ],
    complete: 'Your invitation is open.',
  },
  navratri: {
    title: 'Lights for Navratri',
    instruction: 'Light a diya to reveal each blessing.',
    action: 'Light diya',
    items: [
      ['🪔', 'May your home be filled with warmth'],
      ['🪔', 'May you find strength in the days ahead'],
      ['🪔', 'May this season bring you peace'],
    ],
    complete: 'Wishing you a joyful Navratri.',
  },
  dhanteras: {
    title: 'Grow a little wish',
    instruction: 'Plant a seed, give it water, then see what grew.',
    action: 'Grow',
    items: [
      ['🌱', 'Plant a seed'],
      ['💧', 'Water the seed'],
      ['🌿', 'See it grow'],
    ],
    complete: 'May good things grow for you this Dhanteras.',
  },

};

export function GiftInteraction({ occasion, notes = [], photos = [], onComplete }: {
  occasion: keyof typeof interactions;
  notes?: string[];
  photos?: string[];
  onComplete: () => void;
}) {
  const [revealed, setRevealed] = useState<number[]>([]);
  const interaction = interactions[occasion];
  const items = interaction.items.flatMap(([symbol, message], index) => {
    const note = notes[index]?.trim();
    if (occasion === 'love' && !note) return [];
    return [{ symbol, message, note: note || message }];
  });
  const complete = revealed.length === items.length;

  function reveal(index: number) {
    if (revealed.includes(index) || (occasion === 'dhanteras' && index !== revealed.length)) return;
    const next = [...revealed, index];
    setRevealed(next);
    if (next.length === items.length) onComplete();
  }

  return (
    <section className={`gift-interaction gift-interaction--${occasion}`} aria-labelledby="gift-interaction-title">
      <h2 id="gift-interaction-title">{interaction.title}</h2>
      <p>{interaction.instruction}</p>
      <div className="gift-interaction-items">
        {items.map(({symbol, message, note}, index) => {
          const active = revealed.includes(index);
          const waiting = occasion === 'dhanteras' && index > revealed.length;
          const action = occasion === 'garba' ? ['Open the invitation', 'Reveal the venue', 'Reveal the date'][index]
            : occasion === 'dhanteras' ? message
            : `${interaction.action} ${index + 1}`;
          return (
            <button
              type="button"
              key={index}
              aria-disabled={active || waiting}
              onClick={() => reveal(index)}
            >
              <span className="gift-interaction-symbol" aria-hidden="true">
                {active && occasion === 'birthday' ? '✦' : symbol}
              </span>
              <span>{active ? note : action}</span>
              {active && occasion === 'favourite-light' && photos[index] &&
                <img src={photos[index]} alt={`Lantern memory ${index + 1}`} loading="lazy" />
              }
            </button>
          );
        })}
      </div>
      <p className="gift-interaction-status" role="status">
        {complete ? interaction.complete : `${revealed.length} of ${items.length} complete`}
      </p>
    </section>
  );
}
