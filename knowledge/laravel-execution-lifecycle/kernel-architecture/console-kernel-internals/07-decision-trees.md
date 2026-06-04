# Decision Trees — Console Kernel Internals

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Kernel Architecture |
| Knowledge Unit | Console Kernel Internals |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Explicit Registration vs Auto-Discovery | Whether to use `$commands` array or `load()` for Artisan command registration | Every new command | Medium |
| D02 | Schedule Task Configuration | What safety measures to apply when defining a scheduled task | Every schedule definition | High |
| D03 | Console Command vs HTTP Controller | Whether logic belongs in an Artisan command or an HTTP controller | Every new feature | Medium |
| D04 | Long-Running Command Bounds | What resource limits to set for long-running Artisan commands | Queue worker/deamon setup | High |

---

## D01: Explicit Registration vs Auto-Discovery

### Decision Context
You are registering Artisan commands in the Console Kernel. You can either list them explicitly in the `$commands` array or use `$this->load()` to auto-discover commands from a directory.

### Criteria
1. **Environment**: Is this production or development?
2. **Command count**: How many commands are being registered?
3. **Directory purity**: Does the commands directory contain only command classes?
4. **Maintenance burden**: Will the command list change frequently?

### Decision Tree
```
Registering Artisan commands
├── Is this production?
│   ├── Yes → Use explicit registration ($commands array or ->withCommands())
│   └── No → Is the commands directory "pure" (only command classes)?
│       ├── Yes → Auto-discovery via load() is acceptable for development
│       └── No → Use explicit registration (avoids autoloader errors)
├── Command count >20?
│   ├── Yes → Use load() auto-discovery + explicit overrides for specific commands
│   └── No → Explicit registration is cleaner
```

### Rationale
Explicit registration loads only the listed classes, avoiding autoloader overhead from scanning every file in the commands directory. Auto-discovery via `load()` triggers the Composer autoloader for each file, including non-command files that may cause parse errors. In production, the performance and predictability of explicit registration are preferred.

### Default
Explicit registration in production. Auto-discovery acceptable in development with a clean commands directory.

### Risks
- Using `load()` with non-command files in the directory = autoloader errors.
- Forgetting to add new commands to the `$commands` array = "command not found".
- Duplicate registration via both `$commands` and `load()` = redundant but harmless.

### Related Rules/Skills
- Rule: Prefer explicit command registration over auto-discovery in production
- Skill: Register and Verify Artisan Commands

---

## D02: Schedule Task Configuration

### Decision Context
You are defining a scheduled task in the `schedule()` method. You must decide which safety measures (overlapping protection, background execution, timeouts) to apply.

### Criteria
1. **Task duration**: How long does the task typically run?
2. **Overlap risk**: Could the task still be running when the next schedule tick occurs?
3. **Criticality**: Would a task failure have significant business impact?
4. **Output handling**: Does the task produce output that needs to be captured?

### Decision Tree
```
Scheduled task definition
├── Could the task duration exceed the schedule frequency?
│   ├── Yes → Add ->withoutOverlapping() (prevents concurrent instances)
│   │   └── Also consider ->runInBackground() (avoids blocking schedule:run)
│   └── No (task completes well within frequency) -> No overlap protection needed
├── Does the task run for >5 minutes or produce stdout?
│   ├── Yes -> Add ->runInBackground() (prevents schedule:run from hanging)
│   └── No -> Run in foreground (simpler, output available in logs)
├── Does the task depend on the previous run completing?
│   ├── Yes -> Add ->withoutOverlapping() + ->onOneServer() (prevents concurrent + multi-server)
│   └── No -> No additional constraints
```

### Rationale
Schedule tasks that overlap cause concurrent processes that degrade performance, corrupt state, or exhaust resources. `->withoutOverlapping()` prevents multiple instances by maintaining a mutex in the cache. `->runInBackground()` prevents the task from blocking the `schedule:run` process, allowing subsequent tasks to be evaluated.

### Default
Add `->withoutOverlapping()` for any task whose duration might exceed its frequency. Add `->runInBackground()` for long-running tasks.

