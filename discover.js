const resultGrid = document.getElementById('results');
const notice = document.getElementById('notice');
const resultTitle = document.getElementById('results-title');
const resultCount = document.getElementById('results-count');
const regionFilter = document.getElementById('region-filter');
const genreFilter = document.getElementById('genre-filter');
const networkFilter = document.getElementById('network-filter');
const typeFilter = document.getElementById('type-filter');
const pagination = document.getElementById('pagination');
const titleDialog = document.getElementById('title-dialog');
const detailContent = document.getElementById('detail-content');
let currentPage = 1;
let currentMode = 'discover';
let currentSearch = { field: 'name', value: '' };
let lastPage = 1;
let activeRequest = 0;
let autocompleteTimer;

async function api(path, params = {}) {
  const url = new URL(path, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== undefined && value !== null) url.searchParams.set(key, value);
  }
  const response = await fetch(url);
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || `Request failed (${response.status}).`);
  return payload;
}

function setNotice(message = '', kind = '') {
  notice.textContent = message;
  notice.dataset.kind = kind;
}

function listFrom(payload, keys) {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

function populateSelect(select, items, { valueKeys, labelKeys, allLabel }) {
  const previousValue = select.value;
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = allLabel;
  select.replaceChildren(placeholder);
  items.forEach(item => {
    const value = valueKeys.map(key => item?.[key]).find(value => value !== undefined && value !== null);
    const label = labelKeys.map(key => item?.[key]).find(value => value !== undefined && value !== null);
    if (value === undefined || label === undefined) return;
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = String(label);
    select.append(option);
  });
  if ([...select.options].some(option => option.value === previousValue)) select.value = previousValue;
}

function getResults(payload) {
  return listFrom(payload, ['title_results', 'titles', 'results']);
}

function posterUrl(title) {
  return title.poster || title.image_url || title.poster_url || '';
}

function renderResults(titles, payload = {}) {
  resultGrid.replaceChildren();
  const total = payload.total_results ?? titles.length;
  resultCount.textContent = `${total} title${total === 1 ? '' : 's'}`;
  titles.forEach(title => {
    const card = document.createElement('button');
    card.className = 'discovery-card';
    card.type = 'button';
    card.setAttribute('aria-label', `View details for ${title.name || title.title || 'untitled'}`);

    const poster = document.createElement('span');
    poster.className = 'discovery-poster';
    const imageUrl = posterUrl(title);
    if (imageUrl) {
      const image = document.createElement('img');
      image.src = imageUrl;
      image.alt = '';
      image.loading = 'lazy';
      image.addEventListener('error', () => {
        image.remove();
        const fallback = document.createElement('span');
        fallback.className = 'poster-placeholder';
        fallback.textContent = (title.name || title.title || '?').slice(0, 2).toUpperCase();
        poster.append(fallback);
      }, { once: true });
      poster.append(image);
    } else {
      const fallback = document.createElement('span');
      fallback.className = 'poster-placeholder';
      fallback.textContent = (title.name || title.title || '?').slice(0, 2).toUpperCase();
      poster.append(fallback);
    }

    const typeBadge = document.createElement('span');
    typeBadge.className = 'discovery-type';
    typeBadge.textContent = (title.type || 'title').replaceAll('_', ' ');
    poster.append(typeBadge);
    const label = document.createElement('span');
    label.className = 'discovery-title';
    label.textContent = title.name || title.title || 'Untitled';
    const year = document.createElement('span');
    year.className = 'discovery-year';
    year.textContent = title.year ? String(title.year) : 'Release year unavailable';
    card.append(poster, label, year);
    card.addEventListener('click', () => openDetails(title.id));
    resultGrid.append(card);
  });

  const totalPages = Math.max(1, Number(payload.total_pages || (total ? Math.ceil(total / 50) : 1)));
  lastPage = totalPages;
  pagination.hidden = totalPages <= 1;
  document.getElementById('page-label').textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById('previous-page').disabled = currentPage <= 1;
  document.getElementById('next-page').disabled = currentPage >= totalPages;
  if (!titles.length) setNotice('No matching titles were found. Adjust your filters and try again.');
  else setNotice('');
}

function discoveryParams() {
  return {
    page: currentPage,
    limit: 50,
    types: typeFilter.value,
    genres: genreFilter.value,
    network_ids: networkFilter.value,
    regions: regionFilter.value
  };
}

async function loadDiscovery() {
  currentMode = 'discover';
  currentPage = Math.min(currentPage, lastPage);
  resultTitle.textContent = 'Explore the catalog';
  setNotice('Loading titles…');
  pagination.hidden = true;
  const requestId = ++activeRequest;
  try {
    const payload = await api('/api/discover', discoveryParams());
    if (requestId !== activeRequest) return;
    renderResults(getResults(payload), payload);
  } catch (error) {
    if (requestId !== activeRequest) return;
    resultGrid.replaceChildren();
    resultCount.textContent = '';
    setNotice(error.message, 'error');
  }
}

async function loadReleases() {
  currentMode = 'releases';
  currentPage = 1;
  resultTitle.textContent = 'New releases';
  setNotice('Loading new releases…');
  pagination.hidden = true;
  const requestId = ++activeRequest;
  try {
    const payload = await api('/api/releases', { types: typeFilter.value, limit: 250 });
    if (requestId !== activeRequest) return;
    renderResults(listFrom(payload, ['releases', 'title_results', 'titles', 'results']), payload);
    pagination.hidden = true;
  } catch (error) {
    if (requestId !== activeRequest) return;
    resultGrid.replaceChildren();
    resultCount.textContent = '';
    setNotice(error.message, 'error');
  }
}

async function searchTitles(event) {
  event?.preventDefault();
  const value = document.getElementById('search-value').value.trim();
  if (!value) {
    setNotice('Enter a title name or identifier to search.', 'error');
    return;
  }
  currentMode = 'search';
  currentSearch = { field: document.getElementById('search-field').value, value };
  currentPage = 1;
  resultTitle.textContent = 'Search results';
  setNotice('Searching Watchmode…');
  pagination.hidden = true;
  const requestId = ++activeRequest;
  try {
    const payload = await api('/api/search', {
      search_field: currentSearch.field,
      search_value: currentSearch.value,
      types: [
        ...(typeFilter.value.includes('movie') ? ['movie'] : []),
        ...(typeFilter.value.includes('tv_') ? ['tv'] : [])
      ].join(',')
    });
    if (requestId !== activeRequest) return;
    renderResults(getResults(payload), payload);
  } catch (error) {
    if (requestId !== activeRequest) return;
    resultGrid.replaceChildren();
    resultCount.textContent = '';
    setNotice(error.message, 'error');
  }
}

function safeExternalUrl(value) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    if (['http:', 'https:'].includes(url.protocol)) return url.href;
    if (/^[a-z][a-z0-9+.-]*:$/.test(url.protocol) && !['javascript:', 'data:', 'file:', 'vbscript:'].includes(url.protocol)) return url.href;
  } catch {
    return '';
  }
  return '';
}

function makeSection(title, content) {
  const section = document.createElement('section');
  section.className = 'detail-section';
  const heading = document.createElement('h3');
  heading.textContent = title;
  section.append(heading, content);
  return section;
}

function renderSources(sources) {
  const groups = [
    { keys: ['sub', 'subscription'], label: 'Subscription' },
    { keys: ['rent', 'rental'], label: 'Rent' },
    { keys: ['buy', 'purchase'], label: 'Buy' },
    { keys: ['free'], label: 'Free' },
    { keys: ['addon', 'tv_everywhere'], label: 'Add-on / TV Everywhere' }
  ];
  const container = document.createElement('div');
  for (const group of groups) {
    const matching = sources.filter(source => group.keys.includes(String(source.type || '').toLowerCase()));
    if (!matching.length) continue;
    const category = document.createElement('p');
    category.className = 'provider-category';
    category.textContent = group.label;
    container.append(category);
    matching.forEach(source => {
      const card = document.createElement('div');
      card.className = 'provider-card';
      if (source.logo_100px) {
        const logo = document.createElement('img');
        logo.src = source.logo_100px;
        logo.alt = '';
        logo.loading = 'lazy';
        card.append(logo);
      }
      const name = document.createElement('strong');
      name.textContent = source.name || 'Streaming service';
      card.append(name);
      if (source.price !== undefined && source.price !== null) {
        const price = document.createElement('span');
        price.textContent = ` $${source.price}`;
        card.append(price);
      }
      [
        ['web_url', 'Watch online'],
        ['ios_url', 'Open iOS app'],
        ['android_url', 'Open Android app']
      ].forEach(([key, label]) => {
        const href = safeExternalUrl(source[key]);
        if (!href) return;
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        card.append(link);
      });
      container.append(card);
    });
  }
  return container;
}

