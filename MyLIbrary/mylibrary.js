const grid = document.getElementById('library-grid');
const searchInput = document.getElementById('library-search');
const searchButton = document.getElementById('library-search-submit');
const count = document.getElementById('item-count');
const emptyState = document.getElementById('empty-state');
const filterButtons = [...document.querySelectorAll('[data-category]')];
const watchedFilters = document.querySelector('.watched-filters');
const watchedFilterButtons = [...document.querySelectorAll('[data-watched-filter]')];
const availableSections = filterButtons.map(button => button.dataset.category);
const searchParams = new URLSearchParams(window.location.search);
const requestedSection = searchParams.get('section');
let activeCategory = availableSections.includes(requestedSection) ? requestedSection : 'All';
let activeWatchedFilter = searchParams.get('watchedFilter') === 'Favorites' ? 'Favorites' : 'All';

const transferredItem = searchParams.get('item');
if (transferredItem) {
  let item;
  try {
    item = JSON.parse(transferredItem);
  } catch {
    throw new Error('The selected title could not be added because its transfer data is invalid.');
  }
  if (!item || typeof item.title !== 'string' || !['Movies', 'TV Shows', 'Anime'].includes(item.type)) {
    throw new Error('The selected title could not be added because its transfer data is invalid.');
  }
  window.FrameLibrary.addToSection(item, activeCategory);
  searchParams.delete('item');
  const query = searchParams.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
}

let mediaItems = window.FrameLibrary.getItems();

function updateSectionUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set('section', activeCategory);
  if (activeCategory === 'Watched' && activeWatchedFilter === 'Favorites') {
    url.searchParams.set('watchedFilter', 'Favorites');
  } else {
    url.searchParams.delete('watchedFilter');
  }
  window.history.replaceState(null, '', url);
}

function renderLibrary() {
  const query = searchInput.value.trim().toLowerCase();
  watchedFilters.hidden = activeCategory !== 'Watched';
  const visibleItems = mediaItems.filter(item => {
    const matchesCategory = activeCategory === 'All'
      || (activeCategory === 'Watched'
        ? item.watched && (activeWatchedFilter !== 'Favorites' || item.favorite)
        : item.type === activeCategory);
    return matchesCategory && item.title.toLowerCase().includes(query);
  });

  grid.replaceChildren(...visibleItems.map(item => {
    const card = document.createElement('article');
    card.className = 'media-card';

    const poster = document.createElement('div');
    poster.className = 'poster';
    if (item.gradient) poster.style.background = item.gradient;
    if (item.image) poster.classList.add('has-poster-image');

    if (item.image) {
      const image = document.createElement('img');
      image.className = 'library-poster-image';
      image.src = item.image.startsWith('images/') ? `../${item.image}` : item.image;
      image.alt = item.alt || item.title;
      image.addEventListener('error', () => {
        image.remove();
        poster.classList.remove('has-poster-image');
      }, { once: true });
      poster.append(image);
    }

    if (item.mark) {
      const mark = document.createElement('span');
      mark.className = 'poster-mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = item.mark;
      poster.append(mark);
    }

    const tag = document.createElement('span');
    tag.className = 'poster-tag';
    tag.textContent = item.type;

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const favoriteButton = document.createElement('button');
    favoriteButton.className = 'icon-button favorite-button';
    favoriteButton.type = 'button';
    favoriteButton.setAttribute('aria-label', item.favorite ? 'Remove from favorites' : 'Add to favorites');
    favoriteButton.setAttribute('aria-pressed', String(Boolean(item.favorite)));
    favoriteButton.textContent = item.favorite ? '♥' : '♡';
    favoriteButton.addEventListener('click', () => {
      item.favorite = !item.favorite;
      window.FrameLibrary.updateItem(item.title, { favorite: item.favorite });
      mediaItems = window.FrameLibrary.getItems();
      renderLibrary();
    });

    actions.append(favoriteButton);

    const removeButton = document.createElement('button');
    removeButton.className = 'icon-button remove-button';
    removeButton.type = 'button';
    removeButton.setAttribute('aria-label', `Remove ${item.title} from library`);
    removeButton.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    removeButton.addEventListener('click', () => {
      window.FrameLibrary.removeItem(item.title);
      mediaItems = window.FrameLibrary.getItems();
      renderLibrary();
    });
    actions.append(removeButton);

    if (activeCategory !== 'Watched') {
      const optionsButton = document.createElement('button');
      optionsButton.className = 'icon-button options-button';
      optionsButton.type = 'button';
      optionsButton.setAttribute('aria-label', `More options for ${item.title}`);
      optionsButton.setAttribute('aria-expanded', 'false');
      optionsButton.innerHTML = '<i class="fa-solid fa-ellipsis" aria-hidden="true"></i>';

      const menu = document.createElement('div');
      menu.className = 'card-menu';
      menu.setAttribute('role', 'group');
      menu.setAttribute('aria-label', `Options for ${item.title}`);
      menu.hidden = true;

      [
        { section: 'All', label: 'My Library' },
        { section: 'Watched', label: 'Watched' },
        { section: 'Favorites', label: 'Favourite' }
      ].forEach(option => {
        const menuItem = document.createElement('button');
        menuItem.className = 'card-menu-item';
        menuItem.type = 'button';
        menuItem.textContent = option.label;
        menuItem.addEventListener('click', () => {
          window.FrameLibrary.addToSection(item, option.section);
          mediaItems = window.FrameLibrary.getItems();
          menu.hidden = true;
          optionsButton.setAttribute('aria-expanded', 'false');
          renderLibrary();
        });
        menu.append(menuItem);
      });

      optionsButton.addEventListener('click', () => {
        const isExpanded = optionsButton.getAttribute('aria-expanded') === 'true';
        grid.querySelectorAll('.card-menu').forEach(openMenu => {
          if (openMenu !== menu) {
            openMenu.hidden = true;
            openMenu.parentElement.querySelector('.options-button').setAttribute('aria-expanded', 'false');
          }
        });
        optionsButton.setAttribute('aria-expanded', String(!isExpanded));
        menu.hidden = isExpanded;
      });

      actions.append(optionsButton);
      poster.append(tag, actions, menu);
    } else {
      poster.append(tag, actions);
    }

    const title = document.createElement('h2');
    title.className = 'media-title';
    title.textContent = item.title;

    const year = document.createElement('p');
    year.className = 'media-year';
    year.textContent = String(item.year);

    card.append(poster, title, year);
    return card;
  }));

  count.textContent = `Showing ${visibleItems.length} of ${mediaItems.length} items in your collection.`;
  emptyState.hidden = visibleItems.length > 0;
  grid.hidden = visibleItems.length === 0;
}

