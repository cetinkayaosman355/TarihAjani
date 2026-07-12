// Tarih Ajanı — CANLI HAT (site geneli sohbet widget'ı)
// Sağ altta yüzen düğme; mesajlar "chat" edge fonksiyonu üzerinden
// Supabase'e düşer, yanıtlar Admin panelinden gelir. Ziyaretçi kimliği
// localStorage'daki rastgele oturum anahtarıdır (ta_chat_v1).
(function () {
  var FN = 'https://ddyuopqcvpzaysnfavqc.supabase.co/functions/v1/chat';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeXVvcHFjdnB6YXlzbmZhdnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMzAxMjAsImV4cCI6MjA5ODkwNjEyMH0.0nTnXFFrPNlxWC_MIeRwqBCqgdYX_tG7WVUbsj0B6Cc';
  var LS = 'ta_chat_v1';
  var FONT = "'Special Elite', 'Courier New', monospace";

  var st = { thread: '', name: '', email: '', lastId: 0 };
  try { st = Object.assign(st, JSON.parse(localStorage.getItem(LS) || '{}')); } catch (e) {}
  function save() { try { localStorage.setItem(LS, JSON.stringify(st)); } catch (e) {} }
  function newThread() {
    if (st.thread) return st.thread;
    st.thread = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
      : 'ta-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    save();
    return st.thread;
  }

  async function call(payload) {
    var r = await fetch(FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON },
      body: JSON.stringify(payload)
    });
    return r.json().catch(function () { return { ok: false }; });
  }

  var panel = null, msgBox = null, pollTimer = null, open = false;

  function bubble(text, who) {
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;margin:6px 0;justify-content:' + (who === 'ziyaretci' ? 'flex-end' : 'flex-start') + ';';
    var b = document.createElement('div');
    b.textContent = text;
    b.style.cssText = 'max-width:82%;padding:9px 12px;font-size:13px;line-height:1.5;border:1px solid ' +
      (who === 'ziyaretci' ? 'rgba(193,154,82,.4);background:rgba(193,154,82,.13);color:#e9dfc8;'
        : who === 'ajan' ? 'rgba(129,135,151,.3);background:#0b0e18;color:#cfc8b4;'
          : 'rgba(129,135,151,.2);background:transparent;color:#818797;font-size:12px;');
    row.appendChild(b);
    if (msgBox) { msgBox.appendChild(row); msgBox.scrollTop = msgBox.scrollHeight; }
  }

  async function poll() {
    if (!st.thread) return;
    var d = await call({ action: 'fetch', thread: st.thread, afterId: st.lastId });
    if (d && d.ok && d.messages) {
      d.messages.forEach(function (m) {
        if (m.id > st.lastId) {
          st.lastId = m.id;
          if (m.sender === 'ajan') bubble(m.text, 'ajan');
        }
      });
      save();
    }
  }
  function startPoll() { stopPoll(); pollTimer = setInterval(poll, 7000); }
  function stopPoll() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

  function buildPanel() {
    panel = document.createElement('div');
    panel.id = 'ta-chat-panel';
    panel.style.cssText = 'position:fixed;right:18px;bottom:88px;z-index:999;width:min(340px,92vw);height:min(480px,72vh);' +
      'display:flex;flex-direction:column;background:#05070d;border:1px solid rgba(193,154,82,.5);' +
      'box-shadow:0 24px 70px rgba(0,0,0,.65);font-family:' + FONT + ';';

    var head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 15px;border-bottom:1px solid rgba(193,154,82,.25);';
    head.innerHTML = '<div style="display:flex;align-items:center;gap:8px;">' +
      '<span style="width:8px;height:8px;border-radius:50%;background:#9ed3a8;box-shadow:0 0 8px rgba(158,211,168,.8);"></span>' +
      '<span style="font-size:12px;letter-spacing:.18em;color:#e6c478;">CANLI HAT</span></div>';
    var x = document.createElement('button');
    x.textContent = '×';
    x.style.cssText = 'border:0;background:transparent;color:#818797;font-size:20px;cursor:pointer;line-height:1;padding:0 2px;';
    x.onclick = closePanel;
    head.appendChild(x);
    panel.appendChild(head);

    msgBox = document.createElement('div');
    msgBox.style.cssText = 'flex:1;overflow-y:auto;padding:12px 14px;';
    panel.appendChild(msgBox);
    bubble('Hoş geldin, ajan. Ben Ajan Asistan — ürünler, üyelik ve Studio hakkında sorularını anında yanıtlarım. İnsan desteği istersen e-postanı bırakman yeterli.', 'sistem');

    var meta = document.createElement('div');
    meta.id = 'ta-chat-meta';
    meta.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 14px 8px;';
    function metaInput(ph, val) {
      var i = document.createElement('input');
      i.placeholder = ph; i.value = val || ''; i.maxLength = 120;
      i.style.cssText = 'border:1px solid rgba(129,135,151,.3);background:#02040a;color:#cfc8b4;padding:9px 10px;font-size:12px;font-family:inherit;min-width:0;';
      meta.appendChild(i); return i;
    }
    var nameIn = metaInput('Adın (isteğe bağlı)', st.name);
    var mailIn = metaInput('E-posta (dönüş için)', st.email);
    panel.appendChild(meta);

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;padding:0 14px 14px;';
    var input = document.createElement('input');
    input.placeholder = 'Mesajını yaz…'; input.maxLength = 600;
    input.style.cssText = 'flex:1;border:1px solid rgba(129,135,151,.35);background:#02040a;color:#fff;padding:12px;font-size:13px;font-family:inherit;min-width:0;';
    var send = document.createElement('button');
    send.textContent = 'GÖNDER';
    send.style.cssText = 'border:0;cursor:pointer;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;' +
      'font-family:' + FONT + ';font-weight:800;font-size:11px;letter-spacing:.1em;padding:12px 14px;';
    async function doSend() {
      var text = input.value.trim();
      if (!text) return;
      st.name = nameIn.value.trim(); st.email = mailIn.value.trim(); save();
      input.value = '';
      bubble(text, 'ziyaretci');
      // "yazıyor…" göstergesi — asistan yanıtı send cevabıyla birlikte gelir
      var typing = document.createElement('div');
      typing.textContent = 'Ajan Asistan yazıyor…';
      typing.style.cssText = 'margin:6px 0;font-size:11.5px;color:#676d7c;font-style:italic;';
      if (msgBox) { msgBox.appendChild(typing); msgBox.scrollTop = msgBox.scrollHeight; }
      var d = await call({ action: 'send', thread: newThread(), name: st.name, email: st.email, text: text });
      if (typing.parentElement) typing.parentElement.removeChild(typing);
      if (d && d.ok) {
        if (d.id) st.lastId = Math.max(st.lastId, d.id);
        if (d.reply && d.reply.text) {
          bubble(d.reply.text, 'ajan');
          if (d.reply.id) st.lastId = Math.max(st.lastId, d.reply.id);
        }
        save();
      } else {
        bubble('Mesaj iletilemedi — bağlantını kontrol edip tekrar dene.', 'sistem');
      }
      try { if (typeof window.taTrack === 'function') window.taTrack('chat_message'); } catch (e) {}
    }
    send.onclick = doSend;
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSend(); });
    row.appendChild(input); row.appendChild(send);
    panel.appendChild(row);

    document.body.appendChild(panel);
    setTimeout(function () { input.focus(); }, 60);
  }

  function openPanel() {
    if (!panel) buildPanel();
    panel.style.display = 'flex';
    open = true;
    poll(); startPoll();
    try { if (typeof window.taTrack === 'function') window.taTrack('chat_open'); } catch (e) {}
  }
  function closePanel() {
    if (panel) panel.style.display = 'none';
    open = false;
    stopPoll();
  }

  function ensureButton() {
    if (document.getElementById('ta-chat-btn')) return;
    var b = document.createElement('button');
    b.id = 'ta-chat-btn';
    b.title = 'Canlı Hat — bize yaz';
    b.textContent = '💬';
    b.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:998;width:56px;height:56px;border-radius:50%;' +
      'border:1px solid rgba(23,18,7,.45);cursor:pointer;font-size:23px;line-height:1;' +
      'background:linear-gradient(135deg,#a77d35,#d8b26a 55%,#c19a52);color:#171207;' +
      'box-shadow:0 10px 34px rgba(0,0,0,.5), 0 0 0 1px rgba(193,154,82,.35);';
    b.onclick = function () { open ? closePanel() : openPanel(); };
    document.body.appendChild(b);
    // panel DOM'dan düşmüşse (framework gövdeyi yeniden kurduysa) durumu sıfırla
    if (panel && !document.body.contains(panel)) { panel = null; msgBox = null; if (open) openPanel(); }
  }

  function init() {
    ensureButton();
    // dc framework gövdeyi geç/yeniden kurabilir → düğmeyi periyodik garanti et
    setInterval(ensureButton, 4000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
