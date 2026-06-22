# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Package Escape Hatch Strategy |
| Difficulty | Advanced |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Package wrapper/boundary pattern, Interface-first architecture, Service container |
| Related KUs | Calibrated package recommendation, Package fit/non-fit analysis, When not to build custom |
| Source | domain-analysis.md |

---

# Overview

An escape hatch is a designed path to bypass a package when it cannot handle a specific requirement. Every package recommendation must include its escape hatch. For Cashier, the escape hatch is `stripe/stripe-php` directly. For Spatie Permission, the escape hatch is native Laravel Gates and Policies. For Scout, the escape hatch is the Eloquent query builder. The escape hatch must be designed so that application code does not split into two parallel code paths — the wrapper layer absorbs the escape, and business logic remains unchanged.

---

# Core Concepts

- **Escape hatch**: A concrete, code-level path to bypass a package for flows it cannot handle, while continuing to use the package for flows it handles well.
- **One escape hatch per package**: Multiple escape hatches suggest the package is fundamentally wrong for the project. One escape hatch is a safety valve; three escape hatches are a sign the package doesn't fit.
- **Wrapper-mediated escape**: The escape hatch is implemented inside the package wrapper/adapter, not in business logic. Business logic calls `$gateway->subscribe()`. The adapter decides whether to use Cashier or `stripe/stripe-php` directly.
- **Gradual migration path**: The escape hatch enables incremental migration away from the package, one method at a time, without a big-bang rewrite.
- **Parallel path risk**: The danger that escape hatch usage creates two ways to do the same thing, leading to inconsistent behavior and duplicated bugs.

---

# When To Use

- For every package that handles business-critical flows (billing, auth, search)
- When the package's core assumptions may break for specific use cases
- During initial package adoption — design the escape hatch before writing the first integration
- When evaluating whether to keep or replace an existing package

## When NOT To Use

- For framework packages where the "escape hatch" is switching frameworks (not practical)
- When the package handles a trivial concern with no risk of assumption breakage
- When the escape hatch would require maintaining two complete implementations (that's not an escape hatch, that's a migration)

---

# Best Practices

1. **Design the escape hatch before the first integration, not after you need it** WHY: Escape hatches retrofitted under pressure create dual code paths. Escape hatches designed first are clean architectural seams.

2. **Use the same interface for both the package path and the escape hatch path** WHY: If both paths implement `BillingGateway`, switching between them is transparent to business logic. The adapter absorbs the difference.

3. **Test both paths — the package path and the escape hatch path** WHY: If the escape hatch is untested, it will fail when you need it most. The escape hatch must be production-grade, not a "we'll test it later" afterthought.

4. **Limit escape hatch surface to 2-3 methods** WHY: If 10+ methods need the escape hatch, the package doesn't fit. The escape hatch is for exceptions, not the rule.

5. **Log every escape hatch activation** WHY: Escape hatch usage is a signal that the package's fit is degrading. High escape hatch usage should trigger a re-evaluation of the package.

---

# Architecture Guidelines

- **Escape hatch in the adapter, not the caller**: Business logic should never contain `if ($useCashier) { ... } else { // escape hatch }`. That branching lives inside the adapter.
- **Adapter method dispatch**:
  ```php
  class StripeCashierAdapter implements BillingGateway
  {
      public function charge(int $amount, PaymentMethod $method): ChargeResult
      {
          if ($this->isMarketplacePayout()) {
              // Escape hatch: Cashier doesn't support Connect
              return $this->chargeViaStripeDirect($amount, $method);
          }
          // Normal path: Cashier
          return $this->chargeViaCashier($amount, $method);
      }
  }
  ```
- **Escape hatch triggers**: Document what triggers the escape hatch. "When the payment involves a Connect destination account" is a clear trigger. "When it's complex" is not.

---

# Performance Considerations

- **Escape hatch methods may be slower**: Direct SDK calls often lack the caching or batching that the package provides. Measure and document the performance difference.
- **Two code paths, two performance profiles**: The package path and escape hatch path may have different performance characteristics. Load-test both.

---

# Security Considerations

- **Escape hatch code must meet the same security standards as package code**: Escape hatches often involve lower-level SDK calls that lack the package's built-in security features (e.g., Cashier's idempotency key handling).
- **Credential handling must be identical**: The escape hatch should use the same API keys, webhook secrets, and auth patterns as the package path.
- **Audit escape hatch usage**: Track which flows use the escape hatch. High escape hatch usage for a security-sensitive flow is a red flag.

---

# Common Mistakes

**Mistake: Escape hatch that creates parallel code paths in business logic**
- Description: Controllers or services contain `if ($needsEscape) { useDirectStripe() } else { useCashier() }`
- Cause: Implementing the escape hatch at the wrong layer
- Consequence: Every new billing feature must be implemented twice. Inconsistency between paths.
- Better: Push the branching down into the adapter. Business logic only calls the interface.

