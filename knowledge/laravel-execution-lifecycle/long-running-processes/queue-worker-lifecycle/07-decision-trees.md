# Decision Trees: Queue Worker Lifecycle

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Knowledge Unit:** Queue Worker Lifecycle
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-QW-01 | Queue Worker Safety Configuration | Reliability | Medium | Per worker setup |
| DT-QW-02 | State Reset Strategy Between Jobs | Reliability | Medium | Per application setup |
| DT-QW-03 | Job Constructor Injection Pattern | Design | Medium | Per job class creation |

---

## DT-QW-01: Queue Worker Safety Configuration

### Decision Context
- **When to decide:** When setting up queue workers for production
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Running queue:work or configuring Horizon
- **Constraint:** Queue workers lack sandbox isolation — persistent state accumulates across jobs

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Memory growth rate | High | MB per job from profiling |
| Baseline memory | High | Idle worker memory after boot |
| Job volume | Medium | Jobs per hour × max_jobs determines churn frequency |

### Decision Tree

```
Has memory profiling data been collected for queue workers?
├── Yes — growth per job is known
│   └── Calculate max-jobs:
│       ├── safe_max = (memory_limit - baseline) / growth_per_job * 0.8
│       ├── Example: (128MB - 30MB) / 0.3MB * 0.8 = ~261
│       └── Set --max-jobs=250
│
├── No — no profiling data yet
│   ├── Start with conservative default:
│   │   ├── --max-jobs=500 (equivalent to Octane default)
│   │   └── --max-time=3600 (1 hour maximum runtime)
│   │
│   └── Monitor and adjust:
│       ├── Workers OOM before max-jobs? → reduce max-jobs
│       └── Workers never reach max-jobs? → increase for less churn
│
└── Regardless of data:
    └── NEVER run without --max-jobs
        └── Unbounded growth → certain OOM
```

### Rationale
Queue workers have no sandbox mechanism. Every job mutates the same container and static properties. Without `--max-jobs`, workers accumulate memory unbounded until the OS OOM killer terminates them, losing the current job. `--max-jobs` is the safety valve.

### Default Path
Always set `--max-jobs=500` (or calculated value) and `--max-time=3600`. Never run without limits.

### Risks
- No safety valve = unbounded memory growth, certain OOM crash
- max-jobs too low = excessive worker churn, reduced throughput
- max-jobs too high = workers OOM before recycling, job lost

### Related Rules/Skills
- Always set `--max-jobs` or Horizon `maxJobs`
- Skill: Configure Queue Worker Safety for Long-Running Execution

---

## DT-QW-02: State Reset Strategy Between Jobs

### Decision Context
- **When to decide:** When setting up queue worker state management
- **Stakeholders:** Backend Developers
- **Trigger:** Deploying queue workers with persistent container
- **Constraint:** Queue::looping() is the only hook between job iterations

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| State accumulation risk | High | Auth guards, string caches, static registries all persist |
| Reset overhead | Medium | Heavy listeners delay next job pickup |
| Context safety | Medium | Queue::looping() also fires in Octane — must guard |

### Decision Tree

```
What needs to be reset between jobs?
├── Auth guards and session state
│   └── Reset in Queue::looping():
│       ├── app(AuthManager::class)->forgetGuards()
│       └── app(SessionManager::class)->forgetDrivers()
│
├── Static caches and registries
│   └── Reset in Queue::looping():
│       ├── Str::resetCache()
│       ├── Collection::clearMacros()
│       └── App-specific static registry clears
│
├── Package-specific state
│   └── Reset in Queue::looping():
│       └── PermissionRegistrar::forgetCachedPermissions()
│
└── Memory pressure management
    └── In Queue::looping():
        └── if memory > 80% limit: gc_collect_cycles()
            └── Only when root count is high (gc_status()['roots'] > threshold)

IMPORTANT: Guard all Queue::looping() registrations:
└── if (app()->runningInConsole()) { ... }
    └── Prevents firing during Octane requests
```

### Rationale
`Queue::looping()` is the queue worker's equivalent of Octane's `RequestTerminated`. Without it, auth state, string caches, and static registries accumulate indefinitely across jobs. The `runningInConsole()` guard prevents the callback from firing in non-queue contexts.

### Default Path
Register a `Queue::looping()` callback in `AppServiceProvider::boot()`, guarded with `runningInConsole()`, that resets auth guards, string caches, collection macros, and app-specific static registries.

### Risks
- Not registering looping callback = accumulated state across jobs
- Not guarding with runningInConsole = fires during Octane requests
- Heavy callbacks (HTTP calls, queued dispatches) block worker from picking up next job

### Related Rules/Skills
- Register a `Queue::looping()` callback for state reset
- Guard `Queue::looping()` against non-queue contexts
- Skill: Configure Queue Worker Safety for Long-Running Execution

---

## DT-QW-03: Job Constructor Injection Pattern

### Decision Context
- **When to decide:** When creating a new job class
- **Stakeholders:** Backend Developers
- **Trigger:** Defining a job's __construct and handle methods
- **Constraint:** Constructor runs at dispatch time; handle() runs at execution time — potentially in a different process

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Execution context | High | Constructor = dispatch time; handle = worker time |
| Service persistence | High | Singleton state persists across jobs in the same worker |
| Data freshness | High | Models serialized in constructor may be stale |

### Decision Tree

```
Is the dependency request-scoped or time-sensitive?
├── Yes — Eloquent model, auth user, session data
│   └── Store ONLY the identifier in constructor
│       ├── public function __construct(private int $orderId) {}
│       └── Fetch fresh in handle():
│           └── public function handle(): void { $order = Order::find($this->orderId); }
│
├── No — stateless service (logger, cache, HTTP client)
│   └── Type-hint in handle() for container resolution
│       └── public function handle(Logger $log): void { ... }
│
└── No dependencies needed
    └── Empty constructor or only primitive payload data
        └── public function __construct(private array $payload) {}
```

### Rationale
Job constructors run at dispatch time with the current request context. By the time the worker executes the job, resolved services may be stale. Eloquent models serialized in the constructor may have changed. Storing only identifiers and fetching fresh data in `handle()` guarantees correctness.

### Default Path
Store only primitive IDs in constructor. Resolve all services and models inside `handle()`.

### Risks
- Stale Eloquent model in constructor — `$order->status` may have changed by execution time
- Singleton service injected in constructor — state leaks across jobs in the same worker
- Request-scoped service (auth, session) injected in constructor — null or wrong context at execution time

### Related Rules/Skills
- Load dependencies in `handle()`, not the constructor
- Skill: Configure Queue Worker Safety for Long-Running Execution
