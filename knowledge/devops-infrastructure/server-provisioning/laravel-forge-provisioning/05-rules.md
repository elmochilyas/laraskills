# Rules: Laravel Forge Provisioning

## FORGE-001: OPcache Reset on Deploy
**Condition:** Deployment script runs on Forge-managed server
**Action:** Must include `php artisan opcache:clear` or equivalent mechanism
**Rationale:** Forge does not auto-reset OPcache; stale opcode causes silent serving of old code
**Consequences:** Violation leads to inconsistent application state across server fleet

## FORGE-002: Server Type Decomposition
**Condition:** Production deployment using Forge-managed server
**Action:** Decompose into minimum of app + database separation before production launch
**Rationale:** Coupling database and application creates scaling bottleneck and single point of failure
**Consequences:** Violation requires downtime to re-architecture; reverts the team to monolithic scaling

## FORGE-003: PHP-FPM Calculation
**Condition:** Configuring PHP-FPM on Forge server
**Action:** Calculate `pm.max_children` using formula: `(total_ram - os_ram - db_ram - redis_ram) / avg_php_process_size`
**Rationale:** Default settings are conservative and cause 502 errors under moderate traffic
**Consequences:** Violation causes server overload or underutilization; OOM kills PHP-FPM processes

## FORGE-004: Deployment Script Version Control
**Condition:** Creating or modifying Forge deployment script
**Action:** Store a copy in `deploy/deploy.sh` in the application repository
**Rationale:** Forge dashboard does not provide version history; recovery requires external backup
**Consequences:** Violation creates single point of failure for deployment configuration

## FORGE-005: No Manual SSH Edits
**Condition:** Server is managed by Forge
**Action:** Do not modify configuration files directly via SSH; use Forge dashboard or recipes
**Rationale:** Forge overwrites SSH-made changes on recipe reapplication; state becomes unpredictable
**Consequences:** Violation causes configuration drift; troubleshooting becomes impossible

## FORGE-006: Separate .env Per Server Type
**Condition:** Multi-server Forge architecture with decomposed server types
**Action:** Maintain separate `.env` files for each server type with only necessary credentials
**Rationale:** Database credentials on a web-only server unnecessarily expand the attack surface
**Consequences:** Violation increases blast radius of any server compromise

## FORGE-007: Managed Database for Production
**Condition:** Production Laravel application on Forge
**Action:** Use managed database service (RDS, DigitalOcean Managed DB) not Forge-provisioned DB
**Rationale:** Forge-provisioned databases lack automated backups, failover, and point-in-time recovery
**Consequences:** Violation risks permanent data loss on server failure

## FORGE-008: Monitoring Integration
**Condition:** Forge server serves production traffic
**Action:** Integrate Nightwatch or equivalent monitoring before going live
**Rationale:** Forge provisions infrastructure but does not monitor application health
**Consequences:** Violation means production issues detected via customer complaints, not alerts

## FORGE-009: SSH Key Rotation
**Condition:** Forge SSH key in use longer than 90 days
**Action:** Rotate SSH key and update in Forge dashboard
**Rationale:** Stale keys increase risk window for credential compromise
**Consequences:** Violation leaves backdoor access after key compromise
