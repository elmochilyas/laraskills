# Structure Rationale

The folder structure follows Domain → Subdomain → Knowledge Unit with knowledge units as leaf nodes only.

The organizational strategy is:

1. **Horizontal by lifecycle phase.** The top-level subdirectories mirror the chronological order of the request lifecycle — from entry through bootstrap, container, providers, kernel, middleware, routing dispatch, and termination. This makes the structure intuitive for anyone who understands the lifecycle.

2. **Separation of mechanism from policy.** The `service-container/` and `dependency-injection/` subdomains are separated because the container is the *mechanism* (how bindings work, how resolution happens) while dependency injection is the *policy* (where to inject, when to use facades, anti-patterns). Experts need both, but they are distinct knowledge sets.

3. **Long-running processes as a first-class subdomain.** Octane and queue workers fundamentally change the lifecycle semantics. This is not an edge case — it's the future of Laravel deployment. It deserves its own top-level subdomain rather than being buried under `request-lifecycle/`.

4. **Caching & optimization is separate from bootstrap.** While caching reduces bootstrap overhead, the knowledge of cache internals, invalidation, CI/CD pipeline integration, and deployment strategies is distinct from understanding the bootstrap sequence itself.

5. **No single-file folders.** Every subdomain below has at least 3-5 knowledge units, avoiding orphan directories.

6. **Future-proof naming.** Subdomain names are generic enough to accommodate expansion. For example, `long-running-processes/` can cover Octane, RoadRunner, FrankenPHP, queue workers, and future runtime technologies without renaming.

---

# Proposed ECC Folder Tree

```
knowledge/
└── execution-lifecycle/
    │
    ├── request-lifecycle/
    │   ├── entry-point-mechanics
    │   ├── http-kernel-dispatch
    │   ├── console-kernel-dispatch
    │   ├── response-sending-and-termination
    │   └── lifecycle-events-and-hooks
    │
    ├── service-container/
    │   ├── container-fundamentals
    │   ├── binding-types
    │   ├── binding-resolution
    │   ├── auto-resolution-via-reflection
    │   ├── contextual-binding
    │   ├── tagged-bindings
    │   ├── binding-extending
    │   ├── resolution-callbacks
    │   ├── rebound-callbacks
    │   ├── container-aliases
    │   ├── circular-dependency-detection
    │   └── scoped-instance-management
    │
    ├── service-providers/
    │   ├── provider-fundamentals
    │   ├── register-vs-boot-methods
    │   ├── deferred-providers
    │   ├── eager-providers
    │   ├── package-discovery-and-auto-registration
    │   ├── environment-specific-providers
    │   ├── provider-properties-shortcuts
    │   ├── provider-organization-strategies
    │   ├── provider-testing
    │   └── provider-sprawl-and-governance
    │
    ├── application-bootstrap/
    │   ├── application-class-construction
    │   ├── base-bindings-and-core-aliases
    │   ├── application-builder-configuration
    │   ├── bootstrap-app-php-file
    │   ├── bootstrapper-sequence
    │   ├── path-helpers-and-environment-detection
    │   └── application-flush-and-reset
    │
    ├── kernel-architecture/
    │   ├── http-kernel-internals
    │   ├── console-kernel-internals
    │   ├── kernel-bootstrappers
    │   ├── kernel-version-evolution
    │   ├── legacy-kernel-migration
    │   └── request-duration-lifecycle-handlers
    │
    ├── middleware-pipeline/
    │   ├── pipeline-pattern-fundamentals
    │   ├── global-middleware-stack
    │   ├── middleware-groups
    │   ├── route-middleware
    │   ├── middleware-aliases
    │   ├── middleware-priority
    │   ├── middleware-parameters
    │   ├── pre-and-post-middleware-code
    │   ├── terminable-middleware
    │   ├── middleware-exclusion
    │   ├── default-middleware-members
    │   ├── middleware-vs-route-binding-ordering
    │   └── middleware-configuration-in-bootstrap
    │
    ├── dependency-injection/
    │   ├── constructor-injection
    │   ├── method-injection
    │   ├── auto-resolution-strategy
    │   ├── interface-binding-resolution
    │   ├── service-locator-anti-pattern
    │   ├── facade-architecture
    │   ├── testing-with-container
    │   ├── over-injection-anti-pattern
    │   └── injection-guidelines-by-class-type
    │
    ├── boot-order-timing/
    │   ├── complete-boot-sequence
    │   ├── bootstrap-with-event-system
    │   ├── register-phase-order
    │   ├── boot-phase-order
    │   ├── lifecycle-callback-hooks
    │   ├── deferred-provider-loading-timing
    │   ├── octane-boot-timing
    │   └── console-vs-http-boot-differences
    │
    ├── long-running-processes/
    │   ├── octane-architecture-overview
    │   ├── singleton-state-leaks
    │   ├── scoped-bindings-for-octane
    │   ├── static-property-accumulation
    │   ├── octane-lifecycle-hooks
    │   ├── octane-configuration-and-workers
    │   ├── queue-worker-lifecycle
    │   ├── service-binding-audit
    │   ├── octane-package-compatibility
    │   └── memory-profiling-and-observability
    │
    └── caching-optimization/
        ├── config-caching
        ├── route-caching
        ├── events-caching
        ├── services-cache
        ├── optimize-command
        ├── cache-invalidation-deployment
        ├── opcache-configuration
        ├── composer-autoloader-optimization
        └── bootstrap-warmup-in-cicd
```

---

# Domain → Subdomain Mapping

## Laravel Execution Lifecycle & Framework Internals
→ Request Lifecycle
→ Entry Point Mechanics
→ HTTP Kernel Dispatch
→ Console Kernel Dispatch
→ Response Sending and Termination
→ Lifecycle Events and Hooks

## Laravel Execution Lifecycle & Framework Internals
→ Service Container
→ Container Fundamentals
→ Binding Types
→ Binding Resolution
→ Auto-Resolution via Reflection
→ Contextual Binding
→ Tagged Bindings
→ Binding Extending
→ Resolution Callbacks
→ Rebound Callbacks
→ Container Aliases
→ Circular Dependency Detection
→ Scoped Instance Management

## Laravel Execution Lifecycle & Framework Internals
→ Service Providers
→ Provider Fundamentals
→ Register vs Boot Methods
→ Deferred Providers
→ Eager Providers
→ Package Discovery and Auto-Registration
→ Environment-Specific Providers
→ Provider Properties Shortcuts
→ Provider Organization Strategies
→ Provider Testing
→ Provider Sprawl and Governance

## Laravel Execution Lifecycle & Framework Internals
→ Application Bootstrap
→ Application Class Construction
→ Base Bindings and Core Aliases
→ Application Builder Configuration
→ Bootstrap App PHP File
→ Bootstrapper Sequence
→ Path Helpers and Environment Detection
→ Application Flush and Reset

## Laravel Execution Lifecycle & Framework Internals
→ Kernel Architecture
→ HTTP Kernel Internals
→ Console Kernel Internals
→ Kernel Bootstrappers
→ Kernel Version Evolution
→ Legacy Kernel Migration
→ Request Duration Lifecycle Handlers

## Laravel Execution Lifecycle & Framework Internals
→ Middleware Pipeline
→ Pipeline Pattern Fundamentals
→ Global Middleware Stack
→ Middleware Groups
→ Route Middleware
→ Middleware Aliases
→ Middleware Priority
→ Middleware Parameters
→ Pre and Post Middleware Code
→ Terminable Middleware
→ Middleware Exclusion
→ Default Middleware Members
→ Middleware vs Route Binding Ordering
→ Middleware Configuration in Bootstrap

## Laravel Execution Lifecycle & Framework Internals
→ Dependency Injection
→ Constructor Injection
→ Method Injection
→ Auto-Resolution Strategy
→ Interface Binding Resolution
→ Service Locator Anti-Pattern
→ Facade Architecture
→ Testing with Container
→ Over-Injection Anti-Pattern
→ Injection Guidelines by Class Type

## Laravel Execution Lifecycle & Framework Internals
→ Boot Order & Timing
→ Complete Boot Sequence
→ Bootstrap With Event System
→ Register Phase Order
→ Boot Phase Order
→ Lifecycle Callback Hooks
→ Deferred Provider Loading Timing
→ Octane Boot Timing
→ Console vs HTTP Boot Differences

## Laravel Execution Lifecycle & Framework Internals
→ Long-Running Processes
→ Octane Architecture Overview
→ Singleton State Leaks
→ Scoped Bindings for Octane
→ Static Property Accumulation
→ Octane Lifecycle Hooks
→ Octane Configuration and Workers
→ Queue Worker Lifecycle
→ Service Binding Audit
→ Octane Package Compatibility
→ Memory Profiling and Observability

## Laravel Execution Lifecycle & Framework Internals
→ Caching & Optimization
→ Config Caching
→ Route Caching
→ Events Caching
→ Services Cache
→ Optimize Command
→ Cache Invalidation Deployment
→ OpCache Configuration
→ Composer Autoloader Optimization
→ Bootstrap Warmup in CI/CD

---

# Future Growth Considerations

1. **New runtime technologies.** The `long-running-processes/` subdomain can accommodate RoadRunner-specific, FrankenPHP-specific, or future runtime knowledge units without restructuring. Simply add files within that directory.

2. **PHP version impact.** As PHP adds features (property hooks, fiber improvements, JIT changes), new knowledge units about their interaction with the bootstrap/container can be added under `application-bootstrap/` or `service-container/` without reorganizing.

3. **Laravel version evolution.** The `kernel-architecture/` subdomain already includes `kernel-version-evolution` and `legacy-kernel-migration`. Future architecture changes (e.g., Laravel 14/15) can add new knowledge units here.

4. **Container features.** If Laravel adds new binding types or container features (e.g., compile-time container, AOT resolution), they slot cleanly under `service-container/`.

5. **Observability and APM.** A future `observability/` subdomain could be added at the top level if monitoring and tracing become a first-class concern, without affecting existing structure.

6. **Server-specific bootstrap.** Topics like FrankenPHP worker mode, Swoole coroutine bootstrap, or custom PHP-FPM pool configuration could be added under `long-running-processes/` without restructuring.

7. **Attribute-based registration.** As Laravel moves toward PHP attributes for middleware, routes, events, and provider registration, new knowledge units can be added under the relevant subdomain (e.g., `middleware-configuration-in-bootstrap` or a new `attribute-registration/` leaf).

8. **No nesting beyond 3 levels.** The structure strictly limits to Domain → Subdomain → Knowledge Unit (3 levels). No sub-subdomains. This prevents the tree from becoming too deep to navigate.

9. **Cross-domain references.** Knowledge units should reference other domains via convention: e.g., a knowledge unit about middleware auth ordering should reference `security-identity/authentication/middleware-integration` rather than duplicating that content.
