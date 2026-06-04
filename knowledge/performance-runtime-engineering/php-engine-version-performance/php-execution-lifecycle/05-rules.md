---
## Rule Name

Always Enable OpCache in Production

## Category

Performance

## Rule

Never disable OpCache in any production environment.

## Reason

Without OpCache, every request recompiles all source files through lexing, parsing, and compilation phases, causing 2-4x throughput loss compared to OpCache-enabled operation.

## Bad Example

```ini
; php.ini — OpCache disabled in production
opcache.enable=0
```

## Good Example

```ini
; php.ini — OpCache enabled for production
opcache.enable=1
opcache.enable_cli=1
```

## Exceptions

Temporary troubleshooting sessions where OpCache interference must be ruled out, with immediate re-enablement afterward.

## Consequences Of Violation

2-4x throughput reduction, increased CPU utilization, higher latency under load, unnecessary infrastructure cost.

---

## Rule Name

Design Benchmarks for Both Cold and Warm States

## Category

Testing

## Rule

Always measure and report both cold-cache (post-deployment) and warm-cache (steady-state) request performance.

## Reason

Cold requests include compilation time that warm requests skip. Reporting only warm results hides the deployment-time latency impact and misleads capacity planning.

## Bad Example

```php
// Only measuring warm state after repeated requests
$response = $this->get('/api/users');  // Request #100 — warm
```

## Good Example

```php
// Measure cold first
$coldResponse = $this->get('/api/users');  // Request #1 — cold
// Warm up
for ($i = 0; $i < 100; $i++) { $this->get('/api/users'); }
// Measure warm
$warmResponse = $this->get('/api/users');  // Steady-state
```

## Exceptions

Benchmarks that specifically target steady-state behavior only (document the exclusion).

## Consequences Of Violation

Underestimated deployment latency, incorrect capacity planning, surprise slowdowns after deployments.

---

## Rule Name

Use Typed Properties to Reduce Opcode Count

## Category

Performance

## Rule

Always declare explicit types on all class properties in new code and refactor existing property-heavy code to use typed properties.

## Reason

Typed properties generate specialized opcodes (`ASSIGN_OBJ_OP_DATA` variants) that skip zval type conversion and refcount adjustment, reducing opcode count and execution time by 5-15% in property-heavy code.

## Bad Example

```php
// Untyped — generates general ASSIGN_OBJ with type checks
public $id;
public $name;
```

## Good Example

```php
// Typed — generates specialized opcodes
public int $id;
public string $name;
```

## Exceptions

Legacy codebases where adding types would require breaking changes. Code paths where property type is genuinely dynamic.

## Consequences Of Violation

Missed 5-15% execution time reduction, reduced JIT guard elimination opportunities, larger opcode cache footprint.

---

## Rule Name

Use Preloading to Reduce Cold-Start Latency

## Category

Performance

## Rule

Configure OpCache preloading for the framework and commonly used classes to reduce cold-start compilation time.

## Reason

Preloading compiles and caches opcodes for specified files during server startup rather than on first request, eliminating the initial compilation cost and reducing first-request latency.

## Bad Example

```ini
; No preloading configured — all compilation happens on first request
opcache.preload=
```

## Good Example

```php
// config/preload.php
$files = [
    __DIR__ . '/vendor/autoload.php',
    __DIR__ . '/app/Models/User.php',
    // Framework core classes
];
foreach ($files as $file) { opcache_compile_file($file); }
```

```ini
opcache.preload=/var/www/html/config/preload.php
```

## Exceptions

Containerized deployments using OpCache file cache for cold-start mitigation, or deployments where first-request latency is not critical.

## Consequences Of Violation

Higher first-request latency post-deployment, inconsistent benchmark results (cold vs warm), wasted CPU on repeated compilation.

---

## Rule Name

Distinguish Which Lifecycle Phase an Optimization Targets

## Category

Architecture

## Rule

Never apply an optimization without identifying which phase of the PHP execution lifecycle (lexing, parsing, compilation, execution) it addresses.

## Reason

Misapplied optimizations waste effort and may degrade performance. JIT targets the execution phase and will not reduce compilation cost. OpCache targets the compilation phase and will not reduce I/O wait.

## Bad Example

```php
// Tuning JIT parameters while the bottleneck is compilation (no OpCache)
// This targets execution while compilation is the problem
```

## Good Example

```php
// 1. Profile to identify phase: compilation, execution, or I/O
// 2. Compilation bottleneck -> OpCache + preloading
// 3. Execution bottleneck -> JIT + typed properties
// 4. I/O bottleneck -> caching + async processing
```

## Exceptions

When applying established best practices (e.g., enable OpCache + JIT) universally, which is safe even before full profiling.

## Consequences Of Violation

Wasted tuning effort on the wrong target, zero measurable improvement, frustration with performance tooling.
