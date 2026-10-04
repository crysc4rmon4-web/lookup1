import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import vm from "node:vm";
const require = createRequire(
  new URL("../apps/web/package.json", import.meta.url),
);
const ts = require("typescript");
const source = fs.readFileSync(
  new URL("../apps/web/src/app/api/events/[id]/like/route.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const id = "33333333-3333-4333-8333-333333333333";
function fixture({
  owner = false,
  status = "published",
  ended = false,
  valid = true,
  available = true,
} = {}) {
  let liked = false,
    mutations = 0,
    dbCalls = 0;
  const db = {
    auth: {
      getUser: async () => ({
        data: { user: valid ? { id: "viewer" } : null },
        error: null,
      }),
    },
    from(table) {
      let operation = "get";
      const q = {
        select() {
          return q;
        },
        eq() {
          return q;
        },
        maybeSingle: async () => ({
          data: {
            creator_profile_id: owner ? "viewer" : "owner",
            status,
            end_at: new Date(
              Date.now() + (ended ? -10000 : 100000),
            ).toISOString(),
          },
          error: null,
        }),
        insert: async () => {
          mutations++;
          if (liked) return { error: { code: "23505" } };
          liked = true;
          return { error: null };
        },
        delete() {
          operation = "delete";
          return q;
        },
        then(resolve) {
          if (table === "event_likes" && operation === "delete") {
            mutations++;
            liked = false;
          }
          return Promise.resolve({ error: null }).then(resolve);
        },
      };
      return q;
    },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    Request,
    Response,
    Date,
    console: { error() {} },
    require(name) {
      if (name === "next/server")
        return {
          NextResponse: { json: (body, init) => Response.json(body, init) },
        };
      if (name === "@/lib/supabase-admin")
        return {
          getSupabaseAdminClient: () => {
            dbCalls++;
            return db;
          },
        };
      if (name === "@/lib/events/event-likes")
        return {
          getEventLikeSummaries: async () =>
            available ? new Map([[id, { count: liked ? 1 : 0, liked }]]) : null,
        };
      throw new Error(name);
    },
  });
  const call = (method = "GET", token = "test", eventId = id) =>
    exports[method](
      new Request("http://localhost/api/events/" + eventId + "/like", {
        method,
        headers: token ? { Authorization: "Bearer " + token } : {},
      }),
      { params: Promise.resolve({ id: eventId }) },
    );
  return {
    call,
    get mutations() {
      return mutations;
    },
    get dbCalls() {
      return dbCalls;
    },
  };
}
test("unauthenticated and malformed event requests stop before database access", async () => {
  const f = fixture();
  assert.equal((await f.call("POST", "")).status, 401);
  assert.equal((await f.call("GET", "test", "bad-id")).status, 400);
  assert.equal(f.dbCalls, 0);
});
test("invalid sessions cannot read or write likes", async () => {
  const f = fixture({ valid: false });
  assert.equal((await f.call("POST")).status, 401);
  assert.equal(f.mutations, 0);
});
test("likes are idempotent and removing them restores the count", async () => {
  const f = fixture();
  assert.equal((await f.call("POST")).status, 200);
  const again = await f.call("POST");
  assert.equal((await again.json()).count, 1);
  assert.equal((await (await f.call("DELETE")).json()).count, 0);
  assert.equal((await (await f.call("DELETE")).json()).count, 0);
});
test("owners can see counts but cannot react to their own events", async () => {
  const f = fixture({ owner: true, status: "draft" });
  assert.equal((await f.call()).status, 200);
  assert.equal((await f.call("POST")).status, 409);
  assert.equal(f.mutations, 0);
});
test("other users cannot discover unpublished counts or react to ended events", async () => {
  const hidden = fixture({ status: "draft" });
  assert.equal((await hidden.call()).status, 404);
  assert.equal((await hidden.call("POST")).status, 404);
  const ended = fixture({ ended: true });
  assert.equal((await ended.call("POST")).status, 409);
  assert.equal(ended.mutations, 0);
});
test("missing migration is reported as unavailable, never as zero likes", async () => {
  assert.equal((await fixture({ available: false }).call()).status, 503);
});
