import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

const cloudflareApi = axios.create({
  baseURL: `https://api.cloudflare.com/client/v4/`,
  headers: {
    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

export async function createCustomHostname(hostname) {
  // hostname: e.g. partnername.rgtools.se
  const url = `/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames`;

  const data = {
    hostname,
    ssl: { method: 'http', type: 'dv', settings: { http2: 'on', min_tls_version: '1.2' } },
  };
  try {
    const response = await cloudflareApi.post(url, data);
    return response.data;
  } catch (error) {
    if (error.response) {
      // Log Cloudflare API error details
      throw new Error(JSON.stringify(error.response.data));
    } else {
      // Log network or other errors
      throw error;
    }
  }
}

export async function verifyToken() {
  const response = await cloudflareApi.get('/user/tokens/verify');
  return response.data;
} 