# Anti-Patterns: Dashboard Widget Data Provider Pattern

## Query Logic in Templates
The Blade template contains `$revenue = Order::whereDate(...)->sum('total')`. This query is repeated in three other templates. Changing the revenue calculation requires finding and updating all four locations.

**Solution:** Extract to a `RevenueProvider` class. All widgets that display revenue data call the same provider.

## No Caching on Expensive Provider
A provider queries 5 million rows to compute "total active users this month". Every dashboard load (including AJAX refreshes) re-executes the query. Dashboard performance degrades as the user base grows.

**Solution:** Cache the active users count with a 5-minute TTL. Invalidating on new user registration is acceptable.

## Provider Coupled to Request
The provider calls `request()->user()->team_id` and `request()->input('period')`. The provider cannot be called from a queue job, artisan command, or PHPUnit test without faking HTTP requests.

**Solution:** Pass `team_id` and `period` as constructor arguments or via a DTO. The provider is decoupled from the HTTP layer.

## Raw Query Results Returned
The provider returns `Order::selectRaw('DATE(created_at) as date, SUM(total) as revenue')->groupBy('date')->get()`. The widget template must format the data into ApexCharts series format.

**Solution:** The provider transforms results into `['series' => [...], 'categories' => [...]]` format. The template only passes data to the chart component.
