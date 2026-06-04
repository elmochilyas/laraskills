# Knowledge Unit: Xdebug Integration with Sail

## Metadata
- **Subdomain:** Developer Tooling & Debugging
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** developer-tooling-debugging/xdebug-integration-sail
- **Maturity:** Mature
- **Related Technologies:** Xdebug, Laravel Sail, Docker, PHP, Step Debugging

## Executive Summary

Xdebug integration with Laravel Sail enables step-debugging PHP code directly within the Docker-based development environment. Sail includes Xdebug pre-installed in its PHP Docker images, configured to connect back to the host machine's IDE (PhpStorm, VS Code) for debugging sessions. Key features include: step-through debugging (breakpoints, single-stepping, variable inspection), stack traces with full call information, profiling (cachegrind output for performance analysis), code coverage analysis, and improved var_dump output. Xdebug is configured via environment variables in Sail's .env file (SAIL_XDEBUG_MODE, SAIL_XDEBUG_CONFIG). The integration supports both CLI debugging (Artisan commands, tests) and web request debugging (browser-triggered sessions).

## Core Concepts

- **Step Debugging:** Breakpoint-based debugging where execution pauses at specified lines, allowing step-by-step execution and variable inspection
- **IDE Key:** A session identifier (PHPSTORM, VSCODE) that matches Xdebug to the correct IDE instance; set via browser extension or environment variable
- **Docker Host Communication:** Xdebug in the container connects to the host machine's IDE via host.docker.internal (Docker's host gateway) or the host's IP address
- **Xdebug Modes:** debug (step debugging), develop (enhanced var_dump), profile (performance profiling), coverage (code coverage), trace (function tracing)
- **Trigger Variables:** XDEBUG_SESSION cookie/GET parameter starts a debugging session; XDEBUG_PROFILE triggers profiling; XDEBUG_TRACE triggers tracing
- **Sail Environment Variables:** SAIL_XDEBUG_MODE and SAIL_XDEBUG_CONFIG control Xdebug configuration in Sail's docker-compose environment

## Mental Models

- **Xdebug with Sail as Remote Debugging:** The Docker container is the remote server; Xdebug connects back to the host IDE for debugging—like debugging a production server from your local machine
- **Xdebug as Code Microscope:** Step debugging zooms into code execution line-by-line, revealing exactly what happens and what values variables hold
- **Xdebug Modes as Tool Modes:** Each mode (debug, profile, coverage) is like a different tool in a Swiss Army knife—activate the one you need for the task

## Internal Mechanics

1. **Xdebug Extension Loading:** Sail's PHP Docker images have Xdebug installed as a PHP extension; loaded at PHP startup when configured (controlled by SAIL_XDEBUG_MODE env var)
2. **Connection Initiation:** When a debugging session starts (via browser extension, CLI trigger, or IDE), Xdebug initiates a DBGp connection to the configured client_host and client_port (default 9003)
3. **Breakpoint Handling:** When PHP execution reaches a line with a breakpoint, Xdebug pauses execution and sends the current state (call stack, variables, line number) to the IDE via DBGp protocol
4. **Variable Inspection:** The IDE requests variable values from Xdebug; Xdebug serializes variable contents (object properties, array elements) and sends them to the IDE
5. **Step Commands:** The IDE sends step commands (step over, step into, step out, continue) via DBGp; Xdebug resumes execution accordingly
6. **Session Termination:** The debugging session ends when execution completes, the IDE disconnects, or the session key expires

## Patterns

- **CLI Debugging Pattern:** Run ./vendor/bin/sail php artisan command:name with Xdebug enabled; Xdebug connects to the IDE for breakpoint debugging of Artisan commands
- **Web Request Debugging Pattern:** Install a browser extension (Xdebug Helper) to trigger debugging sessions; set IDE key; reload the page; PHP execution pauses at breakpoints
- **Test Debugging Pattern:** Run ./vendor/bin/sail pest --filter=test_name with Xdebug to debug specific failing tests
- **Profiling Pattern:** Set SAIL_XDEBUG_MODE=profile in .env, run the application, Xdebug generates cachegrind files; open with qcachegrind for performance analysis
- **Conditional Breakpoint Pattern:** In the IDE, set breakpoints with conditions to pause only when the condition is met, avoiding interruptions on every iteration
- **Environment-Specific Activation Pattern:** Enable Xdebug only when SAIL_XDEBUG_MODE is set (not by default); add to .env only when debugging is needed
- **Docker Network Debugging Pattern:** When host.docker.internal doesn't resolve, use client_host=172.17.0.1 (default Docker gateway IP) for host communication

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Xdebug mode | debug vs develop vs profile vs coverage | debug,develop for day-to-day; profile for performance tuning; coverage for test coverage |
| IDE key | PHPSTORM (default) vs VSCODE vs custom | PHPSTORM for PhpStorm; VSCODE for VS Code; custom for automated tools |
| Debug port | 9003 (default) vs custom | 9003 (default, Xdebug 3 standard); custom only if port is shared |
| Startup mode | On-demand (browser trigger) vs always-on | On-demand for normal development; always-on for test debugging |
| Host communication | host.docker.internal vs Docker gateway IP | host.docker.internal for macOS/Windows; gateway IP for Linux |

## Tradeoffs

- **Xdebug On vs Off:** Xdebug disabled adds zero overhead. Xdebug in develop mode adds minimal overhead. Xdebug in debug mode adds significant overhead (2-10x slower) due to breakpoint pauses and IDE communication.
- **Detailed vs Minimal Profiling:** Full profiling captures all function calls (comprehensive but large files) vs sampling profiling (lighter but less detail). Use full profiling for targeted analysis; sampling for general monitoring.
- **Browser Extension vs CLI Trigger:** Browser extensions provide convenient per-request debugging but don't work for CLI commands. CLI triggers work for all request types but require manual setup.

## Performance Considerations

- **Debug Mode Overhead:** Xdebug in debug mode adds 2-10x execution time due to process communication and breakpoint handling. Only enable debug mode when actively debugging.
- **Profiling Overhead:** Xdebug profiling adds 10-30% execution time for generating call-graph data. Profile only specific requests or endpoints, not all traffic.
- **Code Coverage Overhead:** Xdebug coverage mode adds 20-50% execution time for tracking which lines are executed. Use only during test suite runs.
- **Develop Mode Overhead:** Xdebug develop mode adds minimal overhead (1-5%) for enhanced var_dump. Safe to keep enabled during development.
- **Docker Networking Latency:** Communication between Xdebug (in container) and IDE (on host) adds 1-5ms per interaction, negligible for debugging purposes.

## Production Considerations

- **Never in Production:** Xdebug must never be enabled in production. It exposes application internals, adds significant performance overhead, and can leak source code. Ensure SAIL_XDEBUG_MODE is unset in production deployments.
- **Security Implications:** If Xdebug is accidentally enabled in production, anyone can trigger debugging sessions and inspect application internals. Validate Xdebug configuration in production deployments.
- **Memory Usage:** Xdebug's profiling and debugging features consume additional memory. In development within Sail, ensure sufficient Docker resource allocation (2-4GB RAM recommended).
- **Cachegrind File Storage:** Profiling generates large cachegrind files. Set a directory for these files and clean them periodically to avoid filling storage.

## Common Mistakes

- **Leaving Xdebug enabled constantly:** Running with debug mode always on; every request slows down 2-10x unnecessarily. Enable Xdebug only when actively debugging.
- **Not configuring client_host correctly:** Xdebug can't connect to the IDE because client_host points to the wrong address; debugging sessions never start
- **IDE port blocking:** Firewall or Docker networking blocks port 9003; Xdebug can't communicate with the IDE
- **Forgetting to start the IDE listener:** Xdebug is active and the browser triggers a session, but the IDE isn't listening for connections; the request hangs until timeout
- **Using Xdebug 2 paths with Xdebug 3:** Xdebug 3 changed configuration keys (remote_host to client_host, remote_port to client_port, remote_enable to mode); using old configuration breaks debugging

## Failure Modes

- **Xdebug Connection Timeout:** Xdebug can't reach the IDE (wrong host, blocked port, IDE not listening). The request hangs until the Xdebug connection timeout (default 200ms). Mitigate: verify client_host and IDE listener status.
- **IDE Not Responding to DBGp:** The IDE receives the connection but doesn't respond to DBGp protocol messages. Mitigate: restart the IDE's debug listener; check IDE configuration.
- **Breakpoint Not Hit:** A breakpoint is set but execution never pauses. Mitigate: verify the breakpoint is on an executable line; check Xdebug mode includes debug; verify IDE key matches.
- **Xdebug Version Mismatch:** The installed Xdebug version doesn't support the IDE's debugging protocol version. Mitigate: update Xdebug in Sail's Docker image or update the IDE.
- **Docker Resource Exhaustion:** Xdebug profiling consumes all available memory in the Docker container, causing PHP to crash. Mitigate: increase Docker memory limits; limit profiling scope.

## Ecosystem Usage

- **Laravel Sail:** Xdebug is pre-installed and pre-configured in Sail's PHP Docker images; developers only need to set environment variables to activate it
- **PhpStorm:** The most common IDE for Laravel debugging with Xdebug; PhpStorm's zero-configuration debugging with Xdebug 3 makes setup seamless
- **VS Code:** PHP Debug extension for VS Code uses Xdebug's DBGp protocol; requires launch.json configuration matching Sail's Xdebug settings
- **Laravel Teams:** Teams using Sail universally rely on Xdebug for step debugging complex business logic, queue jobs, and API endpoints
- **Laravel Package Development:** Package developers use Xdebug with Sail to test their packages across different PHP versions using Sail's PHP version switching

## Related Knowledge Units

- laravel-sail
- xdebug-configuration-docker
- sail-customization-dockerfiles
- debugbar-collectors-profiling

## Research Notes

- Xdebug 3 (released 2020) significantly simplified configuration compared to Xdebug 2: mode-based activation replaced remote_enable, step debugger port changed from 9000 to 9003
- Sail uses PHP 8.x base images with Xdebug pre-installed; the Xdebug extension is compiled and ready but only activated when SAIL_XDEBUG_MODE is set in the environment
- The host.docker.internal DNS name is automatically available in Docker Desktop (macOS, Windows); Linux users need to use the Docker gateway IP or add host.docker.internal to the container's hosts file
- Xdebug 3's develop mode enables enhanced var_dump (colored output with type information) without enabling the step debugger, providing better debugging output without the performance cost
