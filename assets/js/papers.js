// Shared behaviour for /papers/, /papers/archive/ and /papers/saved/.
//
// Cards are rendered server-side by _includes/paper-card.html -- all of them,
// on every page -- and this script decides which ones to show. Filtering and
// paging both happen here so that a search covers every paper rather than
// only the current page, and so the saved-papers page can reuse the same
// markup instead of rebuilding cards in JavaScript.
(function () {
  'use strict';

  var STORAGE_KEY = 'mypage.saved-papers';
  var DEFAULT_PER_PAGE = 20;

  var list = null;
  var cards = [];
  var filtered = [];
  var page = 1;
  var perPage = DEFAULT_PER_PAGE;
  var savedOnly = false;
  var saved = new Set();

  // -- saved papers -------------------------------------------------------
  // localStorage is per-browser and can throw outright (private windows,
  // browsers set to block site data), so every access is guarded and the
  // in-memory set stays authoritative for the current page.

  function loadSaved() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var ids = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(ids) ? ids : []);
    } catch (err) {
      return new Set();
    }
  }

  function persistSaved() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(saved)));
    } catch (err) {
      // Nothing to do: the star still reflects this session.
    }
  }

  function cardId(card) {
    return card.getAttribute('data-arxiv-id') || '';
  }

  function syncStar(card) {
    var button = card.querySelector('.star-btn');
    if (!button) return;
    var on = saved.has(cardId(card));
    button.setAttribute('aria-pressed', String(on));
    button.classList.toggle('is-saved', on);
    button.title = on ? 'Remove from saved' : 'Save for later';
    button.setAttribute('aria-label', button.title);
    var icon = button.querySelector('i');
    if (icon) icon.className = on ? 'fas fa-star' : 'far fa-star';
  }

  function toggleSaved(card) {
    var id = cardId(card);
    if (!id) return;
    if (saved.has(id)) {
      saved.delete(id);
    } else {
      saved.add(id);
    }
    persistSaved();
    syncStar(card);
    updateSavedCount();
    // On the saved page, unstarring should drop the card out of the list.
    if (savedOnly) applyFilters();
  }

  function updateSavedCount() {
    var badge = document.getElementById('nav-saved-count');
    if (badge) {
      badge.textContent = saved.size;
      badge.hidden = saved.size === 0;
    }
  }

  // -- abstracts ----------------------------------------------------------

  // Measured the first time a card is actually on screen: a hidden element
  // reports zero height, and web fonts can change it after DOMContentLoaded.
  function measureAbstract(card) {
    if (card.dataset.measured === 'true') return;
    var abstract = card.querySelector('.abstract');
    var button = card.querySelector('.expand-btn');
    if (!abstract || !button) return;
    if (!abstract.clientHeight) return;
    card.dataset.measured = 'true';
    // Hide the toggle when the abstract already fits uncollapsed.
    button.hidden = abstract.scrollHeight <= abstract.clientHeight + 1;
  }

  function toggleAbstract(button) {
    var container = button.parentElement;
    var abstract = container.querySelector('.abstract');
    var expanded = abstract.classList.toggle('expanded');
    abstract.classList.toggle('collapsed', !expanded);
    button.setAttribute('aria-expanded', String(expanded));
    button.innerHTML = expanded
      ? '<i class="fas fa-chevron-up"></i> Show less'
      : '<i class="fas fa-chevron-down"></i> Show more';
  }

  // -- filtering and paging -----------------------------------------------

  function pageCount() {
    return Math.max(1, Math.ceil(filtered.length / perPage));
  }

  function applyFilters(resetPage) {
    var input = document.getElementById('search-input');
    var term = input ? input.value.toLowerCase().trim() : '';

    filtered = cards.filter(function (card) {
      if (savedOnly && !saved.has(cardId(card))) return false;
      return term === '' || (card.getAttribute('data-search') || '').indexOf(term) !== -1;
    });

    if (resetPage) page = 1;
    if (page > pageCount()) page = pageCount();

    var clear = document.getElementById('clear-search');
    if (clear) clear.hidden = term === '';

    render(term);
  }

  function render(term) {
    var start = (page - 1) * perPage;
    var visible = filtered.slice(start, start + perPage);
    var show = new Set(visible);

    cards.forEach(function (card) {
      card.hidden = !show.has(card);
    });
    visible.forEach(measureAbstract);

    renderStatus(start, visible.length, term);
    renderPager();
  }

  function renderStatus(start, shown, term) {
    var status = document.getElementById('results-count');
    if (status) {
      status.textContent = filtered.length === 0
        ? '0'
        : (start + 1) + '–' + (start + shown);
    }
    var total = document.getElementById('results-total');
    if (total) total.textContent = filtered.length;

    var empty = document.getElementById('no-results');
    if (empty) empty.hidden = !(filtered.length === 0 && term !== '');

    var none = document.getElementById('no-saved');
    if (none) none.hidden = !(filtered.length === 0 && term === '');
  }

  // Page numbers around the current one, with gaps elided: 1 ... 4 5 6 7 8 ... 20
  function pageNumbers(current, last) {
    var wanted = new Set([1, last]);
    for (var offset = -2; offset <= 2; offset++) wanted.add(current + offset);
    var numbers = [];
    var previous = 0;
    for (var n = 1; n <= last; n++) {
      if (!wanted.has(n)) continue;
      if (previous && n - previous > 1) numbers.push(null);
      numbers.push(n);
      previous = n;
    }
    return numbers;
  }

  function renderPager() {
    var pager = document.getElementById('pagination');
    if (!pager) return;

    var last = pageCount();
    if (filtered.length <= perPage) {
      pager.innerHTML = '';
      pager.hidden = true;
      return;
    }
    pager.hidden = false;

    var parts = ['<button type="button" class="page-btn" data-page="' + (page - 1) + '"' +
                 (page === 1 ? ' disabled' : '') + ' aria-label="Previous page">' +
                 '<i class="fas fa-chevron-left"></i></button>'];

    pageNumbers(page, last).forEach(function (n) {
      if (n === null) {
        parts.push('<span class="page-gap">&hellip;</span>');
        return;
      }
      parts.push('<button type="button" class="page-btn' + (n === page ? ' is-current' : '') +
                 '" data-page="' + n + '"' + (n === page ? ' aria-current="page"' : '') +
                 '>' + n + '</button>');
    });

    parts.push('<button type="button" class="page-btn" data-page="' + (page + 1) + '"' +
               (page === last ? ' disabled' : '') + ' aria-label="Next page">' +
               '<i class="fas fa-chevron-right"></i></button>');

    pager.innerHTML = parts.join('');
  }

  function goToPage(n) {
    var target = Math.min(Math.max(n, 1), pageCount());
    if (target === page) return;
    page = target;
    render(document.getElementById('search-input') ?
      document.getElementById('search-input').value.toLowerCase().trim() : '');
    var anchor = document.querySelector('.search-container') || list;
    if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // -- wiring -------------------------------------------------------------

  document.addEventListener('DOMContentLoaded', function () {
    list = document.querySelector('.papers-list');
    if (!list) return;

    cards = Array.prototype.slice.call(list.querySelectorAll('.paper-card'));
    savedOnly = list.getAttribute('data-saved-only') === 'true';
    perPage = parseInt(list.getAttribute('data-per-page'), 10) || DEFAULT_PER_PAGE;

    saved = loadSaved();
    cards.forEach(syncStar);
    updateSavedCount();
    applyFilters(true);

    document.addEventListener('click', function (event) {
      var star = event.target.closest('.star-btn');
      if (star) {
        toggleSaved(star.closest('.paper-card'));
        return;
      }
      var expand = event.target.closest('.expand-btn');
      if (expand) {
        toggleAbstract(expand);
        return;
      }
      var pageButton = event.target.closest('.page-btn');
      if (pageButton && !pageButton.disabled) {
        goToPage(parseInt(pageButton.getAttribute('data-page'), 10));
        return;
      }
      if (event.target.closest('#clear-search')) {
        var input = document.getElementById('search-input');
        if (input) {
          input.value = '';
          applyFilters(true);
          input.focus();
        }
      }
    });

    var input = document.getElementById('search-input');
    if (input) {
      input.addEventListener('input', function () { applyFilters(true); });
    }

    // Re-measure once fonts have settled and line heights are final.
    window.addEventListener('load', function () {
      filtered.slice((page - 1) * perPage, page * perPage).forEach(measureAbstract);
    });
  });
})();
