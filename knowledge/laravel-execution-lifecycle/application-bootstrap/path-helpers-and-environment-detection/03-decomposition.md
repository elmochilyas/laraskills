# Decomposition: Path Helpers and Environment Detection

## Boundary Analysis
The KU covers two related but distinct subsystems: path helpers (all `*Path()` methods and `use*Path()` mutators) and environment detection (`runningInConsole()`, `runningUnitTests()`, `environment()`, `getNamespace()`). The boundary includes how these are bound in the container and how they compute their return values. Excluded are downstream consumers of these values (e.g., how `environment('production')` affects specific framework behaviors).

**In scope:** All path helper methods, `use*Path()` mutators, `bindPathsInContainer()`, `runningInConsole()`, `runningUnitTests()`, `environment()`, `getNamespace()`, fallback logic.
**Out of scope:** Config loading, `.env` parsing, framework behavior changes based on environment, Composer autoloader internals.

## Atomicity Assessment
**Status:** ⚡ Splittable (2 units)

**Proposed split:**
1. **Path Helpers** — all `*Path()` methods, path binding mechanism, `use*Path()` mutators, fallback computation.
2. **Environment Detection** — `runningInConsole()`, `runningUnitTests()`, `environment()`, `getNamespace()`, and the detection context established in the constructor.

**Splitting rationale:** Path helpers are about filesystem layout and can be understood independently of environment detection. Environment detection is about runtime context awareness. They share no internal state beyond the Application instance. A framework engineer might need to understand path customization without caring about environment detection, and vice versa.

## Dependency Graph
```
┌─────────────────────────────────────────────┐
│        Application::__construct             │
│  Sets: $this->runningInConsole              │
│  Calls: bindPathsInContainer()              │
└──────────┬────────────────────────┬─────────┘
           │                        │
           ▼                        ▼
┌─────────────────────┐  ┌──────────────────────┐
│ Path Helpers        │  │ Environment Detection │
│                     │  │                      │
│ basePath()          │  │ runningInConsole()    │
│ appPath()           │  │ runningUnitTests()    │
│ configPath()        │  │ environment()         │
│ storagePath()       │  │ getNamespace()        │
│ resourcePath()      │  │                      │
│ langPath()          │  │ Depends on:           │
│ databasePath()      │  │ - config (env.)       │
│ publicPath()        │  │ - composer.json       │
│ bootstrapPath()     │  │   (getNamespace)      │
│                     │  │ - SAPI (console)      │
│ useStoragePath()    │  │                      │
│ useAppPath() (etc.) │  │                      │
└─────────────────────┘  └──────────────────────┘
```

Path helpers and environment detection are orthogonal — they share only the Application instance as context.

## Follow-up Opportunities
- **Custom Directory Layout Guide:** Document every `use*Path()` method with deployment scenarios (serverless, Docker, multi-tenant directory isolation).
- **Environment Detection in Testing:** Best practices for `$this->artisan()` in tests — how `runningUnitTests()` propagates to Artisan commands and why it sometimes does not.
- **Path Override Performance Benchmark:** Measure the overhead of using `$app->useStoragePath('/tmp/storage')` vs the default `storage_path()` — quantify the container binding lookup cost.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization