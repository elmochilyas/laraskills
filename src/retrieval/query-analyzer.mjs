const DOMAIN_KEYWORDS = {
  'ai-intelligence-systems': [
    'ai', 'llm', 'openai', 'anthropic', 'claude', 'gpt', 'rag',
    'retrieval augmented generation', 'vector', 'embedding', 'agent',
    'prompt', 'streaming', 'token', 'laravel ai', 'machine learning',
    'prompt injection', 'llm safety',
  ],
  'api-crud-system-engineering': [
    'api', 'rest', 'crud', 'resource', 'controller', 'endpoint',
    'route', 'pagination', 'paginate', 'request', 'response',
    'json', 'resource controller', 'cursor pagination', 'api versioning',
    'rate limiting',
  ],
  'api-integration-engineering': [
    'webhook', 'saloon', 'third party', 'external api', 'http client',
    'integration', 'oauth client', 'retry', 'api versioning',
  ],
  'application-architecture-patterns': [
    'architecture', 'pattern', 'modular', 'monolith', 'hexagonal',
    'layered', 'domain', 'bounded context', 'cqrs', 'event sourcing',
    'modular monolith', 'architecture pattern', 'feature flag',
  ],
  'async-distributed-systems': [
    'queue', 'job', 'horizon', 'rabbitmq', 'redis', 'async',
    'background', 'worker', 'event', 'broadcast', 'message broker',
    'batch', 'chain', 'etl pipeline', 'etl',
  ],
  'backend-architecture-design': [
    'solid', 'dto', 'action', 'service layer', 'service class',
    'grasp', 'separation of concerns', 'coupling', 'cohesion',
    'hexagonal', 'clean architecture', 'value object', 'cqrs',
    'event sourcing', 'service', 'business logic',
  ],
  'cost-resource-optimization': [
    'cost', 'optimize', 'resource', 'cloud cost', 'scaling',
    'autoscaling', 'budget', 'saving',
  ],
  'data-engineering-analytics': [
    'etl', 'analytics', 'data warehouse', 'olap', 'reporting',
    'dashboard', 'data pipeline',
  ],
  'data-storage-systems': [
    'database', 'mysql', 'postgresql', 'index', 'migration',
    'schema', 'table', 'column', 'query', 'transaction',
    'partition', 'shard', 'replication', 'connection', 'pool',
    'orm', 'eloquent', 'pessimistic locking', 'locking', 'deadlock',
    'multi tenant', 'tenant',
  ],
  'devops-infrastructure': [
    'deploy', 'docker', 'kubernetes', 'ci', 'cd', 'pipeline',
    'github actions', 'server', 'provision', 'infrastructure',
    'octane', 'roadrunner', 'secrets', 'environment',
    'dusk', 'browser test',
  ],
  'governance-compliance-engineering': [
    'gdpr', 'hipaa', 'soc2', 'compliance', 'audit', 'governance',
    'data retention', 'data classification', 'sla', 'feature flag',
  ],
  'laravel-core-application-engineering': [
    'laravel core', 'middleware', 'routing', 'blade', 'view',
    'form request', 'validation', 'controller', 'service provider',
    'exception handler', 'file upload', 'custom artisan command',
    'artisan command',
  ],
  'laravel-eloquent-domain-modeling': [
    'eloquent', 'relationship', 'model', 'accessor', 'mutator',
    'scope', 'cast', 'observer', 'event', 'factory', 'seeder',
    'n plus one', 'eager load', 'polymorphic',
  ],
  'laravel-execution-lifecycle': [
    'lifecycle', 'kernel', 'service container', 'di',
    'dependency injection', 'provider', 'facade', 'boot',
    'request lifecycle',
  ],
  'observability-production-intelligence': [
    'logging', 'monitoring', 'tracing', 'apm', 'opentelemetry',
    'grafana', 'prometheus', 'alert', 'health check',
    'distributed tracing',
  ],
  'performance-runtime-engineering': [
    'performance', 'opcache', 'jit', 'profiling', 'benchmark',
    'blackfire', 'tideways', 'octane', 'fastcgi', 'fpm',
    'memory', 'cpu', 'redis', 'caching', 'cache',
  ],
  'platform-engineering-developer-experience': [
    'developer experience', 'tooling', 'scaffold', 'code generation',
    'monorepo', 'package', 'composer', 'workflow',
    'custom artisan command', 'artisan command', 'cli',
  ],
  'real-time-systems': [
    'websocket', 'reverb', 'pusher', 'echo', 'broadcasting',
    'realtime', 'real time', 'presence', 'channel', 'sse',
    'server sent event', 'real time dashboard',
  ],
  'search-retrieval-systems': [
    'search', 'meilisearch', 'algolia', 'typesense', 'scout',
    'fulltext', 'full text', 'vector search', 'hybrid search',
    'relevance',
  ],
  'security-identity-engineering': [
    'authentication', 'authorization', 'sanctum', 'passport',
    'gate', 'policy', 'role', 'permission', 'encryption',
    'hashing', 'xss', 'csrf', 'sql injection', 'mass assignment',
    'cors', 'rate limit', 'multi tenant', 'rbac',
    'file upload', 'secrets', 'prompt injection',
    'tenant isolation',
  ],
  'testing-reliability-engineering': [
    'test', 'pest', 'phpunit', 'tdd', 'feature test',
    'unit test', 'mock', 'fake', 'factory', 'coverage',
    'regression', 'dusk', 'playwright', 'mutation test',
    'architecture test',
  ],
};

const CONCEPT_PATTERNS = [
  { pattern: /\bcrud\b/i, slot: 'crud', family: 'crud-controllers', domain: null },
  { pattern: /\brest\s*api\b/i, slot: 'rest-api', family: 'rest-api-design', domain: null },
  { pattern: /\bpolicies?\b/i, slot: 'policies', family: 'authorization', domain: 'security-identity-engineering' },
  { pattern: /\bauthorization\b/i, slot: 'authorization', family: 'authorization', domain: 'security-identity-engineering' },
  { pattern: /\bpagination\b/i, slot: 'pagination', family: 'pagination', domain: null },
  { pattern: /\bvalidat/i, slot: 'validation', family: 'form-request', domain: 'laravel-core-application-engineering' },
  { pattern: /\bform request\b/i, slot: 'form-request', family: 'form-request', domain: 'laravel-core-application-engineering' },
  { pattern: /\b(?:resource\s*)?controller\b/i, slot: 'controller', family: 'crud-controllers', domain: null },
  { pattern: /\b(?:api\s*)?resource\b(?!\s*controller)/i, slot: 'api-resource', family: 'api-resource', domain: null },
  { pattern: /\b(?:eloquent|model|relation)\b/i, slot: 'eloquent', family: 'eloquent-modeling', domain: 'laravel-eloquent-domain-modeling' },
  { pattern: /\bsanctum\b/i, slot: 'sanctum', family: 'api-authentication', domain: 'security-identity-engineering' },
  { pattern: /\bqueue\b/i, slot: 'queue', family: 'queue', domain: 'async-distributed-systems' },
  { pattern: /\bretry\b/i, slot: 'retry', family: 'retry-failure', domain: 'async-distributed-systems' },
  { pattern: /\bidempoten\b/i, slot: 'idempotency', family: 'retry-failure', domain: 'async-distributed-systems' },
  { pattern: /\btenant\b/i, slot: 'tenant', family: 'multi-tenancy', domain: 'security-identity-engineering' },
  { pattern: /\b(?:pgvector|vector\s*search|embedding|semantic\s*search)\b/i, slot: 'vector-search', family: 'vector-search', domain: 'search-retrieval-systems' },
  { pattern: /\bn\s*\+?\s*1\b/i, slot: 'n-plus-one', family: 'query-performance', domain: 'laravel-eloquent-domain-modeling' },
  { pattern: /\beager\s*load(?:ing)?\b/i, slot: 'eager-loading', family: 'query-performance', domain: 'laravel-eloquent-domain-modeling' },
  { pattern: /\bnotification\b/i, slot: 'notification', family: 'notification', domain: null },
  { pattern: /\btest\b/i, slot: 'testing', family: 'testing', domain: 'testing-reliability-engineering' },
];

