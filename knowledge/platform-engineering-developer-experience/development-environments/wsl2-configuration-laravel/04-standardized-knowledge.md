# 04-Standardized Knowledge: WSL2 Configuration for Laravel

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | wsl2-configuration-laravel |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-sail, docker-compose-for-laravel, devcontainer-configuration |
| **Framework/Language** | WSL2, Docker Desktop, Ubuntu, Laravel Sail, Windows Terminal, VS Code |

## Overview

WSL2 (Windows Subsystem for Linux 2) configuration for Laravel sets up and optimizes the WSL2 environment for Docker-based tooling like Laravel Sail. WSL2 runs a full Linux kernel in a lightweight VM on Windows, providing native Linux filesystem performance. Recommended approach for Windows Laravel developers. Key aspects: store projects on WSL2 ext4 filesystem (not Windows NTFS), configure Docker Desktop WSL2 backend, use VS Code Remote - WSL, optimize `.wslconfig` for memory limits.

## Core Concepts

- **WSL2 Architecture**: lightweight VM running real Linux kernel managed by Windows; near-native filesystem perf
- **Docker Desktop WSL2 Backend**: Docker daemon runs inside WSL2 VM; containers have native Linux performance
- **WSL2 Filesystem**: ext4 at `//wsl.localhost/Ubuntu/home/user/project` — 3-5x faster I/O than NTFS for Docker
- **Project Location Rule**: Sail projects must be inside WSL2 filesystem; NTFS (`/mnt/c/`) is 10x slower
- **Localhost Forwarding**: WSL2 services accessible at `localhost` from Windows browser
- **VS Code Remote - WSL**: VS Code server runs inside WSL2; all operations target WSL2 context

## When to Use

- Laravel development on Windows with Sail/Docker
- Teams using Windows laptops for Laravel development
- WSL2 is the recommended Laravel dev environment for Windows (officially in docs)

## When NOT to Use

- Native Linux or macOS users (WSL2 is Windows-specific)
- Simple projects on Windows that don't need Docker

## Best Practices (WHY)

- **Store projects in WSL2 ext4 filesystem**: `~/projects/` not `/mnt/c/Users/` — 3-5x faster Docker I/O
- **Configure .wslconfig**: set memory limit (4-8GB) to prevent VM consuming all RAM
- **Use VS Code Remote - WSL**: edit files through WSL2; avoids permission/line-ending issues
- **Use Windows Terminal**: auto-detects WSL2 distros; Ubuntu as default profile
- **Use Sail inside WSL2**: don't install PHP natively — maintain environment consistency
- **Shutdown WSL2 when not in use**: `wsl --shutdown` frees memory

## Architecture Guidelines

- Install Ubuntu 24.04 LTS via `wsl --install -d Ubuntu-24.04`
- Docker Desktop: enable WSL2 backend, integrate with Ubuntu
- .wslconfig in `%UserProfile%\.wslconfig` for memory/CPU limits
- VS Code: install Remote - WSL extension
- Git: configure `core.autocrlf false` in WSL2

## Performance Considerations

- WSL2 ext4: 3-5x faster than NTFS for Docker bind mounts
- Docker performance: near-native (within 5% of Linux)
- Startup: 2-5s cold boot; 30-60s Sail environment
- Memory: 4-8GB typical allocation; limit via .wslconfig

## Security Considerations

- WSL2 shares Windows network; services on localhost accessible from Windows
- Don't run production workloads in WSL2
- Environment variable differences between Windows and Linux — use .env explicitly

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Projects on Windows drive | `/mnt/c/` path used | 5-10x slower Docker I/O | Store in WSL2 filesystem |
| No .wslconfig | Unlimited memory | Windows slowdown | Set memory=4GB-8GB |
| Native PHP instead of Sail | Inconsistent versions | Version mismatch | Use Sail always |
| Mixing Windows/WSL2 tools | Line ending/permission issues | Git/editor problems | Use VS Code Remote - WSL |
| Never shutting down | Memory always allocated | Resource waste | wsl --shutdown when done |

## Anti-Patterns

- **Editing WSL2 files from Windows apps**: causes permission/line-ending corruption
- **Running Sail from Windows drive**: I/O penalty makes Composer/NPM operations extremely slow

## Examples

```ini
# %UserProfile%\.wslconfig
[wsl2]
memory=8GB
processors=4
localhostForwarding=true
```

```bash
# Inside WSL2
cd ~/projects
curl -s https://laravel.build/my-app | bash
cd my-app
./vendor/bin/sail up -d
```

## Related Topics

- laravel-sail — Sail on WSL2
- docker-compose-for-laravel — Docker Compose on WSL2
- devcontainer-configuration — VS Code devcontainers on WSL2

## AI Agent Notes

- When generating docs for Windows teams, include WSL2 setup instructions
- Default project path recommendations: `~/projects/` inside WSL2

## Verification

- [ ] WSL2 installed with Ubuntu 24.04
- [ ] Docker Desktop uses WSL2 backend
- [ ] Projects stored in WSL2 filesystem (`~/projects/`)
- [ ] .wslconfig configured with memory limit
- [ ] VS Code Remote - WSL installed
- [ ] Git autocrlf set to false in WSL2
- [ ] Sail runs without filesystem performance issues
