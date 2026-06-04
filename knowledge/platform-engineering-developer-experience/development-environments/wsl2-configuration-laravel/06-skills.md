# Skill: Configure WSL2 for Laravel Development

## Purpose
Set up and optimize Windows Subsystem for Linux 2 (WSL2) for Laravel development with Docker-based tooling like Laravel Sail, ensuring optimal filesystem performance and proper tool integration.

## When To Use
- Laravel development on Windows with Sail/Docker
- Teams with Windows developers needing consistent setup
- Setting up a new development machine

## When NOT To Use
- Native Linux or macOS development (WSL2 is Windows-specific)
- Projects not using Docker (native PHP on Windows may be simpler)

## Prerequisites
- Windows 10/11 with WSL2 enabled
- Docker Desktop with WSL2 backend
- VS Code with Remote - WSL extension

## Inputs
- `.wslconfig` — WSL2 configuration
- Windows Terminal settings

## Workflow

1. **Install WSL2:** Run `wsl --install -d Ubuntu` in PowerShell as Administrator. This installs WSL2 and Ubuntu distro. Reboot if required.

2. **Configure .wslconfig:** Create `.wslconfig` in `%USERPROFILE%` with memory limit: `[wsl2] memory=8GB processors=4`. Prevents WSL2 VM from consuming all system RAM.

3. **Store Projects on WSL2 Filesystem:** Create projects at `~/projects/` inside WSL2 (ext4 filesystem). Do NOT use `/mnt/c/Users/` (NTFS) — Docker I/O is 3-5x slower on NTFS bind mounts.

4. **Install Docker Desktop with WSL2 Backend:** In Docker Desktop Settings → Resources → WSL Integration, enable integration with your Ubuntu distro. This allows Docker commands from within WSL2.

5. **Configure VS Code Remote - WSL:** Install the Remote - WSL extension. Open projects via `code ~/projects/my-app` from within WSL2 terminal. This avoids file permission and line-ending issues.

6. **Use Windows Terminal:** Install Windows Terminal for the best terminal experience. Set Ubuntu as the default profile for Laravel work.

7. **Use Sail Inside WSL2:** Don't install PHP natively on the WSL2 system. Use Sail to maintain environment consistency and avoid version conflicts.

8. **Shutdown WSL2 When Not In Use:** Run `wsl --shutdown` from PowerShell when not developing to free up memory. WSL2 VM consumes RAM even when idle.

## Validation Checklist

- [ ] WSL2 Ubuntu distro installed and running
- [ ] `.wslconfig` configured with memory limit
- [ ] Projects stored on WSL2 filesystem (not `/mnt/c/`)
- [ ] Docker Desktop WSL2 backend enabled
- [ ] VS Code Remote - WSL works
- [ ] Sail commands run correctly from WSL2
- [ ] Windows Terminal configured with Ubuntu profile

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Projects on NTFS | Docker I/O extremely slow (10x slower); store in WSL2 filesystem |
| Out of memory | WSL2 consumes all RAM; configure memory limit in `.wslconfig` |
| File permission issues | Editing from Windows apps; use VS Code Remote - WSL |
| Docker not accessible | WSL2 integration not enabled in Docker Desktop |

## Decision Points

- **Use for Laravel development on Windows** with Sail/Docker
- **Not applicable for native Linux or macOS** — WSL2 is Windows-specific
- **Store projects in WSL2 ext4 filesystem** — `~/projects/` not `/mnt/c/Users/`

## Performance/Security Considerations

- **Filesystem performance:** ext4 (WSL2) is 3-5x faster than NTFS for Docker bind mounts
- **Memory management:** Configure `.wslconfig` memory limit; shutdown WSL2 when not in use
- **VS Code Remote - WSL:** Essential for proper file permissions and line endings

## Related Rules

- WSL-RULE-001: Store projects in WSL2 ext4 filesystem
- WSL-RULE-002: Configure .wslconfig
- WSL-RULE-003: Use VS Code Remote - WSL
- WSL-RULE-004: Use Windows Terminal
- WSL-RULE-005: Use Sail inside WSL2
- WSL-RULE-006: Shutdown WSL2 when not in use

## Related Skills

- Configure Laravel Sail
- Set Up Docker Compose for Laravel
- Configure Devcontainer for Laravel

## Success Criteria

- Sail runs with native Linux performance on Windows
- Docker I/O is fast (projects on WSL2 filesystem, not NTFS)
- Memory usage is controlled via `.wslconfig`
- VS Code integrates seamlessly with WSL2
