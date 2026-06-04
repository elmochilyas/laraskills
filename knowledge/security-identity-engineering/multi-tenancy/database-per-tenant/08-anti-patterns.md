# Anti-Patterns: Database-Per-Tenant Isolation Pattern

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Multi-Tenancy Security |
| Knowledge Unit | Database-Per-Tenant Isolation Pattern |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-DPT-01 | Premature Adoption of Per-Tenant DB | High | High | High |
| AP-DPT-02 | Manual Per-Tenant Migration | Critical | Medium | High |
| AP-DPT-03 | Static Database Connections | High | Medium | Medium |
| AP-DPT-04 | Same Backup for All Tenants | High | Medium | Medium |
| AP-DPT-05 | Shared User Table Across Databases | High | Medium | High |

---

## Repository-Wide Anti-Patterns

- **No connection pooling**: Dynamic connections without pooling degrade performance
- **Sequential migration fan-out on 1000+ tenants**: Must use batch parallelism to avoid downtime
- **Not encrypting tenant database credentials**: Tenant connection strings stored in plaintext

---

## 1. Premature Adoption of Per-Tenant DB

### Category
Architecture · Cost

### Description
Choosing the database-per-tenant pattern before there is a clear compliance or scale requirement, incurring significant operational complexity and cost without corresponding benefit.

### Why It Happens
Database-per-tenant sounds like the "most secure" option. Developers overestimate the isolation risk of shared databases and underestimate the operational cost of per-tenant databases. Early-stage products with 10-100 tenants adopt a pattern designed for hundreds or thousands of enterprise tenants.

### Warning Signs
- < 100 tenants with no regulatory compliance requirements
- No HIPAA, PCI DSS, or similar compliance mandates
- Shared database with global scopes would meet all requirements
- Team struggles with migration fan-out, backup automation, connection management
- Cross-tenant aggregate reporting requires complex federated queries

### Why Harmful
Per-tenant databases are 10-100x more operationally complex than shared database. Migration fan-out must run N times, backups must be N times, connection configuration is dynamic, and cross-tenant queries require federated queries or application-level aggregation. This complexity consumes developer time that could be spent on product features.

### Real-World Consequences
- Developer velocity slows as every migration must run on N databases
- Backup strategy is incomplete — some tenant databases miss backup windows
- Connection pool exhaustion from dynamic connections
- Aggregation reports require custom federated query logic
- Startup spends more time on multi-tenancy operations than on product

### Preferred Alternative
Start with a shared database + global Eloquent scopes pattern. Migrate to database-per-tenant only when compliance (HIPAA, PCI DSS) requires it or when individual tenant datasets exceed shared database capacity.

### Refactoring Strategy
1. Evaluate actual compliance requirements — confirm they mandate database-level isolation
2. Assess scale: total data volume, growth rate, per-tenant data size
3. If requirements don't justify per-tenant, refactor to shared database + global scopes
4. For existing per-tenant setups, consolidate data into a shared database with `tenant_id`
5. Implement global scopes, composite unique indexes, and queue context propagation
6. Decommission per-tenant databases after data migration and verification

### Detection Checklist
- [ ] Are there compliance requirements (HIPAA, PCI DSS) that mandate database isolation?
- [ ] Is the per-tenant data volume too large for a shared database?
- [ ] How many tenants exist? Is the growth trajectory justifying per-tenant DBs?
- [ ] Is the team spending significant time on multi-tenancy operations?
- [ ] Would shared database + global scopes meet security and isolation requirements?

### Related Rules/Skills/Trees
- Start with Shared Database; Migrate to Per-Tenant Only When Required (05-rules.md)
- Choose Multi-Tenancy Isolation Pattern (07-decision-trees.md)
- Shared Database + Global Scopes (06-skills.md)

---

## 2. Manual Per-Tenant Migration

### Category
Operations · Reliability

### Description
Running database migrations on each tenant database manually instead of automating the fan-out, leading to schema drift, inconsistent tenant states, and failed deployments.

### Why It Happens
Early-stage products with 3-5 tenants can manually migrate each database. The process is documented in a wiki or README. As tenants grow, the manual process becomes a bottleneck, but automating it is deprioritized because "we only have 50 tenants and we know which ones are up to date."

### Warning Signs
- Migration instructions say "run `php artisan migrate` on each tenant database"
- No Artisan command exists for automated tenant migration
- Some tenants have different schema versions
- Manual checklist tracks which tenants have been migrated
- Deployments require a team member to stay late running migrations

