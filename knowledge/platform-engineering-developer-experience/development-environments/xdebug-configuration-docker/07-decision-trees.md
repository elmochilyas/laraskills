# 07-Decision Trees: Xdebug Configuration in Docker

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | xdebug-configuration-docker |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Xdebug Mode Selection | Which Xdebug mode(s) to enable | Do we need step debugging, profiling, coverage, or just enhanced var_dump? |
| D02 | Trigger Strategy | Auto-start vs trigger-based debugging | Should Xdebug activate on every request or only when triggered? |
| D03 | IDE Configuration | How to configure IDE for Docker debugging | Which IDE (VS Code/PhpStorm) and what network settings are needed? |
| D04 | Production Safety | Ensuring Xdebug never runs in production | How do we prevent Xdebug from being active in non-development environments? |

## Architecture-Level Decision Trees

### D01: Xdebug Mode Selection

```
START: Which Xdebug modes should we enable?
│
├── Off (default — zero overhead)
│   ├── Config: SAIL_XDEBUG_MODE=off (or leave empty)
│   ├── Use for: normal development without debugging needs
│   ├── Overhead: 0% (Xdebug 3's mode system means disabled mode = no overhead)
│   └── Enable other modes only when needed
│
├── Develop only (daily driver)
│   ├── Config: SAIL_XDEBUG_MODE=develop
│   ├── Features: enhanced var_dump(), improved stack traces
│   ├── Overhead: ~3-5% — acceptable for daily use
│   ├── Pro: better error output, no step debugging overhead
│   └── Best for: daily development without step debugging
│
├── Debug (step debugging)
│   ├── Config: SAIL_XDEBUG_MODE=debug
│   ├── Features: breakpoints, step through, variable inspection
│   ├── Overhead: 50-200ms per request (TCP connection overhead)
│   ├── Use: only when actively debugging
│   └── Best for: troubleshooting complex logic
│
├── Profile (performance profiling)
│   ├── Config: SAIL_XDEBUG_MODE=profile
│   ├── Output: cachegrind files for tools like KCacheGrind, QCacheGrind
│   ├── Overhead: 10-20% + disk I/O
│   └── Best for: performance optimization sessions
│
├── Coverage (code coverage)
│   ├── Config: SAIL_XDEBUG_MODE=coverage
│   ├── Features: code coverage analysis for tests
│   ├── Overhead: 30-50% test execution time
│   └── Best for: running coverage reports in CI
│
└── Combine modes
    ├── SAIL_XDEBUG_MODE=debug,develop (step debugging + enhanced output)
    ├── SAIL_XDEBUG_MODE=debug,coverage (debugging + coverage)
    └── Separate with commas
```

### D02: Trigger Strategy

```
START: How should Xdebug activate?
│
├── Auto-start (always active)
│   ├── Config: xdebug.start_with_request=yes (default)
│   ├── Xdebug debug session starts on every request
│   ├── Overhead: 50-200ms per request even when IDE not listening
│   ├── Timeout: 1-2s wait when IDE not listening (bad UX)
│   └── Only use: during active debugging sessions, then disable
│
├── Trigger mode (recommended — zero overhead when not debugging)
│   ├── Config: xdebug.start_with_request=trigger
│   ├── Activation methods:
│   │   ├── Cookie: XDEBUG_TRIGGER=1 (browser extension)
│   │   ├── Query param: ?XDEBUG_TRIGGER=1 (URL parameter)
│   │   └── Environment: XDEBUG_TRIGGER=1 (CLI commands)
│   ├── Overhead: 0% when not triggered
│   ├── Pro: leave SAIL_XDEBUG_MODE=debug always enabled
│   ├── Pro: only debug when you want to
│   └── Best for: most developers
│
├── Browser extension workflow (trigger mode)
│   ├── VS Code: PHP Debug extension with launch.json
│   ├── PhpStorm: built-in, start listening for connections
│   ├── Chrome/Firefox: Xdebug helper extension
│   └── Workflow: enable extension → click debug → refresh page
│
└── CLI debugging
    ├── export XDEBUG_TRIGGER=1 (before running artisan command)
    ├── sail artisan command (with Xdebug active)
    └── Unset: unset XDEBUG_TRIGGER (when done)
```

### D03: IDE Configuration

```
START: How should we configure the IDE for Docker debugging?
│
├── Host communication (critical for Docker)
│   ├── Inside container: localhost = container, not host
│   ├── Host address: host.docker.internal (Docker Desktop DNS)
│   ├── Config: xdebug.client_host=host.docker.internal
│   ├── Sail configures this automatically
│   └── Port: 9003 (Xdebug 3 default, changed from 9000 in Xdebug 2)
│
├── VS Code setup
│   ├── Install: PHP Debug extension
│   ├── launch.json configuration:
│   │   {
│   │     "name": "Listen for Xdebug",
│   │     "type": "php",
│   │     "request": "launch",
│   │     "port": 9003,
│   │     "pathMappings": {
│   │       "/var/www/html": "${workspaceFolder}"
│   │     }
│   │   }
│   ├── F5: start listening
│   └── Path mapping: maps container /var/www/html to local workspace
│
├── PhpStorm setup
│   ├── Settings → PHP → Servers → Add
│   ├── Name: sail, Host: localhost, Port: 80, Debugger: Xdebug
│   ├── Path mappings: /var/www/html → local project path
│   ├── Run → Start Listening for PHP Debug Connections
│   └── PhpStorm with Docker Compose CLI interpreter: zero-config
│
└── Common debugging workflow
    1. Set SAIL_XDEBUG_MODE=debug in .env
    2. sail stop && sail up -d (apply config)
    3. Start IDE listener (F5 in VS Code, phone icon in PhpStorm)
    4. Set breakpoints
    5. Make request with trigger (browser/extension/CLI)
    6. Debug!
```

### D04: Production Safety

```
START: How do we ensure Xdebug never runs in production?
│
├── Environment variable control
│   ├── SAIL_XDEBUG_MODE only set in .env (not committed)
│   ├── Production .env: SAIL_XDEBUG_MODE=off (or not set at all)
│   ├── Production platform (Forge/Vapor): don't set Xdebug env vars
│   └── PHP-FPM config: xdebug.mode=off (compiled out of production PHP)
│
├── Docker image separation
│   ├── Dev: Sail image includes Xdebug (php:<version>-fpm-alpine + Xdebug)
│   ├── Production: separate Docker build without Xdebug
│   ├── Forge: uses PHP without Xdebug extension
│   └── CI: enable only for coverage runs, off otherwise
│
├── Multiple levels of protection
│   ├── 1. Extension not loaded in production PHP config
│   ├── 2. SAIL_XDEBUG_MODE not set in production
│   ├── 3. Port 9003 not exposed in production network
│   └── 4. Monitoring: alert if Xdebug detected in production
│
└── Verification
    ├── Check: php -m | grep xdebug (should not appear in production)
    ├── Check: phpinfo() — xdebug section (should not exist in production)
    ├── Security scan: automated check for debug tools in production
    └── Review: ensure Xdebug config is in .env.example as commented/disabled
```
