# Knowledge Unit: 7-14 GTID-Based Replication

## Metadata

- **ID:** data-storage-systems/replication/7-14-gtid-based-replication
- **Domain:** Data Storage Systems
- **Subdomain:** Replication
- **Slug:** data-storage-systems-replication-7-14-gtid-based-replication
- **Version:** 1.0.0
- **Maturity:** Generated
- **Status:** Published

## Executive Summary

Global Transaction Identifiers (GTID) uniquely identify each transaction committed on a MySQL/MariaDB server. GTID-based replication (`MASTER_AUTO_POSITION=1`) simplifies failover by eliminating the need to manually find binary log positions. Each transaction has a unique ID that tracks its execution across the replication topology. ---

