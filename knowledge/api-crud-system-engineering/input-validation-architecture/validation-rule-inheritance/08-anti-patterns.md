# Validation Rule Inheritance — Anti-Patterns

## Deep Inheritance Chains
**Description:** FormRequest inheritance spanning 3+ levels (BaseApiRequest → BaseUserRequest → StoreUserRequest → AdminStoreUserRequest).
**Why it happens:** Developers add layers of abstraction as new requirements emerge.
**Consequences:** Rules are scattered across the chain; tracing where a rule comes from requires reading multiple classes; overrides have unpredictable effects.
**Better approach:** Keep inheritance at one level. Use traits or composition for additional rule sharing.

## Forcing Inheritance on Divergent Rules
**Description:** Using a base class when store and update share only 20% of rules, with most rules being overridden.
**Why it happens:** Developers feel inheritance is "cleaner" even when rules diverge.
**Consequences:** Base class contains rules that are overridden everywhere; child classes have more override code than inherited code.
**Better approach:** Keep store and update rules completely separate when similarity is below 50%.

## Trait Name Collisions
**Description:** Two traits defining the same method name (e.g., `addressRules()`) causing unexpected overrides.
**Why it happens:** Traits are developed independently without awareness of naming conventions.
**Consequences:** One trait's method silently overrides another's; rules are lost without warning.
**Better approach:** Prefix trait methods with the trait name (`HasAddressRules::addressRules()` syntax). Use explicit method resolution with `insteadof`.

## Using Inheritance for Cross-Cutting Rule Groups
**Description:** Using a base class to share address validation rules across UserRequest, OrderRequest, and ProfileRequest.
**Why it happens:** Inheritance is the default "reuse" mechanism in OOP.
**Consequences:** Unrelated FormRequests share a base class for the wrong reason; the inheritance hierarchy becomes semantic nonsense.
**Better approach:** Use traits for cross-cutting rule groups. Inheritance should represent an "is-a" relationship, not a "has-a" relationship.
