# Server Provisioning

## Metadata
- **ID**: KU-02-SERVER-PROVISIONING
- **Subdomain**: compute-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Server Provisioning
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Server provisioning configures the compute, storage, and network resources for Laravel applications. Efficient provisioning matches resources to workload requirements, eliminates waste from over-sized volumes and idle capacity, and uses automation to prevent configuration drift. Key decisions include EBS volume type (gp3 vs io2), swap configuration, and AMI lifecycle management.

## Core Concepts
- **EBS gp3**: Baseline 3000 IOPS + 125 MB/s throughput ($0.08/GB/month); default for most workloads
- **EBS io2**: Provisioned IOPS up to 64000 ($0.125/GB/month + $0.065/provisioned IOPS)
- **Instance store**: Ephemeral SSD attached to host; high performance, data lost on stop/termination
- **AMI lifecycle**: Fresh AMI per deployment (immutable); reduces configuration drift
- **Swap configuration**: Adequate swap prevents OOM under memory pressure
- **Storage over-provisioning**: Common waste; most Laravel apps use <50GB but provision 100GB+

## When To Use
- gp3: Default for all EBS volumes; sufficient for Laravel apps (database, app data, logs)
- io2: Only for high-performance databases (>16000 IOPS); not needed for typical Laravel
- Instance store: Cache layers, temp data; not for persistent storage
- gp3 with 3000 IOPS: 95%+ of Laravel workloads (PHP-FPM, artifacts, logs)
- Root volume: gp3 20-30GB for OS + PHP + application code

## When NOT To Use
- io2 for web servers: Web servers do not need provisioned IOPS; gp3 is sufficient and cheaper
- gp2 volumes: gp2 is same price as gp3 but lower baseline performance; always use gp3
- Provisioning >100GB without monitoring: Most Laravel apps need 30-50GB; over-provisioning costs $4-8/month per server unnecessarily
- Magnetic volumes (standard): Never use; 50x slower than gp3

## Best Practices
- **Use gp3 as default EBS volume**: Higher baseline performance than gp2 at same price; no IOPS provisioning needed (WHY: gp3 provides 3000 IOPS baseline vs gp2's 100 IOPS/GB; for a 30GB volume, gp3 gives 30x more IOPS at the same price)
- **Right-size EBS volumes**: Start with 20GB root + data volume sized to actual app requirements; monitor utilization for 30 days (WHY: EBS costs $0.08/GB/month; 100GB unused costs $96/year per instance; 30 instances = $2880/year waste)
- **Use separate volumes for data**: Root volume (OS) + data volume (application, logs, cache) (WHY: separate volumes prevent log filling from crashing OS; easier to snapshot/resize data volume independently)
- **Automate AMI creation**: Use Packer or EC2 Image Builder for immutable server images (WHY: immutable deployments ensure every instance is identical; prevents configuration drift and "works on my machine" issues)
- **Configure adequate swap**: 2x RAM or 2GB, whichever is higher (WHY: PHP memory leaks can OOM servers without swap; swap provides buffer for graceful degradation and process termination)

## Architecture Guidelines
- Root volume: gp3, 20GB (Linux + PHP-FPM + Nginx + monitoring agents)
- Data volume: gp3, size based on app profile (20-100GB), mount at /var/www or /data
- Log volume: gp3, 10-30GB, mount at /var/log
- AMI: Built weekly with security patches, tested in staging before prod
- Use lifecycle manager (DLM) for EBS snapshots: daily snapshots, retain 7 days, monthly retain 12 months

## Performance Considerations
- EBS gp3 baseline: 3000 IOPS, 125 MB/s; sufficient for 10000+ requests per instance
- EBS burst: gp3 can burst to 16000 IOPS if credits available (most Laravel workloads stay well under baseline)
- Snapshot performance: First snapshot is full copy (5-30 minutes); subsequent are incremental
- Instance store: 100-1000x faster than EBS; use for application cache (if non-persistent)

## Security Considerations
- Encrypt all EBS volumes with KMS (enforce at account level via SCP)
- Use IMDSv2 (disable IMDSv1) to prevent SSRF-based credential theft
- Harden AMI: remove unnecessary packages, disable root SSH, enforce SSH key-only auth
- Automate security patching: use AWS Systems Manager Patch Manager weekly
- Store secrets in Secrets Manager, not on instance disk or AMI

## Common Mistakes
1. **Using gp2 instead of gp3**: Defaulting to gp2 in launch templates (Cause: gp2 was default historically; Consequence: 30x lower baseline IOPS per GB at same price; Better: update launch templates to specify gp3)
2. **Over-provisioning disk "just in case"**: Provisioning 200GB for logs when actual usage is 5GB (Cause: "I'll grow into it" mentality; Consequence: paying $15/month for unused capacity; Better: start with 20GB, add a CloudWatch alarm at 80% usage, grow as needed)
3. **No swap configuration**: Running PHP-FPM without swap on EC2 (Cause: assumption that swap isn't needed; Consequence: OOM killer terminates PHP processes under memory pressure; Better: configure swap in instance user data or AMI)

## Anti-Patterns
- **Manual server provisioning**: SSH into instance to configure; creates snowflake servers
- **Instances with public IPs**: Putting web servers directly on public subnets (use ALB patterns)
- **Shared volumes across instances**: EBS cannot be attached to multiple EC2 instances (use EFS instead)
- **No backups on data volumes**: Running without EBS snapshots = data loss risk

## Examples
- **Standard web server**: gp3 root 20GB + gp3 data 30GB; packed AMI with PHP 8.3, Nginx, Supervisor; swap = 4GB
- **Database server**: gp3 root 20GB + gp3 data 100GB (database files); provisioned 5000 IOPS if needed
- **Worker server**: gp3 root 20GB + gp3 data 30GB (queue logs); instance store for temp job artifacts

## Related Topics
- VM Sizing (ku-01)
- PHP-FPM Tuning (ku-03)
- Octane Resource Usage (ku-05)

## AI Agent Notes
- Default: gp3 EBS volumes, right-size to actual usage
- Always recommend swap for PHP workloads
- Automate AMI builds with Packer

## Verification
- [ ] gp3 volumes used (not gp2)
- [ ] EBS volume sizes based on actual monitoring data
- [ ] Separate root and data volumes
- [ ] Swap configured on all application servers
- [ ] AMI creation automated (Packer/Image Builder)
- [ ] EBS encryption enabled with KMS
- [ ] EBS snapshots configured via DLM
