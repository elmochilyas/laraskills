# Proxy pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** GoF Structural Patterns
- **Knowledge Unit:** Proxy
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand lazy loading and object lifecycle
- [ ] Know the difference between Proxy and Decorator patterns
- [ ] Familiar with virtual, protection, and remote proxy types

## Implementation Checklist
- [ ] Proxy implements the same interface as the real subject
- [ ] Virtual Proxy defers initialization until first access
- [ ] Protection Proxy checks authorization before delegating
- [ ] Remote Proxy handles network communication transparently
- [ ] Proxy doesn't modify behavior beyond control/access purpose
- [ ] PHP 8.1 lazy objects considered for native proxy support

## Verification Checklist
- [ ] Proxy implements full subject interface (no bypass through unimplemented methods)
- [ ] Virtual Proxy doesn't initialize eagerly (defeats purpose)
- [ ] Protection Proxy authorization logic stays current (not stale)
- [ ] Remote Proxy has timeout/retry (doesn't hang on remote failure)
- [ ] Proxy doesn't modify behavior beyond control (no confusing side effects)
- [ ] Proxy vs Decorator correctly identified (control vs enhancement)

## Security Checklist
- [ ] Protection Proxy applies authorization correctly
- [ ] Remote Proxy handles remote failures securely (no data leak)
- [ ] Virtual Proxy doesn't expose sensitive data during deferred init
- [ ] Proxy doesn't bypass security controls of real subject

## Performance Checklist
- [ ] Virtual Proxy: null-check on every method call until initialized
- [ ] Protection Proxy: adds authorization call on each method invocation
- [ ] Remote Proxy: adds network latency and potential serialization overhead
- [ ] PHP 8.1 lazy objects: native proxy support, no custom classes needed
- [ ] Eloquent lazy loading: lazy proxies add per-property access check

## Production Readiness Checklist
- [ ] Proxy only used where access control/deferred init is needed
- [ ] Protection Proxy authorization logic tested
- [ ] Remote Proxy timeout and retry configured
- [ ] Proxy performance overhead measured and acceptable

## Common Mistakes to Avoid
- [ ] Not implementing full interface on Proxy (missing methods bypass proxy control)
- [ ] Virtual Proxy that initializes anyway (defeats purpose)
- [ ] Protection Proxy with stale authorization logic (permissions changed but proxy didn't)
- [ ] Remote Proxy without timeout/retry (hanging requests when remote is down)
- [ ] Proxy that modifies behavior beyond control (confusing side effects)
- [ ] Using Proxy when Decorator is appropriate (control vs enhancement)
