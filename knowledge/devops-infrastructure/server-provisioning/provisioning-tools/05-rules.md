# Rules: Provisioning Tools

## PROV-001: Server Decomposition for Production
**Condition:** Provisioning a production Laravel server
**Action:** Decompose into at least app + database servers before production launch
**Rationale:** Single-server architecture couples scaling domains and creates single point of failure
**Consequences:** Violation requires downtime to re-architect; creates resource contention between PHP and database

## PROV-002: OPcache Configuration
**Condition:** PHP is installed on a production Laravel server
**Action:** Configure `opcache.memory_consumption` minimum 128MB, `opcache.revalidate_freq=0`
**Rationale:** Default SAPI settings are tuned for CLI, not production web serving
**Consequences:** Violation causes 5-10x performance degradation on Laravel production workloads

## PROV-003: PHP-FPM Calculation Required
**Condition:** Configuring PHP-FPM pool for production
**Action:** Calculate `pm.max_children` using memory-based formula, do not use defaults
**Rationale:** Default `pm.max_children=10` is safe for tiny servers but causes 502 errors under moderate traffic
**Consequences:** Violation leads to HTTP 502 errors and request queuing during traffic spikes

## PROV-004: Firewall Port Minimization
**Condition:** Server network configuration for production
**Action:** Allow only ports 22, 80, 443 from internet; all other services on private interfaces
**Rationale:** Public database or Redis ports are the most common attack vector for Laravel servers
**Consequences:** Violation exposes database and cache services to internet-wide scanning

## PROV-005: Automated Security Patches
**Condition:** Production server provisioned
**Action:** Enable unattended-upgrades for security patches with email failure notifications
**Rationale:** Unpatched servers are the leading cause of Laravel infrastructure compromises
**Consequences:** Violation leaves known CVEs unpatched until manual intervention

## PROV-006: SSH Key-Only Authentication
**Condition:** SSH access configured on production server
**Action:** Disable password authentication and root login; use ed25519 keys
**Rationale:** Password-based SSH is the most consistently exploited attack vector
**Consequences:** Violation enables brute-force SSH attacks against production servers
