# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 01-server-provisioning
**Knowledge Unit:** server-hardening
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] SSH configuration hardened (key-only auth, disable root login, custom port or fail2ban)
- [ ] Firewall rules applied (UFW): port minimization for 22, 80, 443 only
- [ ] Fail2ban installed and configured for SSH brute-force protection
- [ ] Unattended-upgrades configured for automatic security patches
- [ ] System auditing enabled (auditd) with log aggregation
- [ ] Filesystem hardened (/tmp noexec, read-only partitions, mount options)

---

# Architecture Checklist

- [ ] Defense-in-depth model defined (OS + network + application security layers)
- [ ] Break-glass SSH access procedure documented (non-key auth fallback)
- [ ] Private networking configured for inter-server communication (no public DB ports)
- [ ] Audit trail architecture designed (auditd -> log aggregation -> alerting)

---

# Implementation Checklist

- [ ] `sshd_config` hardened (PermitRootLogin no, PasswordAuthentication no, Protocol 2)
- [ ] UFW rules applied (default deny incoming, allow 22/80/443, limit SSH)
- [ ] Fail2ban jail configured for SSH and optionally Nginx/http-auth
- [ ] unattended-upgrades installed with email notifications on failures
- [ ] auditd rules added for critical events (auth, file access, privilege escalation)

---

# Performance Checklist

- [ ] auditd rules scoped to avoid excessive logging volume
- [ ] Fail2ban ban time and find time tuned to avoid false positive lockouts
- [ ] Unattended-upgrades scheduled during maintenance windows
- [ ] Firewall rule order optimized (most frequent rules first for performance)

---

# Security Checklist

- [ ] SSH key-based authentication only (no password auth anywhere)
- [ ] Firewall verified (no unnecessary open ports via `ufw status` or `nmap`)
- [ ] Fail2ban active and tested (trigger ban, verify unban)
- [ ] Unattended-upgrades configured for stable/security only (no dist-upgrade)
- [ ] auditd active and log rotation configured
- [ ] /tmp mounted with noexec,nosuid options in `/etc/fstab`

---

# Reliability Checklist

- [ ] Fail2ban whitelist configured for trusted IPs (office VPN, CI/CD runners)
- [ ] SSH key rotation procedure documented for compromised key scenarios
- [ ] Unattended-upgrades failure notifications configured (email or alert)
- [ ] auditd disk space limits configured (`max_log_file`, `space_left_action`)
- [ ] Firewall rules backed up and recoverable

---

# Testing Checklist

- [ ] SSH password auth disabled and verified (attempt password login, confirm rejected)
- [ ] Firewall rules tested from external IP (port scan, confirm expected closed)
- [ ] Fail2ban tested (trigger repeated auth failures, verify ban)
- [ ] Unattended-upgrades dry-run executed to verify no breaking upgrades
- [ ] auditd events generated and verified in logs

---

# Maintainability Checklist

- [ ] Hardening scripts or Ansible playbooks version-controlled
- [ ] sshd_config backup stored before modifications
- [ ] Firewall rule changes tracked in changelog
- [ ] Server hardening checklist maintained for provisioning repeatability
- [ ] auditd rules documented with rationale for each monitoring rule

---

# Anti-Pattern Prevention Checklist

- [ ] No SSH password authentication enabled (even for "break-glass" accounts use keys)
- [ ] No UFW reset without re-applying rules (connectivity loss risk)
- [ ] No fail2ban without whitelisting CI/CD and trusted IPs
- [ ] No unattended-upgrades without testing on staging
- [ ] No auditd rules that fill disk and crash the server

---

# Production Readiness Checklist

- [ ] SSH key audit completed (keys inventoried, stale keys removed)
- [ ] Firewall rules validated against vulnerability scan
- [ ] Fail2ban monitoring integrated into alerting system
- [ ] Unattended-upgrades status checked (last run, pending updates)
- [ ] CIS benchmark baseline verified (at least Level 1)
- [ ] auditd log shipping configured (to centralized log system)

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: defense-in-depth defined and layered
- [ ] Security requirements satisfied: SSH, firewall, fail2ban, patching, auditing active
- [ ] Performance requirements satisfied: audit scope limited, fail2ban tuned
- [ ] Testing requirements satisfied: hardening controls verified (SSH, firewall, fail2ban)
- [ ] Anti-pattern checks passed: no password auth, no full disk from audit logs
- [ ] Production readiness verified: monitoring, backups, CIS baseline verified

---

# Related References

- Provisioning Tools (applies hardening)
- Environment Secrets (complementary security)
- K8s Orchestration (different hardening model for containers)
