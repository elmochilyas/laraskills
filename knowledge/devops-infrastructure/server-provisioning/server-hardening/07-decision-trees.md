# Decision Trees: Server Hardening

## Firewall Configuration

**Is this a single-server setup?**
- Yes → UFW with 22, 80, 443 from anywhere
- No → Proceed

**Are database/cache services on separate servers?**
- Yes → Allow internal traffic only on private IPs; no public ports for DB/Redis
- No → Database on app server, no public access needed

**Is cloud security group also configured?**
- Yes → Cloud SG handles network edge, UFW handles OS-level defense-in-depth
- No → UFW must be comprehensive; consider cloud SG for additional layer

## Fail2ban Configuration

**Expected admin access pattern:**
- From fixed office IPs → Whitelist IPs, aggressive banning for others
- From dynamic VPN → Realistic find time and ban time
- From anywhere (remote team) → Whitelist team IPs or use SSH tunneling

**CI/CD runners deployed:**
- GitHub Actions → Whitelist GitHub Actions meta IP range
- GitLab CI → Whitelist GitLab runner IPs
- Self-hosted runner → Whitelist runner IP or use agent-based auth

## Audit Logging Scope

**Compliance requirements:**
- SOC2 → Moderate audit scope (auth, config changes, privilege escalation)
- PCI-DSS → Comprehensive audit (file access, system calls, user actions)
- None → Minimal audit (auth failures, privilege changes)
