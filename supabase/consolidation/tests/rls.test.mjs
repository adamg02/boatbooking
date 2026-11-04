const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_KEY;
if (!ANON || !SERVICE) throw new Error('Set SUPABASE_ANON_KEY and SUPABASE_SERVICE_KEY (see `supabase status`)');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

async function login(email) {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'Passw0rd!' }) });
  const j = await r.json(); if (!j.access_token) throw new Error('login ' + email + JSON.stringify(j)); return j.access_token;
}
async function q(token, schema, path, { method = 'GET', body, key = ANON } = {}) {
  const h = { apikey: key, 'Accept-Profile': schema, 'Content-Profile': schema, 'content-type': 'application/json', Prefer: 'return=representation' };
  if (token) h.Authorization = `Bearer ${token}`;
  const r = await fetch(`${URL}/rest/v1/${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); let d; try { d = JSON.parse(t); } catch { d = t; }
  return { status: r.status, data: d, rows: Array.isArray(d) ? d.length : -1 };
}
const denied = (r) => r.status === 401 || r.status === 403 || (r.status >= 400 && /permission denied|42501/.test(JSON.stringify(r.data)));

const T = {};
for (const u of ['alice', 'bob', 'carol', 'dave', 'frank', 'grace']) T[u] = await login(`${u}@x.com`);
T.erin = await login('Erin@X.com');
const BBT = ['Club','User','Boat','Group','UserGroup','BoatGroup','Booking','Payment','LoginEvent','ManagementIpAllowlist'];
const TTT = ['competitions','competition_links','timing_points','crews','time_records'];

// ---------- anon ----------
for (const t of BBT) ok(denied(await q(null, 'boatbooking', `${t}?select=*`)), `anon denied boatbooking.${t}`);
for (const t of TTT) { const r = await q(null, 'tt', `${t}?select=*`); ok(r.status === 200 && r.rows > 0, `anon reads tt.${t} (public results)`); }
ok(denied(await q(null, 'tt', 'user_profiles?select=*')), 'anon denied tt.user_profiles');
ok(denied(await q(null, 'tt', 'crews', { method: 'POST', body: { competition_id: '11111111-1111-1111-1111-111111111111', name: 'x', category: 'x', crew_number: 9 } })), 'anon cannot insert tt.crews');
ok(denied(await q(null, 'public', 'User?select=*')) || (await q(null, 'public', 'User?select=*')).status === 404, 'nothing left in public');

// ---------- cross-app isolation ----------
// frank & grace: TT only
for (const u of ['frank', 'grace']) for (const t of BBT) { const r = await q(T[u], 'boatbooking', `${t}?select=*`); ok(denied(r) || r.rows === 0, `${u} (TT-only) sees nothing in boatbooking.${t}`); }
ok(denied(await q(T.frank, 'boatbooking', 'Boat', { method: 'POST', body: { name: 'hack', clubId: 'clubA' } })), 'TT admin cannot insert boatbooking.Boat');
// alice/bob/carol: BB only
for (const u of ['alice', 'bob', 'carol']) {
  for (const t of [...TTT, 'user_profiles']) { const r = await q(T[u], 'tt', `${t}?select=*`); ok(r.status === 200 && r.rows === 0, `${u} (BB-only) sees 0 rows in tt.${t}`); }
}
ok(denied(await q(T.alice, 'tt', 'competitions', { method: 'POST', body: { name: 'x', date: '2026-01-01', created_by: 'a0000000-0000-0000-0000-00000000000a' } })), 'BB admin cannot insert tt.competitions');
ok(denied(await q(T.bob, 'tt', 'time_records', { method: 'POST', body: { crew_id: '44444444-4444-4444-4444-444444444441', timing_point_id: '33333333-3333-3333-3333-333333333331', timestamp: new Date().toISOString(), recorded_by: 'b0000000-0000-0000-0000-00000000000b' } })), 'BB user cannot insert tt.time_records');
// dave: both apps
ok((await q(T.dave, 'tt', 'crews?select=*')).rows === 2, 'dave (both) reads tt.crews');
ok((await q(T.dave, 'boatbooking', 'Boat?select=*')).rows === 1, 'dave (both) reads boatbooking.Boat (active, own club)');
// erin: merged by email, TT profile with no role, also BB member
ok((await q(T.erin, 'tt', 'user_profiles?select=*')).rows === 1, 'erin sees own tt profile only');
ok((await q(T.erin, 'boatbooking', 'User?select=id')).rows >= 1, 'erin sees boatbooking users in her club');

// ---------- boatbooking tenant isolation ----------
let r = await q(T.bob, 'boatbooking', 'Boat?select=id'); ok(r.rows === 1 && r.data[0].id === 'boatA1', 'bob sees only active boats of clubA');
r = await q(T.alice, 'boatbooking', 'Boat?select=id'); ok(r.rows === 2, 'alice (admin) sees inactive boats too, not clubB');
r = await q(T.carol, 'boatbooking', 'Booking?select=id'); ok(r.rows === 1 && r.data[0].id === 'bkB', 'carol sees only clubB bookings');
r = await q(T.alice, 'boatbooking', 'Payment?select=clubId'); ok(r.rows === 1 && r.data[0].clubId === 'clubA', 'alice sees only clubA payments');
r = await q(T.bob, 'boatbooking', 'Payment?select=*'); ok(r.rows === 0, 'non-admin sees no payments');
r = await q(T.bob, 'boatbooking', 'Club?select=id'); ok(r.rows === 1 && r.data[0].id === 'clubA', 'bob sees only own club');
r = await q(T.alice, 'boatbooking', 'Boat?id=eq.boatB1', { method: 'PATCH', body: { name: 'pwned' } }); ok(r.rows === 0, 'alice cannot update clubB boat');
r = await q(T.alice, 'boatbooking', 'Boat?id=eq.boatA1', { method: 'PATCH', body: { name: 'A1 renamed' } }); ok(r.rows === 1, 'alice updates own club boat');
r = await q(T.bob, 'boatbooking', 'Boat?id=eq.boatA1', { method: 'PATCH', body: { name: 'bob' } }); ok(r.rows === 0, 'bob (member) cannot update boat');
ok(denied(await q(T.bob, 'boatbooking', 'Booking', { method: 'POST', body: { userId: 'b0000000-0000-0000-0000-00000000000b', boatId: 'boatB1', startTime: '2027-01-01T08:00:00Z', endTime: '2027-01-01T09:00:00Z' } })), 'bob cannot book another club\'s boat');
ok(denied(await q(T.bob, 'boatbooking', 'Booking', { method: 'POST', body: { userId: 'a0000000-0000-0000-0000-00000000000a', boatId: 'boatA1', startTime: '2027-01-01T08:00:00Z', endTime: '2027-01-01T09:00:00Z' } })), 'bob cannot book as alice');
r = await q(T.bob, 'boatbooking', 'Booking', { method: 'POST', body: { userId: 'b0000000-0000-0000-0000-00000000000b', boatId: 'boatA1', startTime: '2027-01-01T08:00:00Z', endTime: '2027-01-01T09:00:00Z' } }); ok(r.status === 201, 'bob books own-club boat');
ok(denied(await q(T.bob, 'boatbooking', 'User?id=eq.b0000000-0000-0000-0000-00000000000b', { method: 'PATCH', body: { clubId: 'clubB' } })), 'bob cannot change own clubId');
ok(denied(await q(T.bob, 'boatbooking', 'User?id=eq.b0000000-0000-0000-0000-00000000000b', { method: 'PATCH', body: { isSystemOwner: true } })), 'bob cannot make himself system owner');
r = await q(T.bob, 'boatbooking', 'User?id=eq.b0000000-0000-0000-0000-00000000000b', { method: 'PATCH', body: { lastLogin: new Date().toISOString() } }); ok(r.rows === 1, 'bob updates own lastLogin (middleware)');
ok(denied(await q(T.bob, 'boatbooking', 'Club?id=eq.clubA', { method: 'PATCH', body: { stripeCustomerId: 'x' } })), 'user cannot edit stripe fields');
ok(denied(await q(T.alice, 'boatbooking', 'Club?id=eq.clubA', { method: 'PATCH', body: { subscriptionTier: 'pro' } })), 'admin cannot grant own subscription tier');
r = await q(T.alice, 'boatbooking', 'Club?id=eq.clubA', { method: 'PATCH', body: { description: 'hi' } }); ok(r.rows === 1, 'admin edits club description');
r = await q(T.bob, 'boatbooking', 'UserGroup', { method: 'POST', body: { userId: 'b0000000-0000-0000-0000-00000000000b', groupId: 'gA' } }); ok(denied(r), 'bob cannot add himself to Admin group');
ok(denied(await q(T.alice, 'boatbooking', 'BoatGroup', { method: 'POST', body: { boatId: 'boatA1', groupId: 'gB' } })), 'admin cannot link boat to another club\'s group');
ok(denied(await q(T.bob, 'boatbooking', 'User', { method: 'POST', body: { id: 'x', email: 'x@x' } })), 'users cannot insert User rows directly');
// admin deactivate / reactivate a member
r = await q(T.alice, 'boatbooking', 'User?id=eq.b0000000-0000-0000-0000-00000000000b', { method: 'PATCH', body: { isActive: false } }); ok(r.rows === 1, 'admin deactivates bob');
r = await q(T.bob, 'boatbooking', 'Boat?select=id'); ok(r.rows === 0, 'deactivated bob sees no boats');
r = await q(T.bob, 'boatbooking', 'User?id=eq.b0000000-0000-0000-0000-00000000000b', { method: 'PATCH', body: { isActive: true } }); ok(denied(r) || r.rows === 0, 'deactivated bob cannot reactivate himself');
r = await q(T.bob, 'boatbooking', 'User?select=isActive&id=eq.b0000000-0000-0000-0000-00000000000b'); ok(r.rows === 1 && r.data[0].isActive === false, 'deactivated bob can still read own row (middleware sign-out)');
r = await q(T.alice, 'boatbooking', 'User?id=eq.b0000000-0000-0000-0000-00000000000b', { method: 'PATCH', body: { isActive: true } }); ok(r.rows === 1, 'admin reactivates bob');
// service role
for (const t of BBT) { const s = await q(null, 'boatbooking', `${t}?select=*`, { key: SERVICE }); ok(s.status === 200 && s.rows > 0, `service role reads boatbooking.${t}`); }
r = await q(null, 'boatbooking', 'Club?id=eq.clubA', { method: 'PATCH', key: SERVICE, body: { subscriptionTier: 'pro' } }); ok(r.rows === 1, 'service role updates Stripe fields');

// ---------- tt roles ----------
r = await q(T.frank, 'tt', 'user_profiles?select=*'); ok(r.rows === 4, 'TT admin sees all TT profiles (only TT ones)');
r = await q(T.grace, 'tt', 'user_profiles?select=*'); ok(r.rows === 1, 'timer sees only own profile');
r = await q(T.grace, 'tt', 'time_records', { method: 'POST', body: { crew_id: '44444444-4444-4444-4444-444444444442', timing_point_id: '33333333-3333-3333-3333-333333333332', timestamp: new Date().toISOString(), recorded_by: '90000000-0000-0000-0000-000000000099' } }); ok(r.status === 201, 'timer records a time');
ok(denied(await q(T.grace, 'tt', 'time_records', { method: 'POST', body: { crew_id: '44444444-4444-4444-4444-444444444442', timing_point_id: '33333333-3333-3333-3333-333333333332', timestamp: new Date().toISOString(), recorded_by: 'f0000000-0000-0000-0000-0000000000ff' } })), 'timer cannot record as someone else');
ok(denied(await q(T.erin, 'tt', 'time_records', { method: 'POST', body: { crew_id: '44444444-4444-4444-4444-444444444442', timing_point_id: '33333333-3333-3333-3333-333333333332', timestamp: new Date().toISOString(), recorded_by: 'e0000000-0000-0000-0000-0000000000bb' } })), 'no-role user cannot record times');
ok(denied(await q(T.erin, 'tt', 'user_profiles?id=eq.e0000000-0000-0000-0000-0000000000bb', { method: 'PATCH', body: { role: 'admin' } })), 'user cannot self-promote');
r = await q(T.grace, 'tt', 'crews?id=eq.44444444-4444-4444-4444-444444444441', { method: 'PATCH', body: { name: 'x' } }); ok(r.rows === 0, 'timer cannot edit crews');
r = await q(T.frank, 'tt', 'user_profiles?id=eq.e0000000-0000-0000-0000-0000000000bb', { method: 'PATCH', body: { role: 'timer' } }); ok(r.rows === 1, 'TT admin assigns role');
r = await q(T.frank, 'tt', 'crews?id=eq.44444444-4444-4444-4444-444444444442', { method: 'PATCH', body: { name: 'Staines B2' } }); ok(r.rows === 1, 'TT admin edits crew');
ok(denied(await q(T.frank, 'tt', 'time_records?id=not.is.null', { method: 'DELETE' })), 'time_records are append-only for clients');
// joining TT: BB-only user creates own profile with no role
ok(denied(await q(T.bob, 'tt', 'user_profiles', { method: 'POST', body: { id: 'b0000000-0000-0000-0000-00000000000b', email: 'bob@x.com', full_name: 'Bob', role: 'admin' } })), 'joining TT cannot self-assign admin');
ok(denied(await q(T.bob, 'tt', 'user_profiles', { method: 'POST', body: { id: 'a0000000-0000-0000-0000-00000000000a', email: 'alice@x.com', role: null } })), 'cannot create a profile for someone else');
r = await q(T.bob, 'tt', 'user_profiles', { method: 'POST', body: { id: 'b0000000-0000-0000-0000-00000000000b', email: 'bob@x.com', full_name: 'Bob', role: null } }); ok(r.status === 201, 'BB user joins TT (profile, no role)');
r = await q(T.bob, 'tt', 'crews?select=*'); ok(r.rows === 2, 'after joining, bob can read TT results');
r = await q(T.frank, 'boatbooking', 'User?select=*'); ok(r.rows === 0, 'TT admin still sees no boatbooking users after bob joins TT');
r = await q(T.frank, 'tt', 'user_profiles?id=eq.b0000000-0000-0000-0000-00000000000b', { method: 'DELETE' }); ok(r.rows === 1, 'TT admin removes TT profile');
r = await q(null, 'boatbooking', 'User?select=id&id=eq.b0000000-0000-0000-0000-00000000000b', { key: SERVICE }); ok(r.rows === 1, '...without touching boatbooking.User');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
