# Laravel ECC

**Laravel 13 AI-ready skills, rules, agents, and CLI harness configs** for OpenCode, Claude Code, Cursor, Gemini CLI, Codex CLI, Copilot, VS Code, Zed, Trae, Qwen, CodeBuddy, and Kiro.

Builds on the [ECC](https://github.com/affaan-m/ECC) ecosystem with Laravel 13-specific depth.

```bash
# Install from GitHub
npx skills add elmochilyas/laravel-ecc
gh skill install elmochilyas/laravel-ecc

# Install from npm
npx laravel-ecc@beta add laravel-patterns
```

## What's Included

| Category | Count | Description |
|----------|-------|-------------|
| Skills | 3 | Deep Laravel 13 skills (~35-40 code examples each) |
| Rules | 22 | common(10) + php(5) + web(7) + laravel(5) |
| Agents | 3 | Laravel Artisan, Eloquent, Migration agents |
| Commands | 4 | artisan, migrate, seed, route-list |
| Harness Configs | 12 | OpenCode, Claude Code, Cursor, Gemini, Codex, Copilot, VS Code, Zed, Trae, Qwen, CodeBuddy, Kiro |
| MCP Configs | 2 | Laravel docs + Composer security |

## Quick Start

### Install from npm

```bash
# Install a specific skill
npx laravel-ecc@beta add laravel-patterns
npx laravel-ecc@beta add laravel-tdd
npx laravel-ecc@beta add laravel-security

# Check installation state
npx laravel-ecc@beta doctor
```

### Install from GitHub

```bash
# All 3 skills via Vercel Skills CLI
npx skills add elmochilyas/laravel-ecc

# Or via GitHub CLI
gh skill install elmochilyas/laravel-ecc

# Install a single skill
npx skills add elmochilyas/laravel-ecc --skill laravel-patterns
```

### Install Scripts

```bash
# Minimal (3 skills only)
./install.ps1 --profile minimal   # Windows
./install.sh --profile minimal    # macOS/Linux

# Full (everything)
./install.ps1 --profile full      # Windows
./install.sh --profile full       # macOS/Linux
```

## Laravel 13

Targets **Laravel 13** (PHP 8.3+, Pest 4).

Key features:
- PHP 8 attribute-driven models (`#[Table]`, `#[Fillable]`, `#[Hidden]`, `#[Casts]`)
- Pest 4 first-class test framework with PHP Attribute Output (PAO)
- Queue job attributes (`#[Connection]`, `#[Tries]`, `#[Timeout]`)
- Console command attributes (`#[AsCommand]`)
- Dusk `clickOnceVisible` / `clickOnceEnabled`
- Horizon Redis Cluster support

## Three Skills

### laravel-patterns
Architecture: modular domains, Actions/Services/DTOs, Eloquent optimization, attribute models, Form Requests, API Resources, Queues, Events, Caching, Policies, Pipeline, Service container, Rate limiting

### laravel-tdd
Pest 4: Feature/Unit 80/20 split, Model factories, HTTP tests, Auth tests, Laravel fakes (Http/Mail/Queue/Storage/Event/Bus), Architecture tests, Datasets, Snapshot testing, Parallel testing, Dusk, CI

### laravel-security
Mass assignment, SQL injection, XSS/Blade, CSRF, Breeze/Fortify, Gates/Polices, FormRequest, Rate limiting, HSTS/CSP headers, Session security, CORS, File uploads, composer audit, Enlightn, APP_KEY rotation, Production hardening

## CLI Harness Support

| Tool | Config |
|------|--------|
| OpenCode | `.opencode/opencode.json` |
| Claude Code | `.claude/settings.json` |
| Cursor | `.cursor/rules.mdc` |
| Gemini CLI | `.gemini/instructions.md` |
| Codex CLI | `.codex/instructions.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| VS Code | `.vscode/settings.json` / `.vscode/extensions.json` |
| Zed | `.zed/settings.json` |
| Trae | `.trae/rules.md` |
| Qwen | `.qwen/instructions.md` |
| CodeBuddy | `.codebuddy/instructions.md` |
| Kiro | `.kiro/instructions.md` |

## License

MIT — based on [ECC](https://github.com/affaan-m/ECC) by Affaan Mustafa.
