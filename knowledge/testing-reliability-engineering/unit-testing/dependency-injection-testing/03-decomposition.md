# Decomposition: Dependency Injection Testing (Null Driver Pattern)

## Topic Overview
The Null Driver pattern uses no-op implementations of external services to prevent real side effects during testing. It is essential for baseline testing safety and decoupled, testable code.

## Decomposition Strategy
This knowledge unit breaks down into three areas: (1) Laravel's built-in null drivers and configuration, (2) per-test fake overrides for interaction verification, and (3) custom null implementations via TestingServiceProvider.

## Proposed Folder Structure
```
ku-03-dependency-injection-testing/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory
| Component | Type | Description |
|-----------|------|-------------|
| Null object pattern | concept | No-op implementations of service interfaces |
| Laravel null driver configuration | practice | `.env.testing` settings for mail, queue, cache, etc. |
| Per-test fake overrides | practice | `Mail::fake()`, `Queue::fake()`, `Storage::fake()` |
| TestingServiceProvider | practice | Conditional binding of null implementations |
| Sync queue implications | practice | Inline job execution and deadlock risks |
| Integration test separation | practice | Separate suite for real sandbox testing |

## Dependency Graph
```
Dependency Injection Testing (Null Driver)
├── Requires: Understanding of Laravel service container
├── Depends on: Testing environment management (.env.testing)
├── Related: Laravel fakes (Mail, Queue, Storage, Http)
├── Related: Test double taxonomy
└── Related: Integration test suite separation
```

## Boundary Analysis
This KU focuses on the null driver pattern and its role in dependency injection testing. It does not cover specific fakes (Mail, Queue, Storage — covered in the Mocking & Fakes subdomain) or database testing lifecycle.

## Future Expansion Opportunities
- Custom null driver implementation patterns for common SDKs
- CI crash detection for missing null driver configurations
- Comparative analysis of null vs fake vs mock for each service type
- Automatic null driver generation from service interfaces
