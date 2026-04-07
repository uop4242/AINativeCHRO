/**
 * main.js — Slide loader, navigation, and orchestration
 *
 * Slide order is defined in the SLIDE_FILES array below.
 * To reorder, add, or remove slides, just edit this array.
 */

const SLIDE_FILES = [
    // ── Phase 1: Strategic Alignment (The Hook) ──
    'slides/00-title.html',               // 00: Title
    'slides/01-intro.html',               // 01: Manifesto intro
    'slides/02-data-pipeline.html',       // 02: Data Pipeline (Slop to Structured Intelligence)

    // ── Phase 2: The Problem ──
    'slides/04-skills-challenge.html',    // 03: Why skills are the hardest problem
    'slides/05-convergence.html',         // 04: From chaos to clarity (61K to 36K)
    'slides/06-taxonomy.html',            // 05: Living taxonomy bridges the gap

    // ── Phase 3: The Engine (What Took 8 Years) ──
    'slides/07-intelligence-engine.html', // 06: Self-correcting 4-signal resolver
    'slides/08-proficiency.html',         // 07: Mathematical proficiency scoring
    'slides/09-title-recommender.html',   // 08: Title intelligence
    'slides/10-attribute-graph.html',     // 09: Knowledge graph
    'slides/11-graph-recommender.html',   // 10: Graph-powered recommendations

    // ── Phase 4: What It Makes Possible ──
    'slides/12-transition.html',          // 11: Transition
    'slides/03-intelligence-layer.html',  // 12: Living Intelligence Layer — Phase 4 overview
    'slides/13-ai-infrastructure.html',   // 13: Purpose-built AI stack
    'slides/14-talent-drift.html',        // 14: Talent drift over time
    'slides/15-career-pathways.html',     // 15: Career pathways
    'slides/16-gap-analysis.html',        // 16: Workforce Planning
    'slides/17-search-intelligence.html', // 17: Search intelligence
    'slides/18-signal-composition.html',  // 18: Signal composition
    'slides/19-intelligence-outcomes.html', // 19: Intelligence outcomes

    // ── Phase 5: Proof ──
    'slides/20-job-profile-match.html',   // 20: Real matching output
    'slides/21-verizon-case-study.html',  // 21: $70M impact, Fortune 10 scale
    // Note: 22-demo.html (Thank You slide) removed
];

// ── State ──────────────────────────────────────────────
window.currentSlide = 0;
window.presentationSlides = [];  // populated after load
let notesVisible = false;

// ── Loader ─────────────────────────────────────────────

async function loadSlides() {
    const container = document.querySelector('.presentation');

    for (let i = 0; i < SLIDE_FILES.length; i++) {
        const res = await fetch(SLIDE_FILES[i]);
        const html = await res.text();

        // Parse the HTML and update data-slide indices to match load order
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html.trim();
        const slideEl = wrapper.firstElementChild;

        // Overwrite the data-slide attribute to match its position
        slideEl.setAttribute('data-slide', i);

        // Only the first slide should be active initially
        if (i === 0) {
            slideEl.classList.add('active');
        } else {
            slideEl.classList.remove('active');
        }

        // Update the slide-number text (01, 02, ...) for non-title slides
        const numEl = slideEl.querySelector('.slide-number');
        if (numEl && i > 0) {
            numEl.textContent = String(i).padStart(2, '0');
        }

        // Update speaker-notes data-notes attribute
        const notesEl = slideEl.querySelector('.speaker-notes');
        if (notesEl) {
            notesEl.setAttribute('data-notes', i);
        }

        container.appendChild(slideEl);
    }

    // Cache slide elements
    window.presentationSlides = document.querySelectorAll('.slide');

    // Post-load setup
    createNavDots();
    setupVariantTagIndices();
    updateSlide(0);
    setupKeyboardNav();
    setupMobileNav();
    setupTouchNav();
}

// ── Navigation ─────────────────────────────────────────

