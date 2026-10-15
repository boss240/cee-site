const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Run the real route with in-memory dependencies: no database/network writes.
function load(file, dependencies) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, process: { env: { NEXT_PUBLIC_APP_URL: 'https://cee.energy' } },
    require(name) {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  }, { filename: file });
  return exports;
}

const original = { id: 1, legalName: 'CEE', address: 'Ladyzhyn', phone: '123', email: 'info@example.test', iban: 'old' };
function profileRoute({ body = {}, denied = false, fails = false } = {}) {
  const invalidations = [];
  let writes = 0;
  const db = {
    select: () => ({ from: () => ({ limit: async () => [original] }) }),
    update: () => ({ set: (patch) => ({ where: () => ({ returning: async () => {
      if (fails) throw new Error('write failed');
      writes++;
      return [{ ...original, ...patch }];
    } }) }) }),
  };
  const route = load('app/api/admin/company-profile/route.ts', {
    'next/server': { NextResponse: { json: (data) => data } },
    'drizzle-orm': { eq: () => true },
    '@/lib/db': { db, schema: { companyProfile: { id: 'id' } } },
    'next/cache': { revalidateTag: (...args) => invalidations.push(args) },
    '@/lib/auth/requireAdmin': { requireAdminSession: async () => ({ response: denied ? { status: 401 } : undefined }) },
    '@/lib/publicProfile': { PUBLIC_CONTACTS_TAG: 'public-contacts' },
  });
  return { run: () => route.PATCH({ json: async () => body }), invalidations, writes: () => writes };
}

test('unchanged contacts and billing-only edits do not invalidate public pages', async () => {
  for (const body of [{}, { ...original }, { iban: 'new', bankName: 'Bank', vatPayer: true }]) {
    const route = profileRoute({ body });
    await route.run();
    assert.equal(route.writes(), 1);
    assert.equal(route.invalidations.length, 0);
  }
});

for (const field of ['legalName', 'address', 'phone', 'email']) {
  test(`changing or clearing ${field} invalidates contacts after saving`, async () => {
    for (const value of ['changed', '']) {
      const route = profileRoute({ body: { [field]: value } });
      await route.run();
      assert.deepEqual(route.invalidations, [['public-contacts', 'max']]);
      assert.equal(route.writes(), 1);
    }
  });
}

test('denied and failed writes never invalidate public pages', async () => {
  const denied = profileRoute({ denied: true, body: { phone: 'new' } });
  assert.equal((await denied.run()).status, 401);
  assert.equal(denied.writes(), 0);
  assert.equal(denied.invalidations.length, 0);
  const failed = profileRoute({ fails: true, body: { phone: 'new' } });
  await assert.rejects(failed.run(), /write failed/);
  assert.equal(failed.invalidations.length, 0);
});

test('sitemap omits fabricated dates and keeps content dates', async () => {
  const publishedAt = new Date('2026-09-20T00:00:00Z');
  const updatedAt = new Date('2026-10-10T00:00:00Z');
  const { default: sitemap } = load('app/sitemap.ts', {
    '@/lib/nav': { NAV: [{ href: '/services' }] },
    '@/lib/blog/queries': { listPublishedPosts: async () => [
      { slug: 'dated', publishedAt }, { slug: 'undated', publishedAt: null },
    ] },
    '@/lib/knowledge/documents': { searchDocuments: async () => [{ slug: 'doc', updatedAt }] },
    '@/lib/knowledge/digests': { listPublishedDigests: async () => [{ slug: 'digest', publishedAt, updatedAt }] },
  });
  const entries = await sitemap();
  assert.equal(entries.find(e => e.url.endsWith('/services')).lastModified, undefined);
  assert.equal(entries.find(e => e.url.endsWith('/blog/undated')).lastModified, undefined);
  assert.equal(entries.find(e => e.url.endsWith('/blog/dated')).lastModified, publishedAt);
  assert.equal(entries.find(e => e.url.endsWith('/documents/doc')).lastModified, updatedAt);
  assert.equal(entries.find(e => e.url.endsWith('/digests/digest')).lastModified, updatedAt);
});

test('a cold-cache database read failure rejects instead of caching empty contacts', async () => {
  let offline = true;
  const { getPublicContacts } = load('lib/publicProfile.ts', {
    'next/cache': { unstable_cache: (read) => read },
    '@/lib/db': {
      schema: { companyProfile: {} },
      db: { select: () => ({ from: () => ({ limit: async () => {
        if (offline) throw new Error('test database unavailable');
        return [{ legalName: 'Recovered', phone: '', email: '', address: '' }];
      } }) }) },
    },
  });
  await assert.rejects(getPublicContacts(), /test database unavailable/);
  offline = false;
  assert.equal((await getPublicContacts()).legalName, 'Recovered');
});
