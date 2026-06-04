# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Dependency Injection
**Knowledge Unit:** Method Injection
**Generated:** 2026-06-03

---

# Decision Inventory

1. Injection Strategy: Constructor vs method injection
2. Parameter Ordering: Container-resolved vs route-binding parameter positioning
3. Framework Method Injection: Controllers vs middleware vs event listeners

---

# Architecture-Level Decision Trees

---

## Decision Name: Injection Strategy Selection

---

## Decision Context

Choosing between constructor injection and method injection for a given dependency.

---

## Decision Criteria

* performance — method injection adds ~0.01-0.03ms per call (Reflection)
* architectural — constructor injection declares shared dependencies; method injection is for action-specific
* security — method injection exposes services after middleware (controller actions)
* maintainability — constructor injection creates a single dependency contract; method injection repeats type-hints

---

## Decision Tree

Is the dependency used in multiple methods of the class?
↓
YES → Use constructor injection — single declaration, visible contract
NO → Is the dependency specific to a single method (action-specific)?
↓
YES → Use method injection — keep constructor lean
NO → Is the class a controller and the dependency only needed in one action?
↓
YES → Use method injection — controllers benefit from lean constructors
NO → Is the class a middleware?
↓
YES → Use constructor injection — middleware handle() has fixed signature ($request, $next)
NO → Use constructor injection — default for most class dependencies

---

## Rationale

Constructor injection declares shared dependencies once, providing a clear contract of the class's requirements. Method injection for shared deps repeats type-hints, creating DRY violations and making refactoring harder. Method injection is best for controller actions, event listeners, and job handlers where specific services are needed only for that method.

---

## Recommended Default

**Default:** Constructor injection for shared multi-method dependencies; method injection for single-method action-specific dependencies.
**Reason:** Constructor injection provides a clear dependency contract; method injection keeps constructors lean for action-specific services.

---

## Risks Of Wrong Choice

- Method injection for shared dependencies: repeated type-hints across methods; refactoring requires changing every method.
- Constructor injection for single-use dependency: unnecessary parameter in constructor that is only used in one method.
- Method injection in middleware handle(): fixed signature — extra type-hints cause type errors.

---

## Related Rules

- Use constructor injection for shared dependencies, method injection for action-specific (05-rules.md, Rule 1)
- Do not use method injection in middleware handle() (05-rules.md, Rule 2)

---

## Related Skills

- Inject Dependencies via Method Parameters (06-skills.md)

---

## Decision Name: Parameter Ordering in Method Injection

---

## Decision Context

Ordering method parameters correctly when mixing container-resolved dependencies and route-binding or positional parameters.

---

## Decision Criteria

* performance — no meaningful impact
* architectural — container resolves type-hinted parameters; route bindings are matched positionally
* security — incorrect ordering causes route model binding IDs to be passed to container resolution
* maintainability — consistent ordering convention prevents bugs

---

## Decision Tree

Does the method have both type-hinted container parameters AND non-container parameters (route bindings, primitives)?
↓
YES → Place container-resolved parameters FIRST, route binding parameters LAST
NO → Does the method only have type-hinted parameters?
↓
YES → Any order works — all are resolved by container
NO → Does the method have no type-hinted parameters?
↓
YES → No container resolution — all parameters passed positionally
NO → If mixing resolved and positional, ALWAYS put resolved first

---

## Rationale

`Container::call()` resolves parameters by type-hint for class/interface types and skips primitives and non-class types. Route model bindings are resolved BEFORE method injection and passed as positional arguments. If a route binding parameter appears before a container-resolved parameter, the route binding ID is passed to the container's resolver — causing resolution failure.

---

## Recommended Default

**Default:** Container-resolved parameters first, route binding parameters last: `function show(OrderService $service, Order $order)`.
**Reason:** Container resolution inspects type-hints; route bindings are positional — correct ordering avoids failures.

---

## Risks Of Wrong Choice

- Route binding before container parameter: route model binding value passed to container — resolution fails with wrong type.
- Primitive before container parameter: primitive value passed to container — cannot resolve class from integer/string.
- No type-hint on container parameter: parameter not resolved — receives default value or null.

---

## Related Rules

- Order parameters: resolved first, runtime second (05-rules.md, Rule 3)

---

## Related Skills

- Inject Dependencies via Method Parameters (06-skills.md)
