# Skill: Package Escape Hatch Design and Implementation

## Purpose
Design concrete, code-level paths to bypass third-party packages for flows they cannot handle — enabling confident package adoption with a safety valve that prevents sunk-cost trapping and enables incremental migration when packages stop fitting.

## When To Use
- For every architectural package adoption (billing, auth, search, cache) — design the escape hatch before the first integration
- When a package's core assumption breaks for a specific use case (e.g., Cashier doesn't support Connect)
- When evaluating whether to keep or replace an existing package — escape hatch usage rate is a key metric
- During initial architecture design of any feature that relies on a third-party package

## When NOT To Use
- For framework-native features where "escape" means switching frameworks (not practical)
- When the package handles a trivial concern with zero risk of assumption breakage
- When the escape hatch would require maintaining two complete implementations (that's a package exit, not an escape hatch)
- When escape hatch methods would cover >20% of the package's surface — the package doesn't fit

## Prerequisites
- The Package Wrapper/Boundary Pattern (KU 03) must be in place — the escape hatch lives inside the adapter
- The Calibrated Package Recommendation (KU 01) should identify the specific non-fit conditions
- Understanding of the package's internal architecture and extension points
- Access to the underlying SDK or service the package wraps (e.g., stripe/stripe-php, Algolia SDK)

## Inputs
- The package's known non-fit conditions (from the calibrated recommendation)
- The specific methods/flows the package cannot handle
- The alternative SDK or mechanism that CAN handle those flows
- The wrapper interface the adapter implements
- Application DTOs for return types

## Workflow
1. **Identify the specific non-fit condition** — Not "Cashier doesn't fit everything." But "Cashier has no API for Stripe Connect transfers." Document the trigger condition as falsifiable: `$this->isConnectTransfer($method)` returns true/false.
2. **Design the escape inside the adapter** — Add private escape methods to the adapter class. Each escape method handles one specific flow the package cannot. The public interface method checks the trigger condition and dispatches to either the package path or the escape path.
3. **Use the same interface for both paths** — The escape path must implement the SAME interface method as the package path. Business logic calls `$gateway->charge($amount, $method)` regardless of which path is active. The adapter absorbs the branching.
4. **Log every escape hatch activation** — Every time the escape path is taken, log: package name, method name, reason for escape, and relevant contextual data. This logging enables monitoring escape hatch usage rates.
5. **Write integration tests for each escape method** — Each escape method must have at least one integration test. The escape path must be production-grade from day one, not "we'll test it when we need it."
6. **Monitor escape hatch usage** — Track how frequently the escape hatch activates. If usage exceeds 20% of method calls, trigger a package re-evaluation — the package may no longer fit.
7. **Keep the escape hatch symmetrical** — Flows should be able to move back from the escape path to the package path if the package later adds support. Design escape methods so they can be deprecated in favor of new package capabilities.

## Validation Checklist
- [ ] Escape hatch is documented for every architectural package in the calibrated recommendation
- [ ] Escape hatch code lives inside the adapter class, not in controllers or services
- [ ] Escape hatch methods have corresponding integration tests (at least one per method)
- [ ] Every escape hatch activation is logged with package, method, and reason
- [ ] Escape hatch covers only the methods that actually need it (not the entire package surface)
- [ ] Both package path and escape hatch path implement the same interface method
- [ ] Escape hatch has a documented trigger condition (not "when things get complex")
- [ ] Escape hatch usage is monitored — a dashboard or alert on activation rate
- [ ] Escape hatch is designed before the first line of package integration code
- [ ] Adapter constructor includes the escape hatch dependency (e.g., StripeClient for direct API calls)

## Common Failures
- Implementing the escape hatch in business logic (controllers, services) instead of inside the adapter
- Creating an untested escape hatch that fails when it's finally needed in production
- Having too many escape hatches (>20% of the interface) — the package fundamentally doesn't fit
- Designing the escape hatch as a one-way door — once escaped, flows can never return to the package path
- Silent escape: activating the escape hatch without logging, making it impossible to monitor usage
- Escape hatch that duplicates the package's safety features poorly (e.g., missing idempotency key handling)
- Escape hatch designed retroactively under deadline pressure, creating parallel code paths

## Decision Points
- **Escape vs. exit**: When escape hatch usage exceeds 20% of flows, the package doesn't fit — this is an exit signal, not an escape scenario
- **Escape method granularity**: Should the escape handle individual methods or entire workflows?
- **Escape dependency scope**: Does the adapter need the full vendor SDK (StripeClient) or just specific API calls?
- **Escape symmetry**: Can flows move back from the escape path to the package path if the package adds support?

## Performance Considerations
- Escape hatch methods may be slower than package methods — direct SDK calls often lack the caching or batching the package provides
- Two code paths (package + escape) may have different performance profiles — load-test both
- Logging every escape activation adds negligible overhead (~1ms) but provides critical operational visibility

## Security Considerations
- Escape hatch code must meet the same security standards as package code — the package's built-in safeguards (idempotency, webhook verification) must be replicated
- Credential handling must be identical between package and escape paths (same API keys, same secrets)
- Audit escape hatch usage for security-sensitive flows — high escape rates in billing or auth are red flags
- Escape hatch code must strip sensitive data from logs and exceptions, just like the package path

## Related Rules (from 05-rules.md)
- Design the Escape Hatch Before the First Integration
- Use the Same Interface for Both the Package Path and the Escape Hatch Path
- Limit Escape Hatch Surface to 2-3 Methods
- Log Every Escape Hatch Activation
- Test Both Paths — Package Path and Escape Hatch Path

## Related Skills
- Package Wrapper/Boundary Pattern (KU 03)
- Calibrated Package Recommendation Writing (KU 01)
- When NOT To Build Custom (KU 05)

## Success Criteria
- A new flow that the package cannot handle is implemented entirely within the adapter's escape method — zero changes to business logic. The escape is logged. The escape has an integration test. The escape surfaced a trigger for package re-evaluation if it becomes the primary path.
