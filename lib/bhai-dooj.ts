export type BhaiDoojDetails = {
  sibling: 'brother' | 'sister';
  bond: 'loving' | 'playful' | 'far-away';
};

export const defaultBhaiDooj: BhaiDoojDetails = { sibling: 'brother', bond: 'loving' };
export const bhaiBonds = [
  { id: 'loving', label: 'Loving', description: 'Warm and always there for each other' },
  { id: 'playful', label: 'Playful', description: 'Inside jokes and endless teasing' },
  { id: 'far-away', label: 'Far away', description: 'In different places, close at heart' },
] as const;

const starters = {
  loving: [
    ['A favourite memory', 'Some of my happiest memories have you in them. I’m so glad we got to grow up together.'],
    ['A wish for you', 'May the year ahead bring you good health, easy laughter and time for the people you love.'],
    ['Always in your corner', 'Whatever comes next, you’ll always have me cheering for you. Happy Bhai Dooj!'],
  ],
  playful: [
    ['An important question', 'Happy Bhai Dooj! I have been very patient about the sweets, which is clearly a festival miracle.'],
    ['My favourite rival', 'We can turn almost anything into a competition. I still wouldn’t trade our nonsense for anything.'],
    ['The serious bit', 'Under all that teasing, there’s someone I trust completely. I’m glad that someone is you.'],
  ],
  'far-away': [
    ['Thinking of home', 'I wish we could sit down together today and pick up exactly where we left off.'],
    ['Across the miles', 'I hope the little things make you smile today: a familiar song, a favourite sweet, a call from home.'],
    ['Until we meet again', 'Save a story for the next time we’re together. I’ll bring one too. Happy Bhai Dooj!'],
  ],
} as const;

export function bhaiNoteStarters(details: BhaiDoojDetails) {
  return starters[details.bond] ?? starters.loving;
}
