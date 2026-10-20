// Uygulama kurulumuna yeni test bağımlılığı eklemeden server-only sınırlarını test eder.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const crypto = require("node:crypto");
const root = require("node:path").join(__dirname, "..");

function compile(file, mocks, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(
    fs.readFileSync(require("node:path").join(root, file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (id) => {
      if (id in mocks) return mocks[id];
      throw new Error("Unexpected import: " + id);
    },
    URL,
    AbortSignal,
    Date,
    process: {
      env: {
        NODE_ENV: "production",
        API_URL: "http://api.test",
        APP_ORIGIN: "https://menu.test",
      },
    },
    ...globals,
  });
  return module.exports;
}

function authHarness({
  token,
  status = 200,
  origin = "https://menu.test",
} = {}) {
  let calls = 0;
  const auth = compile(
    "src/lib/admin-auth.ts",
    {
      "server-only": {},
      "next/headers": {
        cookies: async () => ({
          get: () => (token ? { value: token } : undefined),
        }),
        headers: async () =>
          new Map([
            ["origin", origin],
            ["host", "menu.test"],
          ]),
      },
      "next/navigation": {
        redirect: (path) => {
          throw new Error("REDIRECT:" + path);
        },
      },
    },
    {
      fetch: async () => {
        calls++;
        return {
          status,
          ok: status === 200,
          json: async () => ({
            admin: { id: "admin", email: "admin@example.test" },
          }),
        };
      },
    },
  );
  return { auth, calls: () => calls };
}

test("production cookie is HttpOnly, Secure, SameSite Strict and host-only", () => {
  const { auth } = authHarness();
  assert.equal(auth.ADMIN_COOKIE, "__Host-nest-admin");
  assert.equal(auth.cookieOptions.httpOnly, true);
  assert.equal(auth.cookieOptions.secure, true);
  assert.equal(auth.cookieOptions.sameSite, "strict");
  assert.equal(auth.cookieOptions.path, "/");
  assert.equal(auth.cookieOptions.domain, undefined);
});
test("missing session redirects without calling API", async () => {
  const harness = authHarness();
  await assert.rejects(harness.auth.requireAdmin(), /REDIRECT:\/admin\/login/);
  assert.equal(harness.calls(), 0);
});
test("revoked session redirects and valid session is verified against backend", async () => {
  const revoked = authHarness({ token: "a".repeat(43), status: 401 });
  await assert.rejects(revoked.auth.requireAdmin(), /REDIRECT/);
  const valid = authHarness({ token: "a".repeat(43) });
  assert.equal((await valid.auth.requireAdmin()).admin.id, "admin");
  assert.equal(valid.calls(), 1);
});
test("cross-origin action fails before session or backend access", async () => {
  const harness = authHarness({
    token: "a".repeat(43),
    origin: "https://attacker.test",
  });
  await assert.rejects(harness.auth.adminActionAuthorization(), /kaynağı/);
  assert.equal(harness.calls(), 0);
});
test("API outage does not authorize access", async () => {
  const { auth } = authHarness({ token: "a".repeat(43), status: 503 });
  await assert.rejects(auth.requireAdmin(), /doğrulanamadı/);
});
for (const kind of ["category", "product"]) {
  test(`all ${kind} action exports require authorization even for invalid input`, async () => {
    let requests = 0;
    const actions = compile(
      `src/app/admin/${kind}-actions.ts`,
      {
        "next/cache": { revalidatePath() {} },
        "node:crypto": crypto,
        "@/lib/admin-auth": {
          adminActionAuthorization: async () => {
            throw new Error("NOT_AUTHORIZED");
          },
        },
        "@/lib/categories": {
          isCategory: () => true,
          getCategories: async () => [],
        },
        "@/lib/products": { isProduct: () => true },
      },
      {
        fetch: async () => {
          requests++;
          throw new Error("unexpected fetch");
        },
      },
    );
    const suffix = kind[0].toUpperCase() + kind.slice(1);
    for (const prefix of ["load", "create", "update", "delete"]) {
      await assert.rejects(actions[prefix + suffix]("", {}), /NOT_AUTHORIZED/);
    }
    assert.equal(requests, 0);
  });
}
