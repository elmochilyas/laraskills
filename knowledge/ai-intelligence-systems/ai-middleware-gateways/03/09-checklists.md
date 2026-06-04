# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-middleware-gateways
**Knowledge Unit:** ku-03
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Encrypt keys at rest
- [ ] Implement key rotation automation.
- [ ] Monitor key usage anomalies.
- [ ] Never store keys in code, config files, or environment variables
- [ ] Use a separate key per application or environment.
- [ ] API keys are stored in a secrets manager, not in code or config files.
- [ ] Key revocation propagates to all gateway instances with <10s delay.
- [ ] Key rotation is automated with configurable schedule (default 90 days).
- [ ] Rules for API Key Management
- [ ] API keys are stored in a secrets manager, not in code or config files
- [ ] Key revocation propagates to all gateway instances with <10s delay
- [ ] Key rotation is automated with configurable schedule (default 90 days)
- [ ] **Audit key access**: Regularly review key inventory, revoke unused keys, and verify that no keys are hardcoded or exposed in repositories (automated scanning).
- [ ] **Automate key rotation**: Schedule key rotation every 90 days (or as required by provider). The rotation process: generate new key â†’ validate against provider â†’ update vault â†’ wait for cache TTL expiry â†’ revoke old key.
- [ ] **Cache keys in memory**: At application startup, fetch all keys from the vault and cache in-memory with a 5-15 minute TTL. Implement a refresh mechanism for emergency revocation.
- [ ] 100% of production keys are stored in secrets manager with encryption at rest
- [ ] Compromised key response (detect â†’ revoke â†’ rotate) completes within 5 minutes
- [ ] Key revocation propagates to all gateway instances within 10 seconds

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering

---

# Implementation Checklist

- [ ] Encrypt keys at rest
- [ ] Implement key rotation automation.
- [ ] Monitor key usage anomalies.
- [ ] Never store keys in code, config files, or environment variables
- [ ] Use a separate key per application or environment.
- [ ] **Audit key access**: Regularly review key inventory, revoke unused keys, and verify that no keys are hardcoded or exposed in repositories (automated scanning).
- [ ] **Automate key rotation**: Schedule key rotation every 90 days (or as required by provider). The rotation process: generate new key â†’ validate against provider â†’ update vault â†’ wait for cache TTL expiry â†’ revoke old key.
- [ ] **Cache keys in memory**: At application startup, fetch all keys from the vault and cache in-memory with a 5-15 minute TTL. Implement a refresh mechanism for emergency revocation.
- [ ] **Configure key pooling**: For providers with multiple keys (for higher rate limits), implement a `KeyPool` with round-robin or least-used selection. Skip keys that have exhausted their quota.
- [ ] **Implement key revocation**: Create a revocation procedure that immediately invalidates a compromised key: update vault â†’ set short cache TTL (30s) â†’ force cache refresh on all instances â†’ verify old key is no longer used.
- [ ] **Implement key vault adapter**: Create a `KeyVault` interface with `get(keyId)`, `rotate(keyId)`, `revoke(keyId)`, `list()`. Implement for your chosen secrets manager (Vault, AWS, Azure).
- [ ] **Implement per-key quota enforcement**: Track usage per key (requests, tokens, cost). Enforce limits before dispatching requests. Alert when a key approaches its quota.

---

# Performance Checklist

- [ ] For high-throughput systems, use **local memory cache** for keys with periodic refresh from the vault.
- [ ] Key pooling with 10+ keys requires efficient selection to avoid O(n) scans. Use an index of available keys.
- [ ] Key rotation should be **event-driven, not time-based.** Rotate on key expiry notifications or security events.
- [ ] Vault reads add 10-50ms latency. Cache keys aggressively with a TTL of 5-15 minutes.
- [ ] Cache refresh: scheduled TTL expiry, not per-request vault calls
- [ ] Key pool selection: O(1) with round-robin, O(n) with quota-aware selection
- [ ] Memory: keys cached in memory, typically <10KB total for all keys
- [ ] Vault read: 10-50ms. Cache aggressively with in-memory storage â€” key lookup should be <1ms

---

# Security Checklist

- [ ] Audit log integrity:
- [ ] Compromised key response:
- [ ] Key leak detection:
- [ ] Least privilege:
- [ ] Revocation propagation:
- [ ] Git-secret scanning: use tools (truffleHog, git-secrets) to detect committed keys
- [ ] Implement least privilege: each key should have minimum permissions (specific models, read-only if applicable)
- [ ] Key pool selection: O(1) with round-robin, O(n) with quota-aware selection

---

# Reliability Checklist

- [ ] Caching keys without TTL â€” a rotated key continues to be used until the cache is cleared.
- [ ] Hardcoding API keys in source code and committing to git.
- [ ] Logging request bodies that contain API keys in headers or authentication fields.
- [ ] Not setting usage quotas â€” an application with a bug can burn through the monthly budget in minutes.
- [ ] Sharing a single production key across development and staging environments.

---

# Testing Checklist

- [ ] 100% of production keys are stored in secrets manager with encryption at rest
- [ ] API keys are stored in a secrets manager, not in code or config files
- [ ] API keys are stored in a secrets manager, not in code or config files.
- [ ] Compromised key response (detect â†’ revoke â†’ rotate) completes within 5 minutes
- [ ] Key revocation propagates to all gateway instances with <10s delay
- [ ] Key revocation propagates to all gateway instances with <10s delay.
- [ ] Key revocation propagates to all gateway instances within 10 seconds
- [ ] Key rotation completes automatically within schedule (every 90 days) with zero downtime
- [ ] Key rotation is automated with configurable schedule (default 90 days)
- [ ] Key rotation is automated with configurable schedule (default 90 days).

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Never store keys in code, config files, or environment variables
- [ ] Use a separate key per application or environment.

---

# Anti-Pattern Prevention Checklist

- [ ] [Transformation Mutating Original Request â€” Unexpected Side Effects]
- [ ] [No Transformation Validation â€” Malformed Requests Reach Provider]
- [ ] [Response Transformation Losing Provider-Specific Metadata]
- [ ] [Heavy Transformations Blocking Gateway Throughput]
- [ ] [Transformation Logic Not Reusable Across Routes]
- [ ] Client-Side Keys:
- [ ] Key Hoarding:
- [ ] Keys in .env Files:
- [ ] Manual Rotation:
- [ ] One Key to Rule Them All:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Never log API keys, even masked â€” key fragments can be used for brute force
- [ ] Runbook for key compromise: immediate revocation â†’ audit log review â†’ rotate all keys in the same vault

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