function renderEpisodes(episodes) {
  const container = document.createElement('div');
  const seasons = [...new Set(episodes.map(episode => Number(episode.season_number)).filter(Number.isFinite))].sort((a, b) => a - b);
  const seasonSelect = document.createElement('select');
  seasonSelect.className = 'episode-controls';
  seasonSelect.setAttribute('aria-label', 'Filter episodes by season');
  seasons.forEach(season => {
    const option = document.createElement('option');
    option.value = String(season);
    option.textContent = `Season ${season}`;
    seasonSelect.append(option);
  });
  const episodeList = document.createElement('ul');
  const renderSeason = () => {
    episodeList.replaceChildren();
    episodes.filter(episode => String(episode.season_number) === seasonSelect.value).forEach(episode => {
      const entry = document.createElement('li');
      const name = episode.name || `Episode ${episode.episode_number}`;
      const date = episode.release_date ? ` — ${episode.release_date}` : '';
      entry.textContent = `S${episode.season_number} E${episode.episode_number}: ${name}${date}`;
      episodeList.append(entry);
    });
  };
  seasonSelect.addEventListener('change', renderSeason);
  if (seasons.length) {
    container.append(seasonSelect);
    renderSeason();
  } else {
    const message = document.createElement('p');
    message.textContent = 'Episode information is not available.';
    container.append(message);
  }
  container.append(episodeList);
  return container;
}

function renderReleaseDates(payload) {
  const releases = listFrom(payload, ['release_dates', 'releases', 'results']);
  const list = document.createElement('ul');
  releases.forEach(release => {
    const entry = document.createElement('li');
    entry.textContent = [
      release.release_date || release.date,
      release.region || release.country,
      release.type || release.release_type,
      release.source_name || release.source
    ].filter(Boolean).join(' · ');
    if (entry.textContent) list.append(entry);
  });
  if (!list.children.length) {
    const entry = document.createElement('li');
    entry.textContent = 'Regional release dates are not available.';
    list.append(entry);
  }
  return list;
}

