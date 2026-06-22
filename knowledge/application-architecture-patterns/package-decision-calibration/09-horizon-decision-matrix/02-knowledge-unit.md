# Metadata

Domain: Application Architecture Patterns
Subdomain: Package Decision Calibration
Knowledge Unit: Laravel Horizon decision matrix
Difficulty Level: Intermediate
Last Updated: 2026-06-22

---

# Executive Summary

Laravel Horizon provides a production-ready queue monitoring dashboard and Redis queue management. It fits for Redis-backed queue systems needing visibility. It may not fit when using SQS/Beanstalkd, when the team already uses a centralized monitoring platform, or when Redis overhead is unacceptable.
