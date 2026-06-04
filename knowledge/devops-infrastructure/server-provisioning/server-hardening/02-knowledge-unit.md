# Server Hardening

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Server Provisioning
- **Knowledge Unit:** Server Hardening
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Server hardening applies OS-level security configurations to production Laravel servers including SSH hardening, firewall rules, brute-force protection, automatic patching, and filesystem security. It provides defense-in-depth against common infrastructure attack vectors and is the infrastructure equivalent of input validation — a baseline prerequisite, not an optional enhancement.

---

## Core Concepts

- **Defense in Depth** — Multiple independent security layers from network firewall to audit logging ensure that if one layer fails, the next contains the breach
- **Attack Surface Minimization** — Every running service, open port, and installed package is a potential attack vector; systematically reduce to minimum
- **Principle of Least Privilege** — Every user, process, and service should have minimum permissions required to function, limiting compromise blast radius
- **Configuration Drift** — Hardening is not a one-time activity; servers drift from hardened baselines through updates, manual interventions, and configuration changes

---

## Mental Models

- **Hardening as Input Validation** — Just as you validate all user input, you must harden all servers. It is a prerequisite, not an optional enhancement.
- **Onion Layers** — Security layers from outside in: network firewall → OS firewall → SSH access → process isolation → filesystem permissions → audit logging. Breach any layer and the next one still protects.
- **Hardening at Provisioning Time** — Integrate hardening into provisioning scripts so every server starts hardened. Retrospective hardening almost always misses servers.

---

## Internal Mechanics

Server hardening applies a sequence of configuration changes to the OS and installed services. SSH hardening modifies `/etc/ssh/sshd_config` to disable password auth, disable root login, and restrict authentication methods. Firewall configuration (UFW or iptables) sets default-deny incoming policy and allows only necessary ports. Fail2ban installs jails that monitor log files for brute-force patterns and temporarily ban offending IPs. Unattended-upgrades configures automatic security patching with notification. Auditd installs rules for monitoring security-relevant events. Each control must be verified independently because a misconfigured firewall creates a false sense of security.

---

## Patterns

- **Hardening Modules in Provisioning** — Include hardening as a module in the provisioning script or tool recipe; never apply hardening as a separate step that can be skipped
- **Firewall Default-Deny** — Always set default-deny incoming policy; any port not explicitly allowed is blocked. This prevents unconsidered services from being exposed.
- **SSH Break-Glass Procedure** — Document fallback procedures for SSH key loss, firewall lockouts, and fail2ban false positives. Ensure break-glass accounts also use key-based auth.

---

## Architectural Decisions

- **Hardening at Provisioning vs. Post-Hoc** — Apply hardening during provisioning to ensure every server starts secure. Post-hoc hardening inevitably misses servers and creates gaps.
- **Audit Logging Destination** — Ship audit logs to a centralized, immutable log store. Local logs can be tampered with by an attacker with root access.
- **Automatic vs. Manual Patching** — Enable unattended-upgrades for security patches but pin critical packages (PHP, Nginx) and test on staging before production.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Prevents most common attack vectors | Operational friction when legitimate access blocked | Document break-glass procedures |
| Defense-in-depth against breaches | Overly broad audit rules generate GBs of logs per day | Scope audit rules to security-relevant events only |
| Automated patching reduces window of exposure | Package updates can trigger service restarts causing downtime | Schedule patches during maintenance windows; pin critical packages |
| Fail2ban prevents brute-force attacks | Aggressive settings lock out legitimate users during deploys | Whitelist trusted IPs; tune based on actual traffic patterns |

---

## Performance Considerations

Overly broad auditd rules generate gigabytes of logs per day, consuming disk I/O and storage. Scope rules to authentication, privilege escalation, and file access events. Aggressive fail2ban settings (short find time, long ban time) can lock out legitimate users during deployment bursts. Firewall rule ordering matters — place frequently matched rules (allow established connections) early. Unattended-upgrades should run during maintenance windows to avoid unexpected service restarts.

---

## Production Considerations

SSH hardening is non-negotiable: disable password authentication, disable root login, use ed25519 keys. Fail2ban configuration is server-specific because log paths differ by OS version — always test on each unique server configuration. Auditd requires log rotation configuration to prevent disk exhaustion. Whitelist CI/CD IPs in fail2ban before enabling jails. Private networking between servers reduces attack surface for inter-service communication — database servers should not have public IPs.

---

## Common Mistakes

- **Password Auth for Break-Glass** — Disabling password auth for regular users but leaving it enabled for a break-glass admin account. Attackers find and brute-force this account. All accounts must use key-based auth.
- **Firewall Without Default-Deny** — Configuring only allow rules without default-deny policy. Any unconsidered port remains exposed. Always set `ufw default deny incoming`.
- **Fail2ban Without Whitelist** — Locking out deployment servers or CI/CD runners. Always whitelist trusted IPs before enabling fail2ban jails.
- **Auditd With No Rotation** — Enabling system auditing without configuring log rotation causes disk exhaustion and system-wide failures.

---

## Failure Modes

- **Firewall Lockout** — Misconfigured firewall blocks legitimate SSH access. Detection: cannot SSH into server. Mitigation: use out-of-band access (console, IPMI) or pre-configured break-glass procedure.
- **Fail2ban False Positive** — Legitimate deployment traffic triggers fail2ban ban. Detection: CI/CD pipeline fails with SSH connection timeout. Mitigation: whitelist CI/CD IPs, monitor fail2ban logs for false positives.
- **Auditd Disk Exhaustion** — Audit logs fill system partition. Detection: `df -h` shows 100% usage, system alerts. Mitigation: configure `max_log_file`, `space_left_action`, and log rotation.
- **Unpatched CVE After OS Upgrade** — Package pinning prevents critical security patch. Detection: vulnerability scanner reports known CVE. Mitigation: actively manage pinned packages, review monthly.

---

## Ecosystem Usage

Server hardening is applied during the provisioning phase of Laravel infrastructure setup. Forge applies basic firewall and SSH hardening during provisioning. Forge recipes can include custom hardening steps. Ansible playbooks for Laravel server setup typically include a hardening role. Hardening is a prerequisite for compliance frameworks (PCI-DSS, SOC2, HIPAA) that Laravel applications may need to satisfy. Security scanning tools (Wazuh, OSSEC) validate hardening controls post-deployment.

---

## Related Knowledge Units

### Prerequisites
- Linux administration basics, SSH concepts

### Related Topics
- Provisioning Tools (applies hardening at setup time)
- Environment & Secret Management
- Security Hardening (application-level)

### Advanced Follow-up Topics
- CIS Benchmark Compliance
- Intrusion Detection (OSSEC/Wazuh)
- Zero-Trust Networking

---

## Research Notes

Server hardening must be applied during provisioning, not as a separate step. Fail2ban configuration is server-specific (log paths differ by OS version) — verify on each target OS. Automatic security patching is recommended but must exclude kernel and critical service packages that require reboot. Auditd rules should be scoped to authentication, privilege escalation, and file access events; system call auditing is too noisy for most environments.
