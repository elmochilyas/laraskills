# CloudFront Free Tier Economics Rules

## Rule 1: Always Put CloudFront in Front of S3
- **Category**: Cost Management
- **Rule**: Always route all public S3 asset delivery through CloudFront
- **Reason**: CloudFront offers 1TB free egress/month permanently + 10M free HTTP/HTTPS requests; S3 direct egress has no free tier and is more expensive per GB
- **Bad Example**: Serving assets directly from S3 at 500GB/month, paying ~$46/month in egress costs
- **Good Example**: CloudFront in front of S3; first 1TB/month is free, saving $46+ per month
- **Exceptions**: Presigned URLs for private content that must bypass CloudFront
- **Consequences Of Violation**: Paying for S3 egress that would be free through CloudFront

## Rule 2: Monitor Monthly Free Tier Consumption
- **Category**: Cost Management
- **Rule**: Track CloudFront data transfer in Cost Explorer and forecast when usage will exceed 1TB/month
- **Reason**: Free tier covers 1TB/month; once exceeded, cost jumps from $0 to $0.085/GB; forecasting prevents budget surprises
- **Bad Example**: Unaware that CloudFront usage grew from 800GB to 1.2TB/month; surprised by a $17 egress bill
- **Good Example**: Dashboard showing monthly CloudFront consumption with forecast at 85% of free tier; planning for paid tier at projected growth rate
- **Exceptions**: Apps with minimal CloudFront usage (<100GB/month) that are unlikely to exceed free tier
- **Consequences Of Violation**: Budget variance from unexpected CloudFront egress charges

## Rule 3: Use PriceClass_100 for Regional Audiences
- **Category**: Cost Management
- **Rule**: Use CloudFront PriceClass_100 (US and Europe only) for apps with primarily US/EU audiences
- **Reason**: PriceClass_100 serves from US/EU edge locations only and is cheaper per-GB than global pricing; free tier covers the same 1TB regardless of price class
- **Bad Example**: Using PriceClass_All (global) for a Laravel app with 95% US-based users; paying higher per-GB rates for unused global coverage
- **Good Example**: Using PriceClass_100 for a US/EU app; full global coverage is unnecessary and more expensive
- **Exceptions**: Apps with significant user bases in Asia, South America, or Africa need global price class
- **Consequences Of Violation**: Paying higher per-GB rates for edge locations in regions where there are no users

## Rule 4: Combine Free Tier with Compression
- **Category**: Cost Management
- **Rule**: Enable CloudFront compression to effectively multiply the free tier value by 2-3x
- **Reason**: Compression reduces data transfer by 60-70%; 1TB free tier effectively becomes 2.5-3TB of uncompressed content served within free tier limits
- **Bad Example**: Serving uncompressed CSS/JS/HTML through CloudFront; 1TB free tier covers less actual content
- **Good Example**: Enabling CloudFront automatic compression; 1TB free tier now covers the equivalent of 2.5-3TB of uncompressed content
- **Exceptions**: Already-compressed content (images, video) does not benefit from additional compression
- **Consequences Of Violation**: Hitting the 1TB free tier limit sooner than necessary; paying for egress that could be avoided
