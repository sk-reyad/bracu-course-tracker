export async function connect() {
  const targets=await (await fetch('http://127.0.0.1:9242/json')).json();
  const target=targets.find(x=>x.type==='page');
  const ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
  let id=0; const pending=new Map(); const events=[];
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}else events.push(m)};
  const send=(method,params={})=>new Promise((resolve,reject)=>{const i=++id;pending.set(i,{resolve,reject});ws.send(JSON.stringify({id:i,method,params}))});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result?.value};
  const key=async(key,modifiers=0)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,modifiers,windowsVirtualKeyCode:key==='Tab'?9:key==='Escape'?27:undefined});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,modifiers})};
  await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
  const open=async(port,width=390,theme='light')=>{events.length=0;await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'http://127.0.0.1:'+port+'/index.html?preview=1'});for(let i=0;i<100;i++){try{if(await evaluate("typeof state!=='undefined'&&!!state&&document.querySelectorAll('.course-card').length>0"))break}catch{}await new Promise(r=>setTimeout(r,100))}await evaluate("state.settings.theme="+JSON.stringify(theme)+";renderAll();true");await new Promise(r=>setTimeout(r,350))};
  return {send,evaluate,key,open,events,close:()=>ws.close()};
}
