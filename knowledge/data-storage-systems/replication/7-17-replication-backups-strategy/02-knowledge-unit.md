# Knowledge Unit: 7-17 Replication Backups Strategy

## Metadata

- **ID:** data-storage-systems/replication/7-17-replication-backups-strategy
- **Domain:** Data Storage Systems
- **Subdomain:** Replication
- **Slug:** data-storage-systems-replication-7-17-replication-backups-strategy
- **Version:** 1.0.0
- **Maturity:** Generated
- **Status:** Published

## Executive Summary

Coordinating backups with replication is critical for data protection. Best practice is running backups on replicas to avoid I/O impact on the primary. Backups must record GTID/binlog positions for point-in-time recovery and the ability to provision new replicas from the backup. ---

