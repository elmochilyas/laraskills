# Rules: Vault Secrets Management

## VAULT-001: Vault SDK Over CLI
**Condition:** Laravel integrates with vault service
**Action:** Use vault SDK for runtime secret fetching, not CLI execution
**Rationale:** CLI calls add subprocess overhead and require CLI binary on server
**Consequences:** Violation degrades application performance and adds deployment dependency

## VAULT-002: Cache Vault Responses
**Condition:** Runtime vault secret fetching implemented
**Action:** Cache fetched secrets in Laravel cache with appropriate TTL
**Rationale:** Vault API latency on every request degrades application response time
**Consequences:** Violation adds 50-200ms latency to every request that accesses secrets

## VAULT-003: Graceful Degradation
**Condition:** Application depends on vault for secrets
**Action:** Implement fallback to cached secrets when vault is unreachable
**Rationale:** Vault outage should not cause full application outage
**Consequences:** Violation makes application availability dependent on vault availability

## VAULT-004: Audit Log Review
**Condition:** Vault service in use
**Action:** Review vault access logs monthly
**Rationale:** Unauthorized vault access is undetected without audit review
**Consequences:** Violation allows undetected credential exfiltration
