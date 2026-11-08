export async function connect() {
  const targets = await (await fetch('http://127.0.0.1:9246/json')).json();
  const page = targets.find(t => t.type === 'page');
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  const listeners = new Map();
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, {resolve, reject});
    socket.send(JSON.stringify({id, method, params}));
  });
  socket.onmessage = ({data}) => {
    const {id, result, error, method, params} = JSON.parse(data);
    if (id) {
      const request = pending.get(id);
      pending.delete(id);
      if (error) request.reject(Error(error.message));
      else request.resolve(result);
    } else listeners.get(method)?.(params);
  };
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
    if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const key = async (name, repeat = false) => {
    const codes = {Enter: 13, Space: 32, Tab: 9, Escape: 27};
    const info = {key: name === 'Space' ? ' ' : name, code: name, windowsVirtualKeyCode: codes[name]};
    const text = {Enter: '\r', Space: ' ', Tab: ''}[name];
    await send('Input.dispatchKeyEvent', {type: 'keyDown', ...info, text, unmodifiedText: text, autoRepeat: repeat});
    await send('Input.dispatchKeyEvent', {type: 'keyUp', ...info});
  };
  const click = async ({x, y}) => {
    await send('Input.dispatchMouseEvent', {type: 'mouseMoved', x, y});
    for (const type of ['mousePressed', 'mouseReleased'])
      await send('Input.dispatchMouseEvent', {type, button: 'left', clickCount: 1, x, y});
  };
  return {send, evaluate, key, click, on: (method, fn) => listeners.set(method, fn), close: () => socket.close()};
}