### Why Harmful
Manual migration guarantees eventual schema drift. A missed tenant, a failed migration on one database, or a skipped deployment causes some tenants to have different schemas. When a critical patch relies on a migration, tenants on the old schema may experience errors or data loss.

### Real-World Consequences
- Critical security patch fails on 20% of tenants — schema mismatch
- Tenant-specific bug caused by different migration state — hours to debug
- Deployment requires 2 hours of manual migration after every release
- New tenant creation stalls because the migration process isn't automated
- Data loss when a migration fails silently on one tenant database

### Preferred Alternative
Write an Artisan command that iterates over all tenants and runs migrations on each. Include a `--tenant=` flag for single-tenant migration during development.

### Refactoring Strategy
1. Create `php artisan tenancy:migrate` — iterates all tenants and runs `php artisan migrate --force`
2. Include error handling: log failed tenant, continue others, report summary
3. Add a `--tenant=` option for single-tenant migration during development
4. Integrate the command into the deployment pipeline
5. Add a tenant schema version tracking table to verify migration state
6. Add monitoring: alert if any tenant's schema version differs from expected

### Detection Checklist
- [ ] Is there an automated migration fan-out command?
- [ ] How are tenant database migrations run during deployment?
- [ ] Do all tenants have the same schema version?
- [ ] Is there a process for adding a new tenant database?
- [ ] Is schema drift detected or monitored?

### Related Rules/Skills/Trees
- Automate Per-Tenant Migration Fan-Out (05-rules.md)
- Configure Database-Per-Tenant Pattern (06-skills.md)
- Database Deployment for Multi-Tenant Applications (06-skills.md)

---

## 3. Static Database Connections

### Category
Architecture · Performance

### Description
Using hardcoded database connections for each tenant or creating a new connection per request without pooling, causing connection management overhead and limited scalability.

### Why It Happens
The simplest implementation is to create a new database connection when a tenant is initialized. Developers hardcode connections in `config/database.php` for each tenant during early development. Dynamic connection resolution with pooling adds complexity that seems unnecessary for small deployments.

### Warning Signs
- `config/database.php` has individual connection entries per tenant
- New tenant additions require modifying `config/database.php`
- No connection pooling configured (no persistent connections)
- Database connection count grows linearly with active tenants
- `Too many connections` errors under moderate load

### Why Harmful
Hardcoded connections require a deployment every time a tenant is added. Without pooling, each request to a new tenant creates a TCP connection to the database — adding 5-10ms latency per request and consuming database connection slots. At scale, this exhausts database connection limits.

### Real-World Consequences
- Adding a new tenant requires a code deployment
- Database reaches `max_connections` limit under moderate concurrent load
- Request latency increases as new connections are established per request
- `Too many connections` errors cause application downtime
- Connection exhaustion affects all tenants, not just the high-traffic one

### Preferred Alternative
Use dynamic connection resolution with a connection pool. Configure persistent connections. Resolve the tenant database name from a central tenant store at runtime.

### Refactoring Strategy
1. Remove hardcoded per-tenant database connections from `config/database.php`
2. Implement a dynamic connection resolver: `config(['database.connections.tenant.database' => $tenantDatabaseName])`
3. Enable persistent connections: `'persistent' => true` in the database config
4. Use connection pooling middleware or a service provider that reuses connections
5. For MySQL, configure a connection pooler like ProxySQL or MySQL Router
6. Add connection pool monitoring: track active connections per tenant

### Detection Checklist
- [ ] Are database connections hardcoded per tenant in config files?
- [ ] Is there a dynamic connection resolution mechanism?
- [ ] Are persistent connections enabled?
- [ ] Is a connection pooler configured at the database layer?
- [ ] What is the current database connection count vs. `max_connections`?

### Related Rules/Skills/Trees
- Use Dynamic Connection Resolution with Pooling (05-rules.md)
- Configure Database-Per-Tenant Pattern (06-skills.md)
- Database Connection Management for Multi-Tenancy (06-skills.md)

---

## 4. Same Backup for All Tenants

### Category
Operations · Security

### Description
Using a single backup strategy for all tenant databases without per-tenant backup isolation, creating a single point of failure and potential cross-tenant data access during restore.

### Why It Happens
A single backup script running `mysqldump --all-databases` is the simplest approach. Per-tenant backup adds complexity: N backup jobs, N backup files, N restore procedures. The isolation requirement of per-tenant databases extends to backups, but this is often overlooked.