filterButtons.forEach(button => {
  button.setAttribute('aria-pressed', String(button.dataset.category === activeCategory));
  button.addEventListener('click', () => {
    activeCategory = button.dataset.category;
    filterButtons.forEach(filter => {
      filter.setAttribute('aria-pressed', String(filter === button));
    });
    if (activeCategory !== 'Watched') activeWatchedFilter = 'All';
    watchedFilterButtons.forEach(filter => {
      filter.setAttribute('aria-pressed', String(filter.dataset.watchedFilter === activeWatchedFilter));
    });
    updateSectionUrl();
    renderLibrary();
    });
});

watchedFilterButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.watchedFilter === activeWatchedFilter));
    button.addEventListener('click', () => {
      activeWatchedFilter = button.dataset.watchedFilter;
      watchedFilterButtons.forEach(filter => {
        filter.setAttribute('aria-pressed', String(filter === button));
      });
      updateSectionUrl();
      renderLibrary();
    });
});

function closeOpenMenus() {
    grid.querySelectorAll('.card-menu:not([hidden])').forEach(openMenu => {
      openMenu.hidden = true;
      openMenu.parentElement.querySelector('.options-button').setAttribute('aria-expanded', 'false');
    });
}

document.addEventListener('click', event => {
    if (!(event.target instanceof Element) || event.target.closest('.card-actions, .card-menu')) return;
    closeOpenMenus();
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeOpenMenus();
});

searchInput.addEventListener('input', renderLibrary);
searchButton.addEventListener('click', renderLibrary);
searchInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') renderLibrary();
});
document.getElementById('clear-filters').addEventListener('click', () => {
  activeCategory = 'All';
  searchInput.value = '';
  filterButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.category === 'All'));
  });
  activeWatchedFilter = 'All';
  watchedFilterButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.watchedFilter === 'All'));
  });
  updateSectionUrl();
  renderLibrary();
});

renderLibrary();
