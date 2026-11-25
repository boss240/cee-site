const test=require('node:test'),a=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript');
function load(path,deps={},env={},extra={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,AbortSignal,process:{env},console:{info(){}},require:n=>{a(n in deps,n);return deps[n]},...extra});return exports}
const CH='https://t.me/cee_energy';
const tg=env=>load('lib/telegram.ts',{},env);
const channel=env=>load('lib/telegram/channel.ts',{'drizzle-orm':{},'@/lib/db':{},'@/lib/siteUrl':{},'@/lib/telegram':tg(env)},env);

test('channel chat id comes from the public URL or an explicit id',()=>{
  a.equal(tg({NEXT_PUBLIC_TELEGRAM_CHANNEL_URL:CH}).ceeChannelChatId(),'@cee_energy');
  a.equal(tg({TELEGRAM_CHANNEL_ID:'-1001234567890'}).ceeChannelChatId(),'-1001234567890');
  a.equal(tg({TELEGRAM_CHANNEL_ID:'not valid'}).ceeChannelChatId(),null);
  a.equal(tg({}).ceeChannelChatId(),null);
});

test('config states: no token, conflict with leads chat, ready',()=>{
  const base={NEXT_PUBLIC_TELEGRAM_CHANNEL_URL:CH};
  a.equal(channel(base).channelConfig(base).state,'no_token');
  const conflict={...base,TELEGRAM_CHANNEL_BOT_TOKEN:'x',TELEGRAM_CHAT_ID:'12345, @CEE_energy'};
  a.equal(channel(conflict).channelConfig(conflict).state,'conflict');
  const ready={...base,TELEGRAM_CHANNEL_BOT_TOKEN:'x',TELEGRAM_CHAT_ID:'12345',CEE_TELEGRAM_AUTOPUBLISH:'true'};
  const c=channel(ready).channelConfig(ready);a.equal(c.state,'ready');a.equal(c.autopublish,true);
  a.equal(channel({}).channelConfig({}).state,'no_channel');
});

test('post text escapes HTML, links to the site and stays short',()=>{
  const m=channel({});
  const {text,url}=m.buildChannelText({title:'Тарифи <2027> & ОСББ',summary:'**Головне**: [деталі](https://x.y). '+'Дуже довге речення. '.repeat(60),path:'/uk/blog/taryfy'},'https://cee.energy');
  a.equal(url,'https://cee.energy/uk/blog/taryfy');
  a.ok(text.startsWith('<b>Тарифи &lt;2027&gt; &amp; ОСББ</b>'));
  a.ok(!text.includes('**')&&!text.includes('https://x.y'));
  a.ok(text.endsWith('<a href="https://cee.energy/uk/blog/taryfy">Читати на сайті →</a>'));
  a.ok(text.length<700);
});

test('lead notifications never go to the public channel',async()=>{
  const sent=[];const env={TELEGRAM_BOT_TOKEN:'SECRET',TELEGRAM_CHAT_ID:'private, @cee_energy',NEXT_PUBLIC_TELEGRAM_CHANNEL_URL:CH};
  const m=load('lib/notify/telegram.ts',{},env,{fetch:async(_u,o)=>{sent.push(JSON.parse(o.body).chat_id);return {ok:true,json:async()=>({ok:true})}}});
  const r=await m.sendTelegram('lead');
  a.deepEqual(sent,['private']);a.equal(r.total,1);
});
