# Skill: Run Octane Alongside Reverb for HTTP Acceleration + WebSocket

## Purpose
Run Laravel Octane (HTTP acceleration) and Reverb (WebSocket server) as separate services on shared infrastructure, understanding their independence and coexistence patterns.

## When To Use
- High-performance Laravel deployments using both Octane (HTTP) and Reverb (WebSocket)
- FrankenPHP users wanting integrated HTTP + WebSocket from a single binary
- Applications needing sub-50ms HTTP response times alongside real-time broadcasting

## When NOT To Use
- Standard PHP-FPM deployments (Octane adds unnecessary complexity)
- Applications not needing HTTP acceleration
- Simple deployments where performance requirements are modest

## Prerequisites
- Laravel Octane installed and configured
- Reverb installed and configured
- Supervisor or equivalent process manager

## Inputs
- Octane Supervisor configuration
- Reverb Supervisor configuration
- Memory monitoring setup
- FrankenPHP version (if applicable)

## Workflow
1. Create separate Supervisor programs for Octane and Reverb
2. Configure distinct ports: Octane on 8000, Reverb on 8080
3. Set separate memory limits and stopwaitsecs for each
4. Test broadcast event serialization under Octane before production
5. Monitor combined memory footprint of Octane workers + Reverb connections
6. If using FrankenPHP, verify embedded Reverb version is v1.7.0+
7. Ensure broadcasting code works unchanged under Octane
8. Restart Octane and Reverb independently during deployments

## Validation Checklist
- [ ] Octane and Reverb run as separate Supervisor programs
- [ ] Broadcast events tested under Octane before production
- [ ] Octane sandboxing compatible with broadcast dispatch
- [ ] Memory limits configured for both services
- [ ] FrankenPHP embedded Reverb version verified (v1.7.0+)
- [ ] Broadcasting code works under Octane

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Broadcast events fail under Octane | Serialization issue with persistent memory | Test broadcast events under octane:start |
| Combined OOM kills | Octane workers + Reverb connections exceed RAM | Monitor combined memory usage |
| FrankenPHP still vulnerable | Embedded Reverb outdated | Verify FrankenPHP's Reverb version is 1.7.0+ |
| Cannot restart services independently | Both in same Supervisor program | Split into separate programs |

## Decision Points
- **Process management**: Separate Supervisor programs for independent lifecycle management
- **Memory allocation**: Octane workers hold app in memory permanently; Reverb connections add per-connection overhead
- **FrankenPHP vs standalone**: FrankenPHP shares process space; standalone gives independent control

## Performance/Security Considerations
- Octane reduces HTTP response latency including broadcast dispatch but does not affect queue processing
- Queue workers are still needed — Octane does not change the broadcasting pipeline
- FrankenPHP hybrid mode may reduce Redis pub/sub latency
- Both services should run under separate users with minimal privileges

## Related Rules (from 05-rules.md)
- Always Run Octane and Reverb as Separate Supervisor Programs
- Never Assume Octane Replaces Reverb
- Always Test Broadcast Event Serialization Under Octane
- Always Monitor Combined Memory Usage
- Always Verify FrankenPHP's Embedded Reverb Version

## Related Skills
- Manage Reverb with Supervisor for Production Process Management
- Patch and Protect Against CVE-2026-23524 (Reverb Redis Deserialization)

## Success Criteria
- Octane handles HTTP requests with sub-50ms response times
- Reverb manages WebSocket connections independently
- Combined memory stays within available RAM
- Broadcasting works correctly under Octane
- FrankenPHP embedded Reverb is at patched version
