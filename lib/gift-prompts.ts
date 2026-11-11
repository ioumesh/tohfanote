import type { Occasion } from './gift';

export const letterPrompts: Record<Occasion, string> = {
  birthday: 'What do you hope this next year brings them?',
  love: 'What small thing do they do that makes you feel loved?',
  friendship: 'What’s a story only the two of you would understand?',
  anniversary: 'Which memory would you live all over again?',
  proposal: 'What made you want to share a future with them?',
  apology: 'Name what happened, acknowledge how it affected them, and say what you’ll do differently.',
  puzzle: 'Tell them why you chose this photo.',
  anonymous: 'What kind words would make their day a little brighter?',
  diwali: 'What would you wish for them in the year ahead?',
  'bhai-dooj': 'What’s one childhood memory that still makes you both laugh?',
  'favourite-light': 'When did they make an ordinary day feel brighter?',
  garba: 'What makes you want them beside you on the dance floor?',
  navratri: 'What blessing would you like to send to their home?',
  dhanteras: 'What would you love to see grow in their life this year?',
};

export const revealPrompts: Partial<Record<Occasion, { title: string; fields: string[] }>> = {
  birthday: { title: 'Personalise the balloon wishes', fields: ['First wish', 'Second wish', 'Third wish'] },
  love: { title: 'Add reasons you love them', fields: ['First reason', 'Second reason', 'Third reason'] },
  proposal: { title: 'Write your own proposal question', fields: ['The question they’ll see'] },
  diwali: { title: 'Personalise the diya wishes', fields: ['First wish', 'Second wish', 'Third wish'] },
  'favourite-light': { title: 'Add memories to the lanterns', fields: ['First memory', 'Second memory', 'Third memory'] },
  garba: { title: 'Add invitation details', fields: ['Why you’d love them there', 'Venue', 'Date and time'] },
  navratri: { title: 'Personalise the blessings', fields: ['First blessing', 'Second blessing', 'Third blessing'] },
  dhanteras: { title: 'Personalise the planting wishes', fields: ['A wish to plant', 'A wish to nurture', 'A wish to grow'] },
};
