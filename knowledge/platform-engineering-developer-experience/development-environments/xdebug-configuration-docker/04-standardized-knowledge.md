# 04-Standardized Knowledge: Xdebug Configuration in Docker

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | xdebug-configuration-docker |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-sail, sail-customization-dockerfiles, docker-compose-for-laravel |
| **Framework/Language** | Xdebug, PHP, Docker, Laravel Sail, VS Code, PhpStorm |

## Overview

Xdebug in Docker provides step debugging, profiling, and code coverage within containerized Laravel dev environments (Sail). Xdebug is a PHP extension for step debugging (breakpoints, stack traces, variable inspection), profiling (cachegrind output), and code coverage. In Docker, PHP (client) must connect back to host IDE (server). Sail pre-installs Xdebug; configured via `SAIL_XDEBUG_MODE` env var. Modes: debug, develop, profile, coverage, off.

## Core Concepts

- **Xdebug Modes**: debug (step debugging), develop (enhanced var_dump), profile (profiling), coverage (code coverage), off (disabled)
- **DBGp Protocol**: TCP-based protocol for IDE communication; PHP connects to IDE on port 9003
- **Docker Network Challenge**: `localhost` inside container = container itself; must use `host.docker.internal` for host
- **SAIL_XDEBUG_MODE**: Sail env var mapping to `xdebug.mode`; e.g., `debug,develop`
- **Trigger vs Auto-Start**: auto-start on every request vs on-demand via cookie/query param (trigger mode)

## When to Use

- Step debugging complex business logic during development
- Debugging failing tests with breakpoints
- Performance profiling with cachegrind output
- Code coverage analysis during test runs

## When NOT to Use

- Production (must never be enabled)
- When debugging is not active (leave disabled — `SAIL_XDEBUG_MODE=off`)
- Simple issues solvable with logs or Debugbar

## Best Practices (WHY)

- **Toggle on demand**: set `SAIL_XDEBUG_MODE=debug,develop` only during active debugging; default to off
- **Use trigger mode**: `start_with_request=trigger` adds zero overhead until `XDEBUG_TRIGGER=1` is set
- **Use `host.docker.internal`**: Docker Desktop provides this DNS name automatically for host access
- **Start IDE listener first**: click "Start Listening" before triggering a debug session
- **Restart Sail after config change**: `sail stop && sail up -d` — SAIL_XDEBUG_MODE read at container start
- **Use develop mode safely**: safe for daily dev (only enhanced var_dump, ~3-5% overhead)

## Architecture Guidelines

- Set `SAIL_XDEBUG_MODE` in .env, not docker-compose.yml
- Port 9003 must be accessible from container to host
- PhpStorm: zero-configuration with Docker Compose CLI interpreter
- VS Code: PHP Debug extension with launch.json for Sail
- CLI debugging: `sail artisan command` with Xdebug active

## Performance Considerations

- Disabled (mode=off): zero overhead (Xdebug 3 mode system)
- Develop mode: ~3-5% overhead
- Debug mode (auto-start): ~50-200ms per request (TCP connection overhead)
- Coverage mode: 30-50% test execution overhead
- Profile mode: 10-20% overhead + disk I/O for cachegrind output

## Security Considerations

- Never enable Xdebug in production — leaks code paths, slows requests, debug port is a security risk
- Don't expose port 9003 to public networks
- Production images (Forge) don't include Xdebug

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| IDE not listening | Session starts but no IDE | 1-2s timeout per request | Click "Start Listening" first |
| Using localhost | resolves to container, not host | Connection refused | Use host.docker.internal |
| Port conflict (9000) | Xdebug 3 default is 9003 | Connection fails | Use 9003 (Xdebug 3 standard) |
| Not rebuilding Sail | Env change not applied | Old config used | Restart containers |
| Wrong SAIL_XDEBUG_MODE format | Setting XDEBUG_MODE instead | Not picked up by Sail | Use SAIL_XDEBUG_MODE |

## Anti-Patterns

- **Leaving debug mode on constantly**: 50-200ms added to every request unnecessarily
- **Xdebug for all debugging**: use Debugbar/Pulse for monitoring; Xdebug only for step debugging

## Examples

```env
# .env - enable step debugging + develop mode
SAIL_XDEBUG_MODE=debug,develop

# Trigger mode (zero overhead until triggered)
SAIL_XDEBUG_MODE=debug
XDEBUG_CONFIG="start_with_request=trigger"
```

## Related Topics

- laravel-sail — Sail's Xdebug integration
- sail-customization-dockerfiles — custom Xdebug configuration
- xdebug-integration-sail — Xdebug + Sail detailed usage

## AI Agent Notes

- Default `SAIL_XDEBUG_MODE` to empty (off) in scaffolded .env.example
- Include commented-out Xdebug section for developers to enable as needed

## Verification

- [ ] SAIL_XDEBUG_MODE set only when debugging
- [ ] IDE listener configured and tested
- [ ] host.docker.internal resolves correctly
- [ ] Port 9003 accessible
- [ ] Trigger mode considered for zero-overhead setup
- [ ] No Xdebug in production config
- [ ] Path mappings configured in IDE
