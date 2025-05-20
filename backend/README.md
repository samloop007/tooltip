# Affiliate Toplist Backend

This is the backend for the Affiliate Toplist Tool. It manages partners, toplists, authentication, and integrates with Cloudflare for subdomain management. Data is stored in Cloudflare KV.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your secrets:
   - `PORT`
   - `JWT_SECRET`
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_ZONE_ID`

3. Start the server:
   ```bash
   npm run dev
   ```

## Endpoints
- `GET /health` — Health check
- (More endpoints documented as implemented)

## Features
- Admin and partner authentication (JWT)
- Partner and toplist management
- Cloudflare API integration for subdomain creation
- Data fetching and caching from toplist API
- Cloudflare KV for storage 