export function extractConcepts(normalizedQuery) {
  const text = `${normalizedQuery.normalized} ${normalizedQuery.original}`;
  const concepts = [];
  const seenSlots = new Set();

  for (const cp of CONCEPT_PATTERNS) {
    const match = text.match(cp.pattern);
    if (match) {
      const slotKey = cp.slot;
      if (!seenSlots.has(slotKey)) {
        seenSlots.add(slotKey);
        concepts.push({
          term: match[0].toLowerCase(),
          slot: slotKey,
          family: cp.family,
          domain: cp.domain,
          matched: true,
        });
      }
    }
  }

  return concepts;
}

const RANKING_STOPWORDS = new Set([
  'api', 'crud', 'rest', 'design', 'engineering', 'system',
  'architecture', 'laravel', 'implementation', 'development',
  'pattern', 'application', 'framework', 'php', 'web',
]);

export function getKuConceptFamilies(kuId) {
  const id = kuId.toLowerCase();
  const parts = id.split('/');
  const domain = parts[0] || '';
  const subdomain = parts[1] || '';
  const name = parts[2] || '';
  const families = [];

  if (/crud|controller/.test(name) || /crud|resource.controller/.test(subdomain)) families.push('crud-controllers');
  if (/rest/.test(subdomain) && !/cors|hateoas|conditional|content-?negotiation|idempot/.test(name)) families.push('rest-api-design');
  if (/polic|authorization/.test(name) || /authorization/.test(subdomain)) families.push('authorization');
  if (/paginat/.test(name) || /paginat/.test(subdomain)) families.push('pagination');
  if (/validat|form\.request/.test(name) || /validat/.test(subdomain) || /input.validation/.test(subdomain)) families.push('form-request');
  if (/api\.resource/.test(name)) families.push('api-resource');
  if (/eloquent|model/.test(name) || /modeling/.test(subdomain)) families.push('eloquent-modeling');
  if (/sanctum/.test(name) || /auth/.test(subdomain)) families.push('api-authentication');
  if (/queue|job/.test(name) || /queue|async/.test(subdomain)) families.push('queue');
  if (/retry|failure|idempot/.test(name)) families.push('retry-failure');
  if (/tenant/.test(name) || /tenant/.test(subdomain)) families.push('multi-tenancy');
  if (/vector|embedding/.test(name) || /vector/.test(subdomain)) families.push('vector-search');
  if (/n\.plus|eager/.test(name) || /performance/.test(subdomain)) families.push('query-performance');
  if (/test|reliability/.test(domain) || /test/.test(subdomain)) families.push('testing');
  if (/notification/.test(name)) families.push('notification');

  return families;
}

export function analyzeQuery(normalized) {
  const { original, normalized: normalizedText, tokens } = normalized;

  const matchedDomains = {};

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    let score = 0;
    const matchedTerms = [];
    for (const keyword of keywords) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(normalizedText)) {
        score += 10;
        matchedTerms.push(keyword);
      } else if (normalizedText.includes(keyword)) {
        score += 5;
        matchedTerms.push(keyword);
      }
    }
    for (const token of tokens) {
      for (const keyword of keywords) {
        if (keyword.includes(token) && token.length > 2) {
          score += 1;
          break;
        }
      }
    }
    if (score > 0) {
      matchedDomains[domain] = {
        score,
        matchedTerms: [...new Set(matchedTerms)],
        tokenOverlap: tokens.filter(t =>
          keywords.some(k => k.includes(t) || t.includes(k))
        ).length,
      };
    }
  }

  const sorted = Object.entries(matchedDomains)
    .sort(([keyA, a], [keyB, b]) => {
      if (b.score !== a.score) return b.score - a.score;
      return keyA.localeCompare(keyB);
    });

  const primaryDomain = sorted.length > 0 ? sorted[0][0] : null;
  const supportingDomains = sorted.length > 1
    ? sorted.slice(1).filter(([, s]) => s.score > 0).slice(0, 3).map(([d]) => d)
    : [];

  const concepts = extractConcepts(normalized);

  return {
    originalQuery: original,
    normalizedText,
    tokens,
    domains: sorted.map(([d, s]) => ({ domain: d, ...s })),
    primaryDomain,
    supportingDomains,
    intentConfidence: sorted.length > 0
      ? Math.min(100, Math.round(sorted[0][1].score * 100 / 50))
      : 0,
    concepts,
  };
}
