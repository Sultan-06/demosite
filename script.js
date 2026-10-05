// 1. THE DATA: Array of objects containing movie details
const moviesData = [
    {
        image: "images/c1.jpg",
        fallback: "https://placehold.co/300x400/111/fff?text=Spider-Verse",
        alt: "spider-man into the spider-verse",
        title: "Spider-Man: Into the Spider-Verse",
        description: "After gaining superpowers, Brooklyn teen Miles Morales discovers he isn't the only Spider-Man. He must team up with dimensionally-displaced heroes to stop a ruthless kingpin from destroying their realities."
    },
    {
        image: "images/c3.jpg",
        fallback: "https://placehold.co/300x400/111/fff?text=Across+Verse",
        alt: "spider-man across the spider-verse",
        title: "Spider-Man: Across the Spider-Verse",
        description: "After reuniting with Gwen Stacy, Brooklyn's Spider-Man is catapulted across the Multiverse where he encounters a society of spider-heroes protecting reality. When they clash over how to handle a dangerous new threat, Miles must face off against the other Spiders to save the people he loves most."
    },
    {
        image: "images/c2.jpg",
        fallback: "https://placehold.co/300x400/111/fff?text=Homecoming",
        alt: "spider-man homecoming",
        title: "Spider-Man: Homecoming",
        description: "Balancing high school life with his secret superhero duties, young Peter Parker strives to prove himself under the watchful eye of mentor Tony Stark. But when a ruthless scavenger known as the Vulture begins peddling dangerous alien weapons, Peter must take matters into his own hands to protect his city and discover what it truly means to be a hero."
    },
    {
        image: "images/c4.jpg",
        fallback: "https://placehold.co/300x400/111/fff?text=Far+From+Home",
        alt: "spider-man far from home",
        title: "Spider-Man: Far From Home",
        description: "Hoping to leave his superhero duties behind for a European school vacation, Peter Parker's plans are derailed when Nick Fury recruits him to fight mysterious elemental creatures. Teaming up with a new hero from another dimension, Peter must step up to protect his friends and uncover the truth behind these world-threatening attacks."
    },
    {
        image: "images/c5.jpg",
        fallback: "https://placehold.co/300x400/111/fff?text=No+Way+Home",
        alt: "spider-man no way home",
        title: "Spider-Man: No Way Home",
        description: "With his secret identity exposed to the world, Peter Parker seeks help from Doctor Strange to magically erase the public's memory of his double life. But when the dangerous spell fractures the multiverse, Peter is forced to battle iconic villains from alternate realities and face his greatest challenge yet."
    },
    {
        image: "images/c6.jpg",
        fallback: "https://placehold.co/300x400/111/fff?text=Brand+New+Day",
        alt: "spider-man brand new day",
        title: "Spider-Man: Brand New Day",
        description: "Entering a fresh chapter of his life, Peter Parker must navigate a changed New York City where his usual support system is gone and a wave of dangerous new criminals is on the rise. Stripped back to basics, he must rebuild his life from the ground up and rely on his classic web-slinging skills to prove once again what it takes to be Spider-Man."
    },
    {
        image: "images/c7.jpg",
        fallback: "https://placehold.co/300x400/111/fff?text=Spider-Man+1",
        alt: "spider-man",
        title: "Spider-Man",
        description: "After a bite from a genetically altered spider grants him extraordinary abilities, awkward high schooler Peter Parker learns a painful lesson about responsibility following a personal tragedy. Embracing his destiny as Spider-Man, he must protect New York City from the ruthless and mentally unstable Green Goblin."
    },
    {
        image: "images/c8.jpg",
        fallback: "https://placehold.co/300x400/111/fff?text=Spider-Man+2",
        alt: "spider-man 2",
        title: "Spider-Man 2",
        description: "Overwhelmed by financial struggles, academic pressure, and strained relationships, Peter Parker finds his powers fading just as a lab accident creates the multi-tentacled menace Doctor Octopus. Torn between pursuing a normal life and honoring his heroic calling, Peter must decide what wearing the mask truly costs."
    },
    {
        image: "images/c9.jpg",
        fallback: "https://placehold.co/300x400/111/fff?text=Spider-Man+3",
        alt: "spider-man 3",
        title: "Spider-Man 3",
        description: "Peter Parker's newfound stability is upended when a mysterious alien symbiote latches onto his suit, amplifying his aggression and corrupting his moral compass. Consumed by his own hubris and inner darkness, he must fight to save his closest relationships while facing the tragic Sandman and a vengeful adversary."
    },
    {
        image: "images/c10.jpg",
        fallback: "https://placehold.co/300x400/111/fff?text=TASM+1",
        alt: "the amazing spider-man",
        title: "The Amazing Spider-Man",
        description: "Teenage outcast Peter Parker begins investigating the mysterious disappearance of his parents, leading him to a genetic laboratory where a spider bite grants him superhuman abilities. As he uncovers his father's secrets, Peter must embrace his new identity as Spider-Man to stop his mentor-turned-enemy from unleashing a mutated reptilian menace on New York City."
    },
    {
        image: "images/c11.webp",
        fallback: "https://placehold.co/300x400/111/fff?text=TASM+2",
        alt: "the amazing spider-man 2",
        title: "The Amazing Spider-Man 2",
        description: "Confident in his role as New York's protector, Peter Parker struggles to balance his life as Spider-Man with his complicated relationship with Gwen Stacy. When the electrifying villain Electro emerges and his old friend Harry Osborn returns, Peter realizes that all of his greatest enemies share a dark connection to the secretive corporation Oscorp."
    },
    {
        image: "images/c12.jpg",
        fallback: "https://placehold.co/300x400/111/fff?text=Beyond+Verse",
        alt: "spider-man beyond the spider-verse",
        title: "Spider-Man: Beyond the Spider-Verse",
        description: "Trapped in an unfamiliar alternate reality and facing a dark version of himself, Miles Morales desperately races against time to return to his own dimension and protect his loved ones. As the reality-altering villain the Spot threatens to unravel the multiverse, Gwen Stacy leads a rogue team of Spider-allies on a high-stakes rescue mission before existence itself collapses."
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
    
    // Loop through our data and build the HTML for each movie dynamically
    let htmlContent = '';
    moviesData.forEach(movie => {
        htmlContent += `
            <div class="cards">
                <img src="${movie.image}" onerror="this.src='${movie.fallback}'" alt="${movie.alt}" class="card-image">
                <div class="details">
                    <p><b>TITLE:</b> ${movie.title}</p>
                    <p class="desc-text"><b>DESCRIPTION:</b> ${movie.description}</p>
                    <button class="read-more-btn">Read More</button>
                </div>
            </div>
        `;
    });
    
    // Inject all the generated cards into the grid at once
    if (gridContainer) {
        gridContainer.innerHTML = htmlContent;
    }

    // --- 3. READ MORE / READ LESS LOGIC ---
    // Note: We MUST run this after the cards are generated and injected!
    const readMoreBtns = document.querySelectorAll('.read-more-btn');

    readMoreBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Find the description paragraph right above the button
            const descText = this.previousElementSibling;
            
            // Toggle the 'expanded' class
            descText.classList.toggle('expanded');

            // Update button text
            if (descText.classList.contains('expanded')) {
                this.textContent = 'Read Less';
            } else {
                this.textContent = 'Read More';
            }
        });
    });

    // --- 4. AVATAR UPLOAD LOGIC ---
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