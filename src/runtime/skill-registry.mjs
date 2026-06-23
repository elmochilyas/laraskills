import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { LARASKILLS_ROOT_DIR } from './paths.mjs';

const SKILL_METADATA = {
  'laravel-patterns': { description: 'Laravel architecture patterns, actions, DTOs, services, queues, caching, API resources', tags: ['architecture', 'patterns', 'services', 'actions', 'dto', 'queues', 'caching'] },
  'laravel-tdd': { description: 'Laravel 13 testing with Pest 4: feature tests, fakes, architecture tests', tags: ['testing', 'tdd', 'pest', 'feature-tests', 'unit-tests'] },
  'laravel-security': { description: 'Laravel 13 security: mass assignment, XSS, CSRF, Gates/Policies, rate limiting', tags: ['security', 'csrf', 'xss', 'gates', 'policies', 'rate-limiting'] },
  'laravel-core-internals': { description: 'Laravel 13 core internals: Service Container, DI, Providers, Facades, Request Lifecycle, Contracts', tags: ['container', 'di', 'providers', 'facades', 'lifecycle', 'contracts'] },
  'laravel-eloquent': { description: 'Advanced Eloquent: relationships (morph, deep, through), performance (N+1, aggregates), domain modeling (DTOs, VOs), custom builders, scopes, casts, events, event sourcing', tags: ['eloquent', 'orm', 'relationships', 'performance', 'domain-modeling', 'n+1'] },
  'laravel-database': { description: 'Database engineering: SQL mastery, indexing, PostgreSQL (JSONB, materialized views, vector search), MySQL (InnoDB, utf8mb4, partitioning, replication), transactions, scaling', tags: ['database', 'sql', 'postgresql', 'mysql', 'indexing', 'transactions', 'scaling'] },
  'laravel-api-rest': { description: 'REST API architecture: resource naming, HATEOAS, versioning, resource transformation, pagination', tags: ['api', 'rest', 'hateoas', 'versioning', 'pagination'] },
  'laravel-api-jsonapi': { description: 'JSON:API specification: native JsonApiResource, sparse fieldsets, includes, compound documents, links, meta', tags: ['api', 'json-api', 'jsonapi', 'jsonapiresource'] },
  'laravel-api-graphql': { description: 'GraphQL with Lighthouse: schema-first design, directives, DataLoader, query complexity, subscriptions, Federation', tags: ['api', 'graphql', 'lighthouse', 'dataloader', 'federation'] },
  'laravel-api-grpc': { description: 'gRPC & Protocol Buffers: proto definition, RoadRunner services, interceptors, streaming, client integration', tags: ['api', 'grpc', 'protobuf', 'roadrunner', 'streaming'] },
  'laravel-api-microservices': { description: 'Microservice architecture: service boundaries, database ownership, event-driven communication, saga patterns', tags: ['microservices', 'architecture', 'event-driven', 'saga', 'boundaries'] },
  'laravel-authentication': { description: 'Authentication & authorization: Sanctum, Passport, OAuth2, OIDC, JWT, Policies, Gates, Roles, Permissions, Multi-tenant, SSO, Enterprise IAM, Zero-trust', tags: ['authentication', 'authorization', 'sanctum', 'passport', 'oauth2', 'oidc', 'jwt', 'mfa', 'sso', 'zero-trust'] },
};

const REGISTRY_DIR = LARASKILLS_ROOT_DIR;

function readSkillDescription(packageRoot, skillName) {
  const skillMdPath = join(packageRoot, 'skills', skillName, 'SKILL.md');
  if (!existsSync(skillMdPath)) return null;

  try {
    const content = readFileSync(skillMdPath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('# ')) continue;

      if (trimmed.startsWith('## When to Use')) {
        for (let i = lines.indexOf(line) + 1; i < lines.length; i++) {
          const useLine = lines[i].trim();
          if (useLine && !useLine.startsWith('#') && !useLine.startsWith('```')) {
            return useLine;
          }
        }
      }

      if (trimmed.startsWith('## ')) {
        const desc = trimmed.replace(/^##\s+/, '');
        if (desc && !['When to Use', 'Core Philosophy', 'Architecture', 'Laravel 13'].some(s => desc.toLowerCase().includes(s.toLowerCase()))) {
          return desc;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

function getSkillInfo(packageRoot, skillName) {
  const meta = SKILL_METADATA[skillName];
  if (!meta) return null;

  let description = null;
  if (packageRoot && existsSync(packageRoot)) {
    description = readSkillDescription(packageRoot, skillName);
  }

  return {
    name: skillName,
    path: `.laraskills/skills/${skillName}/SKILL.md`,
    description: description || meta.description,
    tags: meta.tags,
  };
}

function discoverInstalledSkills(target) {
  const candidateDirs = [
    join(target, '.laraskills', 'skills'),
    join(target, 'skills'),
  ];

  for (const dir of candidateDirs) {
    if (existsSync(dir)) {
      try {
        const entries = readdirSync(dir);
        return entries.filter(entry => {
          const fullPath = join(dir, entry);
          try {
            return statSync(fullPath).isDirectory() && entry in SKILL_METADATA;
          } catch {
            return false;
          }
        });
      } catch {
        continue;
      }
    }
  }

  return [];
}

export function getRegistryPath(target) {
  return join(target, REGISTRY_DIR, 'skill-registry.json');
}

export function generateRegistry(target, packageRoot, profile, pkgVersion = '1.0.0-beta.23') {
  const installedSkills = discoverInstalledSkills(target);

  const skills = installedSkills
    .map(name => getSkillInfo(packageRoot, name))
    .filter(Boolean);

  const registry = {
    version: pkgVersion,
    generated_at: new Date().toISOString(),
    profile: profile || 'core',
    skills,
  };

  writeRegistry(target, registry);
  return registry;
}

export function readRegistry(target) {
  const registryPath = getRegistryPath(target);
  if (!existsSync(registryPath)) return null;

  try {
    const data = JSON.parse(readFileSync(registryPath, 'utf-8'));
    if (!data || !Array.isArray(data.skills)) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeRegistry(target, registry) {
  const registryDir = join(target, REGISTRY_DIR);
  if (!existsSync(registryDir)) {
    mkdirSync(registryDir, { recursive: true });
  }

  const registryPath = getRegistryPath(target);
  writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
}

export function validateRegistry(target) {
  const registry = readRegistry(target);

  if (!registry) {
    return { valid: false, missingSkills: [], skillsFound: [] };
  }

  const missingSkills = [];
  const skillsFound = [];

  for (const skill of registry.skills) {
    const skillPath = join(target, skill.path);
    if (existsSync(skillPath)) {
      skillsFound.push(skill.name);
    } else {
      missingSkills.push(skill.name);
    }
  }

  return {
    valid: missingSkills.length === 0,
    missingSkills,
    skillsFound,
  };
}

export function getRegistrySummary(target) {
  const registry = readRegistry(target);

  if (!registry) {
    return { exists: false, skillCount: 0, skills: [] };
  }

  return {
    exists: true,
    version: registry.version,
    skillCount: registry.skills.length,
    skills: registry.skills.map(s => ({
      name: s.name,
      path: s.path,
      description: s.description,
      tags: s.tags,
    })),
  };
}
