# ECC Task-to-Skill Map

Development tasks to applicable skills.

---

## Task Categories with Skills

### Building APIs
- REST API: skills/laravel-api-rest
- JSON:API: skills/laravel-api-jsonapi
- GraphQL: skills/laravel-api-graphql
- gRPC: skills/laravel-api-grpc
- Microservices: skills/laravel-api-microservices
**Knowledge domains:** knowledge/api-crud-system-engineering/, knowledge/api-integration-engineering/
**Agents:** laravel-api-rest, laravel-api-jsonapi, laravel-api-graphql, laravel-api-grpc, laravel-api-microservices

### Database Work
- Eloquent ORM: skills/laravel-eloquent
- Database engineering: skills/laravel-database
- Migrations: agents/laravel-migration
**Knowledge domains:** knowledge/data-storage-systems/, knowledge/laravel-eloquent-domain-modeling/
**Agents:** laravel-eloquent, laravel-migration, laravel-database

### Testing
- Pest TDD: skills/laravel-tdd
**Knowledge domain:** knowledge/testing-reliability-engineering/
**Agents:** (none specific)

### Security
- Laravel security: skills/laravel-security
- Authentication: skills/laravel-authentication
**Knowledge domain:** knowledge/security-identity-engineering/
**Agents:** laravel-authentication, laravel-identity-architecture

### Architecture
- Laravel patterns: skills/laravel-patterns
- Core internals: skills/laravel-core-internals
**Knowledge domains:** knowledge/application-architecture-patterns/, knowledge/laravel-core-application-engineering/, knowledge/laravel-execution-lifecycle/
**Agents:** laravel-container

### Authentication
- Auth systems: skills/laravel-authentication
**Knowledge domains:** knowledge/security-identity-engineering/, knowledge/governance-compliance-engineering/
**Agents:** laravel-authentication, laravel-identity-architecture

---

## Detailed Skill Reference

| Skill Name | File Location | Domain Focus | Primary Use Case |
|---|---|---|---|
| laravel-patterns | skills/laravel-patterns | application-architecture-patterns | Actions, DTOs, Services, Queues, Caching, API Resources |
| laravel-eloquent | skills/laravel-eloquent | laravel-eloquent-domain-modeling | Relationships, N+1 elimination, domain modeling, casts, events |
| laravel-tdd | skills/laravel-tdd | testing-reliability-engineering | Pest 4 feature tests, fakes, architecture tests |
| laravel-security | skills/laravel-security | security-identity-engineering | Mass assignment, XSS, CSRF, Gates/Policies, rate limiting |
| laravel-core-internals | skills/laravel-core-internals | laravel-execution-lifecycle | Container, DI, Providers, Facades, Request Lifecycle |
| laravel-database | skills/laravel-database | data-storage-systems | SQL, indexing, PostgreSQL, MySQL, scaling, transactions |
| laravel-api-rest | skills/laravel-api-rest | api-crud-system-engineering | Resource naming, HATEOAS, versioning, pagination |
| laravel-api-jsonapi | skills/laravel-api-jsonapi | api-crud-system-engineering | JsonApiResource, sparse fieldsets, includes, compound documents |
| laravel-api-graphql | skills/laravel-api-graphql | api-crud-system-engineering | Lighthouse, resolvers, DataLoader, query complexity, subscriptions |
| laravel-api-grpc | skills/laravel-api-grpc | api-crud-system-engineering | Proto definition, RoadRunner, interceptors, streaming |
| laravel-api-microservices | skills/laravel-api-microservices | api-crud-system-engineering | Service boundaries, event-driven communication, saga patterns |
| laravel-authentication | skills/laravel-authentication | security-identity-engineering | Sanctum, Passport, OAuth2, JWT, Policies, SSO |

---

## Task-to-Agent Map

| Task | Agent | Skill to Load |
|---|---|---|
| Create REST API endpoints | laravel-api-rest | skills/laravel-api-rest |
| Implement JSON:API spec | laravel-api-jsonapi | skills/laravel-api-jsonapi |
| Build GraphQL schema | laravel-api-graphql | skills/laravel-api-graphql |
| Design gRPC services | laravel-api-grpc | skills/laravel-api-grpc |
| Design microservice boundaries | laravel-api-microservices | skills/laravel-api-microservices |
| Configure auth (Sanctum/Passport) | laravel-authentication | skills/laravel-authentication |
| Set up enterprise SSO/IAM | laravel-identity-architecture | skills/laravel-authentication |
| Write Eloquent models/queries | laravel-eloquent | skills/laravel-eloquent |
| Design database schema/migrations | laravel-migration | skills/laravel-database |
| Optimize SQL queries | laravel-database | skills/laravel-database |
| Create Artisan commands | laravel-artisan | (none specific) |
| Configure service container/bindings | laravel-container | skills/laravel-core-internals |

---

## Task-to-Knowledge-Domain Cross-Reference

| Task | Primary Domain | Secondary Domain | Skill |
|---|---|---|---|
| REST API with Sanctum auth | api-crud-system-engineering | security-identity-engineering | laravel-api-rest |
| GraphQL with queue jobs | api-crud-system-engineering | async-distributed-systems | laravel-api-graphql |
| Eloquent models for multi-tenant app | laravel-eloquent-domain-modeling | security-identity-engineering | laravel-eloquent |
| Octane deployment with Docker | performance-runtime-engineering | devops-infrastructure | (none) |
| Test-driven API development | testing-reliability-engineering | api-crud-system-engineering | laravel-tdd |
| Secure file upload with audit trail | security-identity-engineering | governance-compliance-engineering | laravel-security |
| Real-time dashboard with broadcasting | real-time-systems | laravel-core-application-engineering | (none) |
| AI chat with RAG pipeline | ai-intelligence-systems | search-retrieval-systems | (none) |
| Cost-optimized cloud infrastructure | cost-resource-optimization | devops-infrastructure | (none) |
| Monorepo with shared packages | platform-engineering-developer-experience | application-architecture-patterns | (none) |
