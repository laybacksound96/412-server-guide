// 412's server guide: version picker, version banner, mod guide, mod changes.
// Each version lives in its own folder (w9/, w10/ …) with the same page names.
// versions.json (site root) lists versions newest first and names the live one in "current".
(function () {
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const parts = location.pathname.split('/');
  const page = parts.pop() || 'index.html';
  const here = parts[parts.length - 1];

  const versionsP = fetch('../versions.json').then(r => r.json());

  // ---- header picker + banner ----
  versionsP.then(v => {
    const me = v.versions.find(x => x.id === here);
    const cur = v.versions.find(x => x.id === v.current);
    const label = x => x.name + (x.id === v.current ? ' (운영 중)' : x.status === '예정' ? ' (예정)' : '');
    const box = document.getElementById('ver');
    if (box) {
      box.innerHTML = `<label class="ver"><span>버전</span><select aria-label="버전 선택">${
        v.versions.map(x => `<option value="${esc(x.id)}"${x.id === here ? ' selected' : ''}>${esc(label(x))}</option>`).join('')
      }</select></label>`;
      box.querySelector('select').addEventListener('change', e => {
        location.href = `../${e.target.value}/${page}${location.hash}`;
      });
    }
    const banner = document.getElementById('banner');
    if (banner && me && me.id !== v.current) {
      const planned = v.versions.indexOf(me) < v.versions.indexOf(cur);
      banner.innerHTML = `<div class="card note banner">${planned
        ? `아직 열리지 않은 다음 서버(<b>${esc(me.name)}</b>) 안내입니다. 내용은 리셋 전까지 바뀔 수 있습니다.`
        : `지난 버전(<b>${esc(me.name)}</b>) 안내입니다.`} 지금 서버는 <a href="../${esc(cur.id)}/${esc(page)}">${esc(cur.name)}</a>.</div>`;
    }
  });

  // previous (older) version of this folder, for NEW badges and change lists
  function prevOf(v) {
    const i = v.versions.findIndex(x => x.id === here);
    return i >= 0 && i + 1 < v.versions.length ? v.versions[i + 1] : null;
  }
  function loadMods() {
    return versionsP.then(v => {
      const prev = prevOf(v);
      return Promise.all([
        fetch('mods.json').then(r => r.json()),
        prev ? fetch(`../${prev.id}/mods.json`).then(r => r.json()).catch(() => null) : null,
        prev
      ]);
    }).then(([mods, old, prev]) => {
      if (!old) return { mods, removed: [], prev: null };
      const oldIds = new Set(old.map(m => m.id));
      const keep = new Set();
      mods.forEach(m => {
        const was = m.was || m.id;
        if (oldIds.has(was)) keep.add(was); else m._new = true;
      });
      const removed = old.filter(m => !keep.has(m.id)).map(m => ({ ...m, _gone: true }));
      return { mods, removed, prev };
    });
  }

  function block(title, arr) {
    return arr && arr.length ? `<h4>${title}</h4><ul>${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
  }
  function card(m) {
    const badge = m._new ? '<span class="tag new">NEW</span>' : m._gone ? '<span class="tag gone">빠짐</span>' : '';
    return `
    <details class="mod${m._gone ? ' gone' : ''}" id="m-${esc(m.id)}">
      <summary><span class="name">${esc(m.name)}${badge}</span><span class="cat">${esc(m.category)}</span>
        <span class="sum">${esc(m.summary)}</span></summary>
      <div class="body">
        ${block('기능', m.features)}${block('사용법', m.how)}${block('이 서버 설정', m.settings)}${block('참고', m.notes)}
        <div class="meta">모드 ID <code>${esc(m.id)}</code>${m.workshop ? ` · <a href="https://steamcommunity.com/sharedfiles/filedetails/?id=${esc(m.workshop)}" target="_blank" rel="noopener">${esc(m.title)} (창작마당)</a>` : ''}</div>
      </div>
    </details>`;
  }

  // ---- mod guide page ----
  const list = document.getElementById('list');
  if (list) {
    const q = document.getElementById('q');
    let mods = [], removed = [], cat = '전체';
    const CHANGED = '이번 버전 변경';
    const text = m => [m.name, m.title, m.id, m.category, m.summary, ...m.features, ...m.how, ...m.settings, ...m.notes].join(' ').toLowerCase();
    function render() {
      const words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const pool = cat === CHANGED ? [...mods.filter(m => m._new), ...removed] : mods.filter(m => cat === '전체' || m.category === cat);
      const shown = pool.filter(m => words.every(w => m._text.includes(w)));
      document.getElementById('count').textContent = cat === CHANGED ? `${shown.length}개` : `${shown.length} / ${mods.length}개`;
      list.innerHTML = shown.map(card).join('');
    }
    loadMods().then(r => {
      mods = r.mods.map(m => ({ ...m, _text: text(m) }));
      removed = r.removed.map(m => ({ ...m, _text: text(m) }));
      const nNew = mods.filter(m => m._new).length;
      const cats = ['전체', ...(r.prev && (nNew || removed.length) ? [CHANGED] : []), ...new Set(mods.map(m => m.category))];
      const n = c => c === '전체' ? mods.length : c === CHANGED ? `+${nNew} −${removed.length}` : mods.filter(m => m.category === c).length;
      const box = document.getElementById('cats');
      box.innerHTML = cats.map(c => `<button class="chip${c === cat ? ' on' : ''}${c === CHANGED ? ' changed' : ''}" data-c="${esc(c)}">${esc(c)} <span class="count">${n(c)}</span></button>`).join('');
      box.addEventListener('click', e => {
        const b = e.target.closest('.chip'); if (!b) return;
        cat = b.dataset.c; box.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b)); render();
      });
      q.addEventListener('input', render);
      const h = decodeURIComponent(location.hash.slice(1)); if (h) q.value = h;
      render();
    });
  }

  // ---- mod changes block on the "이번 버전" page ----
  const diff = document.getElementById('moddiff');
  if (diff) {
    loadMods().then(r => {
      if (!r.prev) { diff.innerHTML = '<p class="lead">이전 버전 기록이 없어 비교할 목록이 없습니다.</p>'; return; }
      const added = r.mods.filter(m => m._new);
      const li = (m, sign) => `<li><a href="mods.html#${encodeURIComponent(m.name)}">${esc(m.name)}</a> <span class="count">${esc(m.category)}</span>${sign === '-' ? '' : ` — ${esc(m.summary)}`}</li>`;
      diff.innerHTML = `
        <p class="lead">${esc(r.prev.name)} ${r.mods.length - added.length + r.removed.length}개 → 이번 버전 ${r.mods.length}개 (라이브러리·번역·운영 도구 제외)</p>
        <h3>새로 들어온 모드 ${added.length}개</h3><ul>${added.map(m => li(m, '+')).join('')}</ul>
        <h3>빠진 모드 ${r.removed.length}개</h3><ul class="gone-list">${r.removed.map(m => li(m, '-').replace(/<a [^>]*>(.*?)<\/a>/, '$1')).join('')}</ul>`;
    });
  }
})();
