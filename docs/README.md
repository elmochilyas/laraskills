# Laravel ECC

**Laravel 13 AI-ready skills, rules, agents, and CLI harness configs for OpenCode, Claude Code, Cursor, Gemini CLI, Codex CLI, Copilot, VS Code, Zed, Trae, Qwen, CodeBuddy, and Kiro.**

Builds on the [ECC](https://github.com/affaan-m/ECC) ecosystem with Laravel 13-specific depth.

```bash
# Install from GitHub
npx skills add elmochilyas/laravel-ecc
gh skill install elmochilyas/laravel-ecc
```

## What's Included

| Category | Count | Description |
|----------|-------|-------------|
| Skills | 3 | Deep Laravel 13 skills (~35-40 code examples each) |
| Rules | 15 | common(10) + php(5) + web(7) + laravel(5) |
| Agents | 3+ | Laravel-specific agents + ECC ecosystem agents |
| Commands | 4+ | Artisan, Migrate, Seed, Route-List |
| Harness Configs | 12 | OpenCode, Claude Code, Cursor, Gemini, Codex, Copilot, VS Code, Zed, Trae, Qwen, CodeBuddy, Kiro |
| MCP Configs | 2 | Laravel docs, Composer security |

## Quick Start

### Install from GitHub (once this repo is pushed)

```bash
# Vercel Skills CLI — works in any terminal
npx skills add affaan-m/laravel-ecc

# GitHub CLI — native skill management
gh skill install affaan-m/laravel-ecc

# Install a single skill only
npx skills add affaan-m/laravel-ecc --skill laravel-patterns
```

### Install from this repo locally

```bash
# Using our CLI
npx laravel-ecc add laravel-patterns
npx laravel-ecc add laravel-tdd
npx laravel-ecc add laravel-security
npx laravel-ecc add laravel-artisan

# Using install scripts
./install.ps1 --profile minimal   # Windows
./install.sh --profile minimal    # macOS/Linux

# Full install (everything)
./install.ps1 --profile full      # Windows
./install.sh --profile full       # macOS/Linux
```

## Laravel 13 Version

Targets **Laravel 13** (PHP 8.3+, Pest 4, attribute-driven models).

Key Laravel 13 features covered:
- PHP 8 attribute-driven models (`#[Table]`, `#[Fillable]`, `#[Hidden]`, `#[Casts]`)
- Pest 4 as first-class test framework with PHP Attribute Output
- Queue job attributes (`#[Connection]`, `#[Tries]`, `#[Timeout]`)
- Console command attributes (`#[AsCommand]`)
- Dusk `clickOnceVisible` / `clickOnceEnabled`
- Horizon Redis Cluster support
- Svelte 5 adapter for Laravel Echo

## Three Deep Skills

### laravel-patterns
Architecture best practices: modular/domain structure, Actions/Services/DTOs, Eloquent optimization, attribute-driven models, Form Requests, API Resources, Queues with attributes, Events/Listeners, Caching with tags, Policies/Gates, Pipeline pattern, Service container, Rate limiting

### laravel-tdd
Testing with Pest 4: Setup and configuration, Feature vs Unit (80/20 split), Model factories (sequences, states, relationships), HTTP tests, Authentication tests, Laravel fakes (Http, Mail, Queue, Notification, Storage, Event, Bus), Architecture tests, Datasets, Snapshot testing, Parallel testing, Dusk browser tests, CI integration

### laravel-security
Security best practices: Mass assignment (Laravel 13 attributes), SQL injection prevention, XSS/Blade safety, CSRF protection, Authentication (Breeze/Fortify), Authorization (Gates/Polices), FormRequest validation, Rate limiting, HTTP headers (HSTS/CSP), Session security, CORS, File upload safety, Dependency auditing (composer audit, Enlightn), APP_KEY rotation, Production hardening checklist

## CLI Harness Support

| Tool | Config Location |
|------|----------------|
| OpenCode | `.opencode/opencode.json` |
| Claude Code | `.claude/settings.json` |
| Cursor IDE | `.cursor/rules.mdc` |
| Gemini CLI | `.gemini/instructions.md` |
| Codex CLI | `.codex/instructions.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| VS Code | `.vscode/settings.json` |
| Zed | `.zed/settings.json` |
| Trae | `.trae/rules.md` |
| Qwen | `.qwen/instructions.md` |
| CodeBuddy | `.codebuddy/instructions.md` |
| Kiro | `.kiro/instructions.md` |

## License

MIT — based on [ECC](https://github.com/affaan-m/ECC) by Affaan Mustafa.
