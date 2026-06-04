# Rules: Server Hardening

## HARD-001: SSH Password Authentication Prohibition
**Condition:** SSH access configured on production Laravel server
**Action:** Set `PasswordAuthentication no` and `PermitRootLogin no` in sshd_config
**Rationale:** Password-based SSH is the most exploited attack vector for internet-facing servers
**Consequences:** Violation leaves server vulnerable to automated brute-force attacks

## HARD-002: Default-Deny Firewall
**Condition:** Network firewall configured on production server
**Action:** Set default policy to deny incoming, only allow specific required ports
**Rationale:** Default-allow exposes any service that is accidentally left listening
**Consequences:** Violation creates undetected attack surface from forgotten services

## HARD-003: Fail2ban Whitelist Required
**Condition:** Fail2ban enabled on production server
**Action:** Whitelist all trusted IPs (office, VPN, CI/CD runners) before enabling jails
**Rationale:** Deployment bursts and administrative access trigger fail2ban thresholds
**Consequences:** Violation locks out legitimate users and automated deployment systems

## HARD-004: Auditd Disk Limits
**Condition:** System auditing (auditd) configured on production server
**Action:** Configure `max_log_file`, `space_left_action`, and `admin_space_left_action`
**Rationale:** Unbounded audit logs fill system partition and crash the server
**Consequences:** Violation causes disk-full system failures during security incident

## HARD-005: Unattended-Upgrades Failure Notification
**Condition:** Automatic security patching configured
**Action:** Configure email or alert notification for upgrade failures
**Rationale:** Silent patch failures leave servers vulnerable indefinitely
**Consequences:** Violation means unpatched CVEs go undetected until audit

## HARD-006: Hardening at Provisioning Time
**Condition:** New server being provisioned for Laravel
**Action:** Include hardening steps in provisioning script, not as separate procedure
**Rationale:** Retrospective hardening misses servers and creates inconsistent security posture
**Consequences:** Violation results in unhardened servers in production fleet

## HARD-007: Private Network for Internal Services
**Condition:** Multi-server Laravel architecture
**Action:** Database, Redis, and internal API services must listen only on private network
**Rationale:** Public exposure of database or cache ports enables remote data access
**Consequences:** Violation allows direct database access from any internet host
