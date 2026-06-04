# Knowledge Unit: WSL2 Configuration for Laravel

## Metadata
- **Subdomain:** Development Environments
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** development-environments/wsl2-configuration-laravel
- **Maturity:** Mature
- **Related Technologies:** WSL2, Docker Desktop, Ubuntu, Laravel Sail, Windows Terminal, VS Code

## Executive Summary

WSL2 (Windows Subsystem for Linux 2) configuration for Laravel refers to the setup and optimization of the WSL2 environment on Windows for Laravel development, particularly with Docker-based tooling like Laravel Sail. WSL2 runs a full Linux kernel inside a lightweight VM on Windows, providing native Linux filesystem performance and Docker container support. For Laravel developers on Windows, WSL2 is the recommended approach to run Sail because Docker containers require a Linux kernel and perform significantly better on the WSL2 ext4 filesystem than on the Windows NTFS filesystem via bind mounts. Proper WSL2 configuration involves installing a Linux distribution (typically Ubuntu 22.04 or 24.04), configuring Docker Desktop to use the WSL2 backend, storing Laravel projects inside the WSL2 filesystem (not on the Windows drive), and integrating with Windows tools like VS Code (Remote - WSL extension) and Windows Terminal. Performance optimization includes configuring .wslconfig for memory limits, using project files inside the WSL2 filesystem (not /mnt/c/), and avoiding cross-filesystem operations.

## Core Concepts

- **WSL2 Architecture:** A lightweight VM running a real Linux kernel managed by Windows; provides near-native Linux filesystem performance and full system call compatibility for Docker
- **Docker Desktop WSL2 Backend:** Docker Desktop can integrate with WSL2, running the Docker daemon inside the WSL2 VM; containers have native Linux performance without Hyper-V overhead
- **WSL2 Filesystem vs Windows Filesystem:** WSL2's ext4 filesystem at `//wsl.localhost/Ubuntu/home/user/project` has ~3-5x faster I/O for Docker bind mounts compared to Windows NTFS paths like `C:\Users\...`
- **Project Location Rule:** Laravel projects using Sail must be stored inside the WSL2 filesystem; projects on the Windows drive (`/mnt/c/`) accessed via WSL2 have ~10x slower filesystem performance
- **WSL2 Network Integration:** WSL2 shares the Windows network; localhost connections from Windows reach WSL2 services, and WSL2 can access Windows resources via `localhost` or Windows host IP

## Mental Models

- **WSL2 as Mini Linux VM:** Think of WSL2 as a lightweight Linux virtual machine that shares the Windows filesystem and network; it runs Ubuntu and all Laravel/Sail commands execute inside this Linux environment
- **WSL2 Filesystem as Primary Workspace:** The WSL2 home directory (`/home/user/`) is the primary workspace; Windows drives (`/mnt/c/`) are for data exchange only, not for project storage
- **Docker Desktop as WSL2 Plugin:** Docker Desktop on Windows with WSL2 backend doesn't run a separate VM; it uses the existing WSL2 VM's Linux kernel to run Docker containers directly

## Internal Mechanics

1. **WSL2 Boot:** When WSL2 starts, it boots a real Linux kernel in a lightweight VM managed by Windows; the VM has configurable memory and CPU limits set in `%UserProfile%\.wslconfig`
2. **Filesystem Translation:** WSL2 uses 9P protocol for `/mnt/c/` (Windows drive) access, adding ~50-100 microsecond latency per operation; the native ext4 filesystem has no such translation layer
3. **Docker Integration:** Docker Desktop communicates with the Docker daemon inside WSL2 via a Unix socket; containers run natively on the WSL2 kernel, sharing its cgroup and namespace hierarchy
4. **Port Forwarding:** WSL2 automatically forwards ports from Linux services to Windows; `sail up` on port 80 inside WSL2 is accessible at `localhost:80` on the Windows browser
5. **VS Code Remote - WSL:** VS Code's Remote - WSL extension installs a VS Code server inside WSL2 and communicates via a socket; all terminal operations, file edits, and extensions run inside WSL2
6. **Interop:** Windows executables can be launched from WSL2 (notepad.exe opens in Windows); Linux executables can be launched from Windows (ubuntu.exe runs bash)

## Patterns

