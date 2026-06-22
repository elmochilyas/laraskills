# Metadata

Domain: Application Architecture Patterns
Subdomain: Package Decision Calibration
Knowledge Unit: Laravel Cashier decision matrix
Difficulty Level: Advanced
Last Updated: 2026-06-22

---

# Executive Summary

Laravel Cashier is the default Stripe subscription integration for Laravel. It fits when plans map cleanly to Stripe products/prices. It does not fit for marketplace payouts, complex metered billing, or when multiple payment providers are required. This matrix teaches the full decision calculus with escape hatches.
