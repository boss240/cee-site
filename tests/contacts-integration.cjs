// Local integration only: a real Next production server and disposable PostgreSQL.
// Never point this script at a production URL/database.
const assert = require('node:assert/strict');
const { Pool } = require('pg');
const { encode } = require('next-auth/jwt');
const fs = require('node:fs');
const url = 'http://localhost:3100';
const pool = new Pool({ connectionString: 'postgresql://postgres:local-audit-only@127.0.0.1:55432/cee_audit' });
const results = [];
let cookie;
async function patch(body) {
 const r = await fetch(url + '/api/admin/company-profile', { method: 'PATCH', headers: { cookie, 'content-type':'application/json' }, body: JSON.stringify(body) });
 assert.equal(r.status, 200); return r.json();
}
async function page(path='/uk/contacts') { const r = await fetch(url+path); return { status:r.status, body:await r.text(), cache:r.headers.get('cache-control') }; }
async function eventually(name, path='/uk/contacts') {
 for(let i=0;i<12;i++) { const r=await page(path); if(r.status===200 && r.body.includes(name)) return r; await new Promise(r=>setTimeout(r,250)); }
 assert.fail('Expected refreshed content: '+name);
}
(async()=>{
 cookie='next-auth.session-token='+await encode({secret:'local-audit-only-not-production',token:{sub:'admin:1',role:'admin',name:'Local audit',email:'audit@example.test'}});
 assert.equal((await fetch(url+'/api/admin/company-profile')).status,401);
 await patch({legalName:'CEE_AUDIT_RESET'});
 await eventually('CEE_AUDIT_RESET');
 await patch({legalName:'CEE_AUDIT_INITIAL',phone:'5550101',email:'audit@example.test'});
 await eventually('CEE_AUDIT_INITIAL');
 await patch({legalName:'CEE_AUDIT_UPDATED',phone:'5550102'});
 await eventually('CEE_AUDIT_UPDATED');
 await eventually('CEE_AUDIT_UPDATED','/uk/services');
 results.push('PASS: authenticated PATCH updates real PostgreSQL; shared tag refreshes dynamic contacts and static services.');
 // If a billing-only save invalidates the tag, this unseen DB marker will leak into the page.
 await pool.query("UPDATE company_profile SET legal_name='CEE_AUDIT_DB_ONLY'");
 await patch({iban:'LOCAL_TEST_IBAN'});
 for(let i=0;i<3;i++){const r=await page();assert.ok(r.body.includes('CEE_AUDIT_UPDATED'));assert.ok(!r.body.includes('CEE_AUDIT_DB_ONLY'));}
 results.push('PASS: billing-only PATCH does not invalidate cached public contacts.');
 await patch({legalName:'CEE_AUDIT_BEFORE_FAILURE'});
 await eventually('CEE_AUDIT_BEFORE_FAILURE');
 await eventually('CEE_AUDIT_BEFORE_FAILURE','/uk/services');
 // Mark stale via the real endpoint; fail all contact reads before the first revalidation.
 await patch({legalName:'CEE_AUDIT_RECOVERED'});
 await pool.query('ALTER TABLE company_profile RENAME TO company_profile_audit_offline');
 for(let i=0;i<3;i++){
  for(const path of ['/uk/contacts','/uk/services']) {const r=await page(path);assert.equal(r.status,200);assert.ok(r.body.includes('CEE_AUDIT_BEFORE_FAILURE'));}
  await new Promise(r=>setTimeout(r,250));
 }
 results.push('PASS: repeated DB read failures retain last-good dynamic and ISR contact content; no empty replacement.');
 await pool.query('ALTER TABLE company_profile_audit_offline RENAME TO company_profile');
 await eventually('CEE_AUDIT_RECOVERED');
 results.push('PASS: dynamic contacts retry successfully after DB recovery; ISR can retain last-good output until its 600s TTL.');
 await patch({legalName:'CEE_AUDIT_RECOVERED_ISR'});
 await eventually('CEE_AUDIT_RECOVERED_ISR','/uk/services');
 results.push('PASS: a subsequent public edit invalidates and refreshes ISR after recovery.');
 await patch({phone:'',email:''});
 const cleared=await eventually('CEE_AUDIT_RECOVERED');
 for(let i=0;i<12;i++){ const r=await page(); if(!r.body.includes('tel:5550102'))break; if(i===11)assert.fail('Phone did not clear');await new Promise(r=>setTimeout(r,250)); }
 results.push('PASS: intentional clearing of phone is propagated, rather than treated as a DB failure.');
 assert.ok(cleared.cache.includes('no-store'));
 results.push('PASS: contacts remain private/no-store; unauthenticated admin access denied.');
 console.log(results.join('\n'));fs.writeFileSync(process.env.CEE_AUDIT_OUTPUT || '/tmp/cee-contacts-integration.log',results.join('\n')+'\n');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{
 await pool.query('ALTER TABLE IF EXISTS company_profile_audit_offline RENAME TO company_profile').catch(()=>{});await pool.end();
});
