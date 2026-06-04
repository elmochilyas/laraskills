# Skill: Configure Xdebug in Docker

## Purpose
Configure Xdebug within Docker-based Laravel development environments for step debugging, profiling, and code coverage with on-demand activation to avoid performance overhead.

## When To Use
- Step debugging complex business logic during development
- Debugging failing tests (Pest/PHPUnit) with breakpoints
- Profiling application performance with cachegrind output
- Code coverage analysis during test runs

## When NOT To Use
- Production environments (must never be enabled)
- Simple issues that can be resolved with logs or Debugbar
- When debugging is not actively needed (leave disabled)

## Prerequisites
- Laravel Sail or Docker Compose with Xdebug pre-installed
- IDE with Xdebug support (PhpStorm, VS Code)

## Inputs
- `.env` — `SAIL_XDEBUG_MODE` and `SAIL_XDEBUG_CONFIG`
- IDE configuration for Xdebug port and IDE key

## Workflow

1. **Enable Xdebug Mode:** Set `SAIL_XDEBUG_MODE=debug,develop` in `.env` only during active debugging. Default to `off` when not debugging to avoid overhead.

2. **Configure Docker Host Communication:** Set `SAIL_XDEBUG_CONFIG="client_host=host.docker.internal client_port=9003 idekey=PHPSTORM"`. `host.docker.internal` resolves to the host machine from within Docker containers.

3. **Use Trigger Mode (Recommended):** Set `start_with_request=trigger` in Xdebug config. This adds zero overhead until `XDEBUG_TRIGGER=1` is passed as cookie, GET parameter, or environment variable.

4. **Configure IDE Listener:** Start the IDE's debug listener first before triggering a debug session. PhpStorm: "Start Listening for PHP Debug Connections". VS Code: Run debugging with "Listen for Xdebug" configuration.

5. **Restart Sail After Config Change:** Run `sail stop && sail up -d` after changing `SAIL_XDEBUG_MODE`. The env variable is read at container start.

6. **Develop Mode for Daily Dev:** Set `SAIL_XDEBUG_MODE=develop` for daily development. This only enables enhanced `var_dump()` (~3-5% overhead) without step debugging overhead.

7. **Profile with Cachegrind:** Set `SAIL_XDEBUG_MODE=profile`, run the code to profile, and find cachegrind output files for analysis with tools like QCacheGrind.

## Validation Checklist

- [ ] IDE shows "listening for Xdebug connections"
- [ ] Breakpoints hit in web requests
- [ ] Breakpoints hit in CLI commands and tests
- [ ] Trigger mode works (no overhead until `XDEBUG_TRIGGER=1`)
- [ ] Profiling produces cachegrind output files
- [ ] Code coverage reports generated correctly
- [ ] Xdebug disabled when not actively debugging

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| IDE not connecting | Check `host.docker.internal` and port 9003 |
| Breakpoints not hit in CLI | Set `XDEBUG_SESSION=1` env var alongside command |
| Xdebug overhead when not debugging | Leave enabled unnecessarily; use trigger mode |
| Port 9003 conflict | Another service using port; change `client_port` |

## Decision Points

- **Use for step debugging** complex business logic during development
- **Never enable in production** — Leaks code paths, slows requests
- **Use Debugbar/Pulse for monitoring** — Xdebug only for step debugging
- **Toggle on demand** — Set mode only during active debugging; default to off

## Performance/Security Considerations

- **Trigger mode essential:** `start_with_request=trigger` adds zero overhead until triggered
- **Develop mode safe for daily use:** Enhanced var_dump only; ~3-5% overhead
- **Never in production:** Security risk — leaks code paths, debug port is an attack vector

## Related Rules

- XDEBUGD-RULE-001: Toggle on demand
- XDEBUGD-RULE-002: Use trigger mode
- XDEBUGD-RULE-003: Use `host.docker.internal`
- XDEBUGD-RULE-004: Start IDE listener first
- XDEBUGD-RULE-005: Restart Sail after config change

## Related Skills

- Configure Xdebug Integration with Sail
- Configure Laravel Sail
- Debug with Log Viewer Patterns

## Success Criteria

- Breakpoints hit correctly in both web requests and CLI commands/tests
- Trigger mode eliminates performance overhead when not debugging
- Profiling produces useful cachegrind output
- Xdebug never enabled in production
