# KU-03-MULTI-REGION-DATABASE: Multi-Region Database

## Metadata
- **ID**: KU-03-MULTI-REGION-DATABASE
- **Subdomain**: Multi-Region & Global Cost
- **Topic**: Multi-Region Database
- **Source**: Multi-Region & Global Cost, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Multi-region database strategies enable low-latency reads for global users and disaster recovery across regions. For Laravel applications, Aurora Global Database provides a single writer region with up to 5 secondary read-only regions, replicating at the storage layer with ~1 second lag. The key cost tradeoff: Aurora Global Database adds no per-GB replication cost but requires at least one instance per region. Alternatives include RDS cross-region replicas (lower cost for single-table replication) and application-level replication (complex but flexible).

## Core Concepts
- **Aurora Global Database**: 1 primary region + up to 5 secondary regions; storage-layer replication; <1s lag
- **Aurora Global Database cost**: Pay for instances in each region + storage (shared); no per-GB replication fee
- **RDS cross-region read replica**: MySQL/PostgreSQL replicas in another region; async binlog/WAL replication
- **RDS replica cost**: Full instance cost in each region + data transfer ($0.02/GB for cross-region replication traffic)
- **Application-level replication**: Write to local DB per region; async event-based sync between regions
- **Multi-region writes**: Conflict resolution (last-writer-wins, CRDT, or manual); complex to implement
- **Disaster recovery**: Secondary region promotes to primary during failure; recovery time objective (RTO) varies

## Mental Models
- Default: Aurora Global Database for global apps (single writer)
- Default: RDS cross-region replica for DR-only needs
- Never active-active writes; single writer + async readers
- Monitor replication lag across all regions

## Internal Mechanics
- Aurora Global replication lag: 0.5-1s typical (sub-second for most workloads)
- RDS cross-region replication lag: 1-5s typical (depends on instance size and data rate)
- Local region read latency: 1-5ms (same-region database query)
- Cross-region write latency: 50-200ms (synchronous write to primary region)
- Cache per region: 0.5ms (local Redis) vs 100ms (cross-region Redis)

## Patterns
- Use Aurora Global Database for read-heavy global apps
- Write locally, replicate asynchronously
- Set up DR with Aurora Global Database
- Use RDS cross-region replica for DR only
- Monitor replication lag
- Route read traffic per region

## Architectural Decisions
- Write region: us-east-1 (lowest cost, best service availability)
- Read regions: eu-west-1 (EU), ap-southeast-1 (Asia) if user base justifies
- Aurora Global: Primary cluster in us-east-1, secondary cluster in each read region
- Each region: Application servers connect to local Aurora reader endpoint (read-only)
- Only primary region has write access; secondary regions are promoted only during failover
- Cache (Redis) per region: local caching in each region (not shared)
- Queue (SQS) per region: event bus for cross-region data sync

## Tradeoffs
**When To Use:**
- Aurora Global Database: Global Laravel app needing <100ms read latency worldwide; 1 writer region with readers
- RDS cross-region replica: Compliance (cross-region backup); DR with RTO < 1 hour; lower budget
- Application-level replication: Active-active multi-region writes; complex conflict resolution needed
- Read replicas per region: Select-heavy app with users distributed globally
- Aurora Global Database DR: <1 minute failover; no data loss (RPO=0 at storage layer)

**When NOT To Use:**
- Multi-region for single-region users: Unnecessary cost (instances in idle regions)
- RDS cross-region replicas for high-write apps: Replication bandwidth may not keep up; lag grows
- Application-level replication for low-traffic: Complexity not justified; single region with CloudFront is sufficient
- Aurora Global Database for small data (<50GB): Overhead of managing multiple regional instances
- Synchronous multi-region writes: Use async replication; sync writes add latency and coupling

## Performance Considerations
- Aurora Global replication lag: 0.5-1s typical (sub-second for most workloads)
- RDS cross-region replication lag: 1-5s typical (depends on instance size and data rate)
- Local region read latency: 1-5ms (same-region database query)
- Cross-region write latency: 50-200ms (synchronous write to primary region)
- Cache per region: 0.5ms (local Redis) vs 100ms (cross-region Redis)

## Production Considerations
- Cross-region replication data encrypted (AWS backbone + KMS)
- Each region's database has separate security groups
- IAM roles for cross-region replication (Aurora manages automatically)
- Data residency: ensure user data stays in required region
- Encryption keys (KMS) per region for data isolation

## Common Mistakes
- **Multi-region writes without conflict resolution**: Two regions both accepting writes to same records (Cause: "each region should be independent" assumption; Consequence: data conflicts, last-writer-wins corrupts data; Better: single writer region, async replication to others)
- **Using RDS cross-region replicas for global reads**: RDS replicas cost instances + $0.02/GB replication; heavy read load doubles cost (Cause: RDS replicas are cheaper upfront; Consequence: paying $500+/month in replication data transfer; Better: Aurora Global Database (no per-GB replication fee))
- **Cross-region database for all data**: Replicating 100% of data to all regions when only 20% is read globally (Cause: "replicate everything" approach; Consequence: paying for storage in multiple regions for unused data; Better: replicate only globally-accessed data; keep regional data local)

## Failure Modes
- **Active-active multi-region databases**: Both regions accepting writes; conflict resolution is extremely complex
- **Synchronous cross-region writes**: Every write waits for confirmation from other regions (latency penalty)
- **No DR testing**: Multi-region database configured but never tested failover; DR fails during real disaster
- **Same instance size in all regions**: Read-only regions may need smaller instances than writer

## Ecosystem Usage
- **Global Laravel SaaS**: Aurora Global: Writer in us-east-1 (r7g.xlarge), Readers in eu-west-1 (r7g.large) and ap-southeast-1 (r7g.large); Route53 directs API reads to local reader; async write to us-east-1
- **DR-only**: RDS cross-region replica in us-west-2 from us-east-1 primary; smaller instance (r7g.large vs r7g.xlarge); promoted only during DR
- **Application-level replication**: Each region writes to local PostgreSQL; events (via SQS cross-region) replicate non-conflicting data; user-specific data stays in home region

## Related Knowledge Units
- Data Transfer Costs (ku-01)
- Global Load Balancing (ku-04)
- Region Selection (ku-02)
- Read Replicas Cost

## Research Notes
Derived from Multi-Region & Global Cost, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.