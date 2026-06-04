# Skills: Server Hardening

## Skill: server-security-hardening
**Purpose:** Apply comprehensive OS-level security hardening to a production Laravel server
**Trigger:** When provisioning a new server or auditing existing server security
**Workflow:**
1. Harden SSH configuration (key-only auth, disable root, custom port if desired)
2. Configure UFW firewall with default-deny policy and minimal port exposure
3. Install and configure fail2ban with custom SSH jail and whitelist entries
4. Enable unattended-upgrades for security patches with failure notifications
5. Configure auditd for authentication and privilege escalation monitoring
6. Lock down filesystem (/tmp noexec, read-only partitions)
7. Set up log shipping for centralized audit review
**Output:** Hardened server configuration verified against security baseline

## Skill: security-baseline-audit
**Purpose:** Audit existing Laravel servers against hardened security baseline
**Trigger:** When performing security review or compliance audit
**Workflow:**
1. Run SSH configuration check (password auth, root login, protocol version)
2. Scan open ports with nmap from external perspective
3. Verify fail2ban jails active and whitelist correct
4. Check unattended-upgrades status (last run, pending updates)
5. Review auditd configuration and log volume
6. Check filesystem mount options for security flags
7. Generate audit report with pass/fail for each control
**Output:** Security baseline audit report with remediation recommendations
