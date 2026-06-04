# 07-Decision Trees: WSL2 Configuration for Laravel

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | wsl2-configuration-laravel |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | WSL2 vs Native Windows | Whether to use WSL2 or native Windows tools for Laravel | Does the project require Docker-based development (Sail)? |
| D02 | Project Location | Where to store project files on WSL2 | Are projects on the WSL2 ext4 filesystem or Windows NTFS drive? |
| D03 | Performance Optimization | How to optimize WSL2 for Laravel development | What WSL2 settings maximize Docker and filesystem performance? |
| D04 | Tooling Integration | How to integrate IDEs and tools with WSL2 | Which tools run inside WSL2 and which on Windows? |

## Architecture-Level Decision Trees

### D01: WSL2 vs Native Windows

```
START: Should we use WSL2 or native Windows for Laravel?
│
├── WSL2 (recommended for Laravel on Windows)
│   ├── Use if: project uses Laravel Sail (Docker)
│   ├── Use if: team uses Linux-based tools (PHP, Composer, Artisan)
│   ├── Use if: production is Linux-based (most Laravel apps)
│   ├── Pro: Docker runs natively (WSL2 backend)
│   ├── Pro: Linux file system performance for Docker bind mounts
│   ├── Pro: VS Code Remote - WSL for seamless editing
│   └── Best for: all Docker-based Laravel development on Windows
│
├── Native Windows (alternative)
│   ├── Use if: no Docker needed (native PHP + built-in server)
│   ├── Use if: production is Windows-based (rare for Laravel)
│   ├── Use if: limited RAM (<8GB), WSL2 overhead not justified
│   ├── Pro: simpler, no VM overhead
│   ├── Con: PHP version management on Windows is harder
│   ├── Con: inconsistent with Linux production
│   └── Best for: simple projects, limited hardware
│
└── WSL2 vs Docker Desktop without WSL2
    ├── Docker Desktop with WSL2: default, recommended
    ├── Docker Desktop without WSL2: Hyper-V backend (slower, deprecated)
    ├── WSL2 without Docker Desktop: Docker CE inside WSL2 (advanced)
    └── Recommendation: Docker Desktop with WSL2 backend
```

### D02: Project Location

```
START: Where should Laravel project files be stored?
│
├── WSL2 ext4 filesystem (recommended)
│   ├── Path: ~/projects/ (inside WSL2 home directory)
│   ├── Actually at: \\wsl.localhost\Ubuntu\home\username\projects\
│   ├── Why: 3-5x faster Docker I/O than NTFS
│   ├── Access from Windows: \\wsl.localhost\Ubuntu\home\username\
│   └── Best for: all Sail-based projects
│
├── Windows NTFS filesystem (avoid)
│   ├── Path: C:\Users\username\projects\
│   ├── Mounted in WSL2 at: /mnt/c/Users/username/projects/
│   ├── Problem: 5-10x slower Docker bind mount I/O
│   ├── Problem: Composer install, npm install, migrations are very slow
│   └── Reason: WSL2 translates Linux syscalls to Windows for NTFS
│
└── Moving projects to WSL2
    ├── From Windows: copy to \\wsl.localhost\Ubuntu\home\username\
    ├── Inside WSL2: cp -r /mnt/c/Users/username/project ~/projects/
    ├── Access: use VS Code Remote - WSL for editing
    └── File Explorer: \\wsl.localhost\Ubuntu\home\username\projects\ for Windows tools
```

### D03: Performance Optimization

```
START: How do we optimize WSL2 for Laravel development?
│
├── Memory limits (.wslconfig)
│   ├── Create: %UserProfile%\.wslconfig
│   ├── Settings:
│   │   [wsl2]
│   │   memory=8GB (limit WSL2 RAM)
│   │   processors=4 (limit CPU cores)
│   │   localhostForwarding=true (access services from Windows)
│   │   swap=2GB (swap space)
│   ├── Apply: wsl --shutdown && wsl (restart required)
│   └── Without limits: WSL2 can consume all available RAM
│
├── Docker performance
│   ├── Ensure Docker Desktop uses WSL2 backend
│   ├── Store projects on WSL2 ext4 (not /mnt/c/)
│   ├── Use :cached bind mount flag for macOS compat (not needed on WSL2)
│   └── Monitor: docker stats for resource usage
│
├── Disk performance
│   ├── Keep project files in WSL2 ext4
│   ├── Avoid: opening WSL2 files from Windows apps (permission issues)
│   ├── Avoid: editing files via \\wsl.localhost\ from Windows editors
│   └── Use: VS Code Remote - WSL for all development
│
└── Daily maintenance
    ├── Shutdown: wsl --shutdown when not developing (frees RAM)
    ├── Clean disk: docker system prune periodically
    └── Check: wsl -l -v (verify WSL2 version, not WSL1)
```

### D04: Tooling Integration

```
START: Which tools run inside WSL2 and which on Windows?
│
├── Run inside WSL2 (Linux tools)
│   ├── PHP, Composer, Artisan
│   ├── Laravel Sail (Docker)
│   ├── Git (configure core.autocrlf=false)
│   ├── Node.js, NPM
│   ├── VS Code (via Remote - WSL extension)
│   └── Windows Terminal (with Ubuntu profile)
│
├── Run on Windows (native Windows tools)
│   ├── Browsers (access localhost forwarded from WSL2)
│   ├── Docker Desktop (UI, settings)
│   ├── Database GUI tools (TablePlus, Sequel Ace) — connect via localhost:FORWARD_DB_PORT
│   ├── Git GUI tools (GitHub Desktop, Sourcetree)
│   └── File Explorer (access \\wsl.localhost\Ubuntu\)
│
├── VS Code setup
│   ├── Install Remote - WSL extension
│   ├── Open WSL2 folder: code ~/projects/my-app
│   ├── VS Code Server installs automatically in WSL2
│   ├── All terminal operations target WSL2 Linux
│   └── Extensions: install in WSL2 context (not Windows)
│
└── Git configuration
    ├── core.autocrlf = false (inside WSL2 — Linux line endings)
    ├── core.filemode = false (ignore permission changes)
    ├── Credential helper: use Windows Git credential manager
    └── Avoid: working with repos cloned from Windows and WSL2 (mixed line endings)
```
