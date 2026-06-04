---
## Rule Name
Default to gp3 Storage for All RDS Instances

## Category
Performance

## Rule
Always specify `gp3` as the storage type for RDS MySQL/MariaDB/PostgreSQL instances. Never use `gp2` for new deployments.

## Reason
gp3 provides 3000 IOPS baseline at the same price as gp2's variable IOPS. For most Laravel apps, gp3 is sufficient and eliminates IOPS credit exhaustion.

## Bad Example
Launching an RDS instance with default gp2 storage. At 100GB, gp2 provides only 300 IOPS baseline. Burst credits deplete under sustained load, causing throttling.

## Good Example
Launching with gp3 storage. 100GB gp3 has 3000 IOPS baseline — 10x the baseline of gp2 at the same $8/month.

## Exceptions
When your workload consistently exceeds 16000 IOPS (monitored via CloudWatch), evaluate io2 Block Express.

## Consequences Of Violation
gp2's low baseline IOPS cause throttling under sustained query load. This forces premature upgrades to larger instances or io2 — both significantly more expensive.

---
## Rule Name
Set Storage Allocation to 20% Above Current Usage

## Category
Maintainability

## Rule
Allocate database storage at 20% above current used storage. Monitor `FreeStorageSpace` and scale proactively when it drops below 10%.

## Reason
Storage under-allocation triggers auto-scaling that takes 5-15 minutes. During that window, the database may run out of space and become read-only.

## Bad Example
Allocating 50GB for a 48GB database. Any data growth spike causes "disk full" errors. Emergency resize takes 15 minutes of downtime.

## Good Example
Allocating 100GB for an 80GB database. 20GB headroom covers 6+ months of growth. Auto-scaling is configured with a max cap as a safety net.

## Exceptions
When using Aurora Serverless v2 with auto-scaling storage enabled (Aurora handles this automatically).

## Consequences Of Violation
Emergency storage resizing causes downtime (RDS: 5-30 minutes). Repeated emergency resizes increase operational risk.

---
## Rule Name
Monitor Aurora I/O Costs Monthly

## Category
Cost Management

## Rule
Set a billing alert for Aurora I/O charges. Review I/O cost as a percentage of total Aurora spend monthly. Investigate if I/O cost exceeds compute cost.

## Reason
Aurora charges $0.20/million I/O requests. High-volume apps (logging, audit trails, heavy INSERT workloads) can see I/O costs exceed compute costs.

## Bad Example
$200/month Aurora compute bill with $300/month I/O charges. No one noticed because I/O isn't tracked separately. The app is paying 2.5x what it should.

## Good Example
Monthly review shows I/O cost is $50 on a $200 Aurora bill. I/O is 20% of spend — acceptable. Alert set at $0.20/1M I/O.

## Exceptions
No common exceptions. Aurora I/O is a variable cost that must be actively managed.

## Consequences Of Violation
Aurora I/O costs silently grow to dominate the database bill. A $500/month compute cluster can have $2000/month in I/O charges.

---
## Rule Name
Enable RDS Storage Auto-Scaling With a Maximum Cap

## Category
Reliability

## Rule
Enable RDS storage auto-scaling on all production instances. Set a maximum storage cap to prevent runaway costs.

## Reason
Auto-scaling prevents "disk full" emergencies. A maximum cap ensures costs remain bounded if auto-scaling triggers unexpectedly.

## Bad Example
Auto-scaling enabled without cap. A misconfigured script generates 5TB of data. Storage auto-scales to 5TB at $500/month before anyone notices.

## Good Example
Auto-scaling enabled with cap at 500GB (3x current usage). If storage approaches 500GB, an alert fires for manual review.

## Exceptions
When using Aurora (auto-scaling is built-in and cannot be disabled).

## Consequences Of Violation
Without auto-scaling, disk-full events cause production outages. Without a cap, a runaway process can multiply storage costs overnight.

---
## Rule Name
Use Provisioned IOPS Only When gp3 Consistently Exceeds 3000 IOPS

## Category
Performance

## Rule
Monitor `ReadIOPS` and `WriteIOPS` CloudWatch metrics for 2 weeks. Only upgrade to io2 with provisioned IOPS if average sustained IOPS exceeds 3000.

## Reason
io2 Block Express costs 50%+ more than gp3. Most Laravel applications never exceed 3000 IOPS and gain nothing from io2.

## Bad Example
Using io2 with 5000 provisioned IOPS for a Laravel blog. The database averages 500 IOPS. Monthly storage cost: $200 vs $30 for gp3.

## Good Example
gp3 100GB at $8/month. CloudWatch shows average IOPS = 1200, peak = 2800. No upgrade needed. Saved $192/month vs io2.

## Exceptions
Financial systems, real-time analytics, or high-frequency trading systems with sustained IOPS > 16000.

## Consequences Of Violation
Paying 2-5x more for storage performance that the application never uses. io2's additional cost compounds across multiple instances and replica regions.

---
## Rule Name
Enable EBS Encryption by Default

## Category
Security

## Rule
Enforce EBS encryption at the AWS account level for all RDS instances. Never launch an unencrypted database instance.

## Reason
Unencrypted database instances expose data at rest. Encryption adds zero performance overhead and zero additional cost with gp3/io2.

## Bad Example
Launching RDS without checking the encryption checkbox. Database contains PII data at rest in plaintext. A stolen snapshot exposes all user data.

## Good Example
Account-level EBS encryption enforcement. Every new RDS instance is encrypted by default. Snapshot sharing requires KMS key permissions.

## Exceptions
No common exceptions. All production databases should be encrypted.

## Consequences Of Violation
Data at rest is unencrypted. Compliance violations (PCI, HIPAA, GDPR). Data exposure risk if snapshots are shared or stolen.

---
## Rule Name
Separate Storage for Logs and System Data From Database Volume

## Category
Architecture

## Rule
Do not store application logs, system data, or temporary files on the database storage volume. Use a separate EBS volume or S3.

## Reason
Database storage is sized and priced for database workloads. Logs and system files consume IOPS and capacity that should be reserved for queries.

## Bad Example
MySQL error log and slow query log on the same gp3 volume as the data directory. Log writes consume 10% of IOPS capacity.

## Good Example
Database data on gp3. Logs stream to CloudWatch Logs with 30-day retention. Temporary files use a dedicated EBS volume or `tmpdir` on an instance store.

## Exceptions
Single-instance dev environments where cost of separate volumes exceeds the benefit.

## Consequences Of Violation
Log I/O competes with database I/O, reducing effective query throughput. Storage fills faster from log growth, triggering unnecessary auto-scaling.
