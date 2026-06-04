# 04-Standardized Knowledge: Xdebug Integration with Sail

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | developer-tooling-debugging |
| **Knowledge Unit** | xdebug-integration-sail |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-sail, xdebug-configuration-docker, sail-customization-dockerfiles |
| **Framework/Language** | Xdebug, Laravel Sail, Docker, PHP |

## Overview

Xdebug integration with Laravel Sail enables step-debugging PHP within Docker. Sail includes Xdebug pre-installed in PHP Docker images, configured to connect back to the host IDE. Features: step-through debugging (breakpoints, single-stepping, variable inspection), stack traces, profiling (cachegrind output), code coverage, enhanced var_dump. Configured via `SAIL_XDEBUG_MODE` and `SAIL_XDEBUG_CONFIG` env vars. Supports CLI (Artisan commands, tests) and web request debugging.

## Core Concepts

- **Step Debugging**: breakpoint-based execution pause with variable inspection
- **IDE Key**: session identifier (PHPSTORM, VSCODE) matching Xdebug to IDE instance
- **Docker Host Communication**: `host.docker.internal` for container-to-host IDE connection
- **Xdebug Modes**: debug (step debugging), develop (enhanced var_dump), profile (profiling), coverage (code coverage), trace (function tracing)
- **Trigger Variables**: `XDEBUG_SESSION` cookie/GET, `XDEBUG_PROFILE`, `XDEBUG_TRACE`
- **Sail Env**: `SAIL_XDEBUG_MODE` and `SAIL_XDEBUG_CONFIG` control Xdebug in Sail

## When to Use

- Step debugging complex business logic during development
- Debugging failing tests (Pest/PHPUnit) with breakpoints
- Profiling application performance with cachegrind output
- Code coverage analysis during test runs

## When NOT to Use

- Production environments (must never be enabled)
- When debugging is not actively needed (leave disabled to avoid overhead)
- Simple issues that can be resolved with logs or Debugbar

## Best Practices (WHY)

- **Enable on-demand**: set `SAIL_XDEBUG_MODE` only when actively debugging; keep disabled otherwise
- **Use browser extensions**: Xdebug Helper extension to start sessions without changing URL manually
- **Configure client_host correctly**: `host.docker.internal` for macOS/Windows; Docker gateway IP for Linux
- **Set conditional breakpoints**: avoids breaking on every iteration in loops
- **Use debug mode only**: disable profile/coverage modes when not needed to reduce overhead
- **Start IDE listener first**: PhpStorm/VS Code must be listening before triggering Xdebug session

## Architecture Guidelines

- Xdebug disabled by default in Sail; activated via env variables when debugging
- Modes: develop (safe for daily use), debug (on-demand), profile (targeted), coverage (test runs)
- Port 9003 (Xdebug 3 standard) — must be accessible from container to host
- CLI debugging: prefix with `XDEBUG_MODE=debug` or set in sail shell

## Performance Considerations

- Debug mode: 2-10x execution time (breakpoint pauses, IDE communication)
- Profile mode: 10-30% overhead for call-graph data generation
- Coverage mode: 20-50% overhead for line execution tracking
- Develop mode: 1-5% overhead (enhanced var_dump only — safe for daily dev)
- Docker networking: 1-5ms per interaction (negligible)

## Security Implications

- Xdebug must NEVER be enabled in production — exposes app internals
- If accidentally enabled in production, anyone can trigger debugging sessions
- Ensure `SAIL_XDEBUG_MODE` is unset in production deployments
- Profiling generates large cachegrind files; clean periodically

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Leaving Xdebug always on | 2-10x slowdown on every request | Sluggish development | Enable only when debugging |
| Wrong client_host | Container can't reach IDE | Sessions never start | Use host.docker.internal |
| IDE not listening | Xdebug connects, no receiver | Hangs until timeout | Start listener first |
| Port 9003 blocked | Firewall/Docker blocks port | Connection fails | Check port accessibility |
| Xdebug 2 paths on Xdebug 3 | Old config keys used | Xdebug not working | Use Xdebug 3 config format |

## Anti-Patterns

- **Xdebug as primary debugging tool for all issues**: use Debugbar/Pulse for monitoring, Xdebug only for step debugging
- **Profiling in development as default**: only profile when investigating specific performance issues

## Examples

```bash
# .env for Sail Xdebug step debugging
SAIL_XDEBUG_MODE=debug
SAIL_XDEBUG_CONFIG="client_host=host.docker.internal"

# CLI debugging with Xdebug
XDEBUG_MODE=debug ./vendor/bin/sail php artisan your:command
```

## Related Topics

- laravel-sail — Sail environment overview
- xdebug-configuration-docker — Xdebug in Docker
- sail-customization-dockerfiles — customizing Sail Dockerfiles

## AI Agent Notes

- When scaffolding Sail projects, include Xdebug configuration in `.env.example` (commented out)
- Generate test commands with `XDEBUG_MODE=debug` prefix for CLI debugging

## Verification

- [ ] Xdebug disabled by default in `.env`
- [ ] `SAIL_XDEBUG_MODE` set only when debugging
- [ ] IDE listener configured and tested
- [ ] client_host points to correct Docker gateway
- [ ] Port 9003 accessible from container to host
- [ ] Production env never has Xdebug enabled
