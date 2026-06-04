# 7-19 Replication Security

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication |
| Knowledge Unit ID | 7-19 |
| Knowledge Unit Title | Replication Security |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 7.1 Master-replica topology | 7.12 Multi-region replication |
| Last Updated | 2026-06-04 |

## Overview

Securing replication involves encrypting data in transit with TLS, enforcing authentication for replication connections, restricting replication user permissions to minimum required, and implementing network-level access controls. Essential for compliance (PCI-DSS, HIPAA, SOC2) and preventing data breaches.

---

## Core Concepts

- **SSL/TLS encryption**: Replication data in transit must be encrypted, especially across network boundaries.
- **Replication user**: Dedicated user with only `REPLICATION SLAVE` privilege. Never share with application user.
- **Network access control**: Restrict replication port access to known replica IPs via security groups or firewalls.
- **Certificate management**: CA-signed or self-signed certificates for TLS. Must monitor expiration.
- **Authentication**: Replication user must authenticate with `REQUIRE SSL`.

## When To Use

- Setting up new replication
- Auditing security posture of existing replication
- Replication across network boundaries
- Compliance requirements

## When NOT To Use

- Local development or test environments (same machine)
- Single-node database (no replication)

## Best Practices

- Always encrypt replication in transit with TLS
- Use dedicated replication user with minimal grants
- Rotate replication credentials and certificates regularly

## Architecture Guidelines

| Security Layer | Cross-Region | Cross-AZ | Same VPC |
|---------------|-------------|----------|----------|
| TLS encryption | Mandatory | Recommended | Recommended |
| Certificate verification | Full | CA-only | Optional |
| Network ACL | IP-restricted | IP-restricted | Security group |
| User permissions | REPLICATION SLAVE only | REPLICATION SLAVE only | REPLICATION SLAVE only |

## Performance Considerations

- SSL adds 1-5% CPU overhead per replication connection
- TLS 1.3 is faster than TLS 1.2 (fewer round trips)
- Impact minimal for async replication (few connections)

## Security Considerations

- Replication user must authenticate with SSL
- Certificates stored securely with restricted permissions
- Monitor certificate expiration and rotation

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | SSL certificate expired | No expiration monitoring | Replication connection fails | Monitor cert expiry, auto-renew |
| 2 | Replication user with SUPER/ALL privileges | Copy-paste from tutorial | Security breach risk | Grant only REPLICATION SLAVE |
| 3 | Replication over public internet | Convenience | Data exposure | Use VPN or private network |

## Anti-Patterns

- Using application user for replication
- No encryption for cross-network replication
- Publicly exposed replication ports

## Verification

- [ ] SSL/TLS configured on primary and all replicas
- [ ] Replication uses SSL (verified in SHOW SLAVE STATUS)
- [ ] Replication user has only REPLICATION SLAVE
- [ ] Network restricted to necessary IPs/ports
- [ ] Certificate rotation documented
