# Decomposition: command scheduling

## Topic Overview

Laravel's command scheduler provides a fluent, expressive API for defining task schedules within PHP code, replacing the need for multiple system crontab entries. Instead of adding a crontab entry for each scheduled task, you add a single `* * * * * cd /project && php artisan schedule:run` entry, and Laravel evaluates all scheduled tasks within the `schedule` method of `App\Console\Kernel`. The scheduler supports a wide range of scheduling frequencies (`everyMinute()`, `daily()`, `hourly()`, ...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
command-scheduling/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### command scheduling
- **Purpose:** Laravel's command scheduler provides a fluent, expressive API for defining task schedules within PHP code, replacing the need for multiple system crontab entries. Instead of adding a crontab entry for each scheduled task, you add a single `* * * * * cd /project && php artisan schedule:run` entry, and Laravel evaluates all scheduled tasks within the `schedule` method of `App\Console\Kernel`. The scheduler supports a wide range of scheduling frequencies (`everyMinute()`, `daily()`, `hourly()`, ...
- **Difficulty:** Foundation
- **Dependencies:** cli-workflow-automation, custom-artisan-command-patterns, and interactive-commands

## Dependency Graph
**Depends on:** cli-workflow-automation, custom-artisan-command-patterns, and interactive-commands
**Depended on by:** Knowledge units that leverage or extend command scheduling patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for command scheduling.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization