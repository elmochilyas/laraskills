| Metadata | |
|---|---|
| KU ID | K055 |
| Subdomain | vector-similarity-search |
| Topic | Qdrant Edge |
| Source | Qdrant Docs |
| Maturity | New |

## Overview

Qdrant Edge is an embedded vector search library that runs Qdrant directly within the application process — no separate server needed. It bundles Qdrant's search engine as a library that can be embedded in mobile apps, IoT devices, desktop applications, and edge deployments. Qdrant Edge is ideal for offline-first and low-latency vector search scenarios.

## Core Concepts

- **Embedded Mode**: Qdrant runs in-process as a library, not a separate server.
- **No Network Dependency**: All search operations happen locally within the application.
- **Limited Scale**: Designed for datasets up to ~1M vectors in embedded mode.
- **Same API**: Qdrant Edge uses the same API as the server version.
- **Rust Native**: The library is written in Rust, with bindings available for various languages.

## When To Use

- Mobile applications needing local vector search (no network required)
- IoT and edge devices with limited connectivity
- Desktop applications with embedded search functionality
- Offline-first applications where vector search must work without internet
- Low-latency scenarios where network round-trips are unacceptable

## When NOT To Use

- Large-scale vector search (>1M vectors) needing distributed infrastructure
- Applications already running Qdrant server (no benefit from Edge)
- Cloud-only deployments with reliable network connectivity
- Scenarios requiring multi-node replication and HA

## Best Practices

1. **Design for offline-first**: Qdrant Edge works without network — design your app accordingly.
2. **Plan sync strategy**: For mobile/edge, sync vector data during connectivity windows.
3. **Limit dataset size**: Qdrant Edge is optimized for <1M vectors.
4. **Monitor local storage**: Embedded vector indexes consume local disk space.
5. **Test on target hardware**: Performance varies significantly by device capabilities.

## Architecture Guidelines

- Qdrant Edge is typically embedded in native applications (mobile, desktop, IoT).
- For Laravel, Qdrant Edge may run as a sidecar process for local vector search.
- Same collection and point APIs as Qdrant server — code is portable.
- Data can be synced between Qdrant Edge instances and a central Qdrant server.

## Performance Considerations

- No network latency — search is as fast as local memory/disk access.
- <1ms query latency for datasets fitting in memory.
- Performance scales with device hardware (RAM, CPU, storage speed).
- Index building consumes local CPU resources — schedule during idle time.

## Related Topics

- K048 (Qdrant vector search)
- K053 (Qdrant FastEmbed)
- K042 (pgvector HNSW / IVFFlat indexing)

## AI Agent Notes

- Qdrant Edge enables vector search in environments without server infrastructure.
- Limited to ~1M vectors — use Qdrant server for larger datasets.
- For agents: design for offline-first; plan sync between Edge and server; test on actual target hardware.

## Verification

- [ ] Qdrant Edge integrated into target application
- [ ] Local vector search works offline
- [ ] Dataset size within Edge limits
- [ ] Sync strategy designed (mobile/edge + server)
- [ ] Performance tested on target hardware
