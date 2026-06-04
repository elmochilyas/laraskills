## Use gp3 EBS Volumes Exclusively
---
## Cost Optimization
---
Always use gp3 as the default EBS volume type for all Laravel servers; never use gp2 or magnetic volumes.
---
gp3 provides 3000 IOPS baseline at the same price as gp2's 100 IOPS/GB — a 30x performance improvement at zero cost increase.
---
Launch template specifies gp3 root volume at 20GB.
---
Using gp2 root volume because "it's the default in the launch template wizard."
---
Legacy launch templates not yet updated; migrate within 30 days.
---
30x lower baseline IOPS at the same price; unnecessary EBS performance bottlenecks.
---
## Right-Size EBS Volumes
---
## Cost Optimization
---
Always start with appropriately sized EBS volumes based on actual app requirements; monitor utilization for 30 days and adjust.
---
EBS costs $0.08/GB/month; provisioning 100GB when only 30GB is needed wastes $67/year per instance — multiplied across a fleet, this is thousands in unnecessary spend.
---
Root volume: gp3 20GB. Data volume: gp3 30GB. Monitor with CloudWatch alarm at 80% usage.
---
Provisioning 200GB for logs when actual usage is 5GB.
---
Applications with unpredictable storage growth (video processing, large file uploads).
---
Thousands of dollars in annual waste from unused provisioned storage.
---
## Separate Root and Data Volumes
---
## Architecture
---
Always use separate EBS volumes for OS (root) and application data; never store application data on the root volume.
---
Separate volumes prevent log or data file filling from crashing the OS; enable independent snapshot/resize of data without touching OS configuration.
---
Root: gp3 20GB (/). Data: gp3 30GB (/var/www). Log: gp3 10GB (/var/log).
---
Single 100GB root volume for OS + application + logs.
---
Tiny single-server deployments where separation cost exceeds benefit.
---
OS crash from full disk, coupled OS+data backup complexity, inability to resize independently.
---
## Configure Adequate Swap
---
## Reliability
---
Always configure swap space of 2x RAM or 2GB (whichever is higher) on all Laravel application servers.
---
PHP memory leaks or traffic spikes can exhaust RAM; swap provides a buffer for graceful process termination instead of immediate OOM kills that abort in-flight requests.
---
Configure swap in EC2 user data: `dd if=/dev/zero of=/swapfile bs=1M count=4096; chmod 600 /swapfile; mkswap /swapfile; swapon /swapfile`.
---
Running PHP-FPM without swap on EC2 with 2GB RAM.
---
Servers with NVMe instance store used as swap; non-PHP workloads with predictable memory usage.
---
OOM killer terminates PHP processes, 50x errors, application downtime during memory pressure.
---
## Automate AMI Creation
---
## Maintainability
---
Always use Packer or EC2 Image Builder for immutable server images; never manually configure servers via SSH.
---
Immutable deployments eliminate configuration drift, ensure every instance is identical, and enable instant rollback to a known-good AMI.
---
Packer build script installs PHP 8.3, Nginx, Supervisor; produces AMI used in Auto Scaling group.
---
SSH into a running instance, install packages, create an AMI from the "golden" instance.
---
Emergency hotfixes requiring immediate deployment; create automated AMI afterward.
---
Configuration drift, "works on my machine" issues, untestable server configurations, slow rollback.
