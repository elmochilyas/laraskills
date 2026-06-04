# Decomposition — Prune Command

## Implementation Tasks

### T1: Verify the `model:prune` command is registered
**File:** `tests/Unit/PruneCommandTest.php`
- Run `Artisan::call('list')` and assert the output contains `model:prune`.
- Assert the command signature is `model:prune {--model=*} {--pretend}`.

### T2: Test model discovery and pruning execution
**File:** `tests/Unit/PruneCommandTest.php`
- Create two models: one with `Prunable` trait, one without.
- Define `prunable()` on the first.
- Create eligible records for both models.
- Run `Artisan::call('model:prune')`.
- Assert records from the prunable model are deleted.
- Assert records from the non-prunable model remain.

### T3: Test `--model` flag targeting specific models
**File:** `tests/Unit/PruneCommandTest.php`
- Create two prunable models: `User` and `Post`.
- Create eligible records for both.
- Run `Artisan::call('model:prune', ['--model' => 'User'])`.
- Assert User records are pruned.
- Assert Post records remain (not targeted).

### T4: Test `--model` flag with multiple models
**File:** `tests/Unit/PruneCommandTest.php`
- Run `Artisan::call('model:prune', ['--model' => ['User', 'Post']])`.
- Assert both User and Post records are pruned.

### T5: Test `--pretend` mode
**File:** `tests/Unit/PruneCommandTest.php`
- Create eligible records for a prunable model.
- Run `Artisan::call('model:prune', ['--pretend' => true])`.
- Assert output contains "Would prune" or similar text.
- Assert records are NOT deleted (count unchanged).

### T6: Schedule the prune command
**File:** `app/Console/Kernel.php`
- Add to the `schedule` method:
  ```php
  $schedule->command('model:prune')
      ->daily()
      ->withoutOverlapping()
      ->onFailure(fn () => Log::error('Prune failed'));
  ```
- Write a test that simulates the scheduler running the command.

### T7: Configure custom model discovery paths
**File:** `config/prune.php` (publish if not exists)
- Set `'discovery' => ['model_paths' => [app_path('Models'), app_path('Domain/Models')]]`.
- Move a prunable model to the custom path.
- Assert the command discovers and prunes it.

### T8: Add logging/monitoring for prune execution
**File:** `app/Console/Kernel.php` (or a custom listener)
- Modify the schedule to log start/end of prune:
  ```php
  $schedule->command('model:prune')
      ->daily()
      ->before(fn () => Log::info('Starting model prune'))
      ->after(fn () => Log::info('Model prune completed'));
  ```
- Alternatively, use a `then` callback to capture output to a log file.

### T9: Test error handling when a model throws during `prune()`
**File:** `tests/Unit/PruneCommandTest.php`
- Create a prunable model whose `prune()` method throws an exception.
- Run the command.
- Assert the exception is caught and logged.
- Assert the command continues to other models.
- Assert other prunable models are still pruned.

### T10: Test the command's exit code
**File:** `tests/Unit/PruneCommandTest.php`
- Run `Artisan::call('model:prune')` with successful pruning.
- Assert exit code is `0`.
- Run with a model that fails.
- Assert exit code is non-zero (or `1`).

### T11: Create a custom prune command for a specific subset
**File:** `app/Console/Commands/PruneOldRecords.php`
- Create a command that calls `model:prune --model=User` but with additional logging.
- Register it in `Kernel::commands()`.
- Write a test that the custom command works.

## Test Specifications

| Test | Expected Outcome |
|---|---|
| `model:prune` discovers and prunes all prunable models | Eligible records from all prunable models deleted |
| `--model=User` prunes only User model | Only User records deleted |
| `--model=User,Post` prunes both models | Both User and Post records deleted |
| `--pretend` outputs records but does NOT delete | Output contains record details; DB unchanged |
| Non-prunable models are ignored | Records from non-prunable models remain |
| Schedule executes prune correctly | Command invoked as configured; schedules run without overlapping |
| Custom model discovery paths work | Models outside `app/Models` are discovered |
| Model throwing exception does not stop entire command | Faulty model logged; other models still pruned |
| Exit code 0 on success | Command exits normally |
| Exit code non-zero on failure | Command exits with error code |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization