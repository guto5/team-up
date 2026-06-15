export const AVAILABLE_SKILLS = [
  'Node.js',
  '.NET',
  'Python',
  'React',
  'PostgreSQL',
  'UI/UX',
  'Figma',
  'React Native',
  'TypeScript',
  'Java',
  'Kotlin',
  'Docker',
] as const;

export type PredefinedSkill = (typeof AVAILABLE_SKILLS)[number];
export type Skill = string;
