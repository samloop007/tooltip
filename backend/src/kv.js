import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const kvApi = axios.create({
  baseURL: `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/`,
  headers: {
    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// You need to set your KV namespace ID in env
const KV_NAMESPACE_ID = process.env.KV_NAMESPACE_ID;

export async function getKV(key) {
    console.log(key, 'key');
  const url = `${KV_NAMESPACE_ID}/values/${key}`;
  const response = await kvApi.get(url);
  return response.data;
}

export async function putKV(key, value) {
  const url = `${KV_NAMESPACE_ID}/values/${key}`;
  const response = await kvApi.put(url, value, {
    headers: { 'Content-Type': 'text/plain' },
  });
  return response.data;
}

export async function listKVKeys(prefix) {
  let keys = [];
  let cursor = undefined;
  do {
    const url = `${KV_NAMESPACE_ID}/keys?prefix=${encodeURIComponent(prefix)}${cursor ? `&cursor=${cursor}` : ''}`;
    const response = await kvApi.get(url);
    console.log(response.data, 'response.data');
    keys = keys.concat(response.data.result.map(k => k.name));
    cursor = response.data.result_info?.cursor;
  } while (cursor);
  return keys;
} 