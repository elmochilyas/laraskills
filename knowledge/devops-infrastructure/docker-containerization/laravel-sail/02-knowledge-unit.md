# Laravel Sail

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Docker & Containerization
- **Knowledge Unit:** Laravel Sail
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel Sail is the official Docker-based development environment for Laravel, providing a `compose.yaml` file and a `sail` CLI script that define and manage all development services. It eliminates "works on my machine" problems by standardizing the development environment across macOS, Windows, and Linux.

---

## Core Concepts

- **compose.yaml** — Pre-configured Docker Compose file defining PHP, MySQL/PostgreSQL, Redis, Meilisearch, Mailpit, Selenium, and more
- **sail CLI** — Convenience script wrapping `docker compose` commands with optimized defaults
- **Service Selection** — Choose which services to start via Sail's configuration
- **Environment Parity** — Consistent development environment across all team members
- **CI Integration** — Service container definitions that work in CI/CD pipelines

---

## Mental Models

- **Zero-Configuration Development** — New team members run `composer require laravel/sail --dev` and `./vendor/bin/sail up`. No manual PHP/MySQL/Redis installation required.
- **Docker Compose, Simplified** — Sail is a curated Docker Compose configuration with a friendly CLI. Everything you can do with Compose, you can do with Sail.
- **Production Parity Starting Point** — Sail's service topology mirrors production. Customize Sail to match your production services, then use the same configuration as the base for your production Docker setup.

---

## Internal Mechanics

When `sail up` is executed, the `sail` script runs `docker compose up` with the Sail service configuration. Services are defined in a `docker-compose.yml` file that includes PHP with selected extensions, the chosen database (MySQL or PostgreSQL), Redis for caching, Meilisearch for search, Mailpit for email testing, and Selenium for browser testing. The PHP container includes Composer, Node, and NPM/Yarn. The application source is mounted as a bind mount for live reloading. The `sail` script maps `sail artisan` to `php artisan` inside the container.

---

## Patterns

- **Customize via Publishing** — Publish the `docker/sail` directory with `sail:publish` to modify PHP extensions, add services, or customize configuration
- **Shell Aliases** — Create shell aliases for common commands (`alias sail='./vendor/bin/sail'`) to streamline the workflow
- **Memory Limits** — Configure Docker memory limits to prevent resource exhaustion, especially on Docker Desktop

---

## Architectural Decisions

- **Sail vs. Custom Docker Compose** — Use Sail for new Laravel projects; switch to custom Compose when you need specific service configurations not supported by Sail
- **Sail vs. Valet/Herd** — Use Sail for teams needing environment consistency and Windows support; use Valet or Herd for macOS-only teams preferring native PHP performance
- **Sail in CI/CD** — Use Sail's service containers for CI integration testing; they provide the same service topology as the development environment

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Zero-configuration setup | Docker overhead on macOS/Windows | File system performance slower than native |
| Consistent team environments | All developers must have Docker | Docker Desktop licensing costs for commercial teams |
| CI service containers reuse dev config | Limited customization without publishing | Some advanced configurations require modifying Sail internals |
| Official Laravel package with broad support | Not suitable for production by itself | Sail is development-only; production requires different Docker configuration |

---

## Performance Considerations

Bind mounts on macOS/Windows have slower file system performance. Use dedicated volumes for `vendor/` and `node_modules/` to improve performance. Set Docker memory limits to prevent the development environment from consuming all host resources. Sail's PHP container includes Node.js and other build tools that increase image size but reduce the need for additional containers.

---

## Production Considerations

Sail is designed for development only — never use Sail configuration directly in production. Sail's defaults prioritize convenience over security and performance. Use Sail's service topology as a reference for production Docker Compose or Kubernetes configuration. Publish and customize Sail when your production services differ from defaults.

---

## Common Mistakes

- **Binding to Wrong Port** — Sail services bind to localhost by default. If another service uses port 80 or 3306, Sail conflicts. Use `sail up -p` to change port mappings.
- **Running Commands Outside Sail** — Running `php artisan` without the `sail` prefix executes commands against the host PHP version, not the container's PHP version. Always use `sail artisan`.
- **Not Customizing for Production Parity** — Using default Sail configuration that differs significantly from production. Customize Sail services to match your production topology.
- **Forgetting to Publish Configuration** — Running `sail:publish` early ensures customizations are version-controlled and shared with the team.

---

## Failure Modes

- **Port Conflict** — Port 3306 (MySQL) or 6379 (Redis) already in use on the host. Detection: `sail up` fails with port binding error. Mitigation: stop conflicting services or change Sail port mappings.
- **Docker Desktop Resource Limits** — Docker Desktop memory limit is too low for Sail's services. Detection: containers restart or become unresponsive. Mitigation: increase Docker Desktop memory allocation.
- **Sail Script Missing** — `./vendor/bin/sail` not found. Detection: `sail` command not recognized. Mitigation: file is in `.gitignore`; run `composer install` after clone. Consider creating a global alias in team onboarding docs.

---

## Ecosystem Usage

Sail is the official Laravel development environment, created by Taylor Otwell. It is included as a Composer dev dependency in new Laravel projects. Sail supports Apple Silicon, Windows WSL2, and Linux. The Sail configuration is version-controlled in the repository, ensuring all developers use the same environment. Sail integrates with Laravel Breeze and Jetstream for full-stack development with Livewire, Inertia, or API scaffolding.

---

## Related Knowledge Units

### Prerequisites
- Docker, Docker Compose

### Related Topics
- Production Dockerfiles
- Docker Compose for Laravel

### Advanced Follow-up Topics
- FrankenPHP
- Production Containerization

---

## Research Notes

Sail is the standard development environment for new Laravel projects. Customize via `sail:publish` when production services differ from defaults. Never use Sail configuration in production. The `sail` script is in `.gitignore` — document this in team onboarding. Bind mount performance on macOS/Windows is a known limitation; use dedicated volumes for `vendor/` and `node_modules/`.
