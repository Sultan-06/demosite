const moviesData = [
    {
        title: "Spider-Man: Into the Spider-Verse",
        year: "2018",
        category: "MOVIES",
        image: "images/c1.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=Spider-Verse",
        alt: "spider-man into the spider-verse",
        favorite: false
    },
    {
        title: "Spider-Man: Across the Spider-Verse",
        year: "2023",
        category: "MOVIES",
        image: "images/c3.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=Across+Verse",
        alt: "spider-man across the spider-verse",
        favorite: false
    },
    {
        title: "Spider-Man: Homecoming",
        year: "2017",
        category: "MOVIES",
        image: "images/c2.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=Homecoming",
        alt: "spider-man homecoming",
        favorite: false
    },
    {
        title: "Spider-Man: Far From Home",
        year: "2019",
        category: "MOVIES",
        image: "images/c4.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=Far+From+Home",
        alt: "spider-man far from home",
        favorite: false
    },
    {
        title: "Spider-Man: No Way Home",
        year: "2021",
        category: "MOVIES",
        image: "images/c5.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=No+Way+Home",
        alt: "spider-man no way home",
        favorite: false
    },
    {
        title: "Spider-Man: Brand New Day",
        year: "2026",
        category: "MOVIES",
        image: "images/c6.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=Brand+New+Day",
        alt: "spider-man brand new day",
        favorite: false
    },
    {
        title: "Spider-Man",
        year: "2002",
        category: "MOVIES",
        image: "images/c7.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=Spider-Man+1",
        alt: "spider-man",
        favorite: false
    },
    {
        title: "Spider-Man 2",
        year: "2004",
        category: "MOVIES",
        image: "images/c8.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=Spider-Man+2",
        alt: "spider-man 2",
        favorite: false
    },
    {
        title: "Spider-Man 3",
        year: "2007",
        category: "MOVIES",
        image: "images/c9.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=Spider-Man+3",
        alt: "spider-man 3",
        favorite: false
    },
    {
        title: "The Amazing Spider-Man",
        year: "2012",
        category: "MOVIES",
        image: "images/c10.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=TASM+1",
        alt: "the amazing spider-man",
        favorite: false
    },
    {
        title: "The Amazing Spider-Man 2",
        year: "2014",
        category: "MOVIES",
        image: "images/c11.webp",
        fallback: "https://placehold.co/300x450/111/fff?text=TASM+2",
        alt: "the amazing spider-man 2",
        favorite: false
    },
    {
        title: "Spider-Man: Beyond the Spider-Verse",
        year: "2027",
        category: "MOVIES",
        image: "images/c12.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=Beyond+Verse",
        alt: "spider-man beyond the spider-verse",
        favorite: false
    }
];

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DROPDOWN LOGIC ---
    const browseDropdown = document.querySelector('.dropdown');
    const browseButton = browseDropdown?.querySelector('.dropbtn');

    if (browseDropdown && browseButton) {
        browseButton.addEventListener('click', () => {
            const isExpanded = browseButton.getAttribute('aria-expanded') === 'true';
            browseButton.setAttribute('aria-expanded', String(!isExpanded));
            browseDropdown.classList.toggle('open', !isExpanded);
        });

        document.addEventListener('click', event => {
            if (!browseDropdown.contains(event.target)) {
                browseDropdown.classList.remove('open');
                browseButton.setAttribute('aria-expanded', 'false');
            }
        });
    }

    const gridContainer = document.getElementById('movieGrid');
    const searchInput = document.getElementById('main-search');
    const searchButton = document.getElementById('main-search-submit');

    function toLibraryItem(movie) {
        const type = movie.category === 'MOVIES'
            ? 'Movies'
            : movie.category === 'ANIME' ? 'Anime' : 'TV Shows';
        return {
            title: movie.title,
            year: Number(movie.year),
            type,
            image: movie.image,
            alt: movie.alt,
            favorite: Boolean(movie.favorite)
        };
    }

    const savedItems = window.FrameLibrary.getItems();
    moviesData.forEach(movie => {
        const savedItem = savedItems.find(item => item.title === movie.title);
        if (savedItem) movie.favorite = Boolean(savedItem.favorite);
    });

    function renderMovies() {
        if (!gridContainer) return;

        const query = searchInput?.value.trim().toLowerCase() || '';
        const visibleMovies = moviesData.filter(movie => movie.title.toLowerCase().includes(query));

        gridContainer.replaceChildren(...visibleMovies.map(movie => {
            const card = document.createElement('article');
            card.className = 'media-card';

            const poster = document.createElement('div');
            poster.className = 'cards';

            const image = document.createElement('img');
            image.className = 'card-image';
            image.src = movie.image;
            image.alt = movie.alt;
            image.addEventListener('error', () => {
                image.removeAttribute('src');
                image.src = movie.fallback;
            }, { once: true });

            const category = document.createElement('span');
            category.className = 'category-badge';
            category.textContent = movie.category;

            const actions = document.createElement('div');
            actions.className = 'card-actions';

            const favoriteButton = document.createElement('button');
            favoriteButton.className = 'card-action favorite-button';
            favoriteButton.type = 'button';
            favoriteButton.setAttribute('aria-label', movie.favorite ? 'Remove from favorites' : 'Add to favorites');
            favoriteButton.setAttribute('aria-pressed', String(movie.favorite));

            const favoriteIcon = document.createElement('i');
            favoriteIcon.className = movie.favorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
            favoriteIcon.setAttribute('aria-hidden', 'true');
            favoriteButton.append(favoriteIcon);
            favoriteButton.addEventListener('click', () => {
                movie.favorite = !movie.favorite;
                const savedItem = window.FrameLibrary.getItems().find(item => item.title === movie.title);
                if (movie.favorite) {
                    window.FrameLibrary.addToSection(toLibraryItem(movie), 'Favorites');
                } else if (savedItem) {
                    window.FrameLibrary.updateItem(movie.title, { favorite: false });
                }
                favoriteButton.setAttribute('aria-pressed', String(movie.favorite));
                favoriteButton.setAttribute('aria-label', movie.favorite ? 'Remove from favorites' : 'Add to favorites');
                favoriteIcon.className = movie.favorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
            });

            const optionsButton = document.createElement('button');
            optionsButton.className = 'card-action options-button';
            optionsButton.type = 'button';
            optionsButton.setAttribute('aria-label', `More options for ${movie.title}`);
            optionsButton.setAttribute('aria-expanded', 'false');

            const optionsIcon = document.createElement('i');
            optionsIcon.className = 'fa-solid fa-ellipsis';
            optionsIcon.setAttribute('aria-hidden', 'true');
            optionsButton.append(optionsIcon);

            const menu = document.createElement('div');
            menu.className = 'card-menu';
            menu.setAttribute('role', 'group');
            menu.setAttribute('aria-label', `Options for ${movie.title}`);
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
                    if (option.section === 'Favorites') movie.favorite = true;
                    window.FrameLibrary.addToSection(toLibraryItem(movie), option.section);
                    favoriteButton.setAttribute('aria-pressed', String(movie.favorite));
                    favoriteButton.setAttribute('aria-label', movie.favorite ? 'Remove from favorites' : 'Add to favorites');
                    favoriteIcon.className = movie.favorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
                    menu.hidden = true;
                    optionsButton.setAttribute('aria-expanded', 'false');
                });
                menu.append(menuItem);
            });

            optionsButton.addEventListener('click', () => {
                const isExpanded = optionsButton.getAttribute('aria-expanded') === 'true';
                gridContainer.querySelectorAll('.card-menu').forEach(openMenu => {
                    if (openMenu !== menu) {
                        openMenu.hidden = true;
                        openMenu.previousElementSibling.querySelector('.options-button').setAttribute('aria-expanded', 'false');
                    }
                });
                optionsButton.setAttribute('aria-expanded', String(!isExpanded));
                menu.hidden = isExpanded;
            });

            actions.append(favoriteButton, optionsButton);
            poster.append(image, category, actions, menu);

            const title = document.createElement('h2');
            title.className = 'card-title';
            title.textContent = movie.title;

            const year = document.createElement('p');
            year.className = 'card-year';
            year.textContent = movie.year;

            card.append(poster, title, year);
            return card;
        }));
    }

    renderMovies();
    searchInput?.addEventListener('input', renderMovies);
    const openDiscoverSearch = () => {
        const query = searchInput?.value.trim();
        if (query) {
            window.location.href = `discover.html?search_field=name&search_value=${encodeURIComponent(query)}`;
        } else {
            renderMovies();
        }
    };
    searchButton?.addEventListener('click', openDiscoverSearch);
    searchInput?.addEventListener('keydown', event => {
        if (event.key === 'Enter') openDiscoverSearch();
    });

    document.addEventListener('click', event => {
        if (!(event.target instanceof Element) || event.target.closest('.card-actions, .card-menu')) return;
        gridContainer?.querySelectorAll('.card-menu:not([hidden])').forEach(openMenu => {
            openMenu.hidden = true;
            openMenu.parentElement.querySelector('.options-button').setAttribute('aria-expanded', 'false');
        });
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        gridContainer?.querySelectorAll('.card-menu:not([hidden])').forEach(openMenu => {
            openMenu.hidden = true;
            openMenu.parentElement.querySelector('.options-button').setAttribute('aria-expanded', 'false');
        });
    });

    // --- 3. AVATAR UPLOAD LOGIC ---
    const avatarInput = document.getElementById('avatarInput');
    const navAvatar = document.getElementById('navAvatar');

    if (avatarInput && navAvatar) {
        avatarInput.addEventListener('change', function (event) {
            const file = event.target.files[0];

            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    navAvatar.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
});