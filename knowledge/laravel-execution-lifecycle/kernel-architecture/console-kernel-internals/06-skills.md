# Skill: Register and Verify Artisan Commands

## Purpose
Register Artisan commands in the Console Kernel using explicit registration, auto-discovery, or Laravel 11+ ApplicationBuilder syntax and verify they are properly resolved.

## When To Use
- Adding a new Artisan command to a Laravel application
- Switching from auto-discovery to explicit registration for production
- Setting up command registration in a new Laravel 11+ project
- Debugging "command not found" errors

## When NOT To Use
- Registering service providers or middleware (use their respective registration mechanisms)
- Configuring route definitions (use route files)
- HTTP request handling — use the HTTP kernel

## Prerequisites
- Familiarity with `php artisan make:command`
- Understanding of the `$commands` property, `commands()` method, and `load()` method in Console Kernel
- Access to the application's `Console\Kernel` or `bootstrap/app.php`

## Inputs
- List of command class names to register
- Directory path containing command files (for auto-discovery)
- Laravel version (10 vs 11+)

## Workflow
1. Identify which registration method your project uses: `$commands` array, `commands()` with `load()`, or `->withCommands()` in `bootstrap/app.php`
2. For production environments, create an explicit array of command class names:
   - Laravel 10: Add to `protected $commands = [...]` in `app/Console/Kernel.php`
   - Laravel 11+: Add to `->withCommands([...])` in `bootstrap/app.php`
3. For development with many commands, configure auto-discovery via `$this->load(__DIR__.'/Commands')` in the `commands()` method
4. Run `php artisan list` to verify the command appears in the command listing
5. Run `php artisan <command> --help` to verify option/argument definitions are correct
6. Run the command with a dry-run or test flag to confirm execution

## Validation Checklist
- [ ] Command appears in `php artisan list` output
- [ ] Command class is autoloaded correctly (no ReflectionException)
- [ ] Arguments and options from `$signature` are parsed correctly
- [ ] Running with `--help` shows expected usage text
- [ ] In production, explicit registration is used (no `load()` auto-discovery)

## Common Failures
- "Command not found" error: Command class not registered or autoloader cannot find it
- Auto-discovery scans non-command files: `load()` reads all PHP files in the directory — non-command classes trigger autoloader or parse errors
- Missing `load()` call: Commands directory is not scanned; commands silently unavailable
- Duplicate registration: Adding same command via both `$commands` array and `load()` — no error but redundant resolution

## Decision Points
- **Explicit vs auto-discovery**: Explicit in production for deterministic loading; auto-discovery acceptable in development for convenience
- **Single commands array vs withCommands()**: Use `$commands` for Laravel 10, `->withCommands()` for Laravel 11+
- **Lazy vs eager loading**: Commands are lazy by default — no decision needed for performance

## Performance Considerations
- Explicit registration loads only the listed classes — lower autoloader overhead than `load()` directory scanning
- Auto-discovery triggers Composer autoloader for every file in the commands directory — avoid in production
- Each `artisan` command runs the full bootstrap sequence (6 bootstrappers) — bootstrap dominates execution time for simple commands
- OPcache is less effective for CLI than HTTP because each `artisan` is a separate PHP process

## Security Considerations
- Commands run with full application access — ensure sensitive actions (data deletion, billing operations) require confirmation flags or environment checks
- Exit codes matter in CI/CD: returning non-zero on failure prevents silent pipeline success
- Missing `.env` breaks all artisan commands, including recovery commands like `php artisan down`

## Related Rules
- Prefer explicit command registration over auto-discovery in production (Performance)
- Keep console command `handle()` methods thin by delegating to service classes (Maintainability)

## Related Skills
- Configure and Safeguard Scheduled Tasks
- Build and Test a Long-Running Console Command

## Success Criteria
- New `php artisan` commands are discoverable and executable
- All registration methods produce identical command resolution at runtime
- Explicit registration is used in production; auto-discovery is avoided
- Running `php artisan list` shows all registered commands

---

# Skill: Configure and Safeguard Scheduled Tasks

## Purpose
Define scheduled tasks in the Console Kernel's `schedule()` method with overlapping protection, background execution, and performance-safe evaluation logic.

## When To Use
- Setting up cron-driven tasks like report generation, cleanup, or notifications
- Converting manual periodic scripts into Laravel scheduled tasks
- Refactoring existing schedule definitions for reliability

## When NOT To Use
- Real-time event-driven tasks (use queues or listeners)
- Tasks that must run on every request (use middleware)
- One-off or ad-hoc commands (run manually or via deployment hooks)