async function openDetails(id) {
  if (!Number.isInteger(Number(id)) || Number(id) < 1) return;
  titleDialog.showModal();
  detailContent.replaceChildren();
  const loading = document.createElement('p');
  loading.className = 'detail-body';
  loading.textContent = 'Loading title details…';
  detailContent.append(loading);

  try {
    const region = regionFilter.value || 'US';
    const [details, castCrew, sources, releaseDates] = await Promise.all([
      api(`/api/title/${id}/details`, { append_to_response: 'genres' }),
      api(`/api/title/${id}/cast-crew`),
      api(`/api/title/${id}/sources`, { regions: region }),
      api('/api/title-release-dates', { title_id: id, regions: region })
    ]);
    if (!titleDialog.open) return;
    const isTvTitle = String(details.type || '').includes('tv') || details.seasons;
    const [seasons, episodes] = isTvTitle
      ? await Promise.all([
        api(`/api/title/${id}/seasons`),
        api(`/api/title/${id}/episodes`, { regions: region })
      ])
      : [[], []];
    if (!titleDialog.open) return;

    detailContent.replaceChildren();
    const hero = document.createElement('header');
    hero.className = 'detail-hero';
    if (details.backdrop || details.backdrop_url) {
      hero.style.backgroundImage = `linear-gradient(0deg, #0d0f16 0%, rgba(13, 15, 22, 0.72) 50%, rgba(13, 15, 22, 0.15) 100%), url("${details.backdrop || details.backdrop_url}")`;
    }
    const heroText = document.createElement('div');
    const title = document.createElement('h2');
    title.id = 'detail-title';
    title.textContent = details.title || details.name || 'Title details';
    const meta = document.createElement('p');
    meta.className = 'detail-meta';
    meta.textContent = [details.year, details.release_date, details.type, details.runtime_minutes ? `${details.runtime_minutes} min` : ''].filter(Boolean).join(' · ');
    heroText.append(title, meta);
    hero.append(heroText);
    detailContent.append(hero);

    const body = document.createElement('div');
    body.className = 'detail-body';
    const overview = document.createElement('p');
    overview.textContent = details.plot_overview || 'No synopsis is available.';
    body.append(overview);

    const genres = details.genre_names || listFrom(details.genres, ['genres']);
    if (genres.length) {
      const genreLine = document.createElement('p');
      genreLine.textContent = `Genres: ${genres.map(genre => typeof genre === 'string' ? genre : genre.name).filter(Boolean).join(', ')}`;
      body.append(genreLine);
    }
    const identifiers = [
      details.imdb_id ? `IMDb ${details.imdb_id}` : '',
      details.tmdb_id ? `TMDB ${details.tmdb_id}` : '',
      details.tvdb_id ? `TVDB ${details.tvdb_id}` : ''
    ].filter(Boolean);
    if (identifiers.length) {
      const ids = document.createElement('p');
      ids.className = 'detail-meta';
      ids.textContent = identifiers.join(' · ');
      body.append(ids);
    }

    const sourceList = Array.isArray(sources) ? sources : [];
    body.append(makeSection(`Streaming in ${region}`, sourceList.length ? renderSources(sourceList) : document.createTextNode('No streaming sources found for this region.')));
    body.append(makeSection('Release dates', renderReleaseDates(releaseDates)));

    const cast = listFrom(castCrew, ['cast']);
    const crew = listFrom(castCrew, ['crew']);
    const creditsList = [
      ...cast.map(person => ({ ...person, role: person.role || 'Cast' })),
      ...crew.map(person => ({ ...person, role: person.role || 'Crew' }))
    ];
    if (!creditsList.length && Array.isArray(castCrew)) creditsList.push(...castCrew);
    if (creditsList.length) {
      const credits = document.createElement('ul');
      creditsList.slice(0, 50).forEach(person => {
        const item = document.createElement('li');
        item.textContent = [person.name, person.role || person.type, person.character ? `as ${person.character}` : ''].filter(Boolean).join(' — ');
        credits.append(item);
      });
      body.append(makeSection('Cast & crew', credits));
    }

    if (isTvTitle) {
      const episodeList = Array.isArray(episodes) ? episodes : listFrom(episodes, ['episodes']);
      const seasonList = Array.isArray(seasons) ? seasons : listFrom(seasons, ['seasons']);
      if (seasonList.length) {
        const seasonsDisplay = document.createElement('ul');
        seasonList.forEach(season => {
          const entry = document.createElement('li');
          entry.textContent = [season.name || `Season ${season.season_number}`, season.episode_count ? `${season.episode_count} episodes` : ''].filter(Boolean).join(' · ');
          seasonsDisplay.append(entry);
        });
        body.append(makeSection('Seasons', seasonsDisplay));
      }
      body.append(makeSection(`Episodes${details.seasons ? ` · ${details.seasons} seasons` : ''}`, renderEpisodes(episodeList)));
    }

    const addButton = document.createElement('button');
    addButton.className = 'dialog-action';
    addButton.type = 'button';
    addButton.textContent = 'Add to My Library';
    addButton.addEventListener('click', () => {
      const type = String(details.type || '').includes('tv') ? 'TV Shows' : 'Movies';
      window.FrameLibrary.addToSection({
        id: String(details.id || id),
        title: details.title || details.name || 'Untitled',
        year: Number(details.year) || null,
        type,
        image: details.poster || details.poster_url || '',
        alt: details.title || details.name || 'Poster',
        favorite: false
      }, 'All');
      addButton.textContent = 'Added to My Library';
      addButton.disabled = true;
    });
    body.append(addButton);
    detailContent.append(body);
  } catch (error) {
    if (!titleDialog.open) return;
    detailContent.replaceChildren();
    const message = document.createElement('p');
    message.className = 'detail-body';
    message.textContent = error.message;
    detailContent.append(message);
  }
}

