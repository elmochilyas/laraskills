# Knowledge Unit: Xdebug Configuration in Docker

## Metadata
- **Subdomain:** Development Environments
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** development-environments/xdebug-configuration-docker
- **Maturity:** Mature
- **Related Technologies:** Xdebug, PHP, Docker, Laravel Sail, VS Code, PhpStorm, Step Debugging

## Executive Summary

Xdebug configuration in Docker refers to the setup and optimization of the Xdebug PHP extension for step debugging, profiling, and code coverage analysis within containerized Laravel development environments, particularly Laravel Sail. Xdebug is a PHP extension that provides step debugging (breakpoints, stack traces, variable inspection), profiling (cachegrind output for performance analysis), and code coverage analysis (for PHPUnit/Pest testing). In Docker environments, Xdebug requires specific configuration because the PHP process runs inside a container while the IDE (VS Code, PhpStorm) runs on the host machine. This creates a client-server debugging model where the PHP container (client) must connect back to the host IDE (server) using Docker networking. Sail pre-installs Xdebug and exposes configuration via the `SAIL_XDEBUG_MODE` environment variable, supporting modes: debug, develop, profile, coverage, and off. Proper configuration involves setting the correct Xdebug mode, configuring the IDE to listen for debug connections, and ensuring network connectivity between the container and the host IDE.

## Core Concepts

- **Xdebug Modes:** Xdebug 3 operates in distinct modes set via `xdebug.mode`: debug (step debugging), develop (enhanced var_dump, stack traces), profile (performance profiling), coverage (code coverage analysis), and off (disables Xdebug entirely)
- **Step Debugging Protocol:** Xdebug uses the DBGp protocol over TCP; the PHP engine (client) connects to an IDE (listener) on a specific host:port (default localhost:9003); the IDE sends commands to step through code, inspect variables, and evaluate expressions
- **Docker Network Challenge:** In Docker, PHP runs inside a container; `localhost` inside the container is the container itself, not the host. Xdebug must be told the host machine's address (via `xdebug.client_host` or `DISPLAY`/`remote_connect_back` patterns)
- **SAIL_XDEBUG_MODE:** Sail's environment variable that sets the Xdebug mode: `SAIL_XDEBUG_MODE=debug,develop` for step debugging; `SAIL_XDEBUG_MODE=off` to disable Xdebug and restore full PHP performance
- **Trigger vs Auto-Start:** Xdebug can start automatically on every request (xdebug.start_with_request=yes) or on demand via a cookie/query parameter trigger (xdebug.start_trigger=yes); trigger mode avoids performance penalty during normal browsing

## Mental Models

- **Xdebug as Client-Server Debugger:** Unlike typical debuggers that attach to a process, Xdebug is client-initiated: PHP connects to IDE. The IDE must be listening (start listening button) before PHP makes the request.
- **Docker Network Bridge:** Think of the Docker network as a wall; Xdebug inside the container needs the host's IP (not localhost) to reach the IDE. Docker's `host.docker.internal` DNS name bridges this gap automatically on Docker Desktop.
- **Mode as Permission Set:** Each Xdebug mode is a permission; `debug` allows breakpoints, `profile` allows profiling, `coverage` allows code coverage. Setting `SAIL_XDEBUG_MODE=debug,develop,coverage` enables all three simultaneously.

## Internal Mechanics

1. **Extension Loading:** Xdebug is loaded as a PHP extension (zend_extension) in the PHP container's php.ini; Sail pre-installs it via PECL during Docker build
2. **Mode Selection:** At PHP startup, Xdebug checks `xdebug.mode` (or SAIL_XDEBUG_MODE) and initializes only the enabled subsystems; unused modes add zero overhead
3. **Debug Connection:** When `xdebug.mode` includes `debug` and `xdebug.start_with_request=yes`, Xdebug attempts a TCP connection to `xdebug.client_host:9003` before the first line of PHP code executes
4. **IDE Handshake:** The IDE (VS Code, PhpStorm) listens on port 9003; upon receiving the Xdebug connection, it negotiates DBGp protocol capabilities and presents the debugging UI (breakpoints, call stack, variables)
5. **Profiling Output:** When `xdebug.mode=profile`, Xdebug writes cachegrind files to `xdebug.output_dir` (configurable); these files are analyzed with tools like QCacheGrind, PhpStorm's profiler, or `php tools/analyser.php`
6. **Code Coverage:** When `xdebug.mode=coverage`, Xdebug collects line-execution information during PHPUnit/Pest runs; PHPUnit uses `XdebugHandler` to enable coverage mode automatically

## Patterns

- **Sail + VS Code Step Debugging Pattern:**
  ```env
  # .env
  SAIL_XDEBUG_MODE=debug,develop
  ```
  1. Set SAIL_XDEBUG_MODE in .env
  2. Restart Sail: `sail up -d` (or `sail stop && sail up -d`)
  3. In VS Code: Run and Debug > Listen for Xdebug (or create launch.json)
  4. Set breakpoint in PHP code
  5. Load the page in browser or run `sail artisan <command>`
  6. VS Code stops at breakpoint
- **Sail + PhpStorm Pattern (Zero-Configuration):**
  1. Set `SAIL_XDEBUG_MODE=debug,develop` in .env
  2. PhpStorm: Run > Start Listening for PHP Debug Connections (phone icon)
  3. PhpStorm resolves path mappings automatically with Docker-compose integration
  4. Set breakpoints and browse; PhpStorm catches breakpoints via Sail's pre-configured server
- **Trigger Mode Pattern:**
  ```env
  SAIL_XDEBUG_MODE=debug
  XDEBUG_CONFIG="start_with_request=trigger"
  ```
  Append `XDEBUG_TRIGGER=1` as a cookie, query parameter (XDEBUG_TRIGGER=1), or environment variable to enable debugging for a single request without full auto-start.
- **Profiling Pattern:**
  ```env
  SAIL_XDEBUG_MODE=profile
  XDEBUG_CONFIG="output_dir=/var/www/html/tmp"
  ```
  Enable profiling; profile output files are written to the project's tmp/ directory for analysis.
- **CLI Debugging Pattern:**
  ```bash
  sail artisan cache:clear
  ```
  Xdebug step debugging works for CLI commands too; set breakpoint in PHP code and run the Artisan command via Sail.
- **Disable Xdebug for Performance Pattern:**
  ```env
  SAIL_XDEBUG_MODE=off
  # Or just remove SAIL_XDEBUG_MODE; Sail defaults to off
  ```
  Setting `SAIL_XDEBUG_MODE=off` disables Xdebug entirely; PHP runs at full speed with zero overhead.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Xdebug mode | debug vs develop vs profile vs coverage vs off | `SAIL_XDEBUG_MODE=off` (default, best performance); toggle to `debug,develop` during active debugging sessions |
| Start method | auto-start vs trigger | Auto-start for active debugging sessions; trigger for occasional debugging in shared environments |
| Client host | host.docker.internal vs gateway IP vs LAN IP | `host.docker.internal` (works across Docker Desktop, Docker for Windows, WSL2); static LAN IP as fallback |
| IDE port | 9003 (default) vs 9000 (legacy) | 9003 (Xdebug 3 default); 9000 is legacy Xdebug 2 port and may conflict with PHP-FPM |

## Tradeoffs

- **Xdebug On vs Off:** Xdebug enabled (even in develop mode only) adds 2-5% overhead to every request. Coverage mode adds 30-50% overhead during test runs. Debug mode adds 10-100ms per request even without breakpoints (connection overhead). Toggle Xdebug off (`SAIL_XDEBUG_MODE=off`) for normal development; enable only during debugging sessions.
- **Auto-Start vs Trigger:** Auto-start catches every request (convenient, no manual step) but adds overhead to every page load. Trigger mode has zero overhead until activated but requires adding a cookie/parameter to the request.
- **host.docker.internal vs Manual IP:** host.docker.internal is convenient and cross-platform but relies on Docker's DNS resolution (not available in all Linux Docker setups). Manual client_host IP works universally but varies per network configuration.

## Performance Considerations

- **Xdebug Disabled Overhead:** When `xdebug.mode=off`, Xdebug adds approximately zero overhead (Xdebug 3's mode system disables all functionality). This is Sail's default when SAIL_XDEBUG_MODE is not set.
- **Develop Mode Overhead:** `xdebug.mode=develop` adds ~3-5% overhead due to improved var_dump and stack trace formatting. Acceptable for development but test without it for benchmark baselines.
- **Debug Mode Connection Overhead:** Even without breakpoints, auto-start debug mode adds ~50-200ms per request for the TCP connection attempt to the IDE. This is why trigger mode is recommended for teams.
- **Coverage Mode Overhead:** PHPUnit code coverage with Xdebug adds 30-50% test execution time. Use PCOV (PCOV extension) for faster coverage in CI; fall back to Xdebug when PCOV's line coverage is insufficient.
- **Profiling Overhead:** Profiling adds 10-20% execution time overhead and significant disk I/O for cachegrind output files. Enable only during dedicated profiling sessions.

## Production Considerations

- **Never in Production:** Xdebug must never be enabled in production environments. It leaks code paths, slows all requests, and the debug port (9003) is a security risk. Sail's Forge production images do not include Xdebug.
- **CI Coverage Strategy:** Use Xdebug for code coverage in CI when PCOV or phpdbg are unavailable. Set `xdebug.mode=coverage` in CI environment variables; disable it for all other CI steps.
- **Logging in Production:** Use Laravel's native logging (Monolog) for production debugging; Xdebug is a development-only tool. Never expose Xdebug's enhanced var_dump in production error pages.
- **Configuration Isolation:** Keep Xdebug configuration in .env (development) only; production .env should not set SAIL_XDEBUG_MODE or any XDEBUG_CONFIG variables.

## Common Mistakes

- **IDE not listening:** Starting a debug session without clicking "Start Listening" in the IDE; Xdebug connects but no IDE is on the other end, causing a 1-2 second connection timeout on every request
- **Wrong SAIL_XDEBUG_MODE format:** Setting `SAIL_XDEBUG_MODE=debug` (correct) vs `XDEBUG_MODE=debug` (requires different Sail configuration); Sail maps SAIL_XDEBUG_MODE to xdebug.mode inside the container
- **Using localhost instead of host.docker.internal:** Setting `xdebug.client_host=localhost` inside the container; `localhost` resolves to the container itself, not the host IDE
- **Port conflict with PHP-FPM:** Xdebug 3 default port is 9003; Xdebug 2 used 9000 which conflicts with PHP-FPM's default port. Ensure the IDE listener uses port 9003.
- **Forgetting to rebuild Sail:** Adding SAIL_XDEBUG_MODE to .env after Sail has started; Sail reads this variable during container startup, not dynamically. Restart containers with `sail stop && sail up -d`.

## Failure Modes

- **Connection Refused:** IDE not listening on port 9003. Mitigate: click "Start Listening" in IDE; verify firewall isn't blocking the port.
- **Wrong Client Host:** Xdebug tries to connect to localhost:9003 inside the container. Mitigate: verify host.docker.internal resolves correctly; set `xdebug.client_host=host.docker.internal` explicitly in php.ini.
- **Path Mapping Mismatch:** Breakpoint hit but IDE shows "Cannot find file" or opens a different file. Mitigate: configure path mappings in IDE settings (PhpStorm: Servers > Map project root to /var/www/html).
- **Docker Desktop DNS Failure:** host.docker.internal stops resolving. Mitigate: restart Docker Desktop; use gateway IP (`docker inspect bridge gateway`) as fallback client_host.
- **Xdebug Crashes PHP:** Rare extension conflict or memory corruption. Mitigate: disable Xdebug (`SAIL_XDEBUG_MODE=off`); check PHP error log; update Xdebug to latest version via Sail rebuild.

## Ecosystem Usage

- **Laravel Sail:** Official Xdebug integration via SAIL_XDEBUG_MODE; pre-installed in all Sail PHP images
- **VS Code:** PHP Debug extension by Felix Becker; Xdebug launch.json configurations for Sail
- **PhpStorm:** Zero-configuration Xdebug with Docker Compose CLI interpreter; automatic path mappings
- **Laravel Forge:** No Xdebug in production Forge images; Forge uses dedicated profiling tools (Blackfire, Tideways)
- **PHPUnit/Pest:** Xdebug coverage mode integrated into test suite via phpunit.xml.dist `coverage` element

## Related Knowledge Units

- laravel-sail
- sail-customization-dockerfiles
- docker-compose-for-laravel
- wsl2-configuration-laravel
- debugbar-collectors-profiling

## Research Notes

- Xdebug 3 (released 2020) simplified configuration significantly: replaced 30+ ini directives with ~10, introduced mode system, and changed default port from 9000 to 9003
- Sail uses the `SAIL_XDEBUG_MODE` env variable mapped to `xdebug.mode` via the entrypoint script; this variable is evaluated at container start time
- Docker Desktop automatically adds `host.docker.internal` to the container's /etc/hosts; Docker Engine on Linux requires `--add-host host.docker.internal:host-gateway` flag
- Xdebug 3.2+ supports "develop" mode independently of "debug" mode, allowing enhanced error pages without step debugging overhead
- For profiling Laravel applications, Xdebug profile mode + QCacheGrind (Linux) or PhpStorm profiler provides call-graph visualization of request execution
