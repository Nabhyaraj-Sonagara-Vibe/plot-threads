// PlotThreads — core logic + DOM wiring
// Core functions are exported for Node-based smoke testing via module.exports
// (guarded so this file still works unmodified in the browser).

const STORAGE_KEY = 'plotthreads.threads.v1';
const CHAPTER_KEY = 'plotthreads.currentChapter.v1';
const THRESHOLD_KEY = 'plotthreads.staleThreshold.v1';

/**
 * Determine whether a thread is "stale": not planted/resolved status,
 * and its lastUpdatedChapter is more than `threshold` chapters behind
 * the current chapter. Resolved threads are never stale.
 */
function isStale(thread, currentChapter, threshold) {
  if (!thread || thread.status === 'resolved') return false;
  const gap = currentChapter - thread.lastUpdatedChapter;
  return gap > threshold;
}

/** Create a new thread object with sane defaults. */
function createThread({ id, name, description, status, lastUpdatedChapter }) {
  return {
    id: id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)),
    name: (name || '').trim(),
    description: (description || '').trim(),
    status: ['planted', 'developing', 'resolved'].includes(status) ? status : 'planted',
    lastUpdatedChapter: Number.isFinite(lastUpdatedChapter) ? lastUpdatedChapter : 0,
    createdAt: new Date().toISOString(),
  };
}

/** Filter threads by a filter key: all | planted | developing | resolved | stale */
function filterThreads(threads, filterKey, currentChapter, threshold) {
  switch (filterKey) {
    case 'stale':
      return threads.filter((t) => isStale(t, currentChapter, threshold));
    case 'planted':
    case 'developing':
    case 'resolved':
      return threads.filter((t) => t.status === filterKey);
    default:
      return threads.slice();
  }
}

/** Sort: stale first, then by status (planted, developing, resolved), then by name. */
function sortThreads(threads, currentChapter, threshold) {
  const statusOrder = { planted: 0, developing: 1, resolved: 2 };
  return threads.slice().sort((a, b) => {
    const aStale = isStale(a, currentChapter, threshold);
    const bStale = isStale(b, currentChapter, threshold);
    if (aStale !== bStale) return aStale ? -1 : 1;
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return a.name.localeCompare(b.name);
  });
}

function computeStats(threads, currentChapter, threshold) {
  const total = threads.length;
  const planted = threads.filter((t) => t.status === 'planted').length;
  const developing = threads.filter((t) => t.status === 'developing').length;
  const resolved = threads.filter((t) => t.status === 'resolved').length;
  const stale = threads.filter((t) => isStale(t, currentChapter, threshold)).length;
  return { total, planted, developing, resolved, stale };
}

