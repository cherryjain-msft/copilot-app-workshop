(() => {
  'use strict';

  const PREFIX = 'copilot-learner-guide:v1:';
  const pages = Array.from(document.querySelectorAll('[data-page]'));
  const lessons = pages.filter((page) => page.hasAttribute('data-lesson'));
  const lessonIds = lessons.map((lesson) => lesson.id);
  const message = document.getElementById('message');
  const storageWarning = document.getElementById('storage-warning');
  let messageTimer;
  let storageWarningShown = false;

  function announce(text) {
    clearTimeout(messageTimer);
    message.textContent = text;
    messageTimer = setTimeout(() => { message.textContent = ''; }, 8000);
  }

  function storageProblem(error, reading) {
    storageWarning.hidden = false;
    storageWarning.textContent = reading
      ? 'Some saved data could not be read. You can still use the guide. Keep this tab open and export your notebook before leaving; do not rely on browser storage.'
      : 'Your latest changes could not be saved in this browser. Keep this tab open and export your notebook before leaving.';
    if (!storageWarningShown) {
      console.warn('Learner guide storage is unavailable or invalid:', error.name);
      storageWarningShown = true;
    }
  }

  function readStored(key, fallback, valid) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      const value = JSON.parse(raw);
      if (!valid(value)) throw new TypeError('Invalid learner guide storage');
      return value;
    } catch (error) {
      storageProblem(error, true);
      return fallback;
    }
  }

  function writeStored(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (error) {
      storageProblem(error, false);
      return false;
    }
  }

  const completed = new Set(readStored('complete', [], (value) =>
    Array.isArray(value) && value.every((id) => lessonIds.includes(id))));
  const notes = new Map();
  const reflection = {
    'first-session': 'What did you verify yourself, and which actions did you keep outside the task?',
    projects: 'What did the Project coordinate? Which repository, Library, and Overview evidence did you inspect?',
    delivery: 'Which boundary or regression test changed your confidence in the implementation?',
    parallel: 'Record the two paths, branches, and starting SHAs. What was actually isolated?',
    automations: 'What trigger, identity, tools, cost limits, and stop condition did you verify?',
    'jira-story': 'Which stage is actually complete? What Jira/GitHub write still needs a human decision?',
    fusion: 'Record your choices, actual measurements, scores, and the limits of the comparison.'
  };

  function refreshProgress() {
    const count = completed.size;
    document.getElementById('course-progress').value = count;
    document.getElementById('course-progress').textContent = `${count} of ${lessons.length}`;
    document.getElementById('progress-count').textContent = `${count} of ${lessons.length}`;
    for (const lesson of lessons) {
      const done = completed.has(lesson.id);
      const button = lesson.querySelector('.complete-button');
      button.setAttribute('aria-pressed', String(done));
      button.textContent = done ? 'Lesson marked complete' : 'Mark lesson complete';
      document.querySelector(`[data-route="${lesson.id}"] .nav-check`).hidden = !done;
    }
    const next = lessons.find((lesson) => !completed.has(lesson.id));
    const start = document.getElementById('start-learning');
    start.href = next ? `#${next.id}` : '#next-steps';
    start.textContent = count === 0 ? 'Start learning \u2192'
      : next ? 'Continue learning \u2192' : 'Explore next steps \u2192';
  }

  pages.forEach((page, index) => {
    if (lessonIds.includes(page.id)) {
      const notebook = document.createElement('div');
      notebook.className = 'notebook';
      const title = document.createElement('h2');
      title.textContent = 'Pause and reflect';
      const label = document.createElement('label');
      label.htmlFor = `notes-${page.id}`;
      label.textContent = reflection[page.id];
      const textarea = document.createElement('textarea');
      textarea.id = label.htmlFor;
      textarea.maxLength = 10000;
      textarea.placeholder = 'Your notes stay in this browser. Do not enter secrets.';
      textarea.value = readStored(`notes:${page.id}`, '', (value) =>
        typeof value === 'string' && value.length <= 10000);
      const status = document.createElement('p');
      status.className = 'note-status';
      status.setAttribute('role', 'status');
      status.textContent = 'Browser-local notes. Export a copy when you finish.';
      const printable = document.createElement('p');
      printable.className = 'print-note';
      printable.textContent = textarea.value;
      textarea.addEventListener('input', () => {
        printable.textContent = textarea.value;
        const saved = writeStored(`notes:${page.id}`, textarea.value);
        status.textContent = saved ? 'Saved in this browser.' : 'Not saved. Export your notebook before leaving.';
      });
      notes.set(page.id, textarea);
      notebook.append(title, label, textarea, status, printable);
      page.appendChild(notebook);
    }

    const actions = document.createElement('div');
    actions.className = 'lesson-actions';
    if (index > 0) {
      const back = document.createElement('a');
      back.className = 'button';
      back.href = `#${pages[index - 1].id}`;
      back.textContent = '\u2190 Previous';
      actions.appendChild(back);
    }
    if (lessonIds.includes(page.id)) {
      const complete = document.createElement('button');
      complete.type = 'button';
      complete.className = 'button complete-button';
      complete.addEventListener('click', () => {
        if (completed.has(page.id)) completed.delete(page.id);
        else completed.add(page.id);
        const saved = writeStored('complete', Array.from(completed));
        refreshProgress();
        if (!saved) announce('Completion changed for this tab only. Browser storage could not be updated.');
      });
      actions.appendChild(complete);
    }
    if (index < pages.length - 1) {
      const next = document.createElement('a');
      next.className = 'button primary';
      next.href = `#${pages[index + 1].id}`;
      next.textContent = index === 0 ? 'Go to lesson 1 \u2192' : 'Continue \u2192';
      actions.appendChild(next);
    }
    page.appendChild(actions);
  });
  refreshProgress();

  const themeToggle = document.getElementById('theme-toggle');
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    themeToggle.textContent = theme === 'dark' ? 'Light theme' : 'Dark theme';
    themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  }
  const themeParameter = new URLSearchParams(location.search).get('scoutTheme');
  const savedTheme = readStored('theme', document.documentElement.dataset.theme,
    (value) => value === 'light' || value === 'dark');
  applyTheme(['light', 'dark'].includes(themeParameter) ? themeParameter : savedTheme);
  themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    writeStored('theme', theme);
  });

  const menuToggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('learning-nav');
  function closeMenu() {
    document.body.classList.remove('nav-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
  menuToggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (event) => {
    if (!nav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('nav-open')) {
      closeMenu();
      menuToggle.focus();
    }
  });
  document.querySelector('.skip-link').addEventListener('click', (event) => {
    event.preventDefault();
    document.getElementById('main').focus();
    closeMenu();
  });

  function showPage(moveFocus) {
    const target = document.getElementById(location.hash.slice(1));
    const selected = target?.closest('[data-page]') || pages[0];
    for (const page of pages) page.hidden = page !== selected;
    for (const link of document.querySelectorAll('[data-route]')) {
      if (link.dataset.route === selected.id) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    const heading = selected.querySelector('h1');
    document.title = `${heading.innerText.replace(/\s+/g, ' ').trim()} | Copilot app learner guide`;
    closeMenu();
    if (moveFocus) {
      const focusTarget = target?.closest('[data-page]') ? target : heading;
      if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
      focusTarget.focus({ preventScroll: true });
      focusTarget.scrollIntoView({ block: 'start' });
    } else if (target && target !== selected) {
      target.scrollIntoView({ block: 'start' });
    }
  }
  window.addEventListener('hashchange', () => showPage(true));
  showPage(false);

  for (const button of document.querySelectorAll('.copy-button')) {
    button.addEventListener('click', async () => {
      const pre = button.closest('.prompt').querySelector('pre');
      try {
        if (!navigator.clipboard?.writeText) throw new DOMException('Clipboard not available', 'NotSupportedError');
        await navigator.clipboard.writeText(pre.textContent);
        announce('Copied. Review the text before sending or running it.');
      } catch (error) {
        console.warn('Learner guide clipboard access failed:', error.name);
        pre.focus();
        const range = document.createRange();
        range.selectNodeContents(pre);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        announce('Clipboard access is unavailable. The prompt is selected; copy it manually with Ctrl+C or Command+C.');
      }
    });
  }

  for (const form of document.querySelectorAll('.knowledge-check')) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const selected = form.querySelector('input:checked');
      const feedback = form.querySelector('.quiz-feedback');
      feedback.hidden = false;
      if (!selected) {
        feedback.dataset.result = 'retry';
        feedback.textContent = 'Choose an answer first.';
        return;
      }
      const correct = selected.value === form.dataset.answer;
      feedback.dataset.result = correct ? 'correct' : 'retry';
      feedback.textContent = `${correct ? 'Correct.' : 'Not quite.'} ${form.querySelector('.answer-explanation').textContent}`;
    });
  }

  function exportNotebook() {
    const lines = ['# My Copilot app learning notebook', '', `Exported: ${new Date().toISOString()}`, ''];
    for (const lesson of lessons) {
      lines.push(`## ${lesson.dataset.lesson}. ${lesson.querySelector('h1').textContent}`,
        '', `Completion: ${completed.has(lesson.id) ? 'marked complete' : 'not marked complete'}`,
        '', notes.get(lesson.id).value || '(No notes yet.)', '');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'copilot-learning-notebook.md';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce('Notebook download started. Keep your downloaded copy in a safe place.');
  }
  document.getElementById('export-notes').addEventListener('click', exportNotebook);
  document.querySelector('[data-export]').addEventListener('click', exportNotebook);

  const resetDialog = document.getElementById('reset-dialog');
  document.getElementById('reset-progress').addEventListener('click', () => {
    resetDialog.showModal();
    document.getElementById('cancel-reset').focus();
  });
  document.getElementById('cancel-reset').addEventListener('click', () => resetDialog.close());
  document.getElementById('confirm-reset').addEventListener('click', () => {
    let removed = true;
    for (const key of ['complete', ...lessonIds.map((id) => `notes:${id}`)]) {
      try {
        localStorage.removeItem(PREFIX + key);
      } catch (error) {
        removed = false;
        storageProblem(error, false);
      }
    }
    completed.clear();
    for (const textarea of notes.values()) {
      textarea.value = '';
      textarea.closest('.notebook').querySelector('.print-note').textContent = '';
      textarea.closest('.notebook').querySelector('.note-status').textContent =
        removed ? 'Notes cleared.' : 'Cleared in this tab only; browser storage could not be cleared.';
    }
    refreshProgress();
    resetDialog.close();
    announce(removed ? 'This guide\'s notes and progress were cleared. Other browser data was not changed.'
      : 'Cleared in this tab, but browser storage could not be fully cleared.');
  });

  const filter = document.getElementById('docs-filter');
  function filterDocs() {
    const cards = Array.from(document.querySelectorAll('.resource-card'));
    let shown = 0;
    for (const card of cards) {
      card.hidden = filter.value !== 'all' && card.dataset.topic !== filter.value;
      if (!card.hidden) shown++;
    }
    document.getElementById('docs-count').textContent = `${shown} reading${shown === 1 ? '' : 's'}`;
  }
  filter.addEventListener('change', filterDocs);
  filterDocs();

  let printDetails = [];
  window.addEventListener('beforeprint', () => {
    printDetails = Array.from(document.querySelectorAll('details')).filter((item) => !item.open);
    for (const item of printDetails) item.open = true;
  });
  window.addEventListener('afterprint', () => {
    for (const item of printDetails) item.open = false;
    printDetails = [];
  });
  document.getElementById('print-guide').addEventListener('click', () => window.print());
  document.documentElement.dataset.enhanced = 'true';
})();