### Risks
- No overlap protection on long tasks = concurrent process pileup → OOM.
- No `->runInBackground()` on slow tasks = subsequent tasks delayed.
- `->onOneServer()` without cache driver = mutex not shared across servers.

### Related Rules/Skills
- Skill: Configure and Safeguard Scheduled Tasks

---

## D03: Console Command vs HTTP Controller

### Decision Context
You have a piece of logic that could be exposed either as an Artisan command or an HTTP endpoint. Which should you choose?

### Criteria
1. **Trigger mechanism**: Is this triggered by user action, cron, or a queue?
2. **Response expectation**: Does the caller expect an HTTP response?
3. **Authentication**: Is this an admin-only operation?
4. **Idempotency**: Should running it multiple times be safe?

### Decision Tree
```
Logic needs an execution entry point
├── Is the trigger cron-based or event-driven (queue)?
│   ├── Yes -> Console command (CLI-first, cron-friendly)
│   └── No -> Is the trigger a user action from a browser?
│       ├── Yes -> HTTP controller (returns response, handles session)
│       └── No -> Can be either — check auth requirements
├── Does the operation need interactive input/confirmation?
│   ├── Yes -> Console command (CLI prompts, --force flags)
│   └── No -> HTTP controller may be simpler
├── Is the operation idempotent and safe to run on a schedule?
│   ├── Yes -> Console command (schedule-friendly)
│   └── No -> HTTP controller (request-gated)
```

### Rationale
Console commands are better for cron jobs, queue workers, and CLI operations. HTTP controllers are better for user-facing operations that return responses. Some operations benefit from both — implement the logic in a shared service class and create thin entry points for each.

### Default
User-facing, response-based operations → HTTP controller. Background, cron, or admin operations → Console command.

### Risks
- Exposing sensitive admin operations only as console commands (not accessible via web) but without authentication in the command itself.
- Building console commands for operations that need real-time HTTP responses.

### Related Rules/Skills
- Rule: Do not inject HTTP-specific services into console commands
- Skill: Register and Verify Artisan Commands

---

## D04: Long-Running Command Bounds

### Decision Context
You are configuring a long-running Artisan command (queue worker, daemon, or batch processor). You need to set resource limits to prevent memory leaks and process crashes.

### Criteria
1. **Total expected runtime**: How long should the process run before restarting?
2. **Memory growth**: Does the command accumulate state (singletons, static properties)?
3. **Job count**: How many units of work should be processed before a clean restart?
4. **Supervisor management**: Is a process supervisor (Supervisord) managing the process?

### Decision Tree
```
Configuring long-running command bounds
├── Does the command process discrete units of work (queue jobs, batch items)?
│   ├── Yes -> Set --max-jobs=500 (or lower if each job uses significant memory)
│   └── No -> Set --max-time based on acceptable runtime
├── Does the command accumulate state across iterations?
│   ├── Yes -> Set both --max-jobs and --max-time (restart prevents OOM)
│   └── No (stateless iterations) -> Set a generous --max-time
├── Is a process supervisor (Supervisord) running?
│   ├── Yes -> Set higher limits; supervisor handles restart
│   │   └── --max-jobs=1000, --max-time=3600
│   └── No -> Set conservative limits; restarts are not automatic
│       └── --max-jobs=100, --max-time=600
```

### Rationale
Long-running PHP processes accumulate memory from singleton state leaks, static property growth, and unresolved references. Setting `--max-jobs` and `--max-time` forces a clean process restart before OOM occurs. The limits depend on the workload and supervisor configuration — with a process supervisor, higher limits are safe because automatic restart handles termination.

### Default
`--max-jobs=500 --max-time=3600` as a safe starting point. Adjust based on observed memory growth.

### Risks
- No limits = eventual OOM crash, losing in-progress work.
- Limits too low = excessive restarts, reduced throughput.
- Limits too high = risk of OOM before restart, losing in-progress work.

### Related Rules/Skills
- Rule: Always bound long-running commands with `--max-jobs` and `--max-time`
- Skill: Build and Test a Long-Running Console Command