- **WSL2 Installation Pattern:**
  ```powershell
  wsl --install -d Ubuntu-24.04
  ```
  Installs WSL2 and Ubuntu; verify with `wsl -l -v`.
- **Docker Desktop Configuration Pattern:**
  1. Install Docker Desktop
  2. Settings > Resources > WSL Integration > Enable integration with Ubuntu
  3. Restart Docker Desktop
  4. Verify: `wsl -d Ubuntu` then `docker ps`
- **Project Storage Pattern:**
  ```bash
  cd ~
  mkdir projects
  cd projects
  git clone <laravel-project>
  # Or: curl -s https://laravel.build/my-app | bash
  ```
  Always store projects in the WSL2 ext4 filesystem (`/home/<user>/projects/`), never under `/mnt/c/`.
- **Windows Terminal Integration Pattern:**
  1. Install Windows Terminal from Microsoft Store
  2. It auto-detects WSL2 distributions and adds them as profiles
  3. Set Ubuntu as default profile for Laravel development
- **VS Code WSL Pattern:**
  ```bash
  code .
  ```
  Run from within WSL2 terminal; VS Code opens with Remote - WSL context, extensions, terminal, and debugger all targeting WSL2.
- **Performance Optimization Pattern:**
  ```
  # %UserProfile%\.wslconfig
  [wsl2]
  memory=8GB
  processors=4
  localhostForwarding=true
  ```
  Limits WSL2 resource usage; prevents the VM from consuming all available RAM.
- **Cross-Filesystem Data Exchange Pattern:**
  Use `/mnt/c/Users/<user>/` only for accessing Windows-hosted files (shared configs, backups, downloads); never run Sail projects from `/mnt/c/`.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| WSL2 distro | Ubuntu 22.04 vs 24.04 vs Debian | Ubuntu 24.04 LTS (best package support, Laravel docs examples) |
| Project filesystem | WSL2 ext4 vs Windows NTFS | WSL2 ext4 always; NTFS for Laravel projects with Docker is 5-10x slower |
| Docker backend | WSL2 vs Hyper-V | WSL2 (better performance, lower overhead, integrates with WSL2 distro) |
| Terminal | Windows Terminal vs VS Code terminal | Windows Terminal (dedicated, multi-tab); VS Code terminal for integrated dev flow |
| PHP binary | WSL2-native vs Sail (Docker) | Sail/Docker for environment consistency; WSL2-native PHP for quick one-off commands |

## Tradeoffs

- **WSL2 vs Native Linux:** WSL2 has ~5-10% performance overhead compared to native Linux due to the VM layer. For Laravel development (CPU-bound PHP, I/O-bound Composer), the difference is negligible. WSL2 offers seamless Windows integration (copy-paste, file sharing, Windows apps).
- **WSL2 vs Mac/macOS:** WSL2's Docker performance is superior to Docker for Mac (which uses a HyperKit VM with slower filesystem sharing). Laravel Sail on WSL2 is often faster than on macOS for the same project.
- **WSL2 ext4 vs Windows NTFS:** ext4 inside WSL2 is ~3-5x faster for Docker bind mounts than NTFS. The `/mnt/c/` path uses 9P protocol with per-operation overhead, making `composer install` on NTFS ~5-10x slower.
- **Docker Desktop WSL2 vs Docker Engine in WSL2:** Docker Desktop provides a GUI, automatic updates, and Kubernetes integration. Docker Engine installed directly inside WSL2 avoids Docker Desktop's license fees (for commercial use) but requires manual management.

## Performance Considerations

- **Filesystem Performance:** Running Sail projects on the WSL2 ext4 filesystem yields 3-5x faster `composer install` and `npm install` compared to NTFS. Always use `~/projects/` not `/mnt/c/Users/.../projects/`.
- **Memory Allocation:** Default WSL2 memory limit is 50% of host RAM or 8GB (whichever is lower). Set `.wslconfig` memory=4GB-8GB for Sail; leaving unlimited causes the VM to consume all available RAM under load.
- **Docker Performance:** Docker containers inside WSL2 have near-native performance; there is no additional virtualization layer beyond the WSL2 VM. CPU-bound tasks (PHPStan, Pest tests) are within 5% of native Linux.
- **Startup Time:** WSL2 cold boot: 2-5 seconds. Docker Desktop daemon start: 10-30 seconds. Sail environment start: 30-60 seconds (after initial build).
- **Shutdown:** `wsl --shutdown` in PowerShell frees all WSL2 resources; useful when memory pressure is high.

## Production Considerations

- **Development Only:** WSL2 is a development environment; never run production workloads in WSL2. Deploy to Linux servers (Forge, Vapor, dedicated).
- **Forge Deployment:** Code that works on WSL2 + Sail deploys identically to Forge (both use Ubuntu + Nginx + PHP-FPM + MySQL/PostgreSQL + Redis).
- **CI/CD Parity:** CI runners (GitHub Actions, GitLab CI) use Linux runners; WSL2 approximates this closely. Any Linux-specific scripts tested in WSL2's bash environment behave identically in CI.
- **Environment Variable Handling:** WSL2 inherits some Windows environment variables; use `.env` files explicitly in Laravel projects to avoid cross-platform variable conflicts.

## Common Mistakes

- **Storing projects on Windows drive:** Placing Laravel projects at `C:\Users\me\projects\` and accessing via `/mnt/c/Users/me/projects/`; Docker bind mount performance is 5-10x slower, causing Composer/NPM operations to timeout
- **Not configuring .wslconfig:** Running WSL2 with default memory limits (50% of RAM); WSL2 consumes too much memory, slowing Windows
- **Running PHP natively instead of Sail:** Installing PHP directly in WSL2 instead of using Sail; inconsistent PHP versions across the team
- **Mixing Windows and WSL2 tools:** Using `git` from Windows for a project in WSL2 filesystem; line ending and permission issues
- **Forgetting WSL shutdown:** Leaving WSL2 running indefinitely; memory stays allocated even when not developing

## Failure Modes

- **File Permission Issues:** Git clone inside WSL2 sets Linux permissions; editing from Windows apps (Notepad++) may strip executable permissions. Mitigate: use VS Code with Remote - WSL extension for all editing.
- **Line Ending Conflicts:** Git configured with `autocrlf=true` on Windows causes CRLF in WSL2. Mitigate: `git config core.autocrlf false` in WSL2; use `.gitattributes` to manage line endings.
- **Docker Desktop Resource Exhaustion:** WSL2 + Docker Desktop consumes 6-12GB RAM under load. Mitigate: limit memory in `.wslconfig`; monitor with `wsl --status` and `docker system df`.
- **Network Disconnects:** Windows VPN or network changes can interrupt WSL2 networking. Mitigate: `wsl --shutdown` and restart; Docker Desktop may need restart after network change.
- **WSL2 Disk Space Full:** WSL2 VHDX file grows unbounded and fills the Windows drive. Mitigate: compact VHDX via `diskpart`; set `.wslconfig` `autoMemoryReclaim=gradual` in Windows 11.

## Ecosystem Usage

- **Laravel Sail:** Primary Laravel tool running inside WSL2; full Docker Compose stack with PHP, MySQL, Redis, etc.
- **VS Code:** Remote - WSL extension for seamless editing; PHP Intelephense, Laravel extensions run inside WSL2
- **Windows Terminal:** Multi-tab terminal with Ubuntu, PowerShell, and Command Prompt profiles
- **Laravel Forge:** WSL2 development parity with Forge's Ubuntu production servers ensures consistent behavior
- **Docker Desktop:** Manages WSL2 Docker integration; provides GUI for container management and resource monitoring

## Related Knowledge Units

- laravel-sail
- docker-compose-for-laravel
- devcontainer-configuration
- environment-file-management
- xdebug-configuration-docker

## Research Notes

- WSL2 was introduced in Windows 10 version 2004; it replaced WSL1 which used a translation layer (slower for Docker)
- Docker Desktop requires a paid license for commercial use (large enterprises); teams affected can run Docker Engine directly inside WSL2
- Windows 11 includes improvements to WSL2 including `wsl --manage` for per-distro resource limits and `autoMemoryReclaim`
- The `wsl2` kernel is updated via Windows Update; custom kernels can be compiled and specified in `.wslconfig`
- Cross-filesystem performance penalty (Linux apps accessing Windows files) is a common source of frustration; the rule "project files in WSL2, only data exchange via /mnt/c/" avoids most issues
