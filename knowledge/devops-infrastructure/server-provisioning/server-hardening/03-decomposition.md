# Decomposition: Server Hardening

## Topic Overview
Server hardening encompasses OS-level security configurations applied to production Laravel servers: SSH hardening, firewall rules, brute-force protection, automatic security patching, system auditing, and filesystem security. The goal is defense-in-depth security without degrading operational capabilities.

## Decomposition Strategy
1. **Access control** — SSH configuration, key management, user permissions, break-glass procedures
2. **Network security** — firewall rules, port minimization, private networking, Fail2ban
3. **Patch management** — unattended-upgrades, staged rollouts, rollback procedures
4. **System auditing** — auditd rules, log aggregation, intrusion detection, alerting
5. **Filesystem hardening** — mount options, /tmp lockdown, read-only partitions

## Proposed Folder Structure
```
server-provisioning/
├── server-hardening/
│   ├── 01-knowledge-unit.md  (KU definition)
│   ├── 02-knowledge-unit.md  (detailed knowledge)
│   ├── 03-decomposition.md   (this file)
│   ├── 04-standardized-knowledge.md
│   └── templates/
│       ├── sshd-config.hardened
│       ├── ufw-rules.sh
│       └── auditd-rules.conf
```

## Knowledge Unit Inventory
- KU-002: Server Hardening — OS-level security, SSH, firewall, auditing, patching
- KU-001: Provisioning Tools — Forge, Ploi, server setup and management

## Dependency Graph
- **Prerequisites:** Basic Linux administration, SSH concepts, firewall fundamentals
- **Related:** Provisioning Tools (applies hardening), Environment Secrets (complementary security), K8s Orchestration (different hardening model for containers)
- **Extends:** OS security baseline → continuous vulnerability management

## Boundary Analysis
- **In scope:** OS-level hardening for Linux production servers, SSH configuration, firewall, auditing, patching
- **Out of scope:** Application-level security (covered by security hardening domain), network infrastructure security (WAF, CDN), compliance documentation
- **Adjacent:** Container security (different attack surface), cloud security groups (network-level complement)

## Future Expansion Opportunities
- Automated CIS benchmark compliance scanning
- Hardened server images (golden AMIs) with Packer
- Zero-trust networking integration (Tailscale, WireGuard VPN instead of public SSH)
- Compliance automation for PCI-DSS, SOC2, HIPAA server requirements
