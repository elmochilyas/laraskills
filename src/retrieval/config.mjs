export const SCORE_WEIGHTS = {
  exactKuName: 100,
  exactAlias: 95,
  exactSkillMatch: 90,
  exactPhraseKuName: 80,
  exactPhraseSubdomain: 55,
  conceptMatch: 40,
  domainRoute: 25,
  tokenKuName: 15,
  tokenSubdomain: 8,
  genericToken: 2,
  artifactAvailability: 3,
  conceptSlotFill: 30,
  crossDomainBoost: 20,
  prerequisiteExpansion: 10,
  relatedTopicExpansion: 5,
  externalConcept: 3,
};

export const DEFAULTS = {
  mode: 'standard',
  format: 'markdown',
  maxKus: 10,
  maxRules: 5,
  maxSkills: 5,
  maxRelated: 5,
  maxPrerequisites: 5,
  prerequisiteDepth: 1,
  relatedDepth: 1,
  budget: 4096,
  explain: true,
  domain: null,
};

export const MODE_CONFIG = {
  compact: {
    maxKus: 5,
    maxRules: 3,
    maxSkills: 3,
    maxRelated: 0,
    maxPrerequisites: 0,
    loadContent: false,
    includeDecisionTrees: false,
    includeAntiPatterns: false,
    includeExternalConcepts: false,
  },
  standard: {
    maxKus: 10,
    maxRules: 5,
    maxSkills: 5,
    maxRelated: 5,
    maxPrerequisites: 5,
    loadContent: false,
    includeDecisionTrees: true,
    includeAntiPatterns: true,
    includeExternalConcepts: true,
  },
  deep: {
    maxKus: 15,
    maxRules: 8,
    maxSkills: 8,
    maxRelated: 10,
    maxPrerequisites: 10,
    loadContent: true,
    includeDecisionTrees: true,
    includeAntiPatterns: true,
    includeExternalConcepts: true,
    prerequisiteDepth: 2,
    relatedDepth: 2,
  },
};

export const REQUIRED_JSON_FILES = [
  'knowledge-units.json',
  'dependencies.json',
  'relationships.json',
  'rules.json',
  'skills.json',
  'checklists.json',
  'anti-patterns.json',
  'decision-trees.json',
];

export const OPTIONAL_JSON_FILES = [
  'aliases.json',
  'external-concepts.json',
];

export const INTELLIGENCE_JSON_DIR = 'intelligence/json';

export const DOMAIN_NAMES = {
  'ai-intelligence-systems': 'AI Intelligence Systems',
  'api-crud-system-engineering': 'API & CRUD System Engineering',
  'api-integration-engineering': 'API Integration Engineering',
  'application-architecture-patterns': 'Application Architecture Patterns',
  'async-distributed-systems': 'Async & Distributed Systems',
  'backend-architecture-design': 'Backend Architecture Design',
  'cost-resource-optimization': 'Cost & Resource Optimization',
  'data-engineering-analytics': 'Data Engineering & Analytics',
  'data-storage-systems': 'Data Storage Systems',
  'devops-infrastructure': 'DevOps & Infrastructure',
  'governance-compliance-engineering': 'Governance & Compliance Engineering',
  'laravel-core-application-engineering': 'Laravel Core Application Engineering',
  'laravel-eloquent-domain-modeling': 'Laravel Eloquent Domain Modeling',
  'laravel-execution-lifecycle': 'Laravel Execution Lifecycle',
  'observability-production-intelligence': 'Observability & Production Intelligence',
  'performance-runtime-engineering': 'Performance & Runtime Engineering',
  'platform-engineering-developer-experience': 'Platform Engineering & Developer Experience',
  'real-time-systems': 'Real-Time Systems',
  'search-retrieval-systems': 'Search & Retrieval Systems',
  'security-identity-engineering': 'Security & Identity Engineering',
  'testing-reliability-engineering': 'Testing & Reliability Engineering',
};
