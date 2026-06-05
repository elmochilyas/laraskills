import { DOMAIN_NAMES } from './config.mjs';

const ROUTING_RULES = [
  {
    taskPattern: /\b(api|rest|crud|endpoint|resource|pagination|paginate|api.versioning|cursor.pagination)\b/i,
    primaryDomain: 'api-crud-system-engineering',
    supportingDomains: ['security-identity-engineering', 'testing-reliability-engineering', 'data-storage-systems'],
    reason: 'API development task',
  },
  {
    taskPattern: /\b(database|mysql|postgresql|index|migration|schema|query|sql|partition|shard|replication|connection|locking|deadlock|multi.tenant|tenant)\b/i,
    primaryDomain: 'data-storage-systems',
    supportingDomains: ['laravel-eloquent-domain-modeling', 'performance-runtime-engineering'],
    reason: 'Database or storage task',
  },
  {
    taskPattern: /\b(eloquent|model|relationship|n\s*plus\s*one|eager|polymorphic|accessor|mutator|scope|cast|observer|factory|seeder)\b/i,
    primaryDomain: 'laravel-eloquent-domain-modeling',
    supportingDomains: ['data-storage-systems', 'performance-runtime-engineering', 'application-architecture-patterns'],
    reason: 'Eloquent ORM task',
  },
  {
    taskPattern: /\b(auth|login|register|sanctum|passport|gate|policy|permission|role|rbac|encryption|hashing|xss|csrf|sql.injection|mass.assignment|rate.limit|secrets|file.upload|prompt.injection|environment.variable)\b/i,
    primaryDomain: 'security-identity-engineering',
    supportingDomains: ['api-crud-system-engineering', 'governance-compliance-engineering', 'devops-infrastructure'],
    reason: 'Security or identity task',
  },
  {
    taskPattern: /\b(test|pest|phpunit|tdd|coverage|mock|fake|dusk|playwright|mutation|regression|architecture test)\b/i,
    primaryDomain: 'testing-reliability-engineering',
    supportingDomains: ['api-crud-system-engineering', 'platform-engineering-developer-experience', 'backend-architecture-design'],
    reason: 'Testing task',
  },
  {
    taskPattern: /\b(queue|job|horizon|async|background|worker|event|broadcast|message.broker|batch|chain|etl)\b/i,
    primaryDomain: 'async-distributed-systems',
    supportingDomains: ['performance-runtime-engineering', 'observability-production-intelligence', 'data-engineering-analytics'],
    reason: 'Async or distributed systems task',
  },
  {
    taskPattern: /\b(deploy|docker|kubernetes|ci|cd|pipeline|server|provision|infrastructure|octane|roadrunner|browser.test|scale|horizontally|environment)\b/i,
    primaryDomain: 'devops-infrastructure',
    supportingDomains: ['platform-engineering-developer-experience', 'performance-runtime-engineering', 'testing-reliability-engineering'],
    reason: 'DevOps or infrastructure task',
  },
  {
    taskPattern: /\b(architect|pattern|modular|monolith|hexagonal|ddd|cqrs|event.sourcing|bounded.context|layered|feature.flag|modular.monolith|fat.controller)\b/i,
    primaryDomain: 'application-architecture-patterns',
    supportingDomains: ['backend-architecture-design', 'laravel-core-application-engineering'],
    reason: 'Architecture design task',
  },
  {
    taskPattern: /\b(search|meilisearch|algolia|typesense|scout|fulltext|vector.search|relevance|hybrid search)\b/i,
    primaryDomain: 'search-retrieval-systems',
    supportingDomains: ['ai-intelligence-systems', 'data-storage-systems', 'performance-runtime-engineering'],
    reason: 'Search or retrieval task',
  },
  {
    taskPattern: /\b(websocket|reverb|pusher|echo|broadcasting|realtime|sse|presence|server.sent.event|real.time.dashboard)\b/i,
    primaryDomain: 'real-time-systems',
    supportingDomains: ['async-distributed-systems', 'security-identity-engineering', 'laravel-core-application-engineering'],
    reason: 'Real-time systems task',
  },
  {
    taskPattern: /\b(ai|llm|rag|embedding|vector|openai|anthropic|claude|prompt|token|machine.learning|llm.safety|prompt.injection)\b/i,
    primaryDomain: 'ai-intelligence-systems',
    supportingDomains: ['search-retrieval-systems', 'performance-runtime-engineering', 'security-identity-engineering'],
    reason: 'AI or LLM task',
  },
  {
    taskPattern: /\b(log|monitor|tracing|apm|opentelemetry|grafana|prometheus|alert|health|distributed.tracing|real.time.dashboard|dashboard)\b/i,
    primaryDomain: 'observability-production-intelligence',
    supportingDomains: ['devops-infrastructure', 'performance-runtime-engineering', 'async-distributed-systems'],
    reason: 'Observability task',
  },
  {
    taskPattern: /\b(performance|opcache|jit|profiling|benchmark|blackfire|tideways|memory|cpu|redis|caching|cache|regression|diagnos)\b/i,
    primaryDomain: 'performance-runtime-engineering',
    supportingDomains: ['data-storage-systems', 'laravel-execution-lifecycle', 'laravel-core-application-engineering'],
    reason: 'Performance optimization task',
  },
  {
    taskPattern: /\b(webhook|saloon|third.party|external.api|integration|http.client|api.versioning)\b/i,
    primaryDomain: 'api-integration-engineering',
    supportingDomains: ['api-crud-system-engineering', 'testing-reliability-engineering'],
    reason: 'API integration task',
  },
  {
    taskPattern: /\b(compliance|gdpr|hipaa|soc|audit|governance|retention|sla|data.classification|feature.flag|policy|gate|authorization)\b/i,
    primaryDomain: 'governance-compliance-engineering',
    supportingDomains: ['security-identity-engineering', 'data-storage-systems', 'platform-engineering-developer-experience'],
    reason: 'Compliance or governance task',
  },
  {
    taskPattern: /\b(cost|optimize|resource|cloud|scaling|budget|saving)\b/i,
    primaryDomain: 'cost-resource-optimization',
    supportingDomains: ['devops-infrastructure', 'performance-runtime-engineering'],
    reason: 'Cost optimization task',
  },
  {
    taskPattern: /\b(laravel.core|middleware|routing|blade|form.request|service.provider|exception.handler|file.upload|controller)\b/i,
    primaryDomain: 'laravel-core-application-engineering',
    supportingDomains: ['laravel-execution-lifecycle', 'application-architecture-patterns', 'security-identity-engineering'],
    reason: 'Laravel core application task',
  },
  {
    taskPattern: /\b(lifecycle|kernel|service.container|dependency.injection|facade|provider|boot|di)\b/i,
    primaryDomain: 'laravel-execution-lifecycle',
    supportingDomains: ['laravel-core-application-engineering', 'performance-runtime-engineering'],
    reason: 'Laravel execution lifecycle task',
  },
  {
    taskPattern: /\b(artisan.command|cli.tooling|monorepo|scaffold|code.generation|developer.experience|composer)\b/i,
    primaryDomain: 'platform-engineering-developer-experience',
    supportingDomains: ['laravel-core-application-engineering', 'application-architecture-patterns'],
    reason: 'Platform engineering or developer experience task',
  },
  {
    taskPattern: /\b(solid|dto|value.object|service.class|service.layer|cohesion|coupling|grasp|clean.architecture|business.logic|action|actions|cqrs|event.sourcing|fat.controller)\b/i,
    primaryDomain: 'backend-architecture-design',
    supportingDomains: ['application-architecture-patterns', 'laravel-core-application-engineering'],
    reason: 'Backend architecture design task',
  },
];

