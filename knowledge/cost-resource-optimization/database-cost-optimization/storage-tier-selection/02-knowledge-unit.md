# KU-04-STORAGE-TIER-SELECTION: Storage Tier Selection

## Metadata
- **ID**: KU-04-STORAGE-TIER-SELECTION
- **Subdomain**: Database Cost Optimization
- **Topic**: Storage Tier Selection
- **Source**: Database Cost Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Database storage tier selection (EBS gp3, io2, or Aurora storage) directly impacts both cost and performance. For Laravel applications, RDS/Aurora storage costs $0.10-0.25/GB/month plus I/O charges. Choosing the right storage type and size prevents overpaying for unused IOPS or undersizing for peak demand. Aurora's self-healing storage auto-scales but has hidden I/O costs.

## Core Concepts
- **EBS gp3**: $0.08/GB/month, 3000 IOPS baseline, 125 MB/s (sufficient for 90% of Laravel apps)
- **EBS io2**: $0.125/GB/month + $0.065/provisioned IOPS (for high-I/O workloads >16000 IOPS)
- **Aurora storage**: $0.10/GB/month (auto-scaling to 128TB); I/O cost $0.20/million requests
- **Provisioned IOPS**: gp3 includes 3000 IOPS; extra IOPS cost $0.005/IOPS/month
- **Storage auto-scaling**: RDS can auto-scale storage; but once scaled, it never shrinks
- **Allocated vs used storage**: Pay for allocated storage, not used; over-provisioning is waste

## Mental Models
- Default: gp3 for MySQL/PostgreSQL; Aurora for multi-AZ/replication needs
- Always monitor Aurora I/O costs; set billing alerts
- Storage auto-scaling with max cap

## Internal Mechanics
- gp3 baseline 3000 IOPS: Handles ~1500 queries/second for typical Laravel query
- gp3 burst: Up to 16000 IOPS for 30 minutes (with burst credits)
- Aurora: 3-6x more IOPS than equivalent gp3 (depends on cluster size)
- io2: Consistent IOPS regardless of volume size (no bursting)
- Storage queue depth: Should be < 10; higher indicates IOPS bottleneck
- EBS-optimized instances: Required for consistent EBS performance

## Patterns
- Use gp3 as default for MySQL/PostgreSQL
- Set storage allocation to 20% above current usage
- Monitor I/O credit balance for gp3
- Choose Aurora for multi-AZ + replication needs
- Watch Aurora I/O costs
- Use RDS Storage Auto Scaling with max cap

## Architectural Decisions
- RDS MySQL: gp3, 100GB minimum (to get 3000 IOPS baseline), scale as needed
- Aurora MySQL/PostgreSQL: Starts at 10GB, auto-scales; monitor I/O costs monthly
- Always enable deletion protection on production databases
- Use provisioned IOPS only if CloudWatch shows IOPS consistently > 3000
- Separate storage for logs/system data from database data volume
- Enable Performance Insights to track storage-bottleneck queries

## Tradeoffs
**When To Use:**
- gp3: Default for all RDS MySQL/MariaDB/PostgreSQL instances; sufficient for most Laravel apps
- io2: High-transaction databases (>16000 IOPS sustained); financial systems, real-time analytics
- Aurora: When you need auto-scaling storage, 6-replica reads, or Aurora Serverless
- Provisioned IOPS: When gp3's 3000 IOPS is insufficient (monitor ReadIOPS/WriteIOPS)
- Storage auto-scaling: When you don't want to monitor disk usage manually (but set max limit)

**When NOT To Use:**
- io2 for typical Laravel: E-commerce, CMS, or SaaS apps rarely exceed 3000 IOPS; gp3 is sufficient
- gp2 instead of gp3: gp3 has same price as gp2 with 30x baseline IOPS; always choose gp3
- Aurora for single-AZ: Aurora's strength is replication; if not using replicas, RDS MySQL is cheaper
- Over-provisioning storage: Allocating 500GB when 50GB is used; costs $45/month waste
- Aurora I/O-heavy workloads: High I/O apps (logging, metrics) can have $1000+/month Aurora I/O charges

## Performance Considerations
- gp3 baseline 3000 IOPS: Handles ~1500 queries/second for typical Laravel query
- gp3 burst: Up to 16000 IOPS for 30 minutes (with burst credits)
- Aurora: 3-6x more IOPS than equivalent gp3 (depends on cluster size)
- io2: Consistent IOPS regardless of volume size (no bursting)
- Storage queue depth: Should be < 10; higher indicates IOPS bottleneck
- EBS-optimized instances: Required for consistent EBS performance

## Production Considerations
- Enable EBS encryption by default (enforce at account level)
- Aurora storage is encrypted at rest by default
- Snapshot encryption uses KMS; cross-region snapshot sharing requires KMS key sharing
- Disable public accessibility on database instances
- Deletion protection prevents accidental database deletion

## Common Mistakes
- **Using gp2 instead of gp3**: Default RDS storage type is gp2 in many configurations (Cause: AWS console defaults; Consequence: 30x lower baseline IOPS at same price; Better: specify gp3 in launch/restore configuration)
- **Under-estimating Aurora I/O costs**: Aurora bill shows $200/month I/O charges on $100/month compute (Cause: not monitoring Aurora I/O during development; Consequence: surprise bills; Better: estimate I/O cost: total queries * avg I/O per query * $0.20/1M; use Aurora Serverless v2 for I/O-sensitive workloads)
- **Over-provisioning storage "just in case"**: Allocating 1TB for a 10GB database (Cause: "storage is cheap" mindset; Consequence: $100/month vs $1/month for appropriate size; Better: start at 50-100GB, enable auto-scaling with max cap)

## Failure Modes
- **gp3 with 0 IOPS baseline**: gp3 allows modification of baseline IOPS lower than 3000; never reduce below 3000
- **io2 for all databases**: Using highest tier unnecessarily; io2 adds 50%+ cost with no benefit for typical apps
- **Aurora without I/O monitoring**: Ignoring I/O cost until bill arrives; I/O can dominate total cost
- **Manual storage scaling**: SSH and resize volume instead of enabling auto-scaling

## Ecosystem Usage
- **Laravel app (10K req/day, 50GB data)**: RDS gp3 100GB, 3000 IOPS baseline, no provisioned IOPS = ~$8/month
- **High-traffic app (1M req/day, 200GB data)**: Aurora, 200GB auto-scaling, 2 reader instances, monitor I/O cost
- **Compliance-heavy app (500GB, high writes)**: RDS io2 500GB, 10000 provisioned IOPS = ~$712/month (necessary for high write throughput)

## Related Knowledge Units
- Data Archival (ku-03)
- Read Replicas Cost (ku-05)
- Serverless Database (ku-07)

## Research Notes
Derived from Database Cost Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.