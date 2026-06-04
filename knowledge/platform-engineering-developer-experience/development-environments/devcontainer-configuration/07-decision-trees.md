# 07-Decision Trees: Devcontainer Configuration

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | devcontainer-configuration |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Devcontainer vs Direct Sail | Whether to use devcontainers or Sail directly | Does the team use VS Code and value zero-setup onboarding? |
| D02 | Image Strategy | Pre-built image vs custom Dockerfile | Do we need custom PHP extensions or system packages? |
| D03 | Post-Create Commands | What to run after container creation | What setup steps are needed for a ready-to-use environment? |
| D04 | Codespaces Readiness | Whether to optimize for GitHub Codespaces | Is cloud-based development needed for the team? |

## Architecture-Level Decision Trees

### D01: Devcontainer vs Direct Sail

```
START: Should we use devcontainers or Sail directly?
│
├── Devcontainer (VS Code teams, zero-setup onboarding)
│   ├── Generate: php artisan sail:install --devcontainer
│   ├── Pro: VS Code opens directly into containerized environment
│   ├── Pro: extensions, settings, ports auto-configured
│   ├── Pro: new devs click "Reopen in Container" — ready in minutes
│   ├── Con: VS Code only (not for PhpStorm users)
│   └── Best for: VS Code teams, open-source projects, GitHub Codespaces
│
├── Direct Sail (any IDE, lightweight)
│   ├── Use: sail up -d, IDE connects to container
│   ├── Pro: works with any IDE (PhpStorm, VS Code, etc.)
│   ├── Pro: less overhead, no devcontainer layer
│   ├── Con: manual setup: IDE config, PHP interpreter, debugging
│   └── Best for: experienced teams, mixed IDE environments
│
└── Hybrid (devcontainer available, direct Sail for non-VS Code)
    ├── Commit devcontainer config for VS Code users
    ├── Other IDEs use Sail directly
    └── Both use same Docker Compose file
```

### D02: Image Strategy

```
START: Should we use Sail's pre-built image or a custom Dockerfile?
│
├── Pre-built image (no customization needed)
│   ├── Use: sail image (servesailphp/php)
│   ├── Pro: fastest startup, no build step
│   ├── Pro: auto-updates with Sail
│   ├── Con: limited to Sail's default extensions
│   └── Best for: standard Laravel projects
│
├── Custom Dockerfile (extensions, system packages)
│   ├── Generate: php artisan sail:publish
│   ├── Edit: docker/<version>/Dockerfile
│   ├── Reference in devcontainer.json: "build": { "dockerfile": "Dockerfile" }
│   ├── Pro: full control over PHP extensions and system deps
│   ├── Con: longer build time, must maintain Dockerfile
│   └── Best for: projects needing gd, imagick, swoole, pcntl
│
└── Build strategy
    ├── First build: pull base + install extensions (5-15 min)
    ├── Subsequent: cached layers (1-3 min)
    ├── Use .devcontainer/Dockerfile if different from Sail's
    └── Rebuild on: extension changes, PHP version changes
```

### D03: Post-Create Commands

```
START: What should run after container creation?
│
├── Essential (always include)
│   ├── composer install (install PHP dependencies)
│   ├── npm install (install frontend dependencies)
│   ├── cp .env.example .env (if not present)
│   ├── php artisan key:generate (if APP_KEY not set)
│   └── php artisan migrate (create database tables)
│
├── Optional (project-specific)
│   ├── php artisan db:seed (seed sample data)
│   ├── php artisan storage:link (create storage symlink)
│   ├── npm run build (compile assets)
│   ├── php artisan scout:import (populate search index)
│   └── php artisan ide-helper:generate (IDE autocompletion)
│
├── Lifecycle hooks in devcontainer.json
│   ├── onCreateCommand: runs once after container created (rare)
│   ├── postCreateCommand: runs after container created (common)
│   └── postStartCommand: runs every time container starts (migrations)
│
└── Performance consideration
    ├── Heavy commands in postCreate (npm install) delay first use
    ├── Consider: run heavy commands in background
    └── Consider: use pre-built image with deps installed
```

### D04: Codespaces Readiness

```
START: Should we optimize for GitHub Codespaces?
│
├── Codespaces not needed
│   ├── Local development only
│   ├── No config needed beyond local devcontainer
│   └── Codespaces config = minimal; works but not optimized
│
├── Codespaces ready (recommended for teams)
│   ├── Same devcontainer.json works locally and in Codespaces
│   ├── Considerations:
│   │   ├── APP_URL must be dynamic (codespace URL differs)
│   │   ├── Port visibility settings (public/private)
│   │   ├── Machine type selection (4-core / 8-core)
│   │   └── Auto-stop timeout (30-60 min default)
│   ├── Pro: instant dev environment for new team members
│   ├── Pro: works on low-powered machines (Chromebooks, tablets)
│   ├── Cost: based on compute hours
│   └── Best for: distributed teams, open-source, onboarding
│
└── Codespaces-specific config
    ├── .devcontainer/codespaces.json for overrides
    ├── Set APP_URL dynamically via postCreateCommand script
    ├── Configure forwarded ports as public/private
    └── Test: verify full workflow works in Codespaces
```
