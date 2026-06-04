# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 04-docker-containerization
**Knowledge Unit:** frankenphp-standalone
**Difficulty:** Intermediate
**Category:** Containerization
**Last Updated:** 2026-06-03

# Overview

FrankenPHP is a modern PHP application server built as a standalone Go binary that embeds the PHP interpreter and the Caddy web server. It replaces the traditional Nginx + PHP-FPM stack with a single binary that serves HTTP/1.1, HTTP/2, and HTTP/3 directly. Designed for Laravel Octane, it integrates Caddy's automatic HTTPS, on-demand TLS, and Mercure hub support.

FrankenPHP exists because the traditional Nginx + PHP-FPM + PHP stack is complex to configure and deploy. The engineering value is a single-binary deployment with automatic HTTPS, built-in Octane support, and Mercure real-time capabilities.

# When To Use

- New Laravel applications wanting the simplest production deployment
- Octane-based applications needing maximum performance
- Applications requiring Mercure real-time features
- Teams wanting automatic HTTPS via Caddy

# When NOT To Use

- Existing Nginx + PHP-FPM infrastructure with custom Nginx configurations
- Environments where Go binary deployment is not permitted
- Applications with complex Nginx routing rules

# Core Concepts

- **Single Binary** — Go binary embeds PHP interpreter and Caddy web server
- **Caddy Integration** — Automatic HTTPS, HTTP/3, on-demand TLS
- **Octane Worker Pool** — Built-in Octane support with worker management
- **Mercure Hub** — Real-time event broadcasting
- **Zero Configuration** — Works out of the box with sane defaults

# Best Practices

**Use Official Docker Image.** `dunglas/frankenphp` provides a pre-optimized container with FrankenPHP, PHP extensions, and production configuration.

**Configure Workers.** Set `FRANKENPHP_WORKER_COUNT` based on CPU cores.

**Use Automatic HTTPS.** Caddy automatically provisions Let's Encrypt certificates. No manual SSL configuration needed.

**Enable Mercure.** Configure Mercure hub URL and JWT key for real-time features.

# Related Topics

**Prerequisites:** Docker basics, Laravel Octane
**Closely Related:** Laravel Octane Deployment, Production Dockerfiles, Multi-Stage Builds
**Advanced Follow-Ups:** Kubernetes for Laravel, Mercure Hub Configuration
