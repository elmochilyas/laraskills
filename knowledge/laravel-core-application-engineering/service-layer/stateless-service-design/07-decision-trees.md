# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Service Layer Pattern
**Knowledge Unit:** Stateless Service Design
**Generated:** 2026-06-03

---

# Decision Inventory

* Stateless Services vs Stateful Services for Business Logic
* readonly Class Enforcement vs Discipline-Only Statelessness
* Constructor for Infrastructure vs Constructor for Operational Data
* Result Return Values vs Getter Methods for State Retrieval

---

# Architecture-Level Decision Trees

---

## Decision 1: Stateless Services vs Stateful Services for Business Logic

---

## Decision Context

Whether the service class should maintain per-call state on `$this` properties or remain stateless by passing all data as parameters and returning results.

---

## Decision Criteria

* Whether the service runs in Octane/RoadRunner (long-lived process)
* Whether the service is registered as a singleton
* Whether the service needs to accumulate state across method calls

---

## Decision Tree

Does the service run in Octane/RoadRunner?
↓
YES → ALWAYS stateless — mutable state on `$this` leaks across requests; data corruption bug
NO → Is the service registered as a singleton in the container?
    ↓
    YES → Stateless required — single instance shared across all requests; state leaks
    NO → Is the service instantiated per-request (default Laravel behavior)?
        ↓
        YES → Stateful is technically safe in PHP-FPM — but Octane migration will break
        NO → Stateless — always prefer stateless; no benefit to stateful
YES → Does the service NEED to accumulate state across method calls?
    ↓
    YES → Reconsider the design — stateless services can return state; the caller accumulates
    NO → Stateless — return results from each method; let the caller manage state
NO → Is there a genuine need for request-scoped state?
    ↓
    YES → Use a dedicated context object — pass it as a method parameter; don't store on $this
    NO → Stateless — no need for state in the first place

---

## Rationale

Stateless services are safe in any PHP runtime (PHP-FPM, Octane, RoadRunner). Stateful services work only in PHP-FPM (where each request gets a fresh process and state is naturally lost). In Octane/RoadRunner, the same service instance handles hundreds of requests — state set during one request is visible to the next, causing data leakage and concurrency bugs.

---

## Recommended Default

**Default:** ALWAYS stateless. There is no valid reason for a service to be stateful in modern Laravel.
**Reason:** Stateless is safe in all runtimes. Stateful breaks in Octane/RoadRunner. There is no functional benefit to stateful services.

---

## Risks Of Wrong Choice

* Stateful in Octane: Request A sets `$this->user`, Request B reads `$this->user` — sees request A's user
* Stateful as singleton: Same as Octane — state shared across all requests; unpredictable behavior
* Stateful accumulator: `$this->total += $amount` — accumulates across calls; never resets
* Stateful with getter pattern: `$service->process($data); $result = $service->getResult()` — forces two-step call; race condition in concurrent environments

---

## Related Rules

* Enforce Stateless Service Design (Mandatory for Octane)
* Enforce readonly Class for Compiler-Level Immutability

---

## Related Skills

* Design Services as Stateless Classes
* Use readonly Class to Enforce Service Immutability

---

---

## Decision 2: readonly Class Enforcement vs Discipline-Only Statelessness

---

## Decision Context

Whether to enforce statelessness via `readonly class` (PHP 8.2+) or rely on developer discipline.

---

## Decision Criteria

* Whether the project uses PHP 8.2+
* Whether the team has had stateful bugs in production
* Whether the project uses Octane/RoadRunner

---

## Decision Tree

Does the project use PHP 8.2 or higher?
↓
YES → Use `readonly class` — compiler-enforced immutability; no mutable properties allowed
NO → Does the project use Octane/RoadRunner?
    ↓
    YES → UPGRADE PHP — Octane without `readonly` enforcement is risky; consider PHP 8.2+ upgrade
    NO → Discipline-only — code review and static analysis to catch mutable properties
YES → Has the team had stateful bugs in production?
    ↓
    YES → `readonly class` — enforcement prevents the bug class entirely
    NO → Do developers understand stateless design?
        ↓
        YES → `readonly class` — enforcement is still better than discipline; catch at compile time
        NO → `readonly class` — enforcement teaches good practices; compiler error > runtime bug
NO → Are constructor-injected dependencies mutable (collections, arrays)?
    ↓
    YES → `readonly` prevents reassignment but not mutation of items — use `immutable` collections or defensive copies
    NO → `readonly class` — all properties are set-once in constructor; never modified after

---

## Rationale

`readonly class` prevents ANY property from being modified after the constructor runs. This is compiler-level enforcement — a developer adding `$this->property = value` outside the constructor gets a compile error, not a runtime bug. Discipline-only statelessness relies on code review to catch mutable properties, which is error-prone.

---

## Recommended Default

**Default:** `readonly class` on ALL service classes (PHP 8.2+).
**Reason:** Compiler enforcement is stronger than discipline. Prevent stateful bugs at compile time, not in production.

---

## Risks Of Wrong Choice

* No `readonly` in Octane: Developer accidentally adds mutable property — data leakage in production; discovered weeks later
* `readonly` with mutable property: `readonly` prevents `$this->prop = newVal` but `$this->prop[] = newItem` works — array items are still mutable
* `readonly` for non-service classes: `readonly` on entity/value objects is also good practice; not just for services
* No PHP 8.2: Upgrade blockers may prevent `readonly` — add PHPStan/Psalm rules to enforce immutability

---

## Related Rules

* Enforce Stateless Service Design (Mandatory for Octane)
* Enforce readonly Class for Compiler-Level Immutability

---

## Related Skills

* Design Services as Stateless Classes
* Use readonly Class to Enforce Service Immutability

---

---

## Decision 3: Constructor for Infrastructure vs Constructor for Operational Data

---

## Decision Context

Whether a service's constructor should accept infrastructure dependencies (repositories, gateways) or operational data (user ID, filter criteria).

---

## Decision Criteria

* Whether the dependency is stable across calls (same repository used every time)
* Whether the dependency varies per call (different user ID each time)
* Whether the dependency is injected by the container or provided by the caller

---

## Decision Tree

Is the dependency an infrastructure service (repository, gateway, logger, cache)?
↓
YES → Constructor injection — stable across all method calls; resolved by the container
NO → Is the dependency operational data that varies per call (user ID, date range)?
    ↓
    YES → Method parameter — operational data changes every call; constructor = wrong place
    NO → Is the dependency a configuration value (API URL, timeout)?
        ↓
        YES → Constructor injection — configuration is stable; injected at instantiation
        NO → Constructor injection — default to constructor for stable dependencies
NO → Is the dependency resolved by the service container?
    ↓
    YES → Constructor injection — container resolves constructor dependencies automatically
    NO → Method parameter — caller provides it; not resolved by the container
NO → Is the dependency optional?
    ↓
    YES → Method parameter with default — or constructor with nullable type; method parameter is cleaner
    NO → Constructor injection — required stable dependency

---

## Rationale

The constructor is for dependencies that are stable across all method calls (repositories, gateways, loggers). Operational data (user ID, filters) must be method parameters because they vary per call. Mixing operational data into the constructor forces callers to re-instantiate the service for each different value, which violates the stateless pattern.

---

## Recommended Default

**Default:** Constructor for infrastructure dependencies. Method parameters for operational data.
**Reason:** Infrastructure is stable and injected by the container. Operational data varies per call and must be passed at invocation time.

---

## Risks Of Wrong Choice

* User ID in constructor: `new UserService($userId)` — must re-instantiate for every user; defeats statelessness
* Repository as method parameter: `$service->register($repo, $data)` — caller must know the repository; inconsistent DI
* Config in constructor: Correct — `new PaymentService($apiUrl)` — config is stable
* Optional data in method parameter: Correct — `$service->search($query, $filters = [])` — varies per call

---

## Related Rules

* Enforce Stateless Service Design (Mandatory for Octane)
* Enforce readonly Class for Compiler-Level Immutability

---

## Related Skills

* Design Services as Stateless Classes
* Use readonly Class to Enforce Service Immutability

---

---

## Decision 4: Result Return Values vs Getter Methods for State Retrieval

---

## Decision Context

Whether to return operation results directly or store them on `$this` and expose via getter methods.

---

## Decision Criteria

* Whether the caller needs the result immediately after the call
* Whether the operation produces multiple outputs
* Whether the operation is a single-step or multi-step workflow

---

## Decision Tree

Does the operation produce a result that the caller needs?
↓
YES → Return the result directly — `$result = $service->doSomething();`
NO → Does the operation return void (side-effect only)?
    ↓
    YES → Return void — but this is rare for stateless services; consider returning a status or identifier
    NO → Return the result — if there's no result, why does the method exist?
YES → Does the operation produce multiple distinct outputs?
    ↓
    YES → Return a result object — `OrderResult` wrapping all outputs
    NO → Return the single result directly — `Order` object, bool, string
NO → Is the caller supposed to get the result via `->getResult()` after calling?
    ↓
    YES → WRONG — getter pattern is the stateful anti-pattern; return the result from the method
    NO → Return the result — there's no reason to store state
NO → Is the result needed later, after multiple operations?
    ↓
    YES → The caller accumulates results — caller stores each return value; service stays stateless
    NO → Return the result — immediate consumption

---

## Rationale

Getter methods (`doSomething()` void + `getResult()`) are the stateful anti-pattern. The caller must know to call `getResult()` after the operation, and in Octane/RoadRunner, the stored state persists across requests — the next caller sees the previous result. Direct return values are explicit, type-hinted, and don't require internal state.

---

## Recommended Default

**Default:** Always return results from the method. Never use getter methods for execution results.
**Reason:** Direct returns are explicit, type-safe, and stateless. Getters force two-step calls and create stateful services.

---

## Risks Of Wrong Choice

* Getter pattern: `$service->process($data); $result = $service->getResult()` — breaks in Octane; next request sees previous result
* Void return with no getter: Caller has no access to the result — useless operation
* Return object for single value: `new Result(customer: $customer)` when `$customer` is the only output — over-engineered
* No return from stateful service: Service stores result internally — caller must know about the getter; not discoverable

---

## Related Rules

* Enforce Stateless Service Design (Mandatory for Octane)
* Enforce readonly Class for Compiler-Level Immutability

---

## Related Skills

* Design Services as Stateless Classes
* Use readonly Class to Enforce Service Immutability
