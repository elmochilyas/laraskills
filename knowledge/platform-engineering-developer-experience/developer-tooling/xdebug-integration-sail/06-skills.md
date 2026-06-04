# Skill: Configure Xdebug Integration with Laravel Sail

## Purpose
Enable and configure Xdebug within Laravel Sail for step-through debugging of PHP code, profiling, and code coverage analysis in Docker-based development environments.

## When To Use
- Step debugging complex business logic during development
- Debugging failing tests (Pest/PHPUnit) with breakpoints
- Profiling application performance with cachegrind output
- Code coverage analysis during test runs

## When NOT To Use
- Production environments (must never be enabled)
- When debugging is not actively needed (leave disabled to avoid overhead)
- Simple issues that can be resolved with logs or Debugbar

## Prerequisites
- Laravel Sail installed and running
- IDE with Xdebug support (PhpStorm, VS Code)
- Docker Desktop or alternative Docker runtime
- PHP Xdebug extension (included in Sail's PHP images)

## Inputs
- `.env` — `SAIL_XDEBUG_MODE` and `SAIL_XDEBUG_CONFIG` variables
- IDE configuration for Xdebug port and IDE key
- Docker networking configuration

## Workflow

1. **Enable Xdebug in Sail:** Set `SAIL_XDEBUG_MODE=debug` in `.env`. For profiling, set `SAIL_XDEBUG_MODE=profile`. For coverage, set `SAIL_XDEBUG_MODE=coverage`. Restart Sail: `sail restart`.

2. **Configure IDE Key:** Set `SAIL_XDEBUG_CONFIG="client_host=host.docker.internal client_port=9003 idekey=PHPSTORM"` in `.env`. Ensure the `idekey` matches your IDE configuration.

3. **Configure IDE Listener:** In PhpStorm, enable "Start Listening for PHP Debug Connections" ( telephone icon). For VS Code, install PHP Debug extension and set `"xdebug.ideKey": "VSCODE"`.

4. **Set Breakpoints:** Add breakpoints in your code. Use browser extensions (Xdebug helper) to trigger debugging sessions by passing `XDEBUG_SESSION` cookie/parameter.

5. **Debug CLI Commands:** For Artisan commands and tests, set `XDEBUG_MODE=debug XDEBUG_SESSION=1` environment variables before running: `sail XDEBUG_MODE=debug XDEBUG_SESSION=1 php artisan some:command`.

6. **Disable When Not Needed:** Set `SAIL_XDEBUG_MODE=off` in `.env` when not actively debugging. Xdebug adds significant overhead even when not actively stepping through code.

7. **Profile Performance (Optional):** Set `SAIL_XDEBUG_MODE=profile`, run the code to profile, and find cachegrind output files in the container for analysis with tools like QCacheGrind.

## Validation Checklist

- [ ] IDE shows "listening for Xdebug connections"
- [ ] Breakpoints hit when debugging web requests
- [ ] Breakpoints hit when debugging CLI commands and tests
- [ ] Variable inspection works during step debugging
- [ ] Profiling produces cachegrind output files
- [ ] Code coverage reports generated correctly
- [ ] Xdebug disabled when not needed (`SAIL_XDEBUG_MODE=off`)

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| IDE not connecting | Check `client_host=host.docker.internal` and port 9003 |
| IDE key mismatch | Ensure `idekey` matches between Sail config and IDE |
| Xdebug overhead when not debugging | Leaving `SAIL_XDEBUG_MODE=debug` active slows all requests |
| Breakpoints not hit in CLI | Set `XDEBUG_MODE=debug XDEBUG_SESSION=1` as env vars |

## Decision Points

- **Xdebug vs Debugbar:** Xdebug for step debugging complex logic; Debugbar for quick profiling
- **Xdebug vs logs:** Use logs for simple issues; reserve Xdebug for complex flow debugging
- **Debug vs profile mode:** Switch modes based on task; don't enable both simultaneously

## Performance/Security Considerations

- **Never in production:** Xdebug must never be enabled in production environments
- **Performance overhead:** Significant even when not stepping (2-5x slower requests)
- **Memory usage:** Higher with Xdebug enabled; disable when not needed

## Related Rules

- XDEBUG-RULE-001: Disable when not debugging
- XDEBUG-RULE-002: Never enable in production
- XDEBUG-RULE-003: Use trigger variables
- XDEBUG-RULE-004: Sail includes Xdebug
- XDEBUG-RULE-005: IDE key matching

## Related Skills

- Configure Laravel Sail
- Configure Xdebug in Docker
- Debug with Log Viewer Patterns

## Success Criteria

- Breakpoints are hit correctly in both web requests and CLI commands/tests
- Variable inspection and stepping work reliably
- Profiling produces useful cachegrind output for performance analysis
- Xdebug disabled when not actively debugging to avoid overhead
