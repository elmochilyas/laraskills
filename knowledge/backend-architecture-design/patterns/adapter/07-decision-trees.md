# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Adapter pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Adapter vs inline translation
* Decision 2: Object Adapter vs Class Adapter
* Decision 3: Adapter interface design — vendor-agnostic vs vendor-specific

---

# Architecture-Level Decision Trees

---

## Decision: Adapter vs Inline Translation

---

## Decision Context

Choose between creating a dedicated Adapter class that wraps a third-party SDK and translating the SDK's API inline wherever it's used.

---

## Decision Criteria

* performance considerations: adapter adds single delegation per call (negligible); inline translation has no overhead
* architectural considerations: adapter provides a single seam for replacement; inline translation couples every consumer to the SDK
* security considerations: adapter can sanitize inputs/outputs in one place; inline duplicates security logic
* maintainability considerations: adapter localizes SDK changes; inline requires finding and updating every callsite

---

## Decision Tree

Is the third-party SDK used in more than one place in the application?
↓
YES → Adapter (centralize translation, single point of change when SDK changes)
    ↓
    Examples: payment gateway, email service, SMS provider, file storage
    ↓
    Could the SDK be replaced with a different provider in the future?
    YES → Adapter (essential — adapter isolates replacement impact)
        ↓
        Replace adapter implementation, no changes to application code
        NO → Adapter still beneficial (simplifies testing, centralizes translation)
    NO → Is the SDK interface complex (many methods, different patterns)?
        YES → Adapter (simplify complex SDK to application-specific interface)
            ↓
            Adapter exposes only what the application needs, hides SDK complexity
            NO → Is the SDK used ad-hoc in a single test or script?
                YES → Inline translation (acceptable for disposable code)
                NO → Inline translation (single callsite, stable SDK, simple interface)
                    ↓
                    Monitor: if a second callsite emerges, extract Adapter
NO → Inline translation (single-use, simple SDK call, unlikely to change)
    ↓
    Example: `$sdk = new ThirdPartySDK(); $result = $sdk->callMethod($param);`
    ↓
    Is this callsite in the domain layer?
    YES → Adapter required (domain must not depend on external SDK directly)
        ↓
        Domain layer must be framework-agnostic and SDK-agnostic
        Adapter in infrastructure layer, interface in domain
        NO → Inline is acceptable for infrastructure code

---

## Rationale

Adapter is the default for any third-party integration that appears in more than one place or could be replaced. The primary benefits are testability (mock the adapter interface, not the SDK) and change isolation (SDK version update or provider swap affects only the adapter class). Inline translation is acceptable only for single-use, stable SDKs in infrastructure code.

---

## Recommended Default

**Default:** Adapter for any third-party SDK used in more than one place or likely to change. Inline translation only for single-use, stable SDKs in infrastructure code.
**Reason:** Adapter isolates the application from vendor lock-in, simplifies testing, and centralizes change.

---

## Risks Of Wrong Choice

No adapter for multi-use SDK: SDK upgrade requires changes in N places, some may be missed. Adapter for single-use stable SDK: unnecessary abstraction, extra class to maintain. Inline in domain layer: couples domain to external SDK, violates dependency rule.

---

## Related Rules

- Rule 1: Adapter every third-party SDK used in more than one place
- Rule 2: Domain layer must never depend on third-party SDKs — use adapter interface

---

## Related Skills

- Implement Object Adapter
- Test Adapter with Mocks
- Design Vendor-Agnostic Interface

---

## Decision: Object Adapter vs Class Adapter

---

## Decision Context

Choose between Object Adapter (composition — adapter holds SDK instance) and Class Adapter (inheritance — adapter extends SDK class).

---

## Decision Criteria

* performance considerations: both have negligible overhead; Object Adapter adds one more object reference
* architectural considerations: Object Adapter is more flexible (can wrap any instance); Class Adapter requires inheritance
* security considerations: Object Adapter can intercept and validate all calls; Class Adapter may expose parent methods
* maintainability considerations: Object Adapter works with final classes; Class Adapter cannot wrap final/sealed classes

---

## Decision Tree

Is the SDK class final (PHP 8+ `final` keyword)?
↓
YES → Object Adapter (inheritance not possible with final classes)
    ↓
    Compose the SDK instance in the adapter: `$this->sdk = $sdk`
    ↓
    Does the adapter need to work with multiple SDK instances (different configurations)?
    YES → Object Adapter (composition supports any instance passed at runtime)
        ↓
        Pass different SDK configs per call: `new Adapter(new SDK('api_key_1'))`, `new Adapter(new SDK('api_key_2'))`
        NO → Object Adapter (still the default — composition over inheritance)
    NO → Does the SDK have a non-final class and simple interface?
        YES → Class Adapter possible, but Object Adapter is preferred (composition over inheritance)
            ↓
            Class Adapter: `class StripeAdapter extends StripeSDK implements PaymentGateway`
            Object Adapter: `class StripeAdapter implements PaymentGateway { public function __construct(private StripeSDK $sdk) {} }`
            ↓
            Does the SDK have constructor logic that the adapter should NOT inherit?
            YES → Object Adapter (inheritance would couple constructor behavior)
            NO → Either works; prefer Object Adapter by convention
        NO → Object Adapter (only option for complex interfaces that need wrapping)
            ↓
            Object Adapter can implement a simpler interface while the SDK instance handles complexity
NO → Object Adapter is the default (follows composition over inheritance principle)
    ↓
    Composition advantages:
    → Works with final classes
    → Works with interfaces (SDK interface, not concrete class)
    → Adapter can intercept, transform, or reject calls before delegation
    → No risk of inheriting SDK's internal state or constructor side effects

---

## Rationale

Object Adapter (composition) is the universal default. It works with final classes, interfaces, and multiple SDK instances. Class Adapter (inheritance) is a legacy approach with limited applicability (non-final SDK class, no constructor coupling). Modern PHP with `final` classes makes Object Adapter the only choice in many cases.

---

## Recommended Default

**Default:** Object Adapter (composition). Class Adapter only when extending the SDK provides significant implementation reuse and the SDK class is non-final with a safe constructor.
**Reason:** Composition over inheritance is a core OOP principle. Object Adapter is more flexible, testable, and compatible with modern PHP features.

---

## Risks Of Wrong Choice

Class Adapter with final class: compile-time error. Class Adapter inheriting SDK constructor: unexpected side effects from SDK's init logic. Object Adapter with too many methods: become a pass-through with no value — keep adapter methods focused on the application's needs.

---

## Related Rules

- Rule 3: Prefer Object Adapter (composition) over Class Adapter (inheritance)
- Rule 4: Object Adapter works with final classes and interfaces; Class Adapter does not

---

## Related Skills

- Implement Object Adapter
- Implement Class Adapter
- Wrap SDK in Adapter

---

## Decision: Adapter Interface Design — Vendor-Agnostic vs Vendor-Specific

---

## Decision Context

Choose whether the Adapter's interface is designed to be vendor-agnostic (abstracting the concept) or vendor-specific (modeled after one particular SDK).

---

## Decision Criteria

* performance considerations: no performance impact
* architectural considerations: vendor-agnostic interface supports multiple providers; vendor-specific locks to one
* security considerations: vendor-agnostic can enforce security contracts independent of SDK; vendor-specific inherits SDK's security model
* maintainability considerations: vendor-agnostic is harder to design upfront; vendor-specific is easier but limits options

---

## Decision Tree

Will the application support multiple providers for this capability (current or planned)?
↓
YES → Vendor-agnostic interface (abstract the concept, not the vendor)
    ↓
    Interface named after the capability: `PaymentGateway`, `EmailSender`, `FileStorage`
    Methods named after business operations: `charge(amount, currency)`, not `createCharge()`
    ↓
    Is the interface modeled after the first vendor's API?
    YES → Refactor: vendor-specific interface can't be implemented by a different vendor
        ↓
        Good: `interface PaymentGateway { public function charge(Money $amount): Receipt; }`
        Bad: `interface PaymentGateway { public function createStripeCharge(float $amount): array; }` → vendor leak
        NO → Business-domain interface that any provider can implement
    ↓
    Does the interface need to handle vendor-specific edge cases?
    YES → Use adapter-specific DTOs/vos that map vendor concepts to domain concepts
        ↓
        Example: `StripePaymentGatewayAdapter` can handle Stripe-specific decline codes internally
        Returns domain-specific response: `PaymentResult::declined(DeclineReason::InsufficientFunds)`
        NO → Clean, generic interface — all vendor specifics hidden in implementation
    NO → Is there only one realistic provider and no plan to change?
        YES → Vendor-specific interface is acceptable but vendor-agnostic is still preferred
            ↓
            Even with one provider, vendor-agnostic interface:
            → Simplifies testing (mock the interface, not the SDK)
            → Protects against breaking SDK version changes
            → Documents the business capability
            NO → Vendor-specific interface (one provider, no replacement expected)
                ↓
                Interface matches the SDK's API surface
                Simpler to implement, but couples to vendor's domain model

---

## Rationale

Vendor-agnostic interface design is the single most important architectural decision for adapters. An interface named after the vendor (e.g., `StripeGateway`) or with vendor-specific method names (e.g., `createStripeCharge()`) tightly couples the application to that vendor. The interface should represent the business capability, not the SDK.

---

## Recommended Default

**Default:** Vendor-agnostic interface modeled after the business capability. Vendor-specific interface only when there is exactly one realistic provider and zero chance of replacement.
**Reason:** Vendor-agnostic interfaces preserve the option to switch providers, simplify testing, and document business capabilities.

---

## Risks Of Wrong Choice

Vendor-specific interface: cannot implement a new provider without breaking the contract. Vendor-agnostic over-designed: methods that no provider needs, complicated by edge cases. No interface at all: application code depends directly on SDK classes, cannot test without booting the SDK.

---

## Related Rules

- Rule 5: Adapter interfaces must be vendor-agnostic — name after the business capability, not the vendor
- Rule 6: Map vendor-specific errors to domain-specific types inside the adapter

---

## Related Skills

- Design Vendor-Agnostic Interface
- Implement Business Capability Adapter
- Map Vendor Errors to Domain Types
