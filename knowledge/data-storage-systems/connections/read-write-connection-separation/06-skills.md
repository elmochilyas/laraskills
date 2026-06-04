# Skill: Configure Read/Write Connection Separation

## Purpose

Configure separate pool sizes for read and write connections with asymmetric sizing, sticky writes, read fallback, and differentiated health check thresholds.

## When To Use

- Applications with read replicas deployed
- High-traffic apps where read/write connection requirements differ
- Reporting or analytics workloads should not impact transactional writes
- Multi-region deployments with read replicas per region

## When NOT To Use

- Single-database deployments (no replicas)
- Applications where read/write ratio is near 1:1
- Simple apps where separate pools aren't justified

## Prerequisites

- Read replicas deployed and configured
- Understanding of pool architecture (10-2)
- Understanding of connection health checks (10-14)

## Inputs

- Read replica hostnames
- Primary hostname (write)
- Expected read/write traffic ratio
- Database max_connections

## Workflow (numbered steps)

1. Configure asymmetric pool sizes in `config/database.php`:
   ```php
   'mysql' => [
       'read' => [
           'host' => [env('DB_HOST_READ_1'), env('DB_HOST_READ_2')],
           'pool' => ['min' => 4, 'max' => 16],
       ],
       'write' => [
           'host' => env('DB_HOST_WRITE'),
           'pool' => ['min' => 2, 'max' => 4],
       ],
       'sticky' => true,
   ],
   ```
   - Read pool: 2–4× larger than write pool
   - Write pool: sized for peak write concurrency, not sustained load

2. Enable sticky writes:
   ```php
   'sticky' => true,
   ```
   - Ensures reads after a write go to the primary for the remainder of the request
   - Prevents stale-read-after-write bugs due to replication lag

3. Configure read fallback to write pool:
   - When all read replicas fail, reads fall back to the write connection
   - Degraded but functional — app continues serving read traffic

4. Differentiate health check thresholds:
   - Write pool: aggressive (1s timeout, retry 2×)
   - Read pool: lenient (3s timeout, retry 1×)

5. Tag connections by purpose:
   - `application_name = 'read|web'`
   - `application_name = 'write|web'`

6. Distribute read load across replicas:
   - Laravel cycles through hosts in the read array (round-robin)

## Validation Checklist

- [ ] Read and write connections have asymmetric pool configurations
- [ ] `sticky` is set to `true` for connections with read/write separation
- [ ] Read fallback to write connection is configured
- [ ] Health check timeouts differ between read (lenient) and write (aggressive)
- [ ] Connections are tagged by purpose in monitoring
- [ ] Read replica load is distributed across available hosts
- [ ] No stale-read incidents after deployment

## Common Failures

- Same pool config for read and write — copy-paste between arrays
- Sticky writes disabled — stale reads after writes
- No read fallback on replica failure — all reads fail when replicas are down
- Identical health checks — write fails too slowly, read fails too fast
- Read replicas in different regions with high latency — timeouts

## Decision Points

- Asymmetric pool sizing: read 2× vs 4× vs 10× write
- Sticky writes: enabled vs disabled (consistency vs performance)
- Read fallback: fall back to write vs return error
- ProxySQL routing vs Laravel read/write config

## Performance Considerations

- Read pool: 2–4× larger than write for typical web apps
- Write pool: sized for peak write concurrency
- Sticky writes add overhead (reads go to primary after writes)
- Read replica lag: 100ms–10s — stale read tolerance depends on requirements

## Security Considerations

- Read replicas may have different security requirements
- Write connection user should have minimal privileges (INSERT, UPDATE, DELETE)
- Sticky writes routing reads to primary is expected, not a security concern
- Tag read and write connections separately in audit logs

## Related Rules

- 10-9-1: Use Asymmetric Pool Sizing
- 10-9-2: Enable Sticky Writes

## Related Skills

- Configure Read/Write Config in Laravel
- Configure Load Balancing Across Replicas
- Handle Replica Failover

## Success Criteria

- Asymmetric pool sizing matches traffic patterns
- Sticky writes prevent stale-read bugs
- Read fallback handles replica failures gracefully
- Health check thresholds differentiate read vs write criticality
- Connection tags distinguish read vs write traffic in monitoring
