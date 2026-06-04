# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Dependency Injection
**Knowledge Unit:** Over-Injection Anti-Pattern
**Generated:** 2026-06-03

---

# Decision Inventory

1. Refactoring Strategy: Group dependencies vs split class vs parameter object
2. Threshold Evaluation: When 5+ parameters are acceptable vs when to refactor
3. False Fix Detection: Constructor injection reduction vs service locator cover-up

---

# Architecture-Level Decision Trees

---

## Decision Name: Refactoring Strategy for Over-Injection

---

## Decision Context

Choosing the appropriate refactoring technique when a class has 5+ constructor parameters.

---

## Decision Criteria

* performance — grouping reduces resolution count; splitting increases it
* architectural — parameter object bundles config; facade service bundles behavior; split separates responsibilities
* security — each parameter is a potential attack surface; fewer parameters = easier audit
* maintainability — correct grouping creates clearer abstractions; wrong grouping adds indirection

---

## Decision Tree

Do the excessive parameters include config values (host, port, timeout, keys)?
↓
YES → Use Parameter Object pattern — bundle related config into a typed DTO
NO → Do the excessive parameters include behavioral services that change together (logger + metrics + tracer)?
↓
YES → Use Facade Service pattern — create a higher-level service that groups related services
NO → Does the class have multiple distinct responsibilities (order processing AND invoice generation)?
↓
YES → Split the class — separate each responsibility into its own focused class
NO → Do some parameters serve the same purpose (all notification-related: mail, SMS, push)?
↓
YES → Group into a higher-level service (e.g., `NotificationService`)
NO → Consider whether the class truly needs all dependencies — some may be unused (dead code)

---

## Rationale

Over-injection indicates a class violates the Single Responsibility Principle. Parameter objects bundle configuration values into a typed DTO. Facade services group behavioral services that change together (logger + metrics + tracer → `InfrastructureService`). Splitting the class along responsibility boundaries creates smaller, focused classes. The choice depends on whether the excess is in config values, behavioral services, or distinct responsibilities.

---

## Recommended Default

**Default:** Group related behavioral services into a higher-level abstraction; split the class if it has distinct responsibilities.
**Reason:** Grouping preserves existing architecture; splitting creates cleaner separation.

---

## Risks Of Wrong Choice

- Grouping unrelated dependencies into a "misc" parameter: opaque grouping hides responsibilities — makes things worse.
- Splitting at wrong boundary: same dependencies duplicated across split classes — increased complexity without benefit.
- Using Parameter Object for behavioral services: config objects should not contain service instances.

---

## Related Rules

- Limit constructor parameters to 4 or fewer (05-rules.md, Rule 1)
- Never fix over-injection by switching to service locator (05-rules.md, Rule 2)

---

## Related Skills

- Refactor Over-Injected Classes by Grouping Dependencies (06-skills.md)

---

## Decision Name: Threshold Evaluation

---

## Decision Context

Determining whether a class with 5+ constructor parameters genuinely needs refactoring or is an acceptable exception.

---

## Decision Criteria

* performance — parameter count does not directly affect performance
* architectural — orchestrator classes (controllers, facades) may legitimately need more dependencies
* security — each dependency is an attack surface; more deps = harder to secure
* maintainability — high parameter count correlates with SRP violations

---

## Decision Tree

Is the class an orchestrator (controller, HTTP client wrapper, pipeline)?
↓
YES → 5+ parameters may be acceptable — orchestrators coordinate multiple services by nature
NO → Does every parameter serve a distinct, non-groupable purpose?
↓
YES → Consider whether the class has too many responsibilities — even with distinct purposes, the class may do too much
NO → Does the class have cyclomatic complexity > 10 (many methods, branches)?
↓
YES → High correlation with over-injection — class likely does too much; refactor
NO → Are all 5+ parameters used in every method (not selectively)?
↓
YES → Even so, 5+ is a design smell — look for grouping or splitting opportunities
NO → Some parameters are only used in a few methods — consider moving those methods to a separate class

---

## Rationale

Parameter count is a heuristic, not an absolute rule. Some classes legitimately need many dependencies — an HTTP client wrapper may need config, logger, cache, serializer, and metrics. However, 5+ parameters is always a design smell worth investigating. The key questions are: can related dependencies be grouped? Does the class have more than one responsibility?

---

## Recommended Default

**Default:** 3-4 parameters maximum; 5+ requires documented justification.
**Reason:** Fewer parameters means clearer responsibilities; exceptions should be explicitly justified.

---

## Risks Of Wrong Choice

- Allowing 5+ without refactoring: maintainability debt grows as more parameters are added over time.
- Strictly enforcing 4-parameter rule on orchestrators: creates artificial grouping that obscures real dependencies.
- Not flagging in CI: over-injection goes unnoticed until class becomes unmaintainable.

---

## Related Rules

- Limit constructor parameters to 4 or fewer (05-rules.md, Rule 1)
- Never fix over-injection by switching to service locator (05-rules.md, Rule 2)

---

## Related Skills

- Refactor Over-Injected Classes by Grouping Dependencies (06-skills.md)
