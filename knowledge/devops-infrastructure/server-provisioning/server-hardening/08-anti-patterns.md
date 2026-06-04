# Anti-Patterns: Server Hardening

## AP-HARD-001: Hardening Theater
**Description:** Applying security configurations that look good on a checklist but provide no actual protection. Example: setting a complex SSH port but leaving password authentication enabled.
**Why it happens:** Compliance checklists incentivize checking boxes over actual security.
**Consequences:** The organization believes it is secure while critical vulnerabilities remain. The SSH port change (security through obscurity) is bypassed by password auth.
**Remediation:** Verify every hardening control actually blocks the intended attack. Test controls with the same tools attackers use.

## AP-HARD-002: Hardening by Default-Deny Everything
**Description:** Blocking all non-essential services and ports without considering operational needs, then discovering that monitoring agents, backup systems, and CI/CD pipelines no longer work.
**Why it happens:** Security teams optimize for "most secure" without consulting operations.
**Consequences:** Operations bypass security controls to get work done, creating worse security than if hardening had been moderate. Shadow IT configures unmonitored services on non-standard ports.
**Remediation:** Design hardening in collaboration with operations. Whitelist known requirements before enabling default-deny policies. Document the exception process.

## AP-HARD-003: Set-and-Forget Hardening
**Description:** Applying hardening once during initial provisioning and never reviewing or updating it as the server evolves.
**Why it happens:** Hardening is treated as a project milestone rather than a continuous process.
**Consequences:** New services added after provisioning run on unhardened configurations. Software updates reset hardened configurations. New CVEs in services initially considered safe are not patched.
**Remediation:** Schedule quarterly hardening reviews. Use configuration management to enforce hardening continuously, not just at provisioning time.

## AP-HARD-004: The False Positive Cascade
**Description:** Aggressive fail2ban and firewall rules designed for maximum security that lock out legitimate users, support staff, and monitoring systems, causing more downtime than the attacks they prevent.
**Why it happens:** Security configurations are tuned in isolation without understanding operational patterns.
**Consequences:** Developers can't SSH in during incidents. Monitoring systems can't reach the server. False positive lockouts create second-order incident response chaos.
**Remediation:** Tune detection thresholds based on actual traffic patterns. Whitelist admin and CI/CD IPs. Monitor fail2ban logs for false positives and adjust.
