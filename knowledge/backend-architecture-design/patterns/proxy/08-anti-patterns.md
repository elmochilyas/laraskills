# Proxy — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Proxy pattern in PHP/Laravel context |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Not Implementing Full Interface on Proxy | Critical |
| 2 | Virtual Proxy That Initializes Anyway | High |
| 3 | Protection Proxy with Stale Authorization Logic | High |
| 4 | Remote Proxy Without Timeout/Retry | Critical |
| 5 | Using Proxy When Decorator Is Appropriate | Medium |

---

## 1. Not Implementing Full Interface on Proxy

### Category
Architecture

### Description
The proxy does not implement the complete interface of the subject, leaving some methods unproxied and bypassing proxy controls.

### Why It Happens
Proxy is created to control access to certain methods. Other methods are left unimplemented.

### Warning Signs
- Proxy implements only part of the subject's interface
- Some methods bypass proxy control (auth, lazy loading)
- Callers accessing the subject directly for unimplemented methods
- `BadMethodCallException` for missing proxy methods

### Why Harmful
Incomplete proxy breaks the pattern's transparency. Clients must know which methods are proxied and access the subject directly for others.

### Consequences
- Inconsistent access control
- Lazy loading bypassed
- Client must know proxy limitations
- Pattern transparency lost

### Alternative
Proxy must implement the full subject interface. Uncontrolled methods should still delegate, just without added logic.

### Refactoring Strategy
1. Identify missing interface methods
2. Implement all methods (delegate or add control)
3. Update callers to use proxy only
4. Test full interface compliance

### Detection Checklist
- [ ] Compare proxy methods to subject interface
- [ ] Check for bypassed proxy methods
- [ ] Verify full interface implementation

### Related Rules/Skills/Trees
- Skills: Proxy, Interface Segregation

---

## 2. Virtual Proxy That Initializes Anyway

### Category
Performance

### Description
A virtual proxy (intended to defer object creation) initializes the real subject eagerly, defeating the purpose of lazy loading.

### Why It Happens
The proxy's constructor or early method calls trigger initialization.

### Warning Signs
- Real subject created in proxy constructor
- First method call initializes but method doesn't need subject
- Expected lazy behavior not observed
- Proxy overhead without lazy benefit

### Why Harmful
The performance benefit of deferred initialization is lost. The proxy adds overhead without the lazy benefit.

### Consequences
- No performance benefit
- Unnecessary overhead
- Wasted proxy pattern
- Misleading design

### Alternative
Initialize only when a method that requires the subject is called. Use PHP 8.1 lazy objects or custom initialization checks.

### Refactoring Strategy
1. Remove eager initialization from constructor
2. Add null check before each usage
3. Initialize on first real use
4. Test lazy behavior with profiling

### Detection Checklist
- [ ] Check proxy initialization timing
- [ ] Profile lazy vs eager behavior
- [ ] Verify deferred initialization

### Related Rules/Skills/Trees
- Skills: Proxy, Lazy Loading

---

## 3. Protection Proxy with Stale Authorization Logic

### Category
Reliability

### Description
A protection proxy caches or hard-codes authorization decisions that become stale as permissions change, serving incorrect access control.

### Why It Happens
Authorization logic is embedded in the proxy without considering permission changes.

### Warning Signs
- Authorization checked once and cached
- Hard-coded roles or permissions in proxy
- Permissions change but proxy still allows/denies
- Auth decisions not refreshed

### Why Harmful
Stale authorization allows access that should be denied (security issue) or denies access that should be allowed (usability issue).

### Consequences
- Security vulnerabilities
- User access issues
- Authorization drift
- False sense of security

### Alternative
Check authorization on every proxied call (or cache with short TTL). Use dedicated authorization service.

### Refactoring Strategy
1. Identify stale authorization logic
2. Move auth decisions to authorization service
3. Check permissions on each call
4. Or use short-lived cache
5. Test permission changes

### Detection Checklist
- [ ] Check authorization caching in proxy
- [ ] Test with changing permissions
- [ ] Verify access control freshness

### Related Rules/Skills/Trees
- Skills: Proxy, Authorization
- Decision Trees: Proxy vs Decorator

---

## 4. Remote Proxy Without Timeout/Retry

### Category
Reliability

### Description
A remote proxy (accessing a remote service) does not implement timeout or retry logic, causing hanging requests when the remote service is unavailable.

### Why It Happens
Remote proxy is treated as a simple pass-through. Network failure handling is overlooked.

### Warning Signs
- HTTP calls without timeout in proxy
- Application hangs when remote is down
- No retry on transient failures
- No circuit breaker integration

### Why Harmful
Without timeout, the application hangs indefinitely when the remote service is unresponsive. Without retry, transient failures cause unnecessary errors.

### Consequences
- Application hangs
- Resource exhaustion (blocked connections)
- Poor user experience
- Unnecessary failures

### Alternative
Implement configurable timeout, retry with backoff, and circuit breaker in the remote proxy.

### Refactoring Strategy
1. Add timeout to remote calls
2. Implement retry with exponential backoff
3. Add circuit breaker for persistent failures
4. Test remote failure scenarios
5. Log connection issues

### Detection Checklist
- [ ] Check for timeout configuration
- [ ] Verify retry/backoff logic
- [ ] Test remote failure scenarios

### Related Rules/Skills/Trees
- Skills: Proxy, Circuit Breaker, Retry Pattern
- Decision Trees: Remote Proxy Design

---

## 5. Using Proxy When Decorator Is Appropriate

### Category
Architecture

### Description
Using Proxy pattern for adding behavior (logging, caching, timing) when Decorator is the correct pattern — proxy is for control, decorator for enhancement.

### Why It Happens
The two patterns have similar structures. Developers use them interchangeably.

### Warning Signs
- "Adding behavior" described as primary purpose
- Control element (lazy, protection, remote) absent
- Enhancements (logging, caching, timing) as "proxy"
- No access control or lifecycle management

### Why Harmful
Using wrong pattern creates confusion about intent. Proxy implies control, Decorator implies enhancement.

### Consequences
- Pattern misuse
- Intent confusion
- Misleading design
- Maintenance confusion

### Alternative
Use Decorator for adding behavior/enhancements. Use Proxy for control (access, lifecycle, remote).

### Refactoring Strategy
1. Identify enhancement-only "proxies"
2. Rename to Decorator
3. Update documentation and comments
4. Ensure correct pattern semantics

### Detection Checklist
- [ ] Evaluate proxy vs decorator distinction
- [ ] Check for control vs enhancement intent
- [ ] Verify pattern semantic alignment

### Related Rules/Skills/Trees
- Skills: Proxy, Decorator
- Decision Trees: Proxy vs Decorator