## Prerequisites
- A working cron entry: `* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1`
- Artisan commands already registered for each scheduled task
- Understanding of cron expression equivalents in Laravel (daily, hourly, everyMinute, etc.)

## Inputs
- Command names or closures to execute
- Frequency specifications (cron expression or Laravel helper)
- Overlap, background, and environment constraints

## Workflow
1. Open the schedule definition location:
   - Laravel 10: `app/Console/Kernel.php` method `schedule(Schedule $schedule)`
   - Laravel 11+: `->withSchedule(function (Schedule $schedule) { ... })` in `bootstrap/app.php`
2. For each task, call the appropriate scheduling method:
   - `$schedule->command('reports:generate')->daily()` for Artisan commands
   - `$schedule->job(SendNotifications::class)->everyFiveMinutes()` for queue jobs
   - `$schedule->call(fn() => ...)->hourly()` for closures (keep fast)
3. Apply `->withoutOverlapping()` to any task that may exceed its interval
4. Apply `->runInBackground()` to tasks whose output is not needed and can run independently
5. Apply `->environments(['production'])` to restrict environment if needed
6. Apply `->when(function() { return condition; })` for conditional execution
7. Keep the `schedule()` definition lightweight — no database queries, API calls, or heavy computations. Defer all work to command `handle()` methods

## Validation Checklist
- [ ] `schedule:run` executes without error
- [ ] Each command triggers at its intended frequency
- [ ] `->withoutOverlapping()` prevents concurrent instances (verify with overlapping test)
- [ ] Background tasks produce expected results despite discarded output
- [ ] The schedule definition contains no heavy logic — only scheduling calls and simple conditionals
- [ ] Log output confirms task execution at expected intervals

## Common Failures
- Overlapping tasks: Long-running tasks start a second instance before the first finishes, causing race conditions. Fix: add `->withoutOverlapping()`
- Sequential blocking: Foreground tasks block the `schedule:run` process; if one is slow, subsequent tasks are delayed. Fix: add `->runInBackground()`
- Heavy schedule definitions: Complex computations or queries in `schedule()` add overhead every cron minute. Fix: move logic to command `handle()`
- Environment mismatch: Task runs in wrong environment (e.g., production task fires in development). Fix: add `->environments(['production'])`

## Decision Points
- **Foreground vs background**: Background for output-independent tasks; foreground when exit code matters or when output is consumed by subsequent tasks
- **withoutOverlapping vs no guard**: Always guard unless the task is idempotent, read-only, and safe to run concurrently with documented rationale
- **Command vs Job vs Closure**: Prefer command for complex multi-step work, job for queue dispatch, closure only for trivial in-memory operations

## Performance Considerations
- `schedule:run` evaluates all task constraints on every cron tick — evaluate 50+ tasks, each due-check adds overhead
- Background tasks (`->runInBackground()`) free the `schedule:run` process to proceed immediately
- Overlapping protection uses file locks (cache driver) — ensure a fast cache driver like Redis for high-frequency tasks
- Each scheduled command triggers a full bootstrap sequence — for sub-minute frequencies, consider alternatives

## Security Considerations
- Tasks running in background discard output — ensure non-output monitoring (logging) is in the command itself
- File lock directory for `->withoutOverlapping()` must be writable
- Tasks with `->environments(['production'])` won't run in other envs — test in staging with a separate env restriction

## Related Rules
- Keep schedule task evaluation fast and idempotent (Performance)
- Use `->withoutOverlapping()` for all long-running scheduled tasks (Reliability)
- Prefer `->runInBackground()` for non-critical scheduled tasks (Performance)

## Related Skills
- Register and Verify Artisan Commands
- Build and Test a Long-Running Console Command

## Success Criteria
- All scheduled tasks execute at their configured frequency without overlap
- `schedule:run` returns quickly (under 100ms evaluation overhead regardless of task count)
- No two instances of the same task run concurrently
- Background tasks produce expected side effects despite discarded stdout

---

# Skill: Build and Test a Long-Running Console Command

## Purpose
Construct an Artisan command that processes items in a loop (e.g., batch processing, queue worker, migration) with memory safety, progress output, and bounded execution limits.

## When To Use
- Building a batch processing command that iterates over thousands of records
- Creating a custom queue worker or consumer
- Writing a data migration or ETL command
- Implementing a long-running daemon-like Artisan command

## When NOT To Use
- Simple one-shot commands that complete in a single execution (use standard `handle()`)
- HTTP request handling (use controllers/middleware)
- Scheduled tasks (use schedule definitions, but the underlying command may use this pattern)

