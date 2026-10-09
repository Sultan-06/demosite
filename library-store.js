(() => {
    const storageKey = 'frame-library-items';
    const initialItems = [
        { id: 'spider-man-across-the-spider-verse', title: 'Spider-Man: Across the Spider-Verse', year: 2023, type: 'Movies', favorite: true, watched: false, gradient: 'linear-gradient(140deg, #7f1d1d, #1e3a8a)', mark: 'SP' },
        { id: 'daredevil', title: 'Daredevil', year: 2015, type: 'TV Shows', favorite: true, watched: false, gradient: 'linear-gradient(140deg, #450a0a, #991b1b)', mark: 'DD' },
        { id: 'jujutsu-kaisen', title: 'Jujutsu Kaisen', year: 2020, type: 'Anime', favorite: false, watched: false, gradient: 'linear-gradient(140deg, #312e81, #581c87)', mark: '呪' },
        { id: 'bloodhounds', title: 'Bloodhounds', year: 2023, type: 'TV Shows', favorite: false, watched: false, gradient: 'linear-gradient(140deg, #1e293b, #7f1d1d)', mark: 'BH' },
        { id: 'patema-inverted', title: 'Patema Inverted', year: 2013, type: 'Anime', favorite: true, watched: false, gradient: 'linear-gradient(140deg, #164e63, #1e3a8a)', mark: 'PI' },
        { id: 'the-batman', title: 'The Batman', year: 2022, type: 'Movies', favorite: false, watched: false, gradient: 'linear-gradient(140deg, #0f172a, #292524)', mark: '蝙' },
        { id: 'cyberpunk-edgerunners', title: 'Cyberpunk: Edgerunners', year: 2022, type: 'Anime', favorite: true, watched: false, gradient: 'linear-gradient(140deg, #854d0e, #581c87)', mark: '2077' },
        { id: 'severance', title: 'Severance', year: 2022, type: 'TV Shows', favorite: false, watched: false, gradient: 'linear-gradient(140deg, #134e4a, #1e293b)', mark: 'S' },
        { id: 'dune-part-two', title: 'Dune: Part Two', year: 2024, type: 'Movies', favorite: true, watched: false, gradient: 'linear-gradient(140deg, #9a3412, #78350f)', mark: 'DUNE' },
        { id: 'attack-on-titan', title: 'Attack on Titan', year: 2013, type: 'Anime', favorite: true, watched: false, gradient: 'linear-gradient(140deg, #7f1d1d, #44403c)', mark: '進' }
    ];

    function saveItems(items) {
        localStorage.setItem(storageKey, JSON.stringify(items));
    }

    function getItems() {
        const storedItems = localStorage.getItem(storageKey);
        if (storedItems === null) {
            const items = initialItems.map(item => ({ ...item }));
            saveItems(items);
            return items;
        }

        const items = JSON.parse(storedItems);
        if (!Array.isArray(items) || items.some(item => !item || typeof item.title !== 'string')) {
            throw new Error('Saved library data is invalid. Clear the frame-library-items entry from local storage to reset it.');
        }

        return items;
    }

    function addToSection(media, section) {
        const items = getItems();
        const titleKey = media.title.trim().toLowerCase();
        const existingItem = items.find(item => item.title.trim().toLowerCase() === titleKey);
        const item = existingItem || {
            id: titleKey.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            favorite: false,
            watched: false
        };

        const { favorite, watched, ...mediaDetails } = media;
        Object.assign(item, mediaDetails);
        if (!existingItem) {
            item.favorite = Boolean(favorite);
            item.watched = Boolean(watched);
        }
        if (section === 'Watched') item.watched = true;
        if (section === 'Favorites') item.favorite = true;
        if (!existingItem) items.push(item);
        saveItems(items);
    }

    function updateItem(title, updates) {
        const items = getItems();
        const item = items.find(entry => entry.title === title);
        if (!item) throw new Error(`Cannot update "${title}": item is not in your library.`);
        Object.assign(item, updates);
        saveItems(items);
    }

    function removeItem(title) {
        const items = getItems();
        saveItems(items.filter(item => item.title !== title));
    }

    window.FrameLibrary = { getItems, addToSection, updateItem, removeItem };
})();
