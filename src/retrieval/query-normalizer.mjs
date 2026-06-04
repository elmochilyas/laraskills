const LARAVEL_ABBREVIATIONS = {
  'n\\+1': 'n plus one',
  'n\\+1 ': 'n plus one ',
  'n plus one': 'n plus one',
  crud: 'crud',
  api: 'api',
  rest: 'rest',
  auth: 'authentication',
  authn: 'authentication',
  authz: 'authorization',
  rbac: 'role based access control',
  tdd: 'test driven development',
  db: 'database',
  cli: 'command line interface',
  ui: 'user interface',
  ux: 'user experience',
  orm: 'object relational mapping',
  dto: 'data transfer object',
  vo: 'value object',
  iam: 'identity and access management',
  sso: 'single sign on',
  mfa: 'multi factor authentication',
  otp: 'one time password',
  jwt: 'json web token',
  rls: 'row level security',
  cte: 'common table expression',
  acl: 'access control list',
  ddd: 'domain driven design',
  cqrs: 'command query responsibility segregation',
  sse: 'server sent events',
  rag: 'retrieval augmented generation',
  llm: 'large language model',
  cicd: 'ci cd',
  'ci/cd': 'ci cd',
};

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'for', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
  'by', 'with', 'from', 'of', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these',
  'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'using', 'use', 'used', 'build', 'builds', 'building', 'create',
  'creates', 'creating', 'add', 'adds', 'adding', 'make', 'makes',
  'making', 'implement', 'implements', 'implementing', 'how', 'what',
  'when', 'where', 'which', 'who', 'whom',
]);

export function normalizeQuery(rawQuery) {
  const original = rawQuery.trim();
  let normalized = original.toLowerCase();

  normalized = normalized.replace(/[^\w\s+]/g, ' ');

  normalized = normalized.replace(/\s+/g, ' ').trim();

  for (const [pattern, replacement] of Object.entries(LARAVEL_ABBREVIATIONS)) {
    const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
    normalized = normalized.replace(regex, replacement);
  }

  const tokens = normalized.split(/\s+/).filter(t => !STOP_WORDS.has(t) && t.length > 0);

  return {
    original,
    normalized,
    tokens,
    tokenCount: tokens.length,
  };
}

export function tokenizeForOverlap(text) {
  const clean = text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return new Set(clean.split(/\s+/));
}
