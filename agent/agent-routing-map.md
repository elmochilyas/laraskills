# ECC Agent Routing Map

Task-to-domain routing guide for AI agents.

---

## Task Categories

### API Development
**Knowledge Domain:** knowledge/api-crud-system-engineering/, knowledge/api-integration-engineering/
**Related Skills:** skills/laravel-api-rest, skills/laravel-api-jsonapi, skills/laravel-api-graphql, skills/laravel-api-grpc, skills/laravel-api-microservices
**Related Agents:** laravel-api-rest, laravel-api-jsonapi, laravel-api-graphql, laravel-api-grpc, laravel-api-microservices
**Index:** intelligence/indexes/knowledge-unit-index.md#api-crud-system-engineering
**Registry:** intelligence/registry/knowledge-registry.md

### Authentication & Authorization
**Knowledge Domain:** knowledge/security-identity-engineering/, knowledge/governance-compliance-engineering/
**Related Skills:** skills/laravel-authentication
**Related Agents:** laravel-authentication, laravel-identity-architecture
**Index:** intelligence/indexes/knowledge-unit-index.md#security-identity-engineering

### Database & Storage
**Knowledge Domain:** knowledge/data-storage-systems/, knowledge/laravel-eloquent-domain-modeling/
**Related Skills:** skills/laravel-database, skills/laravel-eloquent
**Related Agents:** laravel-eloquent, laravel-migration, laravel-database
**Index:** intelligence/indexes/knowledge-unit-index.md#data-storage-systems

### Architecture & Design
**Knowledge Domain:** knowledge/application-architecture-patterns/, knowledge/backend-architecture-design/, knowledge/laravel-core-application-engineering/
**Related Skills:** skills/laravel-patterns, skills/laravel-core-internals
**Related Agents:** laravel-container
**Index:** intelligence/indexes/knowledge-unit-index.md#application-architecture-patterns

### Testing
**Knowledge Domain:** knowledge/testing-reliability-engineering/
**Related Skills:** skills/laravel-tdd
**Related Agents:** (no specific agent)
**Index:** intelligence/indexes/knowledge-unit-index.md#testing-reliability-engineering

### Performance
**Knowledge Domain:** knowledge/performance-runtime-engineering/
**Related Skills:** (no specific skill)
**Related Agents:** (no specific agent)
**Index:** intelligence/indexes/knowledge-unit-index.md#performance-runtime-engineering

### DevOps & Deployment
**Knowledge Domain:** knowledge/devops-infrastructure/, knowledge/platform-engineering-developer-experience/
**Related Skills:** (no specific skill)
**Related Agents:** (no specific agent)
**Index:** intelligence/indexes/knowledge-unit-index.md#devops-infrastructure

### Observability
**Knowledge Domain:** knowledge/observability-production-intelligence/
**Related Skills:** (no specific skill)
**Related Agents:** (no specific agent)
**Index:** intelligence/indexes/knowledge-unit-index.md#observability-production-intelligence

### AI & LLM
**Knowledge Domain:** knowledge/ai-intelligence-systems/
**Related Skills:** (no specific skill)
**Related Agents:** (no specific agent)
**Index:** intelligence/indexes/knowledge-unit-index.md#ai-intelligence-systems

### Security
**Knowledge Domain:** knowledge/security-identity-engineering/
**Related Skills:** skills/laravel-security
**Related Agents:** laravel-authentication, laravel-identity-architecture
**Index:** intelligence/indexes/knowledge-unit-index.md#security-identity-engineering

### Async & Queues
**Knowledge Domain:** knowledge/async-distributed-systems/
**Related Skills:** (no specific skill)
**Related Agents:** (no specific agent)
**Index:** intelligence/indexes/knowledge-unit-index.md#async-distributed-systems

### Real-Time
**Knowledge Domain:** knowledge/real-time-systems/
**Related Skills:** (no specific skill)
**Related Agents:** (no specific agent)
**Index:** intelligence/indexes/knowledge-unit-index.md#real-time-systems

### Search
**Knowledge Domain:** knowledge/search-retrieval-systems/
**Related Skills:** (no specific skill)
**Related Agents:** (no specific agent)
**Index:** intelligence/indexes/knowledge-unit-index.md#search-retrieval-systems

### Data Engineering
**Knowledge Domain:** knowledge/data-engineering-analytics/
**Related Skills:** (no specific skill)
**Related Agents:** (no specific agent)
**Index:** intelligence/indexes/knowledge-unit-index.md#data-engineering-analytics

