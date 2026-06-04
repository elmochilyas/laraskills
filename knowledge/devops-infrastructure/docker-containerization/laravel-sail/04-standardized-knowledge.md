# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 04-docker-containerization
**Knowledge Unit:** laravel-sail
**Difficulty:** Beginner
**Category:** Containerization
**Last Updated:** 2026-06-03

# Overview

Laravel Sail is the official Docker-based development environment for Laravel. It provides a `compose.yaml` file and a `sail` CLI script that define and manage all development services: PHP, MySQL/PostgreSQL, Redis, Meilisearch, Mailpit, Selenium, and more.

Sail exists to eliminate "works on my machine" problems by standardizing the development environment. The engineering value is zero-configuration setup for new team members, production-environment parity, and a consistent development experience across macOS, Windows, and Linux.

# When To Use

- New Laravel projects using Docker for development
- Teams wanting standardized local development environments
- CI/CD test environments needing service containers

# When NOT To Use

- Projects already using custom Docker Compose configuration
- Environments where Docker Desktop is not available
- Teams preferring native PHP installation (Valet, Herd)

# Best Practices

**Customize Sail.** Publish and modify the `docker/sail` directory to add custom services or modify PHP extensions.

**Use Shell Aliases.** Create shell aliases for common sail commands (`sail up`, `sail artisan`, `sail test`).

**Set Sail Memory Limits.** Configure Docker memory limits in Docker Desktop to prevent resource exhaustion.

**Share with Team.** The `compose.yaml` and `sail` script are part of the repository, ensuring all developers use the same environment.

# Common Mistakes

**Binding to Wrong Port.** Sail services bind to localhost. If another service uses port 80 or 3306, Sail conflicts.

**Running Commands Outside Sail.** Running `php artisan` without `sail` prefix. Commands run against host PHP, not the container PHP version.

**Not Customizing for Production Parity.** Using default Sail configuration that differs significantly from production.

# Related Topics

**Prerequisites:** Docker, Docker Compose
**Closely Related:** Production Dockerfiles, Docker Compose for Laravel
**Advanced Follow-Ups:** FrankenPHP, Production Containerization
