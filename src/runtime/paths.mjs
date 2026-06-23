// Centralized path constants for LaraSkills cross-assistant integration.
// All assistant config generators and validators MUST use these, not hardcode paths.

export const LARASKILLS_ROOT_DIR = '.laraskills';
export const SKILLS_DIR = '.laraskills/skills';
export const REGISTRY_PATH = '.laraskills/skill-registry.json';
export const STATE_FILE = '.laraskills-state.json';

export const LEGACY_STATE_FILE = '.laravel-ecc-state.json';
export const LEGACY_ROOT_DIR = '.laravel-ecc';
export const LEGACY_BIN_NAME = 'laravel-ecc';
export const LEGACY_MCP_BIN = 'laravel-ecc-mcp';

export const STALE_REFERENCES = ['laravel-ecc', 'laravel-ecc-mcp'];

export const ALL_KNOWN_SKILL_NAMES = [
  'laravel-patterns',
  'laravel-tdd',
  'laravel-security',
  'laravel-core-internals',
  'laravel-eloquent',
  'laravel-database',
  'laravel-api-rest',
  'laravel-api-jsonapi',
  'laravel-api-graphql',
  'laravel-api-grpc',
  'laravel-api-microservices',
  'laravel-authentication',
];

export const ASSISTANT_IDS = ['opencode', 'cursor', 'claude-code', 'codex', 'generic-mcp'];

// For an installed project, the canonical skill path is:
//   <target>/.laraskills/skills/<skill-name>/SKILL.md
export function canonicalSkillPath(target, skillName) {
  return `${LARASKILLS_ROOT_DIR}/skills/${skillName}/SKILL.md`;
}

// Stale path patterns that should NOT appear in generated configs
export const STALE_PATH_PATTERNS = [
  /^skills\//,           // skills/laravel-patterns/SKILL.md
  /^\.\.\/skills\//,     // ../skills/...
  /^\.\.\/laravel-ecc\//,
  /laravel-ecc/i,
];

// Public-friendly display names for internal skill IDs
const PUBLIC_SKILL_NAMES = {
  'laravel-patterns': 'Patterns',
  'laravel-tdd': 'Testing',
  'laravel-security': 'Security',
  'laravel-core-internals': 'Core Internals',
  'laravel-eloquent': 'Eloquent ORM',
  'laravel-database': 'Database',
  'laravel-api-rest': 'REST API',
  'laravel-api-jsonapi': 'JSON:API',
  'laravel-api-graphql': 'GraphQL',
  'laravel-api-grpc': 'gRPC',
  'laravel-api-microservices': 'Microservices',
  'laravel-authentication': 'Authentication',
};

export function sanitizeSkillName(name) {
  return PUBLIC_SKILL_NAMES[name] || name;
}

// Map internal IDs to human labels for public output
const PUBLIC_ASSISTANT_LABELS = {
  opencode: 'Assistant',
  'claude-code': 'Assistant',
  cursor: 'Assistant',
  codex: 'Assistant',
  'generic-mcp': 'MCP Client',
};

export function publicAssistantLabel(id) {
  return PUBLIC_ASSISTANT_LABELS[id] || 'Assistant';
}

export function sanitizeDoctorResult(result) {
  const r = JSON.parse(JSON.stringify(result));

  // Sanitize missing skill names
  if (r.checks?.skills_exist?.missing) {
    r.checks.skills_exist.missing = r.checks.skills_exist.missing.map(sanitizeSkillName);
  }

  // Sanitize mode string
  if (r.mode && r.mode.startsWith('assistant_')) {
    r.mode = 'assistant';
  }

  // Sanitize stale findings file paths
  if (r.checks?.stale_references?.findings) {
    r.checks.stale_references.findings = r.checks.stale_references.findings.map(f => ({
      ...f,
      file: f.file ? '(redacted)' : undefined,
      location: f.location ? '(redacted)' : undefined,
    }));
  }

  // Sanitize failures list
  if (r.failures) {
    for (const f of r.failures) {
      if (f.findings) {
        f.findings = f.findings.map(fx => ({
          ...fx,
          file: fx.file ? '(redacted)' : undefined,
          location: fx.location ? '(redacted)' : undefined,
        }));
      }
    }
  }

  // Sanitize assistant keys — replace internal IDs with public labels
  if (r.assistants) {
    const sanitized = {};
    for (const [aid, a] of Object.entries(r.assistants)) {
      const label = publicAssistantLabel(aid);
      sanitized[label] = {
        status: a.status,
        mcpConfigured: a.mcpConfigured,
      };
    }
    r.assistants = sanitized;
  }

  return r;
}