### Warning Signs
- Backup script uses `--all-databases` or equivalent for all tenants at once
- One backup failure means all tenants' data is at risk
- Restore restores all tenants, not a single tenant
- Backup files are not isolated per tenant in storage
- No per-tenant restore drill has been performed

### Why Harmful
A single backup failure or corruption affects every tenant simultaneously. Restoring a single tenant requires extracting from the full backup — a time-consuming and error-prone process. Cross-tenant data access during restore is possible if the restore process is not isolated.

### Real-World Consequences
- Single corrupted backup file loses all tenants' data
- Restoring a single tenant takes hours because full backup must be extracted
- Compliance requirement for tenant-isolated backups is violated
- Tenant A's data is temporarily accessible during Tenant B's restore process
- RTO (Recovery Time Objective) is determined by the largest tenant, not each tenant

### Preferred Alternative
Implement per-tenant backup with automated scheduling. Each tenant database is backed up independently, and restore is per-tenant.

### Refactoring Strategy
1. Create a backup Artisan command that iterates tenants and backs up each database separately
2. Store backup files in tenant-isolated paths: `backups/{tenant_id}/`
3. Implement per-tenant backup scheduling (staggered to avoid resource contention)
4. Create a per-tenant restore command: `php artisan tenancy:restore {tenantId}`
5. Automate backup verification: test restore a random tenant daily
6. Add monitoring: alert if any tenant's backup is older than threshold

### Detection Checklist
- [ ] Are backups per-tenant or all-tenants-together?
- [ ] Can a single tenant be restored independently?
- [ ] Are backup files stored in tenant-isolated paths?
- [ ] Is there a per-tenant restore procedure documented and tested?
- [ ] Are all tenants' backups verified regularly?

### Related Rules/Skills/Trees
- Implement Per-Tenant Backup and Restore (05-rules.md)
- Configure Database-Per-Tenant Pattern (06-skills.md)
- Backup and Disaster Recovery for Multi-Tenant (06-skills.md)

---

## 5. Shared User Table Across Databases

### Category
Architecture · Security

### Description
Using a single shared `users` table across all tenant databases for authentication, breaking the isolation of the database-per-tenant pattern and creating cross-tenant authentication vulnerabilities.

### Why It Happens
Authentication typically needs to work across tenants — users log in, then the system determines which tenant they belong to. The simplest implementation is one users table shared by all tenants. But this violates the isolation premise of database-per-tenant: the users table is not per-tenant.

### Warning Signs
- User authentication queries a central database, not the tenant database
- The users table is not in any tenant database
- User records lack `tenant_id` because the table is shared
- Authentication code runs before tenant initialization
- User data is accessible across tenant database boundaries

### Why Harmful
A shared user table undermines the isolation guarantee that justifies the complexity of database-per-tenant. User credentials and profile data are not isolated per tenant. A vulnerability in authentication code could expose all users across all tenants — exactly the cross-tenant access that per-tenant databases are designed to prevent.

### Real-World Consequences
- Data breach via authentication code exposes all tenants' user data
- Compliance requirement for per-tenant data isolation is violated for user data
- Authentication system cannot be scaled independently per tenant
- User enumeration across tenants: attacker can check if email exists in any tenant
- GDPR right-to-deletion cannot fully isolate because user data spans tenant boundary

### Preferred Alternative
Keep a central authentication database for login, but ensure user data is scoped per tenant. Or authenticate in the central DB, then tenant-scope all application data. Document this hybrid isolation model explicitly.

### Refactoring Strategy
1. Evaluate: is a shared users table acceptable for the isolation requirements?
2. If yes, document the hybrid model with security controls at the authentication boundary
3. If no, implement per-tenant user tables or tenant-scoped users within each database
4. For new tenants, create both the tenant database and user records within it
5. Implement a central "tenant router" database that maps users to their tenant
6. Ensure authentication queries use least-privilege credentials

### Detection Checklist
- [ ] Is there a single users table shared across all tenants?
- [ ] Is user data isolated per tenant or central?
- [ ] Does authentication code access tenant databases?
- [ ] Is the hybrid authentication model documented?
- [ ] Can a user from one tenant enumerate or access users from another tenant?

### Related Rules/Skills/Trees
- Design Authentication for Database-Per-Tenant Isolation (05-rules.md)
- Configure Database-Per-Tenant Pattern (06-skills.md)
- Multi-Tenant Authentication Architecture (06-skills.md)
