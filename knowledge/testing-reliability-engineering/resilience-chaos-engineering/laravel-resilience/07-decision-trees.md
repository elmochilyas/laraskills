# Decision Trees

## Domain: Testing & Reliability Engineering
## Subdomain: Resilience & Chaos Engineering
## Knowledge Unit: Laravel Resilience Fault Injection

---

### Tree 1: Fault Injection vs Traditional Mocking

```mermaid
flowchart TD
    A[Choose testing approach for failure scenarios] --> B{What do you need<br>to verify?}
    B -->|Service handles a specific return value| C[Use traditional mocking — Mockery or fakes]
    B -->|Service handles a failure (exception/timeout)| D{Does the service have<br>fallback code?}
    D -->|Yes| E[Use Laravel Resilience — inject fault into real service]
    D -->|No| F[Implement fallback first, then use Resilience]
    C --> G[mock()->shouldReceive('method')->andReturn($value)]
    E --> H[Resilience::fake(Service::class)->method('charge')->willTimeout(100)]
    A --> I{Test type?}
    I -->|Unit — isolated class| J[Mocking is appropriate]
    I -->|Feature — real service wiring| K[Resilience is better — tests service decorators]
```

**Key decision points:**
- **Return values vs failure modes**: Mockery controls return values. Resilience controls failure injection — they complement each other.
- **Fallback first**: Always implement fallback code before writing resilience tests. Tests without fallbacks confirm crashes, not resilience.
- **Unit vs feature**: Resilience tests are feature-level — they verify the entire service stack with real wiring.

---

### Tree 2: Choosing the Right Fault Type

```mermaid
flowchart TD
    A[Choose fault type] --> B{What failure scenario<br>are you simulating?}
    B -->|Service throws an exception| C[ExceptionFault — willThrow(exception)]
    B -->|Service responds too slowly| D[TimeoutFault — willTimeout(ms)]
    B -->|Service is degraded (slow)| E[LatencyFault — addLatency(ms)]
    B -->|Any of the above, non-deterministic| F[Use Laravel Bazooka for probabilistic chaos]
    C --> G[Best for: payment failures, auth failures, API errors]
    D --> H[Best for: HTTP client timeouts, DB connection timeouts]
    E --> I[Best for: degradation testing, slow query simulation]
    A --> J{Test performance<br>sensitive?}
    J -->|Yes| K[Use ExceptionFault — no timing penalty]
    J -->|Yes, but need timeout path| L[Use TimeoutFault with 100ms — short enough]
    J -->|No| M[Any fault type works]
```

**Key decision points:**
- **Exception vs Timeout vs Latency**: Match fault type to the real failure mode being tested.
- **Short timeouts**: Use 100-200ms for TimeoutFault in tests. 5-second timeouts waste CI time.
- **ExceptionFault is fastest**: No timing penalty — best for quick resilience verification.

---

### Tree 3: CI Placement — Separate Stage vs Main Suite

```mermaid
flowchart TD
    A[Place resilience tests in CI] --> B{Does the test use<br>TimeoutFault or LatencyFault?}
    B -->|Yes — has timing penalty| C[Run in separate CI stage]
    B -->|No — ExceptionFault only| D{How many resilience<br>tests?}
    D -->|Few (1-5)| E[Can run in main suite — negligible overhead]
    D -->|Many (5+)| F[Consider separate stage even for exception faults]
    C --> G[Stage: run after main test suite]
    G --> H[Main: php artisan test --exclude-group=resilience]
    H --> I[Post-deploy: php artisan test --group=resilience]
    A --> J{Blocking or<br>advisory?}
    J -->|Blocking| K[Resilience tests must pass before deployment]
    J -->|Advisory| L[Run but don't block — track over time]
```

**Key decision points:**
- **Timing faults → separate stage**: Any test with timeouts or latency injection slows the main suite.
- **Exception-only tests**: Can run in main suite if few in number.
- **Blocking vs advisory**: Critical resilience paths block deployment. Others run as advisory.

---

### Tree 4: Discovery → Scaffold → Test Workflow

```mermaid
flowchart TD
    A[Adopt Laravel Resilience] --> B[Run: php artisan resilience:discover]
    B --> C[Review discovered services — which have fallback code?]
    C --> D{Service has<br>fallback?}
    D -->|Yes| E[Run: php artisan resilience:scaffold --service=ServiceName]
    D -->|No| F[Implement fallback first — resilience test without fallback is useless]
    E --> G[Review generated test templates]
    G --> H{Customize with<br>meaningful assertions}
    H --> I[Add: specific exception types, response content checks, assertFallbackUsed()]
    I --> J[Run resilience tests]
    J --> K{Fault correctly<br>injected?}
    K -->|Yes — fallback verified| L[Test passes — resilience confirmed]
    K -->|No — fault not triggered| M[Check: service is container-managed? Decorator works?]
    A --> N[Repeat when container bindings change — run discovery quarterly]
```

**Key decision points:**
- **Discovery first**: Run discovery to find all injectable services. Don't manually enumerate.
- **Scaffold + customize**: Generate test templates with scaffold, then customize assertions for specific fallback behavior.
- **Fallback prerequisite**: Don't scaffold for services without fallbacks. Implement fallbacks first.