## Prerequisites
- Command already registered in the Console Kernel (see "Register and Verify Artisan Commands")
- Understanding of memory management in PHP long-running processes
- Familiarity with `$this->option()`, `$this->argument()`, `$this->output->progressAdvance()`

## Inputs
- The command signature with `--max-jobs` and `--max-time` options
- The data source to iterate over (query, file, queue)
- Per-item processing logic (delegated to a service class)
- Memory cleanup strategy per iteration

## Workflow
1. Define the command signature with bounded execution options:
   ```
   protected $signature = 'process:items
                           {--max-jobs=500 : Maximum items to process}
                           {--max-time=3600 : Maximum seconds to run}
                           {--dry-run : Process without side effects}';
   ```
2. Keep the `handle()` method thin — inject a service class and delegate:
   ```php
   public function handle(ItemProcessor $processor): int
   {
       $maxJobs = (int) $this->option('max-jobs');
       $maxTime = (int) $this->option('max-time');
       $start = time();
       $processed = 0;

       while ($processed < $maxJobs && (time() - $start) < $maxTime) {
           $item = $processor->nextItem();
           if ($item === null) break;

           if (!$this->option('dry-run')) {
               $processor->process($item);
           }

           $processed++;
           $this->output->write("\rProcessed: {$processed}");
       }

       $this->newLine();
       $this->info("Processed {$processed} items.");
       return 0;
   }
   ```
3. Ensure the processor service clears references per iteration to prevent memory leaks:
   ```php
   public function process(Item $item): void
   {
       // Business logic...
       // No static accumulations; clear large local vars explicitly
   }
   ```
4. Add signal handling for graceful shutdown (optional but recommended):
   ```php
   pcntl_signal(SIGINT, function () use (&$running) { $running = false; });
   ```
5. Test with small batch sizes and verify memory is stable
6. Run with `--max-jobs=500 --max-time=3600` in production

## Validation Checklist
- [ ] Command respects `--max-jobs` and terminates after processing that many items
- [ ] Command respects `--max-time` and terminates before the time limit
- [ ] Memory usage is stable (no growth) across iterations — verify with `memory_get_usage()`
- [ ] `--dry-run` flag prevents all side effects while still iterating
- [ ] Progress output does not overflow or slow down the command
- [ ] Error on one item does not abort the entire batch (try-catch per item)
- [ ] Command returns 0 on success, non-zero on failure

## Common Failures
- Memory leaks: Singleton state, static property accumulation, closure references keeping objects alive. Fix: avoid statics, unset large variables, test with `memory_get_usage()` in each iteration
- Unbounded execution: Missing `--max-jobs` or `--max-time` causes OOM crash. Fix: always enforce both limits
- Error killing the process: Uncaught exception in an item loop terminates the entire command. Fix: wrap per-item logic in try-catch
- Output buffering: Heavy progress output can slow processing. Fix: use `$this->output->write("\r...")` instead of `$this->info()` for high-frequency updates

## Decision Points
- **Service class vs inline logic**: Always delegate to a service. Commands are entry points; business logic belongs in injectable classes
- **Synchronous batch vs queued jobs**: Use queued jobs for independent work that can run concurrently; use batch command for sequential processing with ordering requirements
- **Progress output vs silent**: Use progress output for user feedback; suppress in daemon mode or use structured logging

## Performance Considerations
- Each iteration must clean up references to avoid growth — particularly important when processing Eloquent models with lazy loading
- Consider using `chunk()` or `lazy()` for database queries to avoid loading all records into memory at once
- `--max-time` should account for the last item's processing time — stop fetching new items before the hard limit
- In production, `php artisan queue:work` is preferred over custom loops — it has battle-tested memory management

## Security Considerations
- Dry-run mode must genuinely prevent all side effects — verify no database writes, file modifications, or external API calls
- Signal handling (pcntl) is not available on Windows — use cross-platform alternatives or document the limitation
- Long-running commands retain application state — configuration changes (e.g., `.env` reload) require restart

## Related Rules
- Always bound long-running commands with `--max-jobs` and `--max-time` (Reliability)
- Keep console command `handle()` methods thin by delegating to service classes (Maintainability)
- Do not inject HTTP-specific services into console commands (Architecture)

## Related Skills
- Register and Verify Artisan Commands
- Configure and Safeguard Scheduled Tasks

## Success Criteria
- Command processes the expected number of items within the time limit
- Memory usage remains flat (or within acceptable bounds) from first item to last
- A single item failure does not crash the entire batch
- `--dry-run` produces zero side effects while still validating the data pipeline