const KNOWN_TERMS_BY_RULE = ROUTING_RULES.map(rule => {
  const source = rule.taskPattern.source;
  const raw = source.replace(/\\[bB]/g, '').replace(/\\/g, '');
  const parenIdx = raw.indexOf('(');
  const closeIdx = raw.lastIndexOf(')');
  const inner = parenIdx >= 0 && closeIdx > parenIdx ? raw.slice(parenIdx + 1, closeIdx) : raw;
  const terms = inner.split('|').map(t => t.replace(/[.\\]/g, ' ').trim()).filter(Boolean);
  return { pattern: rule.taskPattern, terms };
});

function countPatternMatches(pattern, text, firstWord) {
  if (!text) return 0;
  const entry = KNOWN_TERMS_BY_RULE.find(e => e.pattern === pattern);
  if (!entry) return 0;
  let count = 0;
  for (const term of entry.terms) {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const termRegex = new RegExp(`\\b${escapedTerm.replace(/\s+/g, '\\s*')}\\b`, 'i');
    if (termRegex.test(text)) count++;
  }
  const firstWordTerm = entry.terms.find(t => {
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fwRegex = new RegExp(`^${escaped}$`, 'i');
    return fwRegex.test(firstWord);
  });
  if (firstWordTerm) count++;
  return count;
}

