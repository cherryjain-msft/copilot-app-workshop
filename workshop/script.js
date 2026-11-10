(() => {
  'use strict';

  const STORE = 'ford-copilot-workshop';
  const store = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(`${STORE}:${key}`);
        return value === null ? fallback : JSON.parse(value);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(`${STORE}:${key}`, JSON.stringify(value));
      } catch {
        /* storage unavailable (private mode) */
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(`${STORE}:${key}`);
      } catch {
        /* ignore */
      }
    }
  };

  const sections = Array.from(document.querySelectorAll('section.lesson'));
  const lessons = sections.filter((s) => s.dataset.num !== undefined);
  const routeList = document.getElementById('route-list');
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');
  const done = new Set(store.get('done', []));

  // Theme
  const themeBtn = document.getElementById('theme-toggle');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
  applyTheme(store.get('theme', prefersDark ? 'dark' : 'light'));
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    store.set('theme', next);
    applyTheme(next);
  });

  // Presenter notes
  const presenterBtn = document.getElementById('presenter-toggle');
  function applyPresenter(on) {
    document.body.classList.toggle('show-presenter', on);
    presenterBtn.setAttribute('aria-pressed', String(on));
  }
  applyPresenter(store.get('presenter', false));
  presenterBtn.addEventListener('click', () => {
    const on = presenterBtn.getAttribute('aria-pressed') !== 'true';
    store.set('presenter', on);
    applyPresenter(on);
  });

  // Mobile route menu
  const menuBtn = document.getElementById('menu-toggle');
  menuBtn.addEventListener('click', () => {
    const open = !document.body.classList.contains('route-open');
    document.body.classList.toggle('route-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  });

  // Route navigation
  function buildRoute() {
    routeList.innerHTML = '';
    for (const section of sections) {
      const li = document.createElement('li');
      li.dataset.target = section.id;
      const a = document.createElement('a');
      a.href = `#${section.id}`;
      const num = document.createElement('span');
      num.className = 'num';
      num.setAttribute('aria-hidden', 'true');
      num.textContent = section.dataset.num ?? '★';
      const label = document.createElement('span');
      label.textContent = section.dataset.title;
      if (section.dataset.time) {
        const meta = document.createElement('span');
        meta.className = 'meta';
        meta.textContent = section.dataset.time;
        label.appendChild(meta);
      }
      a.append(num, label);
      li.appendChild(a);
      routeList.appendChild(li);
    }
  }

  function refreshProgress() {
    const complete = lessons.filter((s) => done.has(s.id)).length;
    progressText.textContent = `${complete} / ${lessons.length} complete`;
    progressFill.style.width = `${Math.round((complete / lessons.length) * 100)}%`;
    for (const li of routeList.children) {
      const isDone = done.has(li.dataset.target);
      li.classList.toggle('done', isDone);
      const num = li.querySelector('.num');
      const section = document.getElementById(li.dataset.target);
      num.textContent = isDone ? '✓' : (section.dataset.num ?? '★');
    }
    for (const btn of document.querySelectorAll('.complete-btn')) {
      const isDone = done.has(btn.dataset.target);
      btn.setAttribute('aria-pressed', String(isDone));
      btn.textContent = isDone ? '✓ Lesson complete' : 'Mark lesson complete';
    }
  }

  // Per-lesson footer: notes, prev/next, complete
  function buildLessonFooters() {
    sections.forEach((section, i) => {
      if (section.dataset.num !== undefined) {
        const notes = document.createElement('div');
        notes.className = 'notes';
        const id = `notes-${section.id}`;
        notes.innerHTML = `<label for="${id}">📝 Your notes for this lesson</label>
          <textarea id="${id}" placeholder="Capture questions, customer reactions or follow-ups. Notes stay in this browser."></textarea>
          <div class="saved" aria-live="polite"></div>`;
        const textarea = notes.querySelector('textarea');
        const saved = notes.querySelector('.saved');
        textarea.value = store.get(`notes:${section.id}`, '');
        let timer;
        textarea.addEventListener('input', () => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            store.set(`notes:${section.id}`, textarea.value);
            saved.textContent = `Saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          }, 400);
        });
        section.appendChild(notes);
      }

      const actions = document.createElement('div');
      actions.className = 'lesson-actions';
      const prev = sections[i - 1];
      const next = sections[i + 1];
      const prevLink = document.createElement('a');
      prevLink.className = 'btn';
      if (prev) {
        prevLink.href = `#${prev.id}`;
        prevLink.textContent = `← ${prev.dataset.title}`;
      } else {
        prevLink.style.visibility = 'hidden';
        prevLink.textContent = '←';
      }
      actions.appendChild(prevLink);

      if (section.dataset.num !== undefined) {
        const complete = document.createElement('button');
        complete.type = 'button';
        complete.className = 'btn complete-btn';
        complete.dataset.target = section.id;
        complete.addEventListener('click', () => {
          if (done.has(section.id)) done.delete(section.id);
          else done.add(section.id);
          store.set('done', Array.from(done));
          refreshProgress();
        });
        actions.appendChild(complete);
      }

      const nextLink = document.createElement('a');
      nextLink.className = 'btn btn-primary';
      if (next) {
        nextLink.href = `#${next.id}`;
        nextLink.textContent = `${next.dataset.title} →`;
      } else {
        nextLink.href = `#${sections[0].id}`;
        nextLink.textContent = 'Back to overview ↺';
      }
      actions.appendChild(nextLink);
      section.appendChild(actions);
    });
  }

  let current = null;
  function show(hash, { focus = true } = {}) {
    const raw = decodeURIComponent((hash || '').replace(/^#/, ''));
    let section = sections.find((s) => s.id === raw);
    let anchor = null;
    if (!section && raw) {
      anchor = document.getElementById(raw);
      section = anchor ? anchor.closest('section.lesson') : null;
    }
    if (!section) section = sections[0];

    if (current !== section) {
      for (const s of sections) s.hidden = s !== section;
      current = section;
      document.title = `${section.dataset.title} · Copilot app workshop · Ford`;
      for (const li of routeList.children) {
        const a = li.querySelector('a');
        if (li.dataset.target === section.id) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      }
    }

    document.body.classList.remove('route-open');
    menuBtn.setAttribute('aria-expanded', 'false');

    if (anchor) {
      anchor.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
      if (focus) {
        const heading = section.querySelector('h1');
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus({ preventScroll: true });
        }
      }
    }
  }

  window.addEventListener('hashchange', () => show(location.hash));

  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = event.target;
    if (target.closest('input, textarea, select, [contenteditable], [role="tab"]')) return;
    const index = sections.indexOf(current);
    if (event.key === 'ArrowRight' && sections[index + 1]) {
      location.hash = sections[index + 1].id;
    } else if (event.key === 'ArrowLeft' && sections[index - 1]) {
      location.hash = sections[index - 1].id;
    }
  });

  // Reset
  document.getElementById('reset-lab').addEventListener('click', () => {
    if (!window.confirm('Reset progress and clear all notes for this workshop?')) return;
    done.clear();
    store.remove('done');
    for (const s of lessons) {
      store.remove(`notes:${s.id}`);
      const textarea = document.getElementById(`notes-${s.id}`);
      if (textarea) textarea.value = '';
    }
    refreshProgress();
  });

  // Copy buttons on prompt blocks
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      area.remove();
      return ok;
    }
  }

  for (const block of document.querySelectorAll('.prompt')) {
    const pre = block.querySelector('pre');
    const head = document.createElement('div');
    head.className = 'prompt-head';
    const label = document.createElement('span');
    label.textContent = block.dataset.label || 'Prompt';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', `Copy ${label.textContent.toLowerCase()}`);
    btn.addEventListener('click', async () => {
      const ok = await copyText(pre.textContent.trim());
      btn.textContent = ok ? 'Copied ✓' : 'Press Ctrl+C';
      btn.classList.toggle('copied', ok);
      if (!ok) {
        const range = document.createRange();
        range.selectNodeContents(pre);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 1800);
    });
    head.append(label, btn);
    block.insertBefore(head, pre);
  }

  // Tabs
  let tabSeq = 0;
  for (const tabs of document.querySelectorAll('.tabs')) {
    const tablist = tabs.querySelector('.tablist');
    tablist.setAttribute('role', 'tablist');
    const buttons = Array.from(tablist.querySelectorAll('button'));
    const panels = Array.from(tabs.querySelectorAll(':scope > .tabpanel'));
    buttons.forEach((btn, i) => {
      tabSeq += 1;
      const tabId = `tab-${tabSeq}`;
      const panelId = `tabpanel-${tabSeq}`;
      btn.type = 'button';
      btn.id = tabId;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-controls', panelId);
      panels[i].id = panelId;
      panels[i].setAttribute('role', 'tabpanel');
      panels[i].setAttribute('aria-labelledby', tabId);
      panels[i].tabIndex = 0;
    });
    function select(index, focus) {
      buttons.forEach((btn, i) => {
        const selected = i === index;
        btn.setAttribute('aria-selected', String(selected));
        btn.tabIndex = selected ? 0 : -1;
        panels[i].hidden = !selected;
      });
      if (focus) buttons[index].focus();
    }
    buttons.forEach((btn, i) => {
      btn.addEventListener('click', () => select(i, false));
      btn.addEventListener('keydown', (event) => {
        let next = null;
        if (event.key === 'ArrowRight') next = (i + 1) % buttons.length;
        else if (event.key === 'ArrowLeft') next = (i - 1 + buttons.length) % buttons.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = buttons.length - 1;
        if (next !== null) {
          event.preventDefault();
          select(next, true);
        }
      });
    });
    select(0, false);
  }

  buildRoute();
  buildLessonFooters();
  refreshProgress();
  show(location.hash, { focus: false });
})();
