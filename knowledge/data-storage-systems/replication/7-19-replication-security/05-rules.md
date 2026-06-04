# 7-19 Replication Security - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | replication |
| Knowledge Unit ID | 7-19 |
| Knowledge Unit | 7-19 Replication Security |
| Total Rules | 3 |
| Generated | 2026-06-04 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Always Encrypt Replication In Transit
---
## Security
---
## Rule
Always encrypt all replication traffic using TLS/SSL, especially across network boundaries.
---
## Reason
Unencrypted replication exposes all database data to anyone with network access to the replication stream.
---
## Bad Example
Setting up cross-region replication without SSL enabled.
---
## Good Example
CHANGE MASTER TO MASTER_SSL=1, MASTER_SSL_CA='/path/to/ca.pem';
---
## Exceptions
Loopback replication on the same host (no network exposure).
---
## Consequences Of Violation
Data breach — replication stream carries all database changes in plain text.

---

## 2. Never Use Replication User for Application Access
---
## Security
---
## Rule
Never use the replication user or its credentials for application database access.
---
## Reason
Replication user has special privileges that should not be exposed to application code. Compromise of app credentials could lead to replication compromise.
---
## Bad Example
Using the same user for application queries and replication.
---
## Good Example
Separate users: 'app_user' for application (SELECT, INSERT, UPDATE), 'repl_user' for replication (REPLICATION SLAVE).
---
## Exceptions
None — users must always be separated by purpose.
---
## Consequences Of Violation
Replication credentials leaked through application vulnerability allows unauthorized data access.

---

## 3. Always Restrict Replication Port Access By IP
---
## Security
---
## Rule
Always restrict access to the database replication port (3306/5432) to only known replica IP addresses.
---
## Reason
Publicly exposed replication ports are a primary target for attackers.
---
## Bad Example
Opening port 3306 to 0.0.0.0/0 for replication.
---
## Good Example
Security group: allow replica IPs only. Private subnet for database nodes.
---
## Exceptions
None — network access control is a fundamental security layer.
---
## Consequences Of Violation
Unauthorized connection attempts, brute force attacks on replication port.

---
