# Decomposition: Console Kernel Dispatch

## Boundary Analysis
This KU covers the `Illuminate\Foundation\Console\Kernel` class — entry via `artisan`, `Application::handleCommand()`, command registration from all sources (framework, providers, directory scanning, manual), the Artisan/Symfony Console dispatch flow, and the task scheduler (`schedule()` definition, `schedule:run` evaluation, mutex management). It excludes individual Artisan command implementations (they belong to specific tooling domains like Migrations, Queue, etc.), the HTTP kernel's pipeline (separate KU), and the scheduler's cron integration specifics (operational concern). Console output formatting (Symfony Console helper tables, progress bars) is excluded as presentation detail.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
The Console kernel is a single coherent entry point with two sub-features (command dispatch and scheduling) that are tightly coupled to the kernel's bootstrap lifecycle. Extracting the scheduler into a separate KU would require the scheduler KU to re-describe the kernel's command registration and bootstrap flow.

## Dependency Graph
```
Console Kernel Dispatch
├── Entry Point Mechanics          (artisan entry pattern)
├── HTTP Kernel Dispatch           (parallel kernel structure)
├── Service Providers              (provider command registration)
├── Boot Order & Timing            (different bootstrapper set)
└── Long-Running Process Arch.     (Horizon/Octane CLI interaction)
```

## Follow-up Opportunities
- "Task Scheduler Deep Dive" — The `Illuminate\Console\Scheduling\Schedule` class, event filtering logic, mutex implementations (file vs redis vs DB), cron expression evaluation, `onOneServer()` with mutex drivers, and subprocess management could form a standalone KU if the scheduler continues to gain features (Laravel 12+ added `onOneServer` enhancements).
- "Artisan Console Input & Output Architecture" — The Symfony Console Input/Output system, argument/option parsing, command lifecycle events (`CommandStarting`, `CommandFinished`), and custom output formatters could be extracted for developers building complex CLI tools.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization