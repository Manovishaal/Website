/* ============================================================
   GLOBAL LEADERBOARD
   Supabase-backed public high score board for the Decima Defender
   arcade mini-game. Reads and writes go straight to a Postgres
   table over Supabase's REST API — no server of your own needed.

   ------------------------------------------------------------
   SETUP (one-time, ~5 minutes):
   1. Create a free project at https://supabase.com
   2. Open the SQL editor and run the schema from the README's
      "Global Leaderboard" section (creates the HighScores table
      plus public read/insert Row Level Security policies).
   3. In Project Settings -> API, copy the Project URL and the
      anon/public API key, and paste them below.

   Until you do this, the game still works completely offline —
   SUPABASE_URL/SUPABASE_ANON_KEY are left as placeholders, every
   call below detects that and no-ops (logging a console warning)
   instead of throwing.
   ============================================================ */
'use strict';

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const LB_TABLE = 'HighScores';
const LB_USERNAME_KEY = 'decima-username';

let _client = null;
let _warnedNotConfigured = false;

function _isConfigured() {
  return (
    typeof SUPABASE_URL === 'string' && !SUPABASE_URL.startsWith('YOUR_') &&
    typeof SUPABASE_ANON_KEY === 'string' && !SUPABASE_ANON_KEY.startsWith('YOUR_')
  );
}

function _getClient() {
  if (_client) return _client;
  if (typeof window.supabase === 'undefined') return null;
  if (!_isConfigured()) {
    if (!_warnedNotConfigured) {
      _warnedNotConfigured = true;
      console.warn('[Leaderboard] Supabase is not configured yet — see leaderboard.js. Scores will stay local-only.');
    }
    return null;
  }
  _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}

/* ---- Username helpers ---- */
function sanitizeName(raw) {
  const cleaned = (raw || '')
    .replace(/[^\w \-.]/g, '')   // letters, numbers, underscore, space, hyphen, dot only
    .trim()
    .slice(0, 16);
  return cleaned || null;
}

function getUsername() {
  try { return localStorage.getItem(LB_USERNAME_KEY) || null; }
  catch (_) { return null; }
}

function saveUsername(raw) {
  const clean = sanitizeName(raw);
  if (!clean) return null;
  try { localStorage.setItem(LB_USERNAME_KEY, clean); } catch (_) {}
  return clean;
}

function randomGuestName() {
  return 'GUEST-' + Math.floor(1000 + Math.random() * 9000);
}

/* ---- Score submission ---- */
async function submitScore(score, level) {
  if (!score || score <= 0) return { ok: false, reason: 'no-score' };
  const username = getUsername() || saveUsername(randomGuestName());
  const client = _getClient();
  if (!client) return { ok: false, reason: 'not-configured' };
  try {
    const { error } = await client.from(LB_TABLE).insert([{
      Username: username,
      Score: Math.floor(score),
      Level: Math.floor(level || 1),
    }]);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.warn('[Leaderboard] submitScore failed:', e && e.message ? e.message : e);
    return { ok: false, reason: 'error', error: e };
  }
}

/* ---- Leaderboard read ---- */
async function fetchLeaderboard(limit = 10) {
  const client = _getClient();
  if (!client) return { data: [], configured: false };
  try {
    const { data, error } = await client
      .from(LB_TABLE)
      .select('Username, Score, Level, CreatedAt')
      .order('Score', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return { data: data || [], configured: true };
  } catch (e) {
    console.warn('[Leaderboard] fetchLeaderboard failed:', e && e.message ? e.message : e);
    return { data: [], configured: true, error: true };
  }
}

window.LB = {
  isConfigured: _isConfigured,
  getUsername,
  saveUsername,
  sanitizeName,
  randomGuestName,
  submitScore,
  fetchLeaderboard,
};
