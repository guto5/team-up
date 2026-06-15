const PORTFOLIO_BASE_URL = 'https://teamup.app/u';

export function createPortfolioSlug(displayName: string, uid: string) {
  const normalized = displayName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24);

  return `${normalized || 'user'}${uid.slice(0, 4)}`;
}

export function getPortfolioUrl(slug: string) {
  return `${PORTFOLIO_BASE_URL}/${slug}`;
}

export function getSelfDeclaredSkills(
  skills: string[],
  endorsedSkills: { name: string }[] = [],
) {
  const endorsedNames = new Set(
    endorsedSkills.map((skill) => skill.name.toLowerCase()),
  );

  return skills.filter((skill) => !endorsedNames.has(skill.toLowerCase()));
}
