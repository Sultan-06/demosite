// 1. THE DATA: Updated with rating, sub, dub, and episode stats
const moviesData = [
    {
        image: "images/c1.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=Spider-Verse",
        alt: "spider-man into the spider-verse",
        rating: "8.4", sub: "1", dub: "1", eps: "1"
    },
    {
        image: "images/c3.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=Across+Verse",
        alt: "spider-man across the spider-verse",
        rating: "8.9", sub: "1", dub: "1", eps: "1"
    },
    {
        image: "images/c2.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=Homecoming",
        alt: "spider-man homecoming",
        rating: "7.4", sub: "1", dub: "1", eps: "1"
    },
    {
        image: "images/c4.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=Far+From+Home",
        alt: "spider-man far from home",
        rating: "7.4", sub: "1", dub: "1", eps: "1"
    },
    {
        image: "images/c5.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=No+Way+Home",
        alt: "spider-man no way home",
        rating: "8.2", sub: "1", dub: "1", eps: "1"
    },
    {
        image: "images/c6.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=Brand+New+Day",
        alt: "spider-man brand new day",
        rating: "7.0", sub: "1", dub: "0", eps: "?"
    },
    {
        image: "images/c7.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=Spider-Man+1",
        alt: "spider-man",
        rating: "7.4", sub: "1", dub: "1", eps: "1"
    },
    {
        image: "images/c8.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=Spider-Man+2",
        alt: "spider-man 2",
        rating: "7.5", sub: "1", dub: "1", eps: "1"
    },
    {
        image: "images/c9.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=Spider-Man+3",
        alt: "spider-man 3",
        rating: "6.3", sub: "1", dub: "1", eps: "1"
    },
    {
        image: "images/c10.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=TASM+1",
        alt: "the amazing spider-man",
        rating: "6.9", sub: "1", dub: "1", eps: "1"
    },
    {
        image: "images/c11.webp",
        fallback: "https://placehold.co/300x450/111/fff?text=TASM+2",
        alt: "the amazing spider-man 2",
        rating: "6.6", sub: "1", dub: "1", eps: "1"
    },
    {
        image: "images/c12.jpg",
        fallback: "https://placehold.co/300x450/111/fff?text=Beyond+Verse",
        alt: "spider-man beyond the spider-verse",
        rating: "0.0", sub: "0", dub: "0", eps: "?"
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

    // --- 2. CARD GENERATION LOGIC ---
    const gridContainer = document.getElementById('movieGrid');
    
    // Build the new image-only layout with absolute positioned badges
    let htmlContent = '';
    moviesData.forEach(movie => {
        htmlContent += `
            <div class="cards">
                <img src="${movie.image}" onerror="this.src='${movie.fallback}'" alt="${movie.alt}" class="card-image">
                
                <div class="rating-badge">
                    <i class="fa-solid fa-star"></i> <span>${movie.rating}</span>
                </div>
                
                <div class="stats-badge">
                    <i class="fa-regular fa-closed-captioning"></i> <span class="stat-sub">${movie.sub}</span> 
                    <span class="divider">/</span>
                    <i class="fa-solid fa-microphone"></i> <span class="stat-dub">${movie.dub}</span> 
                    <span class="divider">/</span>
                    <i class="fa-solid fa-list"></i> <span class="stat-eps">${movie.eps}</span>
                </div>
            </div>
        `;
    });
    
    if (gridContainer) {
        gridContainer.innerHTML = htmlContent;
    }

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