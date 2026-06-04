# Skill: Implement Replication Security

## Purpose

Secure replication channels by encrypting data in transit, enforcing authentication, and restricting replication user permissions.

## When To Use

- Setting up new replication
- Auditing security posture of existing replication
- Replication across network boundaries (different AZs, regions, or VPCs)
- Compliance requirements (PCI-DSS, HIPAA, SOC2)

## When NOT To Use

- Local development or test environments (same machine)
- Single-node database (no replication)

## Prerequisites

- SSL/TLS certificates for all nodes
- Replication user created with appropriate grants
- Network access rules (security groups, firewalls)

## Inputs

- SSL/TLS certificates (CA, server cert, client cert, key)
- Replication user credentials
- Network topology and firewall rules

## Workflow (numbered steps)

1. Enable SSL/TLS for replication connections:
   - Generate or obtain SSL certificates for each node
   - For MySQL: `ssl_ca`, `ssl_cert`, `ssl_key` in my.cnf on primary and replica
   - For PostgreSQL: `ssl=on`, `ssl_ca_file`, `ssl_cert_file`, `ssl_key_file` in postgresql.conf
2. Configure replica to use SSL:
   ```sql
   CHANGE MASTER TO
     MASTER_SSL=1,
     MASTER_SSL_CA='/path/to/ca.pem',
     MASTER_SSL_CERT='/path/to/client-cert.pem',
     MASTER_SSL_KEY='/path/to/client-key.pem';
   ```
3. Enforce SSL if all nodes support it: `MASTER_SSL_VERIFY_SERVER_CERT=1`
4. Create dedicated replication user with minimum privileges:
   ```sql
   CREATE USER 'repl'@'%' IDENTIFIED BY 'secure_password' REQUIRE SSL;
   GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
   ```
5. Restrict network access:
   - Allow only replica IPs to connect to primary's replication port
   - Use private network (VPC) or VPN, not public internet
   - Use security groups or firewall rules to restrict access
6. Rotate replication credentials regularly
7. Monitor: verify replication is using SSL (`SHOW SLAVE STATUS` → `Master_SSL_Allowed: Yes`)

## Validation Checklist

- [ ] SSL/TLS configured on primary and all replicas
- [ ] Replication uses SSL (verified in SHOW SLAVE STATUS)
- [ ] Replication user has only REPLICATION SLAVE privilege
- [ ] Network restricted to necessary IPs/ports
- [ ] SSL certificate rotation procedure documented
- [ ] No replication over public internet (unless VPN/tunnel)

## Common Failures

- SSL certificate expired — replication connection fails
- Certificate Common Name (CN) doesn't match hostname — verification fails
- Self-signed certificates not trusted — use CA-signed or distribute CA cert
- Replication user has too many privileges (e.g. SUPER, ALL)
- Replication exposed to public internet without encryption

## Decision Points

- SSL verify mode (disable vs verify CA vs verify full identity)
- Certificate rotation frequency
- Private CA vs public CA vs cloud CA (AWS ACM, GCP Certificate Manager)

## Performance Considerations

- SSL adds 1-5% CPU overhead per replication connection
- TLS 1.3 is faster than TLS 1.2 (fewer round trips)
- Impact is minimal for async replication (few connections)
- For many replicas, SSL overhead increases on primary (one SSL connection per replica)

## Security Considerations

- Replication user must authenticate with SSL (REQUIRE SSL in CREATE USER)
- Certificates must be stored securely with restricted file permissions
- Key rotation procedure must be documented and tested
- Log replication user access attempts

## Related Rules

- 7-19-1: Always Encrypt Replication In Transit
- 7-19-2: Never Use Replication User for Application Access

## Related Skills

- Implement SSL/TLS for Database Connections
- Configure Firewall Rules for Database Access
- Manage Database User Permissions

## Success Criteria

- All replication channels use SSL/TLS
- Replication user has minimal required privileges
- Network access restricted to only required IPs and ports
- Certificate rotation procedure tested and documented
