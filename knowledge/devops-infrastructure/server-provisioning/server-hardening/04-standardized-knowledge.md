# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 01-server-provisioning
**Knowledge Unit:** server-hardening
**Difficulty:** Intermediate
**Category:** Security & Hardening
**Last Updated:** 2026-06-03

# Overview

Server hardening encompasses OS-level security configurations applied to production Laravel servers: SSH hardening, firewall rules, brute-force protection, automatic security patching, system auditing, and filesystem security. The goal is defense-in-depth security without degrading operational capabilities.

Server hardening exists because default OS installations prioritize accessibility over security. The engineering value is preventing the most common infrastructure attack vectors — SSH brute force, exposed services, unpatched CVEs — before they become incidents. Hardening is the infrastructure equivalent of input validation: a baseline prerequisite, not an optional enhancement.

Engineers should care because a compromised server means compromised application data. Server hardening is the first line of defense, operating below the application layer where Laravel's security features (Gates, Policies, validation) cannot protect.

# Core Concepts

## Defense in Depth
Multiple independent security layers ensure that if one layer fails, the next contains the breach. Server hardening layers from outside in: network firewall → OS firewall → SSH access → process isolation → filesystem permissions → audit logging.

## Attack Surface Minimization
Every running service, open port, and installed package is a potential attack vector. Hardening systematically reduces the attack surface by disabling unnecessary services, minimizing open ports, and removing unused software.

## Principle of Least Privilege
Every user, process, and service should have the minimum permissions required to function. This limits the blast radius of any compromise.

## Configuration Drift
Hardening is not a one-time activity. Servers drift from hardened baselines over time through updates, manual interventions, and configuration changes. Continuous verification is required.

# When To Use

- Every production Laravel server, regardless of scale
- Staging servers that handle real or production-like data
- Development servers accessible from the internet
- Servers subject to compliance requirements (PCI-DSS, SOC2, HIPAA)
- Multi-tenant servers where site isolation is critical

# When NOT To Use

- Ephemeral containers (Docker, Kubernetes pods) where hardening is applied at the image level
- Fully managed PaaS (Vapor, Cloud, Heroku) where OS-level access is unavailable
- Short-lived CI/CD runners where the server is destroyed after each job
- Environments already hardened by cloud provider security groups with equivalent controls

# Best Practices

**Harden at Provisioning Time.** Integrate hardening into the provisioning script rather than applying it as a separate step. This ensures every server starts hardened. Retrospective hardening almost always misses servers.

**Use Configuration Management.** Enforce hardening through Ansible, Chef, or Forge recipes, not through manual SSH. This provides audit trail, version control, and automated drift detection.

**Test Hardening Controls.** Run automated tests that verify each hardening control is active. A misconfigured firewall is worse than no firewall because it creates a false sense of security.

**Document Break-Glass Procedures.** Hardened servers can cause operational emergencies when legitimate access is blocked. Document fallback procedures for SSH key loss, firewall lockouts, and fail2ban false positives.

# Architecture Guidelines

Server hardening must not prevent legitimate operations. Whitelist CI/CD IPs in fail2ban, document SSH key rotation procedures, and configure firewall rules to support deployment workflows.

Private networking between servers reduces the attack surface for inter-service communication. Database servers should not have public IPs. Redis and internal APIs should communicate over private networks or VPNs.

Audit logging should ship to a centralized, immutable log store. Local logs are useful for immediate troubleshooting but can be tampered with by an attacker who gains root access.

# Performance Considerations

**Auditd Log Volume.** Overly broad audit rules generate gigabytes of logs per day, consuming disk I/O and storage. Scope audit rules to security-relevant events only.

**Fail2ban False Positives.** Aggressive fail2ban settings (short find time, long ban time) can lock out legitimate users during deployment bursts or load testing. Tune based on actual traffic patterns.

**Firewall Rule Order.** Most firewalls evaluate rules sequentially. Place frequently matched rules (allow established connections) early in the rule set to minimize processing overhead.

**Unattended-Upgrades Scheduling.** Run security patches during maintenance windows. Package updates can trigger service restarts that cause brief downtime.

# Security Considerations

**SSH Hardening Is Non-Negotiable.** Disable password authentication, disable root login, use ed25519 keys. This prevents the most common brute-force and credential-stuffing attacks against production servers.

**Fail2ban Provides False Confidence Without Testing.** A fail2ban configuration that works on the test server may fail on production due to different log paths, service names, or journald configurations. Always test fail2ban on each unique server configuration.

**Auditd Disk Exhaustion.** Without disk space limits, auditd fills the system partition, crashing the server. Configure `max_log_file`, `space_left_action`, and `admin_space_left_action` in `/etc/audit/auditd.conf`.

**Unattended-Upgrades Risk.** Automatic patches can break application compatibility. Pin critical packages (PHP, Nginx) and test upgrades on staging before production. Configure email notifications for upgrade failures.

# Common Mistakes

**Password Auth for Break-Glass.** Teams disable password auth for regular users but leave it enabled for a break-glass "admin" account. Attackers find this account and brute-force it. All accounts must use key-based auth, including break-glass accounts.

**Firewall Without Default-Deny.** Configuring a firewall with only allow rules and no default-deny policy. This leaves any unconsidered port exposed. Always set `ufw default deny incoming`.

**Fail2ban Without Whitelist.** Locking out the deployment server or CI/CD runners through fail2ban. Always whitelist trusted IPs before enabling fail2ban jails.

**Auditd with No Rotation.** Enabling system auditing without configuring log rotation. The audit log fills the disk, causing system-wide failures.

# Examples

**Hardened SSH Config:**
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthenticationMethods publickey
Protocol 2
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 0
```

**UFW Firewall:**
```
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp  # or custom SSH port
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

# Related Topics

**Prerequisites:** Linux administration basics, SSH concepts
**Closely Related:** Provisioning Tools (applies hardening at setup), Security Hardening (application-level), Environment & Secret Management
**Advanced Follow-Ups:** CIS Benchmark Compliance, Intrusion Detection (OSSEC/Wazuh), Zero-Trust Networking
**Cross-Domain Connections:** Infrastructure Security, Compliance Engineering

# AI Agent Notes

- Server hardening must be applied during provisioning, not as a separate step. AI agents should include hardening directives in provisioning scripts.
- Fail2ban configuration is server-specific (log paths differ by OS version). Agents must verify fail2ban configuration on target OS.
- Automatic security patching is recommended but must exclude kernel and critical service packages that require reboot. Agents should configure package pinning.
- Auditd rules should be scoped to authentication, privilege escalation, and file access events. System call auditing is too noisy for most environments.
