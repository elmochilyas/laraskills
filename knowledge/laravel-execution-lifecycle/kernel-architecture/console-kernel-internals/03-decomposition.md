# Decomposition: Console Kernel Internals

## Boundary Analysis
This knowledge unit covers the console kernel's complete CLI request lifecycle. Its boundaries include:
- **In scope:** `Illuminate\Foundation\Console\Kernel` class, `handle()` input parsing and delegation, command registration mechanisms (`$commands`, `commands()`, `load()`), Symfony Application integration, schedule (`schedule()` method, `Schedule` class interaction), bootstrap integration, Artisan command resolution and execution.
- **Out of scope:** Individual command implementation (`make:model`, `serve`, etc.) — those belong to command-specific KUs. The Symfony Console Application internals (HelpSet, Descriptor, etc.) are covered only at the integration boundary. Task scheduling (`Illuminate\Console\Scheduling\Schedule`) mechanics — event filtering, mutex handling, background execution — are covered in the Task Scheduling KU. Queue worker command (`queue:work`) lifecycle belongs to Queue Worker Internals.
- **Overlap:** Bootstrap sequence (the six bootstrappers) is invoked here but detailed in Kernel Bootstrappers KU. Command registration via service provider `boot()` methods overlaps with Service Provider Internals.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:**
- The console kernel, like the HTTP kernel, is a single class with a unified responsibility: handle CLI input.
- The three core sub-responsibilities (command registration, input handling, schedule management) are inseparable — `handle()` requires all three to function.
- Schedule resolution is exposed via a separate method (`schedule()`) but is called within the same kernel lifecycle.
- The Symfony Application adaption is an implementation detail of the kernel.
- Splitting would create an artificial "Command Registration" KU that has no standalone value.

## Dependency Graph
```
console-kernel-internals
├── Prerequisites:
│   ├── PHP CLI execution model ($_SERVER['argv'])
│   ├── Symfony Console Component concepts (Input/Output, Application)
│   ├── Service Container & Service Providers
│   └── Kernel Bootstrappers (shared bootstrap sequence)
├── Internal Dependencies:
│   ├── Kernel Bootstrappers (invokes bootstrap())
│   ├── Task Scheduling (via Schedule class)
│   └── Service Container (for resolving command dependencies)
├── Related (bidirectional):
│   ├── HTTP Kernel Internals (parallel — same bootstrappers, different flow)
│   ├── Artisan Command Development (commands are consumed objects)
│   └── Queue Worker Lifecycle (queue:work is a console command with special lifecycle)
└── Consumed By:
    ├── Legacy Kernel Migration (console kernel structure changes)
    ├── Kernel Version Evolution (console kernel API changes across versions)
    └── Request Duration Lifecycle Handlers (hook timing differs from HTTP)
```

## Follow-up Opportunities
- **Custom Command Loader Development:** Building alternative command loaders (e.g., database-driven command registration, lazy-loading from external packages) — extends the kernel's registration mechanism beyond file scanning and property arrays.
- **Scheduled Task Monitor:** Deep exploration of `schedule:monitor` and `schedule:list` — exposing schedule state, execution history, and failure tracking.
- **Async Command Execution:** Patterns for running Artisan commands asynchronously (dispatching to queue, running as sub-processes) — extends beyond the synchronous `handle()` model.
- **Testing Console Commands:** The `$this->artisan()` test helper simulates console kernel invocation — understanding its internals improves test reliability and speed.
- **Maintenance Mode Integration:** How `php artisan up` / `down` interact with the console kernel's bootstrap sequence — important for deployment tooling development.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization