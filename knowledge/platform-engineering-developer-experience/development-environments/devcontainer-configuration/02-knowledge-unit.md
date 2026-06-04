# Knowledge Unit: Devcontainer Configuration

## Metadata
- **Subdomain:** Development Environments
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** development-environments/devcontainer-configuration
- **Maturity:** Maturing
- **Related Technologies:** VS Code Dev Containers, Docker, Laravel Sail, PHP

## Executive Summary

Devcontainer configuration provides a standardized, containerized development environment for Laravel using VS Code's Dev Containers specification (`.devcontainer/devcontainer.json`). It defines the Docker image, extensions, settings, port forwarding, and post-create commands needed for a complete Laravel development environment. Laravel Sail supports generating a devcontainer configuration via `php artisan sail:install --devcontainer`, creating `.devcontainer/devcontainer.json` and `.devcontainer/Dockerfile`. The devcontainer ensures every developer has identical PHP, Composer, Node, database, and service versions, eliminating "works on my machine" issues. Devcontainers integrate with GitHub Codespaces for cloud-based development environments.

## Core Concepts

- **devcontainer.json:** The configuration file (in `.devcontainer/`) specifying the Docker image, VS Code extensions, settings, forwarded ports, postCreateCommand, and other container configuration
- **Development Container:** A Docker container configured as a full development environment with PHP, Composer, Node, npm, database, and services pre-configured
- **VS Code Extension Installation:** Devcontainer.json lists extensions to install automatically when opening the project in the container
- **Post-Create Commands:** Scripts run after the container is created (composer install, npm install, migration, seeding)
- **Port Forwarding:** Container ports (Laravel dev server, database, Mailpit) are forwarded to the host machine for browser access
- **GitHub Codespaces Integration:** The devcontainer.json works with GitHub Codespaces, providing cloud-hosted development environments from any browser
- **Sail Devcontainer Generation:** php artisan sail:install --devcontainer creates a devcontainer configuration based on Sail's services

## Mental Models

- **Devcontainer as Portable Development Machine:** The devcontainer is a pre-configured development machine that runs anywhere Docker runs—local, codespace, or CI
- **Devcontainer as Environment-as-Code:** The devcontainer.json is environment-as-code—declarative specification of the exact development environment, version-controlled with the project
- **Devcontainer as Onboarding Shortcut:** New developers clone the project, open in VS Code, and get a fully configured development environment—no manual setup steps

## Internal Mechanics

1. **Container Image Build:** VS Code builds the devcontainer image from the Dockerfile in `.devcontainer/` (or uses a pre-built image), installing PHP extensions, Node, Composer, and other tools
2. **Volume Mounting:** The project directory is bind-mounted into the container, enabling file changes on the host to be reflected in the container (and vice versa)
3. **Extension Installation:** VS Code reads the extensions array in devcontainer.json and installs specified extensions (Laravel Intellisense, PHP Intelephense, Laravel Extra Intellisense) inside the container
4. **Post-Create Execution:** After the container is ready, VS Code runs postCreateCommand (composer install, npm install, artisan migrate) inside the container
5. **Port Forwarding:** VS Code forwards specified ports from the container to the host, making Laravel dev server, Mailpit, and database accessible in the host browser
6. **Environment Inheritance:** The devcontainer inherits environment variables from devcontainer.json's `remoteEnv` or `containerEnv`, overriding local .env values if needed

## Patterns

- **Sail-Integrated Pattern:** Generate devcontainer via php artisan sail:install --devcontainer. This creates a devcontainer that uses Sail's Docker infrastructure for consistency.
- **Custom Devcontainer Pattern:** For projects not using Sail, create a custom devcontainer with PHP, Node, MySQL/PostgreSQL, Redis, and tools as separate services in docker-compose.yml referenced by devcontainer.json
- **Codespace-Ready Pattern:** Configure devcontainer.json with "codespaces" property for GitHub Codespace-specific optimizations (machine type, prebuilds). The same config works locally and in codespaces.
- **Post-Create Setup Pattern:** Use postCreateCommand for initial setup, postStartCommand for ongoing tasks (migrations on restart). Keep commands idempotent.
- **Extension Standardization Pattern:** Specify required VS Code extensions in devcontainer.json to ensure all developers have consistent IDE tooling: PHP Intelephense, Laravel Extra Intellisense, Error Lens, GitLens
- **Environment Variable Injection Pattern:** Use remoteEnv in devcontainer.json to inject environment-specific overrides: APP_URL for codespace URL, DB_HOST for internal service name
- **Lifecycle Hook Pattern:** Use onCreateCommand (runs once, when container is first created), postCreateCommand (runs after create), and postStartCommand (runs on every start) for different setup stages

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Image source | Pre-built (Sail) vs custom Dockerfile vs public image | Sail pre-built for Laravel projects; custom Dockerfile for specific needs |
| Service configuration | Single container vs Docker Compose (multiple services) | Docker Compose for separate database, cache, mail services |
| Package installation | Pre-installed in image vs postCreateCommand | Core tools in image; project dependencies in postCreate |
| Extension source | VS Code Marketplace vs Open VSX | VS Code Marketplace for local; Open VSX for codespaces (default) |
| Port mapping | Explicit (forwardPorts) vs automatic (appPort) | Explicit for production-like mapping; automatic for simplicity |

## Tradeoffs

- **Devcontainer vs Native Setup:** Devcontainers provide environment consistency at the cost of Docker overhead (RAM, disk space, startup time). Native setup is faster and less resource-intensive but prone to version inconsistencies.
- **Devcontainer vs Sail:** Sail provides similar containerization without VS Code dependency. Devcontainer adds VS Code integration (extensions, settings, seamless terminal) but requires VS Code. Choose Devcontainer for VS Code teams; Sail for any-editor teams.
- **Pre-built Image vs Custom Dockerfile:** Pre-built images (Sail's image) are faster to start (no build step) but inflexible for specific requirements. Custom Dockerfiles are fully configurable but must be built on first use (5-15 minutes).

## Performance Considerations

- **Container Build Time:** First-time devcontainer build takes 5-15 minutes (image pull, package installation, dependency resolution). Subsequent opens are faster (cached image layers).
- **Filesystem Performance:** Bind-mounting the project directory from the host into the container adds filesystem overhead, especially on macOS (via osxfs). Use Docker's delegated or cached mount options for better performance.
- **RAM Usage:** A full Laravel devcontainer with PHP, Node, MySQL, and Redis uses 2-4GB RAM. Ensure the host has sufficient memory (8GB+ recommended).
- **Startup Time:** Starting a stopped devcontainer takes 10-30 seconds (container start, service initialization, post-start hooks). This is faster than a full build but slower than native development.

## Production Considerations

- **Development Only:** Devcontainers are for development environments only. Never run a devcontainer in production—it includes development tools, exposes ports, and runs with elevated permissions.
- **CI Integration:** Devcontainers can be used in CI (GitHub Actions devcontainer action) for consistent environments, but this adds overhead. Traditional CI setup (install PHP, Node, Composer per job) is more common.
- **Codespace Cost:** GitHub Codespaces bills based on usage (compute hours, storage). Configure machine type (cores, RAM) in devcontainer.json to control costs.
- **Secrets Management:** API keys and tokens needed in development should use VS Code's container environment variables or .env files, not hard-coded in devcontainer.json.

## Common Mistakes

- **Not excluding the .devcontainer directory from production builds:** The devcontainer configuration is copied to production; it's not a security risk but adds unnecessary files
- **Forgetting to update devcontainer when dependencies change:** Adding a new PHP extension or Node version requirement but not updating the devcontainer Dockerfile
- **Hard-coding environment variables in devcontainer.json:** API keys, passwords, and tokens embedded in the configuration; use .env files or remoteEnv references
- **Not handling Codespace URLs:** The devcontainer works locally but in Codespaces, APP_URL must include the codespace hostname; use dynamic URL configuration
- **Building too much into the image:** Including all project dependencies in the Docker image instead of installing via postCreateCommand; every dependency change requires a rebuild

## Failure Modes

- **Docker Not Installed:** Devcontainers require Docker Desktop (or Docker Engine) on the host. Without Docker, the devcontainer can't start. Mitigate: document Docker installation as a prerequisite.
- **Extension Install Failure:** VS Code can't install specified extensions (network issues, extension not found). Mitigate: use well-known extensions; configure fallback behavior.
- **Port Conflict:** Forwarded port is already in use on the host (local web server, other devcontainer). Mitigate: use dynamic port forwarding or configure custom ports.
- **Post-Create Timeout:** postCreateCommand takes too long (slow network, large dependency install) and VS Code times out. Mitigate: use background installation for long-running steps; increase timeout.
- **Codespace Shutdown:** GitHub Codespace is stopped due to inactivity; unsaved work may be lost if the container is rebuilt. Mitigate: commit and push frequently; use persistent storage for IDE state.

## Ecosystem Usage

- **Laravel Sail:** Sail's --devcontainer flag generates a complete devcontainer.json with Sail integration
- **GitHub Codespaces:** Laravel teams use devcontainers with Codespaces for cloud-based development, especially for onboarding and quick contributions
- **Laravel Teams:** Development teams standardize on devcontainer configurations to eliminate "works on my machine" issues across Windows, macOS, and Linux
- **Laravel Open Source:** Open-source Laravel projects include devcontainer configurations for contributors to start contributing immediately without local environment setup

## Related Knowledge Units

- laravel-sail
- docker-compose-for-laravel
- wsl2-configuration-laravel
- automated-environment-setup-scripts

## Research Notes

- Devcontainers are based on the Development Container Specification, an open standard supported by VS Code, GitHub Codespaces, and other tools
- Laravel Sail's --devcontainer flag was added in Sail v1.20+, generating a complete devcontainer configuration that mirrors Sail's service setup
- GitHub Codespaces uses the same devcontainer.json format for cloud environments, enabling local-to-cloud portability
- The devcontainer specification defines life cycle hooks: onCreateCommand, postCreateCommand, postStartCommand, and postAttachCommand for different setup stages