async function loadFilters() {
  const filterWarning = document.getElementById('filter-warning');
  const references = await Promise.allSettled([
    api('/api/regions'),
    api('/api/genres'),
    api('/api/networks')
  ]);
  const [regionsResult, genresResult, networksResult] = references;
  const failures = references.filter(result => result.status === 'rejected');
  if (regionsResult.status === 'fulfilled') {
    const regions = listFrom(regionsResult.value, ['regions', 'results']);
    populateSelect(regionFilter, regions, {
      valueKeys: ['country', 'region', 'code'],
      labelKeys: ['name', 'country_name', 'region_name'],
      allLabel: 'Select country'
    });
    if (!regions.length) {
      const fallback = document.createElement('option');
      fallback.value = 'US';
      fallback.textContent = 'United States (fallback)';
      regionFilter.append(fallback);
    }
  } else {
    regionFilter.replaceChildren(new Option('United States (fallback)', 'US'));
  }
  if (genresResult.status === 'fulfilled') {
    const genres = listFrom(genresResult.value, ['genres', 'results']);
    populateSelect(genreFilter, genres, {
      valueKeys: ['id', 'genre_id'],
      labelKeys: ['name', 'genre_name'],
      allLabel: 'All genres'
    });
  } else {
    genreFilter.disabled = true;
  }
  if (networksResult.status === 'fulfilled') {
    const networks = listFrom(networksResult.value, ['networks', 'results']);
    populateSelect(networkFilter, networks, {
      valueKeys: ['id', 'network_id'],
      labelKeys: ['name', 'network_name'],
      allLabel: 'All networks'
    });
  } else {
    networkFilter.disabled = true;
  }
  const preferredRegion = localStorage.getItem('frame-region') || 'US';
  if ([...regionFilter.options].some(option => option.value === preferredRegion)) regionFilter.value = preferredRegion;
  const params = new URLSearchParams(window.location.search);
  const initialField = params.get('search_field');
  const initialValue = params.get('search_value');
  if (initialField && initialValue) {
    const fieldInput = document.getElementById('search-field');
    if ([...fieldInput.options].some(option => option.value === initialField)) fieldInput.value = initialField;
    document.getElementById('search-value').value = initialValue;
  }
  if (failures.length) {
    filterWarning.textContent = `Some filters could not be loaded: ${failures.map(result => result.reason.message).join(' ')}`;
  }
  if (initialValue) await searchTitles();
  else await loadDiscovery();
}

document.getElementById('search-form').addEventListener('submit', searchTitles);
const searchValueInput = document.getElementById('search-value');
searchValueInput.setAttribute('list', 'title-suggestions');
searchValueInput.addEventListener('input', () => {
  clearTimeout(autocompleteTimer);
  const value = searchValueInput.value.trim();
  if (document.getElementById('search-field').value !== 'name' || value.length < 2) return;
  autocompleteTimer = setTimeout(async () => {
    try {
      const payload = await api('/api/autocomplete', { search_value: value, search_type: 2 });
      const suggestions = listFrom(payload, ['results', 'title_results', 'suggestions']);
      const datalist = document.getElementById('title-suggestions');
      datalist.replaceChildren(...suggestions.slice(0, 10).map(suggestion => {
        const option = document.createElement('option');
        option.value = suggestion.name || suggestion.title || '';
        return option;
      }));
    } catch (error) {
      document.getElementById('title-suggestions').replaceChildren();
      document.getElementById('filter-warning').textContent = error.message;
    }
  }, 500);
});
document.getElementById('discover-button').addEventListener('click', () => {
  currentPage = 1;
  loadDiscovery();
});
document.getElementById('releases-button').addEventListener('click', loadReleases);
document.getElementById('previous-page').addEventListener('click', () => {
  currentPage = Math.max(1, currentPage - 1);
  if (currentMode === 'search') searchTitles();
  else loadDiscovery();
});
document.getElementById('next-page').addEventListener('click', () => {
  currentPage = Math.min(lastPage, currentPage + 1);
  if (currentMode === 'search') searchTitles();
  else loadDiscovery();
});
document.getElementById('close-dialog').addEventListener('click', () => titleDialog.close());
titleDialog.addEventListener('click', event => {
  if (event.target === titleDialog) titleDialog.close();
});
regionFilter.addEventListener('change', () => {
  localStorage.setItem('frame-region', regionFilter.value);
  if (currentMode === 'discover') loadDiscovery();
});
[genreFilter, networkFilter, typeFilter].forEach(select => select.addEventListener('change', () => {
  if (currentMode === 'discover') {
    currentPage = 1;
    loadDiscovery();
  }
}));

api('/api/sync/status').then(state => {
  const status = document.getElementById('sync-status');
  if (state.status === 'complete') {
    status.textContent = `Last data sync: ${new Date(state.lastSyncedAt).toLocaleString()} · ${state.sourceChanges.length} streaming changes`;
  } else if (state.status === 'error') {
    status.textContent = `Daily changes sync unavailable: ${state.error}`;
  }
}).catch(error => {
  document.getElementById('sync-status').textContent = error.message;
});

loadFilters().catch(error => setNotice(error.message, 'error'));
