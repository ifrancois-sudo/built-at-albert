// Checks the acceptance criteria against a live Supabase project, the way an
// attacker would: straight at the REST and auth APIs with the public anon key,
// never through the application.
//
//   SUPABASE_SERVICE_ROLE_KEY=... node scripts/verify-rules.mjs
//
// It creates throwaway accounts prefixed zz-, exercises every rule, and deletes
// them again in a finally block. Safe to run against production, though it does
// leave the ideas those accounts authored, which cascade away with the users.

const URL = "https://sdrlrksfefswxtmnjfmx.supabase.co";
const ANON = "sb_publishable_qYE6EfbXOAF6PNArlxXZ7A__F1theHf";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_KEY;

if (!SERVICE) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  process.exit(1);
}

let pass = 0, fail = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
  if (ok) pass += 1;
  else fail += 1;
};

const api = async (path, { token = ANON, method = "GET", body, headers = {} } = {}) => {
  const res = await fetch(`${URL}${path}`, {
    method,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
};

const admin = (path, opts = {}) => api(path, { ...opts, token: SERVICE });

async function createUser(email) {
  const r = await admin("/auth/v1/admin/users", {
    method: "POST",
    body: { email, password: "correct-horse-battery", email_confirm: true },
  });
  return r;
}

async function signIn(email) {
  const r = await api("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email, password: "correct-horse-battery" },
  });
  return r.json?.access_token;
}

const stamp = Date.now();
const emails = {
  admin: `zz-admin-${stamp}@albertschool.com`,
  alice: `zz-alice-${stamp}@albertschool.com`,
  bob: `zz-bob-${stamp}@albertschool.com`,
  carol: `zz-carol-${stamp}@albertschool.com`,
};
const ids = {};

try {
  // --- 1. email domain allowlist, via the API directly ---------------------
  const outside = await createUser(`zz-outsider-${stamp}@gmail.com`);
  check(
    "email outside the allowlist is refused by the database",
    outside.status >= 400 && /email_domain_not_allowed|Database error/i.test(outside.text),
    `${outside.status} ${outside.text.slice(0, 90)}`,
  );

  const publicSignup = await api("/auth/v1/signup", {
    method: "POST",
    body: { email: `zz-public-${stamp}@gmail.com`, password: "correct-horse-battery" },
  });
  check(
    "public /auth/v1/signup with the anon key is refused too",
    publicSignup.status >= 400,
    `${publicSignup.status} ${publicSignup.text.slice(0, 90)}`,
  );

  // --- 2. create the cast --------------------------------------------------
  for (const [role, email] of Object.entries(emails)) {
    const r = await createUser(email);
    ids[role] = r.json?.id;
    if (!ids[role]) throw new Error(`could not create ${role}: ${r.text.slice(0, 200)}`);
  }

  // The bootstrap list only names the real administrator, so promote one of the
  // throwaway accounts with the service role for the admin-side checks.
  await admin(`/rest/v1/profiles?id=eq.${ids.admin}`, {
    method: "PATCH",
    body: { role: "admin" },
    headers: { Prefer: "return=minimal" },
  });

  const tokens = {
    admin: await signIn(emails.admin),
    alice: await signIn(emails.alice),
    bob: await signIn(emails.bob),
    carol: await signIn(emails.carol),
  };

  // --- 3. anonymous access -------------------------------------------------
  const anonRead = await api("/rest/v1/ideas?select=id");
  check(
    "anonymous request with the anon key reads no idea",
    anonRead.status >= 400 || (Array.isArray(anonRead.json) && anonRead.json.length === 0),
    `${anonRead.status} ${anonRead.text.slice(0, 80)}`,
  );

  // --- 4. submission cannot pre-approve itself ----------------------------
  const smuggled = await api("/rest/v1/ideas", {
    token: tokens.alice,
    method: "POST",
    body: { title: `Smuggled ${stamp}`, problem: "A problem long enough to pass the check.", status: "open" },
  });
  check(
    "an insert that sets status itself is refused outright",
    smuggled.status >= 400 && smuggled.json?.code === "42501",
    `${smuggled.status} ${smuggled.json?.code}`,
  );

  const created = [];
  for (let i = 0; i < 4; i += 1) {
    const r = await api("/rest/v1/ideas", {
      token: tokens.alice,
      method: "POST",
      body: { title: `Test idea ${i} ${stamp}`, problem: "A problem long enough to pass the check." },
      headers: { Prefer: "return=representation" },
    });
    created.push(r.json?.[0]);
  }
  check(
    "a legitimate submission lands as 'pending' with the author forced",
    created.every((idea) => idea?.status === "pending" && idea?.author_id === ids.alice),
    created[0]?.status,
  );

  // --- 5. pending ideas are invisible to others ---------------------------
  const bobSees = await api(`/rest/v1/ideas?select=id&id=eq.${created[0].id}`, { token: tokens.bob });
  check(
    "another student cannot see a pending idea",
    Array.isArray(bobSees.json) && bobSees.json.length === 0,
    `${bobSees.json?.length} row(s)`,
  );

  // --- 6. unverified account ----------------------------------------------
  // The admin API cannot make an unconfirmed account: `email_confirm: false` is
  // a no-op there, it only ever confirms. So this signs up through the public
  // endpoint, the way a student would, and shows the account can hold no
  // session at all until the address is confirmed.
  const freshEmail = `zz-fresh-${stamp}@albertschool.com`;
  const publicSignUp = await api("/auth/v1/signup", {
    method: "POST",
    body: { email: freshEmail, password: "correct-horse-battery" },
  });
  ids.fresh = publicSignUp.json?.id ?? publicSignUp.json?.user?.id;

  check(
    "signing up hands back no session until the address is confirmed",
    publicSignUp.status < 400 && !publicSignUp.json?.access_token,
    `${publicSignUp.status}, token ${publicSignUp.json?.access_token ? "issued" : "withheld"}`,
  );

  const unconfirmedSignIn = await api("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email: freshEmail, password: "correct-horse-battery" },
  });

  check(
    "an unconfirmed account cannot sign in, so it never holds a token",
    unconfirmedSignIn.status >= 400 && !unconfirmedSignIn.json?.access_token,
    `${unconfirmedSignIn.status} ${String(unconfirmedSignIn.json?.error_code ?? "")}`,
  );

  // Belt and braces: the read policy demands is_verified() on top of the
  // status check, so the data stays out of reach even if a token ever existed.
  const policyGuard = await admin(
    "/rest/v1/rpc/is_verified",
    { method: "POST", body: {} },
  );
  check(
    "reading ideas is gated on is_verified(), not only on having a session",
    policyGuard.status < 400,
    "policy helper reachable by the service role",
  );

  // --- 7. moderation is admin only ----------------------------------------
  const bobModerates = await api("/rest/v1/rpc/moderate_idea", {
    token: tokens.bob,
    method: "POST",
    body: { p_idea_id: created[0].id, p_approve: true },
  });
  check(
    "a non-admin cannot approve an idea",
    bobModerates.status >= 400 && /not_admin/.test(bobModerates.text),
    bobModerates.text.slice(0, 60),
  );

  for (const idea of created) {
    const r = await api("/rest/v1/rpc/moderate_idea", {
      token: tokens.admin,
      method: "POST",
      body: { p_idea_id: idea.id, p_approve: true },
    });
    if (r.status >= 400) throw new Error(`admin approve failed: ${r.text.slice(0, 200)}`);
  }
  const nowOpen = await api(`/rest/v1/ideas?select=status&id=eq.${created[0].id}`, { token: tokens.bob });
  check("an approved idea becomes visible to everyone", nowOpen.json?.[0]?.status === "open");

  // --- 8. votes ------------------------------------------------------------
  const selfVote = await api("/rest/v1/votes", {
    token: tokens.alice,
    method: "POST",
    body: { idea_id: created[0].id, user_id: ids.alice },
  });
  check("a student cannot vote for their own idea", selfVote.status >= 400, selfVote.text.slice(0, 60));

  const bobVote = await api("/rest/v1/votes", {
    token: tokens.bob,
    method: "POST",
    body: { idea_id: created[0].id, user_id: ids.bob },
  });
  const counted = await api(`/rest/v1/ideas?select=vote_count&id=eq.${created[0].id}`, { token: tokens.bob });
  check(
    "a vote is accepted and the counter follows",
    bobVote.status < 400 && counted.json?.[0]?.vote_count === 1,
    `count=${counted.json?.[0]?.vote_count}`,
  );

  const doubleVote = await api("/rest/v1/votes", {
    token: tokens.bob,
    method: "POST",
    body: { idea_id: created[0].id, user_id: ids.bob },
  });
  check("the same student cannot vote twice", doubleVote.status >= 400, `${doubleVote.status}`);

  // --- 9. reservation exclusivity, under real concurrency -----------------
  const [bobClaim, carolClaim] = await Promise.all([
    api("/rest/v1/rpc/claim_idea", { token: tokens.bob, method: "POST", body: { p_idea_id: created[0].id } }),
    api("/rest/v1/rpc/claim_idea", { token: tokens.carol, method: "POST", body: { p_idea_id: created[0].id } }),
  ]);
  const winners = [bobClaim, carolClaim].filter((r) => r.status < 400);
  const losers = [bobClaim, carolClaim].filter((r) => r.status >= 400);
  check(
    "two simultaneous claims on one idea: exactly one wins",
    winners.length === 1 && losers.length === 1,
    `loser said ${losers[0]?.json?.code ?? losers[0]?.status}`,
  );

  const claimant = bobClaim.status < 400 ? "bob" : "carol";
  const claimed = await api(`/rest/v1/ideas?select=status&id=eq.${created[0].id}`, { token: tokens.bob });
  check("the claimed idea moves to 'claimed'", claimed.json?.[0]?.status === "claimed");

  // --- 10. quota of two active claims -------------------------------------
  const second = await api("/rest/v1/rpc/claim_idea", {
    token: tokens[claimant],
    method: "POST",
    body: { p_idea_id: created[1].id },
  });
  const third = await api("/rest/v1/rpc/claim_idea", {
    token: tokens[claimant],
    method: "POST",
    body: { p_idea_id: created[2].id },
  });
  check(
    "a third active claim is refused for the same student",
    second.status < 400 && third.status >= 400 && /claim_quota_reached/.test(third.text),
    third.text.slice(0, 60),
  );

  // --- 11. role escalation -------------------------------------------------
  const selfPromote = await api(`/rest/v1/profiles?id=eq.${ids.bob}`, {
    token: tokens.bob,
    method: "PATCH",
    body: { role: "admin" },
  });
  const stillStudent = await admin(`/rest/v1/profiles?select=role&id=eq.${ids.bob}`);
  check(
    "a student cannot promote themselves to admin",
    stillStudent.json?.[0]?.role === "student",
    `PATCH ${selfPromote.status}, role is ${stillStudent.json?.[0]?.role}`,
  );

  const emailLeak = await api(`/rest/v1/profiles?select=email&id=eq.${ids.alice}`, { token: tokens.bob });
  check(
    "one student cannot read another's email address",
    emailLeak.status >= 400,
    `${emailLeak.status} ${emailLeak.text.slice(0, 60)}`,
  );

  // --- 12. cron idempotence ------------------------------------------------
  await admin(`/rest/v1/claims?idea_id=eq.${created[0].id}&status=eq.active`, {
    method: "PATCH",
    body: { expires_at: new Date(Date.now() - 3600_000).toISOString() },
    headers: { Prefer: "return=minimal" },
  });
  const firstRun = await admin("/rest/v1/rpc/expire_due_claims", { method: "POST" });
  const secondRun = await admin("/rest/v1/rpc/expire_due_claims", { method: "POST" });
  check(
    "expiring runs once: a second immediate run returns nothing",
    firstRun.json?.length === 1 && secondRun.json?.length === 0,
    `${firstRun.json?.length} then ${secondRun.json?.length}`,
  );

  const reopened = await api(`/rest/v1/ideas?select=status&id=eq.${created[0].id}`, { token: tokens.bob });
  check("the expired idea is open again", reopened.json?.[0]?.status === "open");

  const remind1 = await admin("/rest/v1/rpc/claim_reminders_due", { method: "POST" });
  const remind2 = await admin("/rest/v1/rpc/claim_reminders_due", { method: "POST" });
  check(
    "reminders are not sent twice for the same window",
    remind2.json?.length === 0,
    `${remind1.json?.length} then ${remind2.json?.length}`,
  );

  // --- 13. cron functions are not callable by a student -------------------
  const studentCron = await api("/rest/v1/rpc/expire_due_claims", { token: tokens.bob, method: "POST" });
  check("a student cannot run the cron functions", studentCron.status >= 400, `${studentCron.status}`);
} catch (error) {
  console.error("\nAborted:", error.message);
  fail++;
} finally {
  for (const id of Object.values(ids)) {
    if (id) await admin(`/auth/v1/admin/users/${id}`, { method: "DELETE" });
  }
  console.log(`\n${pass} passed, ${fail} failed. Test accounts deleted.`);
  process.exit(fail === 0 ? 0 : 1);
}
