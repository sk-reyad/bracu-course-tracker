import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';

const output = path.join(path.dirname(fileURLToPath(import.meta.url)), 'evidence');
for (const dir of ['screenshots', 'traces', 'captures'])
  fs.mkdirSync(path.join(output, dir), {recursive: true});
const save = (name, data) => fs.writeFileSync(path.join(output, name), JSON.stringify(data, null, 2) + '\n');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const {send, evaluate, key, click, on, close} = await connect();
let context = '', frames;
const diagnostics = [];
const record = (kind, message) => diagnostics.push({context, kind, message});
on('Log.entryAdded', ({entry}) => record(entry.level, [entry.text, entry.url].filter(Boolean).join(' ')));
on('Runtime.exceptionThrown', ({exceptionDetails: e}) => record('exception', e.exception?.description || e.text));
on('Runtime.consoleAPICalled', e => {
  if (['warning','error','assert'].includes(e.type))
    record(e.type, e.args.map(a => a.value ?? a.description).join(' '));
});
on('Page.screencastFrame', e => {
  if (frames) frames.push({time: e.metadata.timestamp, jpeg: e.data});
  void send('Page.screencastFrameAck', {sessionId: e.sessionId});
});
const button = "document.getElementById('backToTopBtn')";
async function until(expression) {
  for (let i = 0; i < 160; i++) {
    if (await evaluate(expression)) return;
    await sleep(50);
  }
  throw Error('Timed out in ' + context + ' waiting for ' + expression);
}
function installProbe() {
  const b = document.getElementById('backToTopBtn');
  const originalScroll = window.scrollTo.bind(window);
  let run;
  const active = () => document.activeElement?.id || document.activeElement?.tagName;
  const snapshot = () => {
    const s = getComputedStyle(b), r = b.getBoundingClientRect();
    return {y: scrollY, active: active(), visibleClass: b.classList.contains('is-visible'),
      visibility: s.visibility, opacity: s.opacity, focusVisible: b.matches(':focus-visible'),
      background: s.backgroundColor, shadow: s.boxShadow, outline: s.outline, pointerEvents: s.pointerEvents,
      x: r.x, top: r.y, width: r.width, height: r.height};
  };
  const now = () => Math.round((performance.now() - run.start) * 100) / 100;
  for (const type of ['keydown','keyup','pointerdown','pointerup','click','focusin','focusout']) {
    document.addEventListener(type, event => {
      if (run) run.events.push({ms: now(), type, target: event.target.closest?.('button')?.id || event.target.id || event.target.tagName,
        active: active(), trusted: event.isTrusted, key: event.key, detail: event.detail, pointerType: event.pointerType});
    }, true);
  }
  window.scrollTo = (...args) => {
    if (!run) return originalScroll(...args);
    const call = {ms: now(), args, before: scrollY};
    const result = originalScroll(...args);
    call.after = scrollY;
    call.returnMs = now();
    run.calls.push(call);
    return result;
  };
  window.probe = {
    position(y) {
      document.activeElement?.blur();
      originalScroll({top: y, behavior: 'instant'});
    },
    begin() {
      run = {start: performance.now(), initial: snapshot(), events: [], calls: [], frames: []};
      const current = run;
      function sample() {
        if (current !== run) return;
        run.frames.push({ms: now(), y: scrollY, active: active(), visibleClass: b.classList.contains('is-visible')});
        requestAnimationFrame(sample);
      }
      sample();
    },
    finish() { const data = {...run, settled: snapshot()}; run = undefined; return data; },
    snapshot
  };
}
async function screenshot(name) {
  const {data} = await send('Page.captureScreenshot', {format: 'png', captureBeyondViewport: false});
  fs.writeFileSync(path.join(output, 'screenshots', name + '.png'), Buffer.from(data, 'base64'));
}
async function activate(version, width, theme, motion, input, distance, rapid = false) {
  const id = [version, width, theme, motion, rapid ? 'rapid-Enter' : input].join('-');
  context = id;
  await send('Input.dispatchMouseEvent', {type:'mouseMoved', x:5, y:5});
  await evaluate('probe.position(' + distance + ')');
  await until(button + ".classList.contains('is-visible') && getComputedStyle(" + button + ").visibility === 'visible'");
  if (input !== 'pointer' && input !== 'programmatic') {
    await evaluate("document.querySelector('.footer-disclaimer a').focus({preventScroll:true})");
    assert(await evaluate("document.hasFocus() && document.activeElement.matches('.footer-disclaimer a')"), id + ' preceding footer link');
    await key('Tab');
    assert(await evaluate('document.activeElement === ' + button), id + ' Tab reachability');
  }
  await sleep(220);
  await until(button + ".getAnimations().every(a => a.playState !== 'running' && !a.pending)");
  const illustrated = input === 'Enter' && !rapid && [390,1440].includes(width) &&
    (motion === 'no-preference' && theme === 'light' || motion === 'reduce' && theme === 'dark');
  const film = illustrated && width === 390 && theme === 'light';
  if (illustrated) await screenshot(id + '-initial');
  if (film) {
    frames = [];
    await send('Page.startScreencast', {format:'jpeg', quality:75, maxWidth:390, maxHeight:800, everyNthFrame:1});
    await sleep(130);
  }
  const actual = await evaluate("({theme:document.documentElement.getAttribute('data-theme'),reduce:matchMedia('(prefers-reduced-motion: reduce)').matches,rootBehavior:getComputedStyle(document.documentElement).scrollBehavior,client:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,innerWidth,innerHeight,label:" + button + ".getAttribute('aria-label')})");
  await evaluate('probe.begin()');
  if (input === 'pointer') {
    const {x,top,width:w,height:h} = await evaluate('probe.snapshot()');
    await click({x:x+w/2,y:top+h/2});
  } else if (input === 'programmatic') {
    await evaluate(button + '.click()');
  } else {
    await key(input);
    if (rapid) { await key(input); await key(input); }
  }
  await until("window.scrollY === 0 && getComputedStyle(" + button + ").visibility === 'hidden'");
  await sleep(100);
  const result = await evaluate('probe.finish()');
  if (film) {
    await send('Page.stopScreencast');
    save('captures/' + version + '.json', frames);
    frames = undefined;
  }
  if (illustrated) await screenshot(id + '-settled');
  return {id, version, width, theme, motion, input, rapid, distance, actual, ...result};
}
try {
  for (const domain of ['Runtime','Page','Log']) await send(domain + '.enable');
  save('browser.json', await send('Browser.getVersion'));
  for (const [version,port] of [['before',4310],['after',4311]]) {
    context = version + '-load';
    await send('Page.bringToFront');
    await send('Page.navigate', {url: 'http://127.0.0.1:' + port + '/index.html?preview=1'});
    await until("typeof state !== 'undefined' && !!state && document.querySelectorAll('.course-card').length > 0");
    await evaluate('(' + installProbe.toString() + ')()');
    for (const width of [360,390,768,1024,1440]) {
      await send('Emulation.setDeviceMetricsOverride', {width,height:800,deviceScaleFactor:1,mobile:false});
      const rows = [];
      for (const theme of ['light','dark']) {
        await evaluate("state.settings.theme=" + JSON.stringify(theme) + "; renderAll(); true");
        for (const motion of ['no-preference','reduce']) {
          await send('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:motion}]});
          for (const [input,y] of [['pointer',900],['Enter',1650],['Space',2450]])
            rows.push(await activate(version,width,theme,motion,input,y));
          if (width === 1440 && theme === 'dark') {
            rows.push(await activate(version,width,theme,motion,'Enter',1800,true));
            rows.push(await activate(version,width,theme,motion,'programmatic',1200));
          }
        }
      }
      save('traces/' + version + '-' + width + '.json', rows);
      console.log(version, width, rows.length);
    }
  }
} finally {
  save('diagnostics.json', diagnostics);
  close();
}