function createNavDots() {
    const dotsContainer = document.getElementById('navDots');
    const totalSlides = window.presentationSlides.length;
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('div');
        dot.className = 'nav-dot' + (i === 0 ? ' active' : '');
        dot.onclick = () => goToSlide(i);
        dotsContainer.appendChild(dot);
    }
}

function goToSlide(index) {
    window.currentSlide = index;
    updateSlide(index);
}

function updateSlide(index) {
    const slides = window.presentationSlides;

    // Toggle active slide first so layout is fully computed
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
        if (i === index) slide.scrollTop = 0;
    });

    // Force reflow so GSAP reads correct layout values
    void slides[index].offsetHeight;

    // Now animate — gsap.from() with immediateRender (default) sets
    // the FROM state synchronously before the browser paints
    animateSlideIn(index);

    // Toggle active nav dot
    document.querySelectorAll('.nav-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });

    // Toggle speaker notes
    document.querySelectorAll('.speaker-notes').forEach((note, i) => {
        note.classList.toggle('visible', notesVisible && i === index);
    });

    // Update mobile counter
    updateMobileCounter();

    // Slide-specific hooks (from animations.js)
    onSlideEnter(index);

    // Lazy-init 3D graph when convergence slide first shown (slide 4)
    if (index === 4 && !universeGraph) {
        setTimeout(initUniverseGraph, 100);
    }

    // Lazy-init drift graph when talent drift slide first shown (slide 14)
    if (index === 14 && !driftGraph) {
        setTimeout(initDriftGraph, 100);
    }
}

function nextSlide() {
    if (window.currentSlide < window.presentationSlides.length - 1) {
        window.currentSlide++;
        updateSlide(window.currentSlide);
    }
}

function prevSlide() {
    if (window.currentSlide > 0) {
        window.currentSlide--;
        updateSlide(window.currentSlide);
    }
}

function toggleNotes() {
    notesVisible = !notesVisible;
    document.querySelectorAll('.speaker-notes').forEach((note, i) => {
        note.classList.toggle('visible', notesVisible && i === window.currentSlide);
    });
}

function setupKeyboardNav() {
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowRight':
            case ' ':
                nextSlide();
                break;
            case 'ArrowLeft':
                prevSlide();
                break;
            case 'n':
            case 'N':
                toggleNotes();
                break;
        }
    });
}

// ── Mobile Navigation ──────────────────────────────────

function setupMobileNav() {
    const prevBtn = document.getElementById('mobilePrev')
    const nextBtn = document.getElementById('mobileNext')

    if (prevBtn) prevBtn.addEventListener('click', prevSlide)
    if (nextBtn) nextBtn.addEventListener('click', nextSlide)

    updateMobileCounter()
}

function updateMobileCounter() {
    const counter = document.getElementById('mobileCounter')
    if (counter) {
        counter.textContent = `${window.currentSlide} / ${window.presentationSlides.length - 1}`
    }
}

function setupTouchNav() {
    let touchStartX = 0
    let touchStartY = 0
    let touchStartTime = 0

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX
        touchStartY = e.changedTouches[0].screenY
        touchStartTime = Date.now()
    }, { passive: true })

    document.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].screenX - touchStartX
        const dy = e.changedTouches[0].screenY - touchStartY
        const elapsed = Date.now() - touchStartTime

        const minSwipe = 50
        const maxTime = 500

        if (elapsed > maxTime) return
        if (Math.abs(dx) < minSwipe) return
        if (Math.abs(dy) > Math.abs(dx)) return

        if (dx < 0) {
            nextSlide()
        } else {
            prevSlide()
        }
    }, { passive: true })
}

// ── Helpers ────────────────────────────────────────────

function setupVariantTagIndices() {
    const variantTags = document.querySelectorAll('.variant-tag');
    variantTags.forEach((tag, i) => {
        tag.style.setProperty('--index', i);
    });
}

// ── Boot ───────────────────────────────────────────────
loadSlides();