// ---- Browser-only wiring below ----
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  (function () {
    const els = {
      currentChapter: document.getElementById('currentChapter'),
      staleThreshold: document.getElementById('staleThreshold'),
      statusFilter: document.getElementById('statusFilter'),
      newThreadBtn: document.getElementById('newThreadBtn'),
      statsBar: document.getElementById('statsBar'),
      emptyState: document.getElementById('emptyState'),
      threadList: document.getElementById('threadList'),
      dialog: document.getElementById('threadDialog'),
      form: document.getElementById('threadForm'),
      dialogTitle: document.getElementById('dialogTitle'),
      threadId: document.getElementById('threadId'),
      threadName: document.getElementById('threadName'),
      threadDescription: document.getElementById('threadDescription'),
      threadStatus: document.getElementById('threadStatus'),
      threadChapter: document.getElementById('threadChapter'),
      deleteThreadBtn: document.getElementById('deleteThreadBtn'),
      cancelBtn: document.getElementById('cancelBtn'),
    };

    function loadThreads() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.error('Failed to load threads', e);
        return [];
      }
    }

    function saveThreads(threads) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    }

    function getCurrentChapter() {
      return Number(els.currentChapter.value) || 0;
    }
    function getThreshold() {
      return Number(els.staleThreshold.value) || 1;
    }

    function render() {
      const threads = loadThreads();
      const currentChapter = getCurrentChapter();
      const threshold = getThreshold();
      const filterKey = els.statusFilter.value;

      localStorage.setItem(CHAPTER_KEY, String(currentChapter));
      localStorage.setItem(THRESHOLD_KEY, String(threshold));

      const stats = computeStats(threads, currentChapter, threshold);
      els.statsBar.innerHTML = `
        <span>${stats.total} total</span>
        <span>${stats.planted} planted</span>
        <span>${stats.developing} developing</span>
        <span>${stats.resolved} resolved</span>
        <span style="${stats.stale ? 'color:var(--stale);border-color:var(--stale);' : ''}">${stats.stale} stale</span>
      `;

      const visible = sortThreads(
        filterThreads(threads, filterKey, currentChapter, threshold),
        currentChapter,
        threshold
      );

      els.emptyState.hidden = threads.length !== 0;
      els.threadList.innerHTML = '';

      visible.forEach((thread) => {
        const stale = isStale(thread, currentChapter, threshold);
        const card = document.createElement('article');
        card.className = `thread-card status-${thread.status}${stale ? ' is-stale' : ''}`;
        card.tabIndex = 0;
        card.innerHTML = `
          <div class="thread-card-top">
            <h3 class="thread-name">${escapeHtml(thread.name)}</h3>
          </div>
          ${thread.description ? `<p class="thread-desc">${escapeHtml(thread.description)}</p>` : ''}
          <div class="badge-row">
            <span class="badge badge-${thread.status}">${thread.status}</span>
            ${stale ? '<span class="badge badge-stale">⚠ stale</span>' : ''}
            <span class="meta-text">last updated: ch. ${thread.lastUpdatedChapter}</span>
          </div>
        `;
        card.addEventListener('click', () => openDialog(thread));
        els.threadList.appendChild(card);
      });
    }

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function openDialog(thread) {
      els.form.reset();
      if (thread) {
        els.dialogTitle.textContent = 'Edit Plot Thread';
        els.threadId.value = thread.id;
        els.threadName.value = thread.name;
        els.threadDescription.value = thread.description;
        els.threadStatus.value = thread.status;
        els.threadChapter.value = thread.lastUpdatedChapter;
        els.deleteThreadBtn.hidden = false;
      } else {
        els.dialogTitle.textContent = 'New Plot Thread';
        els.threadId.value = '';
        els.threadChapter.value = getCurrentChapter();
        els.deleteThreadBtn.hidden = true;
      }
      els.dialog.showModal();
    }

    function closeDialog() {
      els.dialog.close();
    }

    els.newThreadBtn.addEventListener('click', () => openDialog(null));
    els.cancelBtn.addEventListener('click', closeDialog);
    els.currentChapter.addEventListener('input', render);
    els.staleThreshold.addEventListener('input', render);
    els.statusFilter.addEventListener('change', render);

    els.deleteThreadBtn.addEventListener('click', () => {
      const id = els.threadId.value;
      if (!id) return;
      if (!confirm('Delete this plot thread? This cannot be undone.')) return;
      const threads = loadThreads().filter((t) => t.id !== id);
      saveThreads(threads);
      closeDialog();
      render();
    });

    els.form.addEventListener('submit', (e) => {
      const threads = loadThreads();
      const id = els.threadId.value;
      const data = {
        id: id || undefined,
        name: els.threadName.value,
        description: els.threadDescription.value,
        status: els.threadStatus.value,
        lastUpdatedChapter: Number(els.threadChapter.value),
      };
      if (!data.name.trim()) return;

      if (id) {
        const idx = threads.findIndex((t) => t.id === id);
        if (idx !== -1) {
          threads[idx] = { ...threads[idx], ...createThread(data), id };
        }
      } else {
        threads.push(createThread(data));
      }
      saveThreads(threads);
      render();
    });

    // Restore chapter/threshold from previous session
    const savedChapter = localStorage.getItem(CHAPTER_KEY);
    const savedThreshold = localStorage.getItem(THRESHOLD_KEY);
    if (savedChapter !== null) els.currentChapter.value = savedChapter;
    if (savedThreshold !== null) els.staleThreshold.value = savedThreshold;

    render();
  })();
}

// Node/CommonJS export for smoke testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { isStale, createThread, filterThreads, sortThreads, computeStats };
}
