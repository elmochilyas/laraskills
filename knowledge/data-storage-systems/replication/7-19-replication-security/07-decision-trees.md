# Decision Trees for 7-19 Replication Security

## Metadata

| Field | Value |
|-------|-------|
| ID | 7-19 |
| Title | Replication Security |
| Decision Type | Replication |

## Decision Inventory

- D1: SSL/TLS encryption enforcement
- D2: Replication user permissions
- D3: Network access restriction approach

## Architecture-Level Decision Trees

### D1: SSL/TLS encryption enforcement

**Decision Context**: Configure and enforce SSL/TLS for replication connections.

**Criteria**:
- Network boundary (same VPC vs cross-region)
- Compliance requirements
- Certificate management capability

**Tree**:
```
Is replication across network boundaries?
├── Yes (cross-AZ, cross-region)
│   └── Enforce SSL with certificate verification
│       MASTER_SSL=1, MASTER_SSL_VERIFY_SERVER_CERT=1
└── No (same VPC/DC)
    └── SSL recommended but optional
        MASTER_SSL=1 (without verification for internal)
```

**Rationale**: Cross-network replication must be encrypted. Same-network encryption is recommended but the performance tradeoff may justify skipping for internal traffic.

**Default**: SSL/TLS with verification for all replication connections.

**Risks**: Expired certificates break replication. Implement certificate rotation monitoring.

**Related Rules/Skills**: 7-19-1 (always encrypt replication in transit), 7-19-2 (never use replication user for application access)

---

### D2: Replication user permissions

**Decision Context**: Create and manage replication user with minimum privileges.

**Criteria**:
- Security audit requirements
- Credential rotation frequency
- Multi-source channel count

**Tree**:
```
Create replication user:
└── Grant only REPLICATION SLAVE privilege
    CREATE USER 'repl'@'%' IDENTIFIED BY 'password' REQUIRE SSL;
    GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
```

**Rationale**: Replication needs only REPLICATION SLAVE privilege. Granting additional privileges (SUPER, ALL) is a security risk.

**Default**: Minimal privilege user with SSL requirement per connection.

**Risks**: Replication user with excessive privileges can be exploited if credentials are compromised.

**Related Rules/Skills**: 7-19-2 (never use replication user for application access)

---

### D3: Network access restriction approach

**Decision Context**: Restrict network access to replication ports.

**Criteria**:
- Network architecture
- Replica IP count and stability
- Cloud environment

**Tree**:
```
Is this a cloud environment?
├── Yes
│   └── Security group: allow only replica IPs on port 3306/5432
│   Use private subnet, not public internet
└── No (on-premise)
    └── Firewall: allow only specific replica IP ranges
        VPN or private network for cross-DC replication
```

**Rationale**: Network-level access control is the first line of defense. Replication ports should only be accessible from known replica IPs.

**Default**: IP-restricted security groups/firewall rules for replication port access.

**Risks**: Publicly exposed replication ports allow anyone to attempt connection. Always enforce SSL.

**Related Rules/Skills**: 7-19-1 (always encrypt replication in transit)

---
