(() => {
  'use strict';

  const prefix = 'copilot-learner-guide:v1:';
  const lessonIds = ['first-session', 'projects', 'delivery', 'parallel', 'automations', 'jira-story', 'fusion'];
  const sentinel = 'copilot-learner-checks:unrelated';
  const keys = [prefix + 'complete', prefix + 'theme', ...lessonIds.map((id) => prefix + 'notes:' + id), sentinel];
  const frame = document.getElementById('subject');
  const results = document.getElementById('test-results');
  const summary = document.getElementById('test-summary');
  const button = document.getElementById('run-checks');
  let loadCount = 0;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function load(hash = 'start') {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Guide did not load within 10 seconds.')), 10000);
      frame.onload = () => {
        clearTimeout(timer);
        const doc = frame.contentDocument;
        if (doc.documentElement.dataset.enhanced !== 'true') {
          reject(new Error('Guide JavaScript did not initialize.'));
          return;
        }
        resolve(doc);
      };
      frame.src = `index.html?checks=${++loadCount}#${hash}`;
    });
  }

  function settle() {
    return new Promise((resolve) => frame.contentWindow.requestAnimationFrame(() =>
      frame.contentWindow.requestAnimationFrame(resolve)));
  }

  async function navigate(hash) {
    frame.contentWindow.location.hash = hash;
    await settle();
  }

  button.addEventListener('click', async () => {
    button.disabled = true;
    results.replaceChildren();
    summary.textContent = 'Running...';
    delete summary.dataset.complete;
    delete summary.dataset.failures;
    const snapshot = new Map();
    let passed = 0;
    let failed = 0;
    let backedUp = false;

    async function check(name, run) {
      const row = document.createElement('li');
      try {
        await run();
        passed++;
        row.textContent = `PASS: ${name}`;
      } catch (error) {
        failed++;
        row.textContent = `FAIL: ${name}: ${error.message}`;
      }
      results.appendChild(row);
    }

    try {
      for (const key of keys) snapshot.set(key, localStorage.getItem(key));
      backedUp = true;
      for (const key of keys) localStorage.removeItem(key);
      localStorage.setItem(sentinel, 'keep');
      let doc = await load();

      await check('Navigation, nested deep links, and unknown routes remain usable', async () => {
        assert(doc.querySelectorAll('[data-page]:not([hidden])').length === 1, 'Expected one active page.');
        await navigate('projects');
        assert(!doc.getElementById('projects').hidden, 'Projects did not open.');
        doc = await load('jira-workflows');
        assert(!doc.getElementById('next-steps').hidden, 'A nested anchor did not open its owning page.');
        assert(doc.querySelector('[data-route="next-steps"]').getAttribute('aria-current') === 'page', 'Navigation did not follow the nested route.');
        await navigate('not-a-real-lesson');
        assert(!doc.getElementById('start').hidden, 'Unknown route did not fall back to the start page.');
      });

      await check('Notes and completion persist without changing other storage', async () => {
        await navigate('first-session');
        const note = doc.getElementById('notes-first-session');
        note.value = 'Verified the boundary; <b>this is text</b>.';
        note.dispatchEvent(new frame.contentWindow.Event('input', { bubbles: true }));
        doc.querySelector('#first-session .complete-button').click();
        doc = await load('first-session');
        assert(doc.getElementById('notes-first-session').value.includes('<b>this is text</b>'), 'Note text did not round-trip.');
        assert(doc.querySelector('#first-session .print-note b') === null, 'Note content became markup.');
        assert(doc.getElementById('progress-count').textContent === '1 of 7', 'Completion was not restored.');
        assert(doc.getElementById('start-learning').getAttribute('href') === '#projects', 'Resume did not choose the first unfinished lesson.');
        assert(localStorage.getItem(sentinel) === 'keep', 'Unrelated storage changed.');
      });

      await check('Knowledge checks handle no answer, wrong answer, and correct answer', () => {
        const form = doc.querySelector('#first-session .knowledge-check');
        const submit = form.querySelector('button');
        submit.click();
        assert(form.querySelector('.quiz-feedback').textContent === 'Choose an answer first.', 'Missing-answer guidance was not shown.');
        form.querySelector('input[value="a"]').checked = true;
        submit.click();
        assert(form.querySelector('.quiz-feedback').dataset.result === 'retry', 'Wrong answer was not explained.');
        form.querySelector('input[value="b"]').checked = true;
        submit.click();
        assert(form.querySelector('.quiz-feedback').dataset.result === 'correct', 'Correct answer was not recognized.');
      });

      await check('Copy exports only prompt text and reports blocked clipboard access', async () => {
        const win = frame.contentWindow;
        const prompt = doc.querySelector('#first-session .prompt');
        let copied;
        Object.defineProperty(win.navigator, 'clipboard', {
          configurable: true, value: { writeText: async (text) => { copied = text; } }
        });
        prompt.querySelector('button').click();
        await settle();
        assert(copied === prompt.querySelector('pre').textContent, 'Copy included extra UI text or omitted prompt content.');
        Object.defineProperty(win.navigator, 'clipboard', {
          configurable: true, value: { writeText: async () => { throw new win.DOMException('Blocked', 'NotAllowedError'); } }
        });
        prompt.querySelector('button').click();
        await settle();
        assert(doc.getElementById('message').textContent.includes('copy it manually'), 'Clipboard failure was not surfaced.');
        assert(win.getSelection().toString() === prompt.querySelector('pre').textContent, 'Prompt was not selected for manual copying.');
      });

      await check('Notebook export includes the current unsent notes and completion', async () => {
        const win = frame.contentWindow;
        const create = win.URL.createObjectURL;
        const click = win.HTMLAnchorElement.prototype.click;
        let content;
        let filename;
        win.URL.createObjectURL = (blob) => { content = blob; return create.call(win.URL, blob); };
        win.HTMLAnchorElement.prototype.click = function () {
          if (this.download) filename = this.download;
          else click.call(this);
        };
        try {
          doc.getElementById('export-notes').click();
          assert(filename === 'copilot-learning-notebook.md', 'Notebook filename missing.');
          const text = await content.text();
          assert(text.includes('Verified the boundary; <b>this is text</b>.'), 'Export lost the note.');
          assert(text.includes('Completion: marked complete'), 'Export lost progress.');
          assert((text.match(/^## /gm) || []).length === 7, 'Export omitted a lesson.');
        } finally {
          win.URL.createObjectURL = create;
          win.HTMLAnchorElement.prototype.click = click;
        }
      });

      await check('Reset requires confirmation and only clears guide notes and progress', () => {
        doc.getElementById('reset-progress').click();
        assert(doc.getElementById('reset-dialog').open, 'Confirmation did not open.');
        doc.getElementById('cancel-reset').click();
        assert(doc.getElementById('notes-first-session').value.length > 0, 'Cancel erased notes.');
        doc.getElementById('reset-progress').click();
        doc.getElementById('confirm-reset').click();
        assert(doc.getElementById('notes-first-session').value === '', 'Confirmed reset did not clear notes.');
        assert(doc.getElementById('progress-count').textContent === '0 of 7', 'Confirmed reset did not clear progress.');
        assert(localStorage.getItem(prefix + 'notes:first-session') === null, 'Saved note remains after reset.');
        assert(localStorage.getItem(sentinel) === 'keep', 'Reset modified unrelated storage.');
      });

      await check('Malformed saved state is visible and does not break navigation', async () => {
        localStorage.setItem(prefix + 'complete', '{"unexpected":true}');
        localStorage.setItem(prefix + 'notes:projects', 'not json');
        doc = await load('projects');
        assert(!doc.getElementById('storage-warning').hidden, 'Corrupt storage was silently ignored.');
        assert(doc.getElementById('progress-count').textContent === '0 of 7', 'Invalid state corrupted progress.');
        await navigate('delivery');
        assert(!doc.getElementById('delivery').hidden, 'Navigation broke after corrupt data.');
        localStorage.removeItem(prefix + 'complete');
        localStorage.removeItem(prefix + 'notes:projects');
        doc = await load('projects');
      });

      await check('Blocked storage preserves in-memory notes and never says saved', () => {
        const win = frame.contentWindow;
        const original = win.Storage.prototype.setItem;
        win.Storage.prototype.setItem = () => { throw new win.DOMException('Storage blocked', 'SecurityError'); };
        try {
          const note = doc.getElementById('notes-projects');
          note.value = 'Keep this note even when saving is blocked.';
          note.dispatchEvent(new win.Event('input', { bubbles: true }));
          assert(note.value.startsWith('Keep this note'), 'In-memory note was lost.');
          assert(note.closest('.notebook').querySelector('.note-status').textContent.startsWith('Not saved.'), 'Failure was reported as success.');
          assert(!doc.getElementById('storage-warning').hidden, 'Storage failure is not visible.');
        } finally {
          win.Storage.prototype.setItem = original;
        }
      });

      await check('Topic filtering and theme switching work and persist', async () => {
        await navigate('resources');
        const filter = doc.getElementById('docs-filter');
        filter.value = 'models';
        filter.dispatchEvent(new frame.contentWindow.Event('change', { bubbles: true }));
        assert(doc.querySelectorAll('.resource-card:not([hidden])').length === 1, 'Topic filter did not narrow the docs.');
        const initial = doc.documentElement.dataset.theme;
        doc.getElementById('theme-toggle').click();
        const changed = doc.documentElement.dataset.theme;
        assert(changed !== initial, 'Theme did not change.');
        doc = await load('resources');
        assert(doc.documentElement.dataset.theme === changed, 'Theme was not restored.');
      });

      await check('Narrow layouts fit and mobile navigation closes correctly', async () => {
        frame.width = '375';
        frame.style.width = '375px';
        await settle();
        for (const id of ['start', ...lessonIds, 'next-steps', 'resources']) {
          await navigate(id);
          assert(doc.documentElement.scrollWidth <= frame.contentWindow.innerWidth + 1, `${id} overflows horizontally.`);
        }
        doc.getElementById('menu-toggle').click();
        assert(doc.getElementById('menu-toggle').getAttribute('aria-expanded') === 'true', 'Menu did not open.');
        doc.querySelector('[data-route="projects"]').click();
        await settle();
        assert(!doc.getElementById('projects').hidden, 'Mobile navigation did not change lesson.');
        assert(doc.getElementById('menu-toggle').getAttribute('aria-expanded') === 'false', 'Menu remained expanded.');
      });

      await check('Print preparation opens examples and restores their state', () => {
        const win = frame.contentWindow;
        const details = Array.from(doc.querySelectorAll('details'));
        const initial = details.map((detail) => detail.open);
        win.dispatchEvent(new win.Event('beforeprint'));
        assert(details.every((detail) => detail.open), 'Print view omitted closed examples.');
        win.dispatchEvent(new win.Event('afterprint'));
        assert(details.every((detail, index) => detail.open === initial[index]), 'Print changed disclosure state permanently.');
      });

      await check('Every local link and fragment resolves and the kit is a ZIP', async () => {
        const paths = new Set();
        for (const link of doc.querySelectorAll('a[href]')) {
          const href = link.getAttribute('href');
          if (href.startsWith('#')) {
            assert(doc.getElementById(href.slice(1)), `Missing fragment ${href}.`);
          } else if (!href.startsWith('https://')) {
            paths.add(href);
          }
        }
        for (const path of paths) {
          const response = await fetch(path);
          assert(response.ok, `${path} returned ${response.status}.`);
          if (path.endsWith('.zip')) {
            const bytes = new Uint8Array(await response.arrayBuffer());
            assert(bytes[0] === 80 && bytes[1] === 75, 'The practice kit is not a ZIP.');
          }
        }
      });
    } catch (error) {
      failed++;
      const row = document.createElement('li');
      row.textContent = `FAIL: Test setup: ${error.message}`;
      results.appendChild(row);
    } finally {
      frame.src = 'about:blank';
      frame.onload = null;
      if (backedUp) {
        try {
          for (const [key, value] of snapshot) {
            if (value === null) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
          }
        } catch (error) {
          failed++;
          const row = document.createElement('li');
          row.textContent = `FAIL: Could not restore test storage: ${error.message}`;
          results.appendChild(row);
        }
      }
      summary.textContent = `${passed} passed; ${failed} failed.`;
      summary.dataset.complete = 'true';
      summary.dataset.failures = String(failed);
      button.disabled = false;
    }
  });
})();