**Mistake: Untested escape hatch**
- Description: Designing an escape hatch but never writing tests for it
- Cause: "We'll test it when we need it"
- Consequence: When the escape hatch is finally needed, it contains bugs. The escape is now a crisis.
- Better: Write at least one integration test per escape hatch method from day one.

**Mistake: Too many escape hatches**
- Description: Having escape hatches for 50% of the package's functionality
- Cause: Adopting a package that fundamentally doesn't fit
- Consequence: You're maintaining a fork of the package disguised as "escape hatches." The package provides negative value.
- Better: If escape hatches cover >20% of usage, the package doesn't fit. Switch to the alternative.

**Mistake: Escape hatch with no migration path back**
- Description: Once a flow uses the escape hatch, it can never return to the package path
- Cause: Designing the escape hatch as a one-way door
- Consequence: Package upgrades or new features can't be adopted for escaped flows
- Better: The escape hatch should be symmetrical — flows can move between package path and escape hatch path as package capabilities evolve.

---

# Anti-Patterns

- **The bottomless escape hatch**: An escape hatch that grows to replace the entire package. If the escape hatch becomes the primary implementation, you've performed an unplanned migration.
- **Escape hatch as excuse for poor package selection**: "We'll just use the escape hatch for the parts that don't fit" — and then 40% of flows use the escape hatch. The package was wrong from the start.
- **Silent escape**: The escape hatch activates without logging. When the package is later upgraded or replaced, nobody knows which flows were escaping.

---

# Examples: Three Canonical Escape Hatches

## 1. Laravel Cashier — Escape to stripe/stripe-php

```php
class StripeCashierAdapter implements BillingGateway
{
    public function __construct(
        private StripeClient $stripeClient,  // stripe/stripe-php
    ) {}

    public function charge(array $data): ChargeResult
    {
        if ($this->isConnectTransfer($data)) {
            // ESCAPE HATCH: Cashier has no Connect API
            Log::info('billing.escape_hatch.activated', [
                'package' => 'cashier',
                'method' => 'charge',
                'reason' => 'stripe_connect_transfer',
            ]);
            return $this->chargeViaStripeConnect($data);
        }

        // Normal Cashier path
        return $this->chargeViaCashier($data);
    }

    private function chargeViaStripeConnect(array $data): ChargeResult
    {
        $transfer = $this->stripeClient->transfers->create([
            'amount' => $data['amount'],
            'currency' => 'usd',
            'destination' => $data['connect_account_id'],
        ]);
        return ChargeResult::fromStripeTransfer($transfer);
    }
}
```

## 2. Spatie Permission — Escape to Native Gates/Policies

```php
class PermissionResolver
{
    public function can(string $ability, mixed $arguments): bool
    {
        $user = auth()->user();

        if ($this->isComplexRelationshipCheck($ability, $arguments)) {
            // ESCAPE HATCH: Spatie doesn't handle ReBAC well
            Log::info('permission.escape_hatch.activated', [
                'package' => 'spatie-permission',
                'ability' => $ability,
                'reason' => 'relationship_based_access',
            ]);
            return Gate::forUser($user)->allows($ability, $arguments);
        }

        // Normal Spatie path
        return $user->can($ability, $arguments);
    }
}
```

## 3. Laravel Scout — Escape to Eloquent Query Builder

```php
class SearchGateway
{
    public function search(string $query, array $filters): SearchResult
    {
        if ($this->needsComplexFilters($filters)) {
            // ESCAPE HATCH: Scout/Algolia can't handle these SQL-level filters
            Log::info('search.escape_hatch.activated', [
                'package' => 'scout',
                'reason' => 'complex_filters',
            ]);
            return $this->searchViaEloquent($query, $filters);
        }

        // Normal Scout path
        return $this->searchViaScout($query);
    }
}
```

---

# AI Agent Notes

- For every package recommendation generated, include an escape hatch section describing how to bypass the package when needed.
- The escape hatch must be concrete: name the SDK, class, or pattern. "Use the vendor SDK" without naming which SDK is too vague.
- When generating adapter code, include escaped methods as private methods in the adapter. They should be visible and documented, not hidden.
- Always add logging around escape hatch activation. The log message should include: package name, method name, reason for escape, and relevant data.
- If generating a codebase that uses a package, pre-build the escape hatch for 1-2 methods even if they aren't currently needed. This establishes the pattern.

---

# Verification

- [ ] Escape hatch is documented for every architectural package
- [ ] Escape hatch code lives inside the adapter, not in business logic
- [ ] Escape hatch methods have corresponding integration tests
- [ ] Escape hatch activation is logged with package, method, and reason
- [ ] Escape hatch covers only the methods that actually need it (not the entire package surface)
- [ ] Both package path and escape hatch path implement the same interface
- [ ] Escape hatch has a documented trigger condition (not "when things get complex")
- [ ] Escape hatch usage is monitored — high activation rate triggers package re-evaluation