export function routeQuery(normalizedQuery, analysis) {
  const { normalized, original } = normalizedQuery;
  const combined = `${normalized} ${original}`;
  const firstWord = (normalized.split(/\s+/)[0] || '').replace(/[^a-z]/g, '');
  const routes = [];

  for (const rule of ROUTING_RULES) {
    if (rule.taskPattern.test(normalized) || rule.taskPattern.test(original)) {
      const matchCount = countPatternMatches(rule.taskPattern, combined, firstWord);
      let confidence = Math.min(95, 70 + matchCount * 5);

      if (matchCount === 0) confidence = 60;

      const primaryName = DOMAIN_NAMES[rule.primaryDomain] || rule.primaryDomain;
      const supportingNames = rule.supportingDomains
        .filter(d => d !== rule.primaryDomain)
        .map(d => ({
          id: d,
          name: DOMAIN_NAMES[d] || d,
        }));

      routes.push({
        primaryDomain: {
          id: rule.primaryDomain,
          name: primaryName,
          reason: rule.reason,
          confidence,
          matchCount,
        },
        supportingDomains: supportingNames,
        matchedRule: rule,
      });
    }
  }

  if (routes.length === 0 && analysis.domains.length > 0) {
    const top = analysis.domains[0];
    routes.push({
      primaryDomain: {
        id: top.domain,
        name: DOMAIN_NAMES[top.domain] || top.domain,
        reason: `Matched ${top.matchedTerms.length} domain keywords: ${top.matchedTerms.slice(0, 3).join(', ')}`,
        confidence: Math.min(85, top.score * 3),
        matchCount: top.matchedTerms.length,
      },
      supportingDomains: analysis.domains.slice(1, 4).map(d => ({
        id: d.domain,
        name: DOMAIN_NAMES[d.domain] || d.domain,
        reason: `Matched ${d.matchedTerms.length} domain keywords`,
      })),
    });
  }

  if (routes.length === 0) {
    return [{
      primaryDomain: null,
      supportingDomains: [],
      matchedRule: null,
    }];
  }

  routes.sort((a, b) => {
    if (b.primaryDomain.matchCount !== a.primaryDomain.matchCount) {
      return b.primaryDomain.matchCount - a.primaryDomain.matchCount;
    }
    if (b.primaryDomain.confidence !== a.primaryDomain.confidence) {
      return b.primaryDomain.confidence - a.primaryDomain.confidence;
    }
    const aScore = analysis.domains.find(d => d.domain === a.primaryDomain.id);
    const bScore = analysis.domains.find(d => d.domain === b.primaryDomain.id);
    const aDomainScore = aScore ? aScore.score : 0;
    const bDomainScore = bScore ? bScore.score : 0;
    if (bDomainScore !== aDomainScore) return bDomainScore - aDomainScore;
    return a.primaryDomain.id.localeCompare(b.primaryDomain.id);
  });
  return routes;
}
