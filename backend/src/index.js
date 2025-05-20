import express, { response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { signToken, authMiddleware } from './auth.js';
import { getUserByUsername, getUserByEmail, addPartnerUser } from './users.js';
import { createCustomHostname } from './cloudflare.js';
import { v4 as uuidv4 } from 'uuid';
import { getKV, putKV, listKVKeys } from './kv.js';
import dns from 'dns/promises';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth endpoint
app.post('/admin/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = signToken({ id: user.id, username: user.username, email: user.email, role: user.role });
  res.json({ token, role: user.role });
});

// Admin: create partner
app.post('/admin/api/partners', authMiddleware('admin'), async (req, res) => {
  const { partnername, username, email, password, whitelabel = false, color = '#000000' } = req.body;
  if (!partnername || !username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // Create subdomain via Cloudflare
  const subdomain = `${partnername}.rgtools.se`;
  try {
    await createCustomHostname(subdomain);
    addPartnerUser({ id: partnername, username, email, password });
    // Store partner config in KV
    const partnerConfig = {
      id: partnername,
      username,
      email,
      whitelabel,
      color,
      subdomain,
      createdAt: Date.now(),
    };
    await putKV(`partner:${partnername}`, JSON.stringify(partnerConfig));
    res.json({ message: 'Partner created', subdomain });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create partner', details: err.message });
  }
});

// Admin: get all partners
app.get('/admin/api/partners', authMiddleware('admin'), async (req, res) => {
  try {
    const keys = await listKVKeys('partner:');
    const partners = [];
    for (const key of keys) {
      const value = await getKV(key);
      if (value) partners.push(value);
    }
    res.json({ partners });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch partners', details: err.message });
  }
});

// Partner: create toplist
app.post('/partner/toplists', authMiddleware('partner'), async (req, res) => {
  const partnerId = req.user.id;
  const { type, departure, destination, layout = 'standard', color = '#000000', columns = 1 } = req.body;
  if (!type || !departure || !destination) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const id = uuidv4();
  const toplistConfig = {
    id,
    partnerId,
    type,
    departure,
    destination,
    layout,
    color,
    columns,
    createdAt: Date.now(),
  };
  await putKV(`toplist:${partnerId}:${id}`, JSON.stringify(toplistConfig));
  res.json({ message: 'Toplist created', toplist: toplistConfig });
});

// Partner: list toplists
app.get('/partner/toplists', authMiddleware('partner'), async (req, res) => {
  const partnerId = req.user.id;
  // For demo, stubbed response (KV list API needed for production)
  res.json({ message: 'KV list API needed for production' });
});

// Partner: edit toplist
app.put('/partner/toplists/:id', authMiddleware('partner'), async (req, res) => {
  const partnerId = req.user.id;
  const { id } = req.params;
  const updates = req.body;
  try {
    const existing = await getKV(`toplist:${partnerId}:${id}`);
    if (!existing) return res.status(404).json({ error: 'Toplist not found' });
    const updated = { ...JSON.parse(existing), ...updates };
    await putKV(`toplist:${partnerId}:${id}`, JSON.stringify(updated));
    res.json({ message: 'Toplist updated', toplist: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update toplist', details: err.message });
  }
});

// Partner: delete toplist
app.delete('/partner/toplists/:id', authMiddleware('partner'), async (req, res) => {
  const partnerId = req.user.id;
  const { id } = req.params;
  try {
    // Delete from KV (in production, use KV delete API)
    // Here, just overwrite with null for demo
    await putKV(`toplist:${partnerId}:${id}`, '');
    res.json({ message: 'Toplist deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete toplist', details: err.message });
  }
});

// Create domain
app.post('/admin/api/domains', authMiddleware('admin'), async (req, res) => {
  const { domainName, partnerName, customHostname } = req.body;
  if (!domainName || !partnerName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // 1. Create subdomain in Cloudflare
    const cfResult = await createCustomHostname(`${domainName}.traveltool.x`);
    // 2. Store in KV
    const domain = {
      id: uuidv4(),
      name: domainName,
      partnerId: partnerName,
      createdAt: new Date().toISOString(),
      customHostname: customHostname || `${domainName}.traveltool.x`,
      cloudflareId: cfResult.result.id,
      status: 'active',
    };
    await putKV(`domain:${domain.id}`, JSON.stringify(domain));
    res.json({ domain });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create domain', details: err.message });
  }
});

// List domains (for demo, you should use KV list API in production)
app.get('/admin/api/domains', authMiddleware('admin'), async (req, res) => {
  // For demo, use a static list or implement KV list API
  const keys = await listKVKeys('partner:');
  const domains = [];
  for (const key of keys) {
    const value = await getKV(key);
    if (value) domains.push(value);
  }
  res.json({ domains });
});

// Update domain
app.put('/api/domains/:id', authMiddleware('admin'), async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const existing = await getKV(`domain:${id}`);
    if (!existing) return res.status(404).json({ error: 'Domain not found' });
    const updated = { ...JSON.parse(existing), ...updates };
    await putKV(`domain:${id}`, JSON.stringify(updated));
    res.json({ domain: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update domain', details: err.message });
  }
});

// Delete domain
app.delete('/api/domains/:id', authMiddleware('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await getKV(`domain:${id}`);
    if (!existing) return res.status(404).json({ error: 'Domain not found' });
    const domain = JSON.parse(existing);
    // Remove from Cloudflare
    await deleteCustomHostname(domain.cloudflareId);
    // Remove from KV
    await putKV(`domain:${id}`, '');
    res.json({ message: 'Domain deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete domain', details: err.message });
  }
});

app.post('/admin/api/partners/:id/validate-dns', authMiddleware('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Get partner config from KV
    const partnerRaw = await getKV(`partner:${id}`);
    if (!partnerRaw) return res.json({ valid: false, error: 'Partner not found' });

    // 2. Extract subdomain
    const subdomain = partnerRaw.subdomain;
    if (!subdomain) return res.json({ valid: false, error: 'No subdomain' });

    // 3. DNS lookup (A or CNAME)
    try {
      const addresses = await dns.resolveAny(subdomain);
      if (addresses && addresses.length > 0) {
        return res.json({ valid: true, addresses });
      } else {
        return res.json({ valid: false, error: 'No DNS records found' });
      }
    } catch (dnsErr) {
      return res.json({ valid: false, error: dnsErr.message });
    }
  } catch (err) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
}); 
