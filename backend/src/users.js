// In-memory user store for demo. Replace with KV in production.
const users = [
  {
    id: 'admin',
    username: 'admin',
    email: 'admin@example.com',
    password: 'gT#8vLp!2zQw@5Xr$Mn1', // <--- update here
    role: 'admin',
  },
  // Example partner user:
  // {
  //   id: 'partner1',
  //   username: 'partner1',
  //   email: 'partner1@example.com',
  //   password: 'partnerpass',
  //   role: 'partner',
  // }
];

export function getUserByUsername(username) {
  return users.find(u => u.username === username);
}

export function getUserByEmail(email) {
  return users.find(u => u.email === email);
}

export function addPartnerUser({ id, username, email, password }) {
  users.push({ id, username, email, password, role: 'partner' });
} 
// hdsfhdsafksa