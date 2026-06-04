# Skills: Self-Hosted Analytics Platforms

## Skill: Plausible Self-Hosting and Laravel Integration
**Purpose:** Deploy and integrate Plausible analytics with a Laravel application.
**When to use:** Adding privacy-first, self-hosted analytics to a Laravel application.
**Steps:**
1. Deploy Plausible via Docker Compose (Plausible + PostgreSQL + Redis)
2. Configure reverse proxy (Nginx/Caddy) for tracking endpoint
3. Implement proxy routes in Laravel for `/js/script.js` and `/api/event`
4. Configure Plausible dashboard domain and admin user
5. Add tracking snippet to layout with proxy URL
6. Verify events appear in Plausible dashboard
7. Set up monitoring for Plausible server resources

## Skill: Matomo PHP SDK Integration
**Purpose:** Integrate Matomo analytics using the PHP SDK for server-side tracking.
**When to use:** Adding server-side analytics tracking with Matomo to a Laravel application.
**Steps:**
1. Deploy Matomo instance (Apache/Nginx + MySQL/MariaDB)
2. Install `matomo/matomo-php-tracker` package
3. Configure tracker with Matomo URL and site ID
4. Implement tracking in middleware for page views and events
5. Configure reverse proxy for tracking API
6. Implement custom dimensions for Laravel-specific data
7. Set up visitor console and heatmap tracking