### Governance & Compliance
**Knowledge Domain:** knowledge/governance-compliance-engineering/
**Related Skills:** (no specific skill)
**Related Agents:** laravel-identity-architecture
**Index:** intelligence/indexes/knowledge-unit-index.md#governance-compliance-engineering

### Cost Optimization
**Knowledge Domain:** knowledge/cost-resource-optimization/
**Related Skills:** (no specific skill)
**Related Agents:** (no specific agent)
**Index:** intelligence/indexes/knowledge-unit-index.md#cost-resource-optimization

### Frontend
**Knowledge Domain:** knowledge/laravel-core-application-engineering/ (Blade, Livewire, Inertia subdomains)
**Related Skills:** (no specific skill)
**Related Agents:** (no specific agent)
**Index:** intelligence/indexes/knowledge-unit-index.md#laravel-core-application-engineering

### Execution Lifecycle
**Knowledge Domain:** knowledge/laravel-execution-lifecycle/
**Related Skills:** skills/laravel-core-internals
**Related Agents:** laravel-container
**Index:** intelligence/indexes/knowledge-unit-index.md#laravel-execution-lifecycle

### Eloquent & Domain Modeling
**Knowledge Domain:** knowledge/laravel-eloquent-domain-modeling/
**Related Skills:** skills/laravel-eloquent
**Related Agents:** laravel-eloquent
**Index:** intelligence/indexes/knowledge-unit-index.md#laravel-eloquent-domain-modeling

### Platform Engineering
**Knowledge Domain:** knowledge/platform-engineering-developer-experience/
**Related Skills:** (no specific skill)
**Related Agents:** laravel-artisan
**Index:** intelligence/indexes/knowledge-unit-index.md#platform-engineering-developer-experience

### Backend Architecture
**Knowledge Domain:** knowledge/backend-architecture-design/
**Related Skills:** skills/laravel-patterns
**Related Agents:** (no specific agent)
**Index:** intelligence/indexes/knowledge-unit-index.md#backend-architecture-design

---

## Index Layer Routing

| Task Phase | Index to Consult | Location |
|---|---|---|
| Identify domain | Knowledge Unit Index | intelligence/indexes/knowledge-unit-index.md |
| Find checklists | Checklist Index | intelligence/indexes/checklist-index.md |
| Apply rules | Rule Index | intelligence/indexes/rule-index.md |
| Select skill | Skill Index | intelligence/indexes/skill-index.md |
| Navigate dependencies | Dependency Index | intelligence/indexes/dependency-index.md |
| Make decisions | Decision Tree Index | intelligence/indexes/decision-tree-index.md |
| Full inventory | Knowledge Registry | intelligence/registry/knowledge-registry.md |

---

## Cross-Domain Tasks

| Task | Primary Domain | Secondary Domain | Routing |
|---|---|---|---|
| API with OAuth | api-crud-system-engineering | security-identity-engineering | Start at api-crud-system-engineering → cross-ref security-identity-engineering for auth |
| Queued webhook processing | api-integration-engineering | async-distributed-systems | Start at api-integration-engineering/webhooks → async-distributed-systems for queue config |
| Real-time dashboard | real-time-systems | laravel-core-application-engineering | Start at real-time-systems for broadcasting, cross-ref laravel-core-application-engineering for frontend |
| AI search with vectors | ai-intelligence-systems | search-retrieval-systems | Start at ai-intelligence-systems/rag, cross-ref search-retrieval-systems/vector-search |
| Cost-optimized queue | cost-resource-optimization | async-distributed-systems | Start at cost-resource-optimization/queue-worker-optimization → async-distributed-systems for horizon scaling |
| Secure API with audit | api-crud-system-engineering | governance-compliance-engineering | Start at api-crud-system-engineering, add governance-compliance-engineering/audit-trails |
| Octane deployment | performance-runtime-engineering | devops-infrastructure | Start at performance-runtime-engineering/laravel-octane → devops-infrastructure for deployment |
| Testable async workflows | testing-reliability-engineering | async-distributed-systems | Start at testing-reliability-engineering → cross-ref async-distributed-systems for fakes |
| Container-based deployment | devops-infrastructure | platform-engineering-developer-experience | Start at devops-infrastructure/docker → platform-engineering-developer-experience |
| Multi-tenant data isolation | data-storage-systems | governance-compliance-engineering | Start at data-storage-systems/multi-tenancy → governance-compliance-engineering |
