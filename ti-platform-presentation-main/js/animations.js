/**
 * animations.js — GSAP animations for slide transitions and convergence effects
 */

// ── Configurable ───────────────────────────────────────
const PARTICLE_FLOW_DURATION_S = 5;    // seconds the particle animation runs after slide entry
const INPUT_PARTICLE_INTERVAL_MS = 180; // ms between input particles
const OUTPUT_PARTICLE_INTERVAL_MS = 650; // ms between output particles (fewer = canonized)
const OUTPUT_PARTICLE_DELAY_S = 0.8;    // delay before output particles begin (processing time)
const OUTPUT_LINGER_S = 2;              // extra seconds output particles continue after inputs stop

// Convergence slide index (update if slide order changes)
const CONVERGENCE_SLIDE_INDEX = 4;

// Pipeline slide index
const PIPELINE_SLIDE_INDEX = 2;

// Track convergence animation intervals
let convergenceAnimationInterval = null;
let outputAnimationInterval = null;

// Track pipeline particle interval
let pipelineParticleInterval = null;

/**
 * Animate standard slide elements on entry
 */
/**
 * Safe GSAP wrapper — skips if target is null or an empty NodeList.
 */
function gsapFrom(target, vars) {
    if (!target) return;
    if (target.length !== undefined && target.length === 0) return;
    gsap.from(target, vars);
}

function animateSlideIn(index) {
    const slide = window.presentationSlides[index];
    if (!slide) return;

    // Standard slide elements
    gsapFrom(slide.querySelectorAll('.slide-header'), {
        opacity: 0,
        y: 30,
        duration: 0.6,
        ease: 'power2.out',
        clearProps: 'opacity,transform'
    });

    // Grid items stagger
    gsapFrom(slide.querySelectorAll('.pipeline-step, .canonizer-main > *, .engine-main > *, .demo-content > *, .profile-comparison > *, .gap-analysis-panel > *, .data-foundation-grid > *, .proficiency-grid > *, .gap-full-grid > *, .job-match-layout > *'), {
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.1,
        delay: 0.2,
        ease: 'power2.out',
        clearProps: 'opacity,transform'
    });

    // Cards with longer delay
    gsapFrom(slide.querySelectorAll('.cost-card, .canonizer-features > *'), {
        opacity: 0,
        y: 30,
        duration: 0.5,
        stagger: 0.1,
        delay: 0.4,
        ease: 'power2.out',
        clearProps: 'opacity,transform'
    });

    gsapFrom(slide.querySelectorAll('.pipeline-note, .moat-footer, .decisions-tagline'), {
        opacity: 0,
        y: 30,
        duration: 0.5,
        delay: 0.8,
        ease: 'power2.out',
        clearProps: 'opacity,transform'
    });

    // Special animations for convergence slide
    if (index === CONVERGENCE_SLIDE_INDEX) {
        animateConvergenceSlide();
    }

    // Slide 2: Data Pipeline — From Slop to Structured Intelligence
    if (index === 2) {
        // Metric badges pop in
        gsapFrom(slide.querySelectorAll('.dp-metric'), {
            opacity: 0,
            scale: 0.7,
            duration: 0.4,
            stagger: 0.08,
            delay: 0.2,
            ease: 'back.out(1.7)',
            clearProps: 'opacity,transform'
        });
        // Section labels
        gsapFrom(slide.querySelectorAll('.dp-section-label, .dp-track-label'), {
            opacity: 0,
            y: -10,
            duration: 0.4,
            stagger: 0.1,
            delay: 0.3,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        // Source pills slide in from left
        gsapFrom(slide.querySelectorAll('.dp-source-pill'), {
            opacity: 0,
            x: -30,
            duration: 0.4,
            stagger: 0.08,
            delay: 0.4,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        // Pipeline stages cascade from left
        gsapFrom(slide.querySelectorAll('.dp-hstage'), {
            opacity: 0,
            y: 30,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.5,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        // Stage arrows fade in
        gsapFrom(slide.querySelectorAll('.dp-hstage-arrow'), {
            opacity: 0,
            duration: 0.3,
            stagger: 0.1,
            delay: 0.8,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        // Golden Record orb scales in with glow
        const dpOrb = slide.querySelector('.dp-orb');
        if (dpOrb) {
            gsapFrom(dpOrb, {
                scale: 0.3,
                opacity: 0,
                duration: 0.8,
                delay: 1.0,
                ease: 'back.out(1.7)',
                clearProps: 'opacity,transform'
            });
        }
        gsapFrom(slide.querySelector('.dp-orb-label'), {
            opacity: 0,
            duration: 0.4,
            delay: 1.4,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        // Callout fades in last
        gsapFrom(slide.querySelector('.dp-callout'), {
            opacity: 0,
            y: 10,
            duration: 0.5,
            delay: 1.6,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        // Start pipeline particle flow animation
        animatePipelineSlide();
    }

    // Slide 12: Living Intelligence Layer
    if (index === 12) {
        // Section labels
        gsapFrom(slide.querySelectorAll('.il-section-label'), {
            opacity: 0,
            y: -10,
            duration: 0.4,
            stagger: 0.1,
            delay: 0.2,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        // Intelligence capability layers cascade in
        gsapFrom(slide.querySelectorAll('.il-cap'), {
            opacity: 0,
            x: -40,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.3,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        // Capability icons scale in with bounce
        gsapFrom(slide.querySelectorAll('.il-cap-icon'), {
            scale: 0,
            opacity: 0,
            duration: 0.4,
            stagger: 0.1,
            delay: 0.5,
            ease: 'back.out(2)',
            clearProps: 'opacity,transform'
        });
        // Connectors
        gsapFrom(slide.querySelectorAll('.il-cap-conn'), {
            opacity: 0,
            scaleY: 0,
            duration: 0.2,
            stagger: 0.08,
            delay: 0.6,
            ease: 'power2.out',
            transformOrigin: 'top center',
            clearProps: 'opacity,transform'
        });
        // Example tags scale in
        gsapFrom(slide.querySelectorAll('.il-example-tag'), {
            opacity: 0,
            scale: 0.7,
            duration: 0.3,
            stagger: 0.06,
            delay: 0.9,
            ease: 'back.out(1.5)',
            clearProps: 'opacity,transform'
        });
        // Unlock flow steps cascade down
        gsapFrom(slide.querySelectorAll('.il-unlock-step'), {
            opacity: 0,
            y: 30,
            duration: 0.5,
            stagger: 0.15,
            delay: 0.5,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        // Unlock arrows fade
        gsapFrom(slide.querySelectorAll('.il-unlock-arrow'), {
            opacity: 0,
            duration: 0.3,
            stagger: 0.12,
            delay: 0.7,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        // Result step glows in
        const resultStep = slide.querySelector('.il-unlock-result');
        if (resultStep) {
            gsap.fromTo(resultStep,
                { boxShadow: '0 0 0px rgba(0, 182, 161, 0)' },
                { boxShadow: '0 0 30px rgba(0, 182, 161, 0.3), 0 0 60px rgba(0, 182, 161, 0.15)',
                  duration: 1, delay: 1.4, ease: 'power2.out' }
            );
        }
        // Living badge pulses in
        gsapFrom(slide.querySelector('.il-living-badge'), {
            opacity: 0,
            scale: 0.8,
            duration: 0.5,
            delay: 1.6,
            ease: 'back.out(1.5)',
            clearProps: 'opacity,transform'
        });
        // Bottom callout
        gsapFrom(slide.querySelector('.il-callout'), {
            opacity: 0,
            y: 15,
            duration: 0.5,
            delay: 1.8,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
    }

    // Slide 5: Taxonomy Bridge — variant pills, canonical hubs, job pills, SVG paths
    if (index === 5) {
        animateBridgeDiagram(slide);
    }

    // Slide 6: Resolver diagram + cluster scatter + correction cycle
    if (index === 6) {
        animateResolverSlide(slide);
    }

    // Slide 7: Proficiency — index cards, equation, distribution bars, callouts
    if (index === 7) {
        // Index cards stagger in
        gsapFrom(slide.querySelectorAll('.index-card'), {
            opacity: 0,
            x: -20,
            duration: 0.4,
            stagger: 0.15,
            delay: 0.3,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });

        // SVG curves draw on
        const curves = slide.querySelectorAll('.index-curve path');
        curves.forEach(path => {
            const len = path.getTotalLength();
            path.style.strokeDasharray = len;
            path.style.strokeDashoffset = len;
        });
        gsap.to(curves, {
            strokeDashoffset: 0,
            duration: 0.8,
            stagger: 0.15,
            delay: 0.6,
            ease: 'power2.out'
        });

        // Equation weighting bar
        gsapFrom(slide.querySelectorAll('.eq-segment'), {
            scaleX: 0,
            opacity: 0,
            duration: 0.4,
            stagger: 0.1,
            delay: 1.0,
            ease: 'power2.out',
            transformOrigin: 'left center',
            clearProps: 'opacity,transform'
        });
        const eqLabel = slide.querySelector('.equation-label');
        if (eqLabel) {
            gsapFrom(eqLabel, { opacity: 0, x: -10, duration: 0.3, delay: 1.4, ease: 'power2.out', clearProps: 'opacity,transform' });
        }

        // Distribution bars
        const distFills = slide.querySelectorAll('.dist-bar-fill');
        distFills.forEach((fill) => {
            const targetWidth = fill.dataset.width;
            fill.style.transition = 'none';
            fill.style.width = '0%';
            setTimeout(() => {
                fill.style.transition = '';
                fill.style.width = targetWidth + '%';
            }, 600);
        });

        // Feature callouts
        gsapFrom(slide.querySelectorAll('.prof-callout'), {
            opacity: 0,
            y: 10,
            duration: 0.4,
            stagger: 0.12,
            delay: 1.6,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });

        // LMS callout
        const lms = slide.querySelector('.lms-callout');
        if (lms) {
            gsapFrom(lms, { opacity: 0, y: 10, duration: 0.4, delay: 1.8, ease: 'power2.out', clearProps: 'opacity,transform' });
        }
    }

    // Title Recommender slide (08d) — stagger steps
    if (index === 8) {
        gsapFrom(slide.querySelectorAll('.tr-step-card, .tr-flow-arrow'), {
            opacity: 0,
            y: 25,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.2,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        gsapFrom(slide.querySelectorAll('.tr-output-card, .tr-advantage-card'), {
            opacity: 0,
            y: 30,
            duration: 0.5,
            stagger: 0.15,
            delay: 0.4,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        gsapFrom(slide.querySelectorAll('.tr-output-row'), {
            opacity: 0,
            x: -20,
            duration: 0.4,
            stagger: 0.1,
            delay: 0.7,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
    }

    // Attribute Graph slide (08e) — stagger graph + cards
    if (index === 9) {
        gsapFrom(slide.querySelectorAll('.ag-graph-card, .ag-connects-card'), {
            opacity: 0,
            y: 30,
            duration: 0.6,
            stagger: 0.15,
            delay: 0.2,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        gsapFrom(slide.querySelectorAll('.ag-how-card, .ag-example-card, .ag-powers-callout'), {
            opacity: 0,
            y: 30,
            duration: 0.5,
            stagger: 0.12,
            delay: 0.35,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        gsapFrom(slide.querySelectorAll('.ag-connection'), {
            opacity: 0,
            scale: 0.7,
            duration: 0.4,
            stagger: 0.08,
            delay: 0.6,
            ease: 'back.out(1.7)',
            clearProps: 'opacity,transform'
        });
        gsapFrom(slide.querySelectorAll('.ag-example-result'), {
            opacity: 0,
            x: -15,
            duration: 0.35,
            stagger: 0.1,
            delay: 0.8,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
    }

    // Slide 13: AI Infrastructure — layer cards + 3D orbit
    // Note: .ai-layer uses inline --lc custom property for colors, so clearProps
    // must NOT clear 'all' or the colors vanish.
    if (index === 13) {
        gsapFrom(slide.querySelectorAll('.ai-layer'), {
            opacity: 0,
            x: -30,
            duration: 0.5,
            stagger: 0.15,
            delay: 0.3,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        gsapFrom(slide.querySelectorAll('.ai-layer-conn'), {
            opacity: 0,
            duration: 0.3,
            stagger: 0.15,
            delay: 0.5,
            ease: 'power2.out',
            clearProps: 'opacity'
        });
        gsapFrom(slide.querySelector('.ai-orbit-tagline'), {
            opacity: 0,
            y: 10,
            duration: 0.5,
            delay: 1.2,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
    }

    // Slide 14: Talent Drift — narrative cards + timeline
    if (index === 14) {
        gsapFrom(slide.querySelectorAll('.drift-narrative-card, .drift-story-card, .drift-implications-card'), {
            opacity: 0,
            x: -30,
            duration: 0.6,
            stagger: 0.15,
            delay: 0.2,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        gsapFrom(slide.querySelectorAll('.drift-graph-container'), {
            opacity: 0,
            scale: 0.9,
            duration: 0.8,
            delay: 0.3,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        gsapFrom(slide.querySelectorAll('.drift-timeline, .drift-metrics'), {
            opacity: 0,
            y: 20,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.6,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        gsapFrom(slide.querySelectorAll('.drift-persona'), {
            opacity: 0,
            x: -15,
            duration: 0.4,
            stagger: 0.12,
            delay: 0.5,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
    }

    // HybridSearch slides (17, 18, 19) — stagger grid items
    if (index === 17 || index === 18 || index === 19) {
        gsapFrom(slide.querySelectorAll('.hs-intel-left > *, .hs-intel-right > *, .hs-signal-left > *, .hs-signal-right > *, .hs-outcomes-col > *'), {
            opacity: 0,
            y: 30,
            duration: 0.5,
            stagger: 0.08,
            delay: 0.2,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
    }

    // Slide 15: Career Pathways — flow animation
    if (index === 15) {
        gsapFrom(slide.querySelector('.current-role'), {
            opacity: 0,
            x: -40,
            duration: 0.6,
            delay: 0.3,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        gsapFrom(slide.querySelector('.pathway-develop-overlay'), {
            opacity: 0,
            scale: 0.8,
            duration: 0.5,
            delay: 0.6,
            ease: 'back.out(1.7)',
            clearProps: 'opacity,transform'
        });
        gsapFrom(slide.querySelector('.target-role'), {
            opacity: 0,
            x: 40,
            duration: 0.6,
            delay: 0.9,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
    }

    // Slide 21: Verizon Case Study — metrics + quotes stagger
    if (index === 21) {
        gsapFrom(slide.querySelectorAll('.case-problem-card, .case-solution-card'), {
            opacity: 0,
            x: -30,
            duration: 0.5,
            stagger: 0.15,
            delay: 0.3,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        gsapFrom(slide.querySelectorAll('.case-metric'), {
            opacity: 0,
            scale: 0.9,
            duration: 0.4,
            stagger: 0.08,
            delay: 0.5,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        gsapFrom(slide.querySelectorAll('.case-outcome-tag'), {
            opacity: 0,
            y: 15,
            duration: 0.3,
            stagger: 0.06,
            delay: 0.9,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        gsapFrom(slide.querySelectorAll('.case-quote'), {
            opacity: 0,
            x: 20,
            duration: 0.4,
            stagger: 0.15,
            delay: 1.1,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
    }

    // Slide 20: Job Profile Matching — cards + bars
    if (index === 20) {
        gsapFrom(slide.querySelector('.jm-job-card'), {
            opacity: 0,
            x: -40,
            duration: 0.6,
            delay: 0.3,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        gsapFrom(slide.querySelector('.jm-match-connector'), {
            opacity: 0,
            scale: 0.5,
            duration: 0.5,
            delay: 0.5,
            ease: 'back.out(1.7)',
            clearProps: 'opacity,transform'
        });
        gsapFrom(slide.querySelector('.jm-emp-card'), {
            opacity: 0,
            x: 40,
            duration: 0.6,
            delay: 0.7,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        // Animate comparison bars
        const jmBars = slide.querySelectorAll('.jm-bar');
        jmBars.forEach((bar) => {
            const targetWidth = bar.style.width;
            bar.style.transition = 'none';
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.transition = '';
                bar.style.width = targetWidth;
            }, 900);
        });
        gsapFrom(slide.querySelectorAll('.jm-skill-row'), {
            opacity: 0,
            x: -15,
            duration: 0.3,
            stagger: 0.05,
            delay: 0.9,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
        gsapFrom(slide.querySelectorAll('.jm-cand-row:not(.jm-cand-header)'), {
            opacity: 0,
            y: 10,
            duration: 0.25,
            stagger: 0.04,
            delay: 1.2,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
    }

}

// ═══════════════════════════════════════════════
// Slide 2: Pipeline Particle Flow System
// ═══════════════════════════════════════════════

function stopPipelineParticles() {
    if (pipelineParticleInterval) {
        clearInterval(pipelineParticleInterval);
        pipelineParticleInterval = null;
    }
    // Kill shimmer tweens on pipeline pills
    document.querySelectorAll('.dp-pill-glow').forEach(glow => {
        gsap.killTweensOf(glow);
        glow.style.left = '-100%';
    });
}

function animatePipelineSlide() {
    const slide = document.getElementById('pipelineSlide');
    if (!slide) return;

    stopPipelineParticles();

    // Animate orb rings
    const outerRing = document.getElementById('dpOrbOuterRing');
    const pulseRing = document.getElementById('dpOrbPulseRing');
    const orb = document.getElementById('dpOrb');

    if (outerRing) {
        gsap.to(outerRing, { rotation: 360, duration: 20, repeat: -1, ease: 'none' });
    }
    if (pulseRing) {
        gsap.to(pulseRing, { scale: 1.1, opacity: 0.5, duration: 1.5, repeat: -1, yoyo: true, ease: 'power1.inOut' });
    }

    // Pill shimmer animation
    const pillGlows = slide.querySelectorAll('.dp-pill-glow');
    pillGlows.forEach((glow, i) => {
        gsap.to(glow, {
            left: '200%',
            duration: 1.5,
            delay: 1.5 + i * 0.2,
            repeat: -1,
            repeatDelay: 3 + Math.random() * 2,
            ease: 'power2.inOut'
        });
    });

    // Start particle flow after entrance animations settle
    setTimeout(() => {
        if (window.currentSlide !== PIPELINE_SLIDE_INDEX) return;
        startPipelineParticleFlow();
    }, 1800);
}

function startPipelineParticleFlow() {
    const slide = document.getElementById('pipelineSlide');
    const container = document.getElementById('dpParticleContainer');
    const pills = slide ? slide.querySelectorAll('.dp-source-pill') : [];
    const stages = slide ? slide.querySelectorAll('.dp-hstage') : [];
    const orb = document.getElementById('dpOrb');

    if (!slide || !container || !orb || pills.length === 0 || stages.length === 0) return;

    stopPipelineParticles();
    container.innerHTML = '';

    if (window.innerWidth <= 768) {
        container.style.height = slide.scrollHeight + 'px';
    }

    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }

    function lerpColor(c1, c2, t) {
        return {
            r: Math.round(c1.r + (c2.r - c1.r) * t),
            g: Math.round(c1.g + (c2.g - c1.g) * t),
            b: Math.round(c1.b + (c2.b - c1.b) * t)
        };
    }

    function getPositions() {
        const sRect = slide.getBoundingClientRect();
        const scrollY = slide.scrollTop || 0;
        const sc = [];
        stages.forEach(stage => {
            const r = stage.getBoundingClientRect();
            sc.push({
                x: r.left - sRect.left + r.width / 2,
                y: r.top - sRect.top + scrollY + r.height / 2
            });
        });
        const oRect = orb.getBoundingClientRect();
        return {
            slideRect: sRect,
            scrollY,
            stageCenters: sc,
            orbCX: oRect.left - sRect.left + oRect.width / 2,
            orbCY: oRect.top - sRect.top + scrollY + oRect.height / 2
        };
    }

    const TEAL_RGB = hexToRgb('#00B6A1');

    function createPipelineParticle() {
        if (window.currentSlide !== PIPELINE_SLIDE_INDEX) { stopPipelineParticles(); return; }

        const pos = getPositions();

        const randomPill = pills[Math.floor(Math.random() * pills.length)];
        const startColor = randomPill.dataset.color || '#00B6A1';
        const startRGB = hexToRgb(startColor);

        const pillRect = randomPill.getBoundingClientRect();
        const startX = pillRect.right - pos.slideRect.left + 4;
        const startY = pillRect.top - pos.slideRect.top + pos.scrollY + pillRect.height / 2;

        const size = 6 + Math.random() * 4;
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: ${startColor};
            box-shadow: 0 0 8px ${startColor}, 0 0 16px ${startColor};
            left: ${startX}px;
            top: ${startY}px;
            pointer-events: none;
            z-index: 100;
            opacity: 0;
        `;
        container.appendChild(particle);

        gsap.to(particle, { opacity: 1, duration: 0.15, ease: 'power1.out' });

        const totalStages = pos.stageCenters.length;
        const segDuration = 0.3;
        let delay = 0;

        const jitterY = (Math.random() - 0.5) * 20;
        gsap.to(particle, {
            left: pos.stageCenters[0].x,
            top: pos.stageCenters[0].y + jitterY,
            duration: segDuration + 0.1,
            delay: delay,
            ease: 'power1.out'
        });
        delay += segDuration + 0.1;

        for (let i = 1; i < totalStages; i++) {
            const t = i / totalStages;
            const interpColor = lerpColor(startRGB, TEAL_RGB, t);
            const colorStr = `rgb(${interpColor.r}, ${interpColor.g}, ${interpColor.b})`;
            const stageJitter = (Math.random() - 0.5) * 16;

            gsap.to(particle, {
                left: pos.stageCenters[i].x,
                top: pos.stageCenters[i].y + stageJitter,
                duration: segDuration,
                delay: delay,
                ease: 'none',
                onStart: function() {
                    particle.style.background = colorStr;
                    particle.style.boxShadow = `0 0 8px ${colorStr}, 0 0 16px ${colorStr}`;
                    if (stages[i]) {
                        gsap.to(stages[i], {
                            boxShadow: `inset 0 4px 20px -4px var(--stage-color), 0 0 15px rgba(0, 182, 161, 0.15)`,
                            duration: 0.15,
                            yoyo: true,
                            repeat: 1
                        });
                    }
                }
            });
            delay += segDuration;
        }

        const finalColor = `rgb(${TEAL_RGB.r}, ${TEAL_RGB.g}, ${TEAL_RGB.b})`;
        gsap.to(particle, {
            left: pos.orbCX,
            top: pos.orbCY,
            duration: 0.4,
            delay: delay,
            ease: 'power2.in',
            onStart: function() {
                particle.style.background = finalColor;
                particle.style.boxShadow = `0 0 8px ${finalColor}, 0 0 16px ${finalColor}`;
            },
            onComplete: function() {
                gsap.to(orb, {
                    boxShadow: '0 0 60px rgba(0, 182, 161, 0.6), 0 0 120px rgba(0, 182, 161, 0.3)',
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1
                });
                particle.remove();
            }
        });

        gsap.to(particle, {
            scale: 0.3,
            opacity: 0,
            duration: 0.3,
            delay: delay + 0.2,
            ease: 'power2.in'
        });
    }

    // Initial burst: 5 particles staggered
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            if (window.currentSlide === PIPELINE_SLIDE_INDEX) createPipelineParticle();
        }, i * 120);
    }

    // Continuous flow
    pipelineParticleInterval = setInterval(() => {
        if (window.currentSlide !== PIPELINE_SLIDE_INDEX) { stopPipelineParticles(); return; }
        createPipelineParticle();
    }, 250);

    // Auto-stop after 8 seconds to avoid performance issues
    setTimeout(() => {
        stopPipelineParticles();
    }, 8000);
}

/**
 * Convergence slide — orb, particles, pill shimmer
 */
function animateConvergenceSlide() {
    const slide = document.getElementById('convergenceSlide');
    if (!slide) return;

    if (convergenceAnimationInterval) {
        clearInterval(convergenceAnimationInterval);
    }

    // Animate orb rings
    const outerRing = document.getElementById('orbOuterRing');
    const pulseRing = document.getElementById('orbPulseRing');
    const orb = document.getElementById('canonizeOrb');

    if (outerRing) {
        gsap.to(outerRing, { rotation: 360, duration: 20, repeat: -1, ease: 'none' });
    }

    if (pulseRing) {
        gsap.to(pulseRing, { scale: 1.1, opacity: 0.5, duration: 1.5, repeat: -1, yoyo: true, ease: 'power1.inOut' });
    }

    // Entrance animations
    const inputsSection = document.getElementById('inputsSection');
    const orbSection = document.getElementById('orbSection');
    const outputSection = document.getElementById('outputSection');

    if (inputsSection) {
        gsapFrom(inputsSection, { x: -60, opacity: 0, duration: 0.8, ease: 'power2.out' });
    }

    if (orbSection && orb) {
        gsapFrom(orb, { scale: 0.5, opacity: 0, duration: 1, delay: 0.3, ease: 'back.out(1.7)' });
    }

    if (outputSection) {
        gsapFrom(outputSection, { x: 60, opacity: 0, duration: 0.8, delay: 0.5, ease: 'power2.out' });
    }

    // Staggered entrance for input pills
    const pills = document.querySelectorAll('.input-pill-anim');
    gsapFrom(pills, { x: -30, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' });

    // Staggered entrance for feature items
    const features = document.querySelectorAll('.feature-item');
    gsapFrom(features, { x: 30, opacity: 0, duration: 0.4, stagger: 0.1, delay: 0.8, ease: 'power2.out' });

    // Animate configurable callout
    const callout = document.getElementById('configurableCallout');
    if (callout) {
        gsapFrom(callout, { y: 20, opacity: 0, duration: 0.6, delay: 1.2, ease: 'power2.out' });
    }

    // Animate engine process strip
    const engineSteps = slide.querySelectorAll('.engine-step');
    const engineArrows = slide.querySelectorAll('.engine-arrow');
    const engineNote = slide.querySelector('.engine-process-note');
    if (engineSteps.length) {
        gsapFrom(engineSteps, { opacity: 0, y: 15, duration: 0.4, stagger: 0.12, delay: 1.5, ease: 'power2.out', clearProps: 'opacity,transform' });
        gsapFrom(engineArrows, { opacity: 0, duration: 0.3, stagger: 0.12, delay: 1.7, ease: 'power2.out', clearProps: 'opacity,transform' });
    }
    if (engineNote) {
        gsapFrom(engineNote, { opacity: 0, duration: 0.5, delay: 2.2, ease: 'power2.out', clearProps: 'opacity,transform' });
    }

    // Start particle flow
    startParticleFlow();
}

/**
 * Stop input particle interval
 */
function stopInputParticles() {
    if (convergenceAnimationInterval) {
        clearInterval(convergenceAnimationInterval);
        convergenceAnimationInterval = null;
    }
}

/**
 * Stop output particle interval
 */
function stopOutputParticles() {
    if (outputAnimationInterval) {
        clearInterval(outputAnimationInterval);
        outputAnimationInterval = null;
    }
}

/**
 * Stop all particle intervals and kill pill shimmer tweens
 */
function stopParticleFlow() {
    stopInputParticles();
    stopOutputParticles();

    // Kill shimmer animations on pill glows
    document.querySelectorAll('.pill-glow').forEach(glow => {
        gsap.killTweensOf(glow);
        glow.style.left = '-100%';
    });
}

/**
 * Particle flow: inputs → orb → output universe
 */
function startParticleFlow() {
    const container = document.getElementById('particleContainer');
    const pills = document.querySelectorAll('.input-pill-anim');
    const orb = document.getElementById('canonizeOrb');
    const graphContainer = document.getElementById('universeGraphContainer');
    const slide = document.getElementById('convergenceSlide');

    if (!container || !orb || pills.length === 0 || !slide) return;

    stopParticleFlow();
    container.innerHTML = '';

    if (window.innerWidth <= 768) {
        container.style.height = slide.scrollHeight + 'px';
    }

    function getPositions() {
        const sRect = slide.getBoundingClientRect();
        const scrollY = slide.scrollTop || 0;
        const oRect = orb.getBoundingClientRect();
        return {
            slideRect: sRect,
            scrollY,
            orbCX: oRect.left - sRect.left + oRect.width / 2,
            orbCY: oRect.top - sRect.top + scrollY + oRect.height / 2,
            orbW: oRect.width
        };
    }

    function createInputParticle() {
        if (window.currentSlide !== CONVERGENCE_SLIDE_INDEX) return;

        const pos = getPositions();
        const randomPill = pills[Math.floor(Math.random() * pills.length)];
        const color = randomPill.dataset.color || '#00B6A1';

        const pillRect = randomPill.getBoundingClientRect();
        const startX = pillRect.right - pos.slideRect.left;
        const startY = pillRect.top - pos.slideRect.top + pos.scrollY + pillRect.height / 2;

        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${color};
            box-shadow: 0 0 12px ${color}, 0 0 24px ${color};
            left: ${startX}px;
            top: ${startY}px;
            pointer-events: none;
            z-index: 100;
        `;
        container.appendChild(particle);

        const duration = 1 + Math.random() * 0.5;

        gsap.to(particle, {
            left: pos.orbCX,
            top: pos.orbCY,
            duration: duration,
            ease: 'power2.in',
            onComplete: () => {
                gsap.to(orb, {
                    boxShadow: '0 0 80px rgba(0, 182, 161, 0.6), 0 0 160px rgba(0, 182, 161, 0.3)',
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1
                });
                particle.remove();
            }
        });

        gsap.to(particle, {
            opacity: 0,
            scale: 0.3,
            duration: duration * 0.3,
            delay: duration * 0.7,
            ease: 'power2.in'
        });
    }

    function createOutputParticle() {
        if (window.currentSlide !== CONVERGENCE_SLIDE_INDEX || !graphContainer) return;

        const pos = getPositions();
        const grRect = graphContainer.getBoundingClientRect();
        const targetCX = grRect.left - pos.slideRect.left + grRect.width / 2;
        const targetCY = grRect.top - pos.slideRect.top + pos.scrollY + grRect.height / 2;

        const startX = pos.orbCX + pos.orbW / 2;
        const startY = pos.orbCY + (Math.random() - 0.5) * 20;

        const angle = Math.random() * Math.PI * 2;
        const radius = grRect.width * 0.35;
        const endX = targetCX + Math.cos(angle) * radius * (0.3 + Math.random() * 0.7);
        const endY = targetCY + Math.sin(angle) * radius * (0.3 + Math.random() * 0.7);

        const particle = document.createElement('div');
        const TEAL = '#00B6A1';
        particle.style.cssText = `
            position: absolute;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: ${TEAL};
            box-shadow: 0 0 10px ${TEAL}, 0 0 20px ${TEAL};
            left: ${startX}px;
            top: ${startY}px;
            pointer-events: none;
            z-index: 100;
            opacity: 0;
        `;
        container.appendChild(particle);

        const duration = 1.2 + Math.random() * 0.6;

        gsap.to(particle, { opacity: 1, duration: 0.15, ease: 'power1.out' });

        gsap.to(particle, {
            left: endX,
            top: endY,
            duration: duration,
            ease: 'power1.out',
        });

        gsap.to(particle, {
            opacity: 0,
            scale: 0.2,
            duration: duration * 0.4,
            delay: duration * 0.6,
            ease: 'power2.in',
            onComplete: () => particle.remove()
        });
    }

    // ── Schedule ────────────────────────────────────────

    // Input particles
    convergenceAnimationInterval = setInterval(() => {
        if (window.currentSlide !== CONVERGENCE_SLIDE_INDEX) { stopParticleFlow(); return; }
        createInputParticle();
    }, INPUT_PARTICLE_INTERVAL_MS);

    // Initial burst of inputs
    for (let i = 0; i < 8; i++) {
        setTimeout(createInputParticle, i * 80);
    }

    // Output particles — start after a brief "processing" delay
    setTimeout(() => {
        if (window.currentSlide !== CONVERGENCE_SLIDE_INDEX) return;
        outputAnimationInterval = setInterval(() => {
            if (window.currentSlide !== CONVERGENCE_SLIDE_INDEX) { stopParticleFlow(); return; }
            createOutputParticle();
        }, OUTPUT_PARTICLE_INTERVAL_MS);
    }, OUTPUT_PARTICLE_DELAY_S * 1000);

    // ── Auto-stop: inputs first, then output + shimmer ──
    setTimeout(() => {
        stopInputParticles();
        // Let output particles linger briefly (last few being "processed")
        setTimeout(() => {
            stopParticleFlow();
        }, OUTPUT_LINGER_S * 1000);
    }, PARTICLE_FLOW_DURATION_S * 1000);

    // Shimmer effect on pills
    const pillGlows = document.querySelectorAll('.pill-glow');
    pillGlows.forEach((glow, i) => {
        gsap.to(glow, {
            left: '200%',
            duration: 1.5,
            delay: i * 0.15,
            repeat: -1,
            repeatDelay: 3 + Math.random() * 2,
            ease: 'power2.inOut'
        });
    });
}

/**
 * Slide-specific post-transition hooks
 */
function onSlideEnter(index) {
    // Variant counter on slide 3
    if (index === 3) {
        const counterEl = document.getElementById('variantCount');
        if (counterEl) {
            const variantTags = document.querySelectorAll('.variant-tag');
            const variantCount = variantTags.length;
            counterEl.textContent = '0';
            setTimeout(() => {
                let current = 0;
                const duration = 1500;
                const increment = variantCount / (duration / 30);
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= variantCount) {
                        current = variantCount;
                        clearInterval(timer);
                    }
                    counterEl.textContent = Math.floor(current);
                }, 30);
            }, 400);
        }
    }

    // Density bars on slide 16 (gap analysis)
    if (index === 16) {
        const densityFills = document.querySelectorAll('.density-fill');
        densityFills.forEach((fill) => {
            const targetWidth = fill.style.width;
            fill.style.transition = 'none';
            fill.style.width = '0%';
            setTimeout(() => {
                fill.style.transition = '';
                fill.style.width = targetWidth;
            }, 600);
        });
    }

    // Convergence particle flow already started by animateConvergenceSlide()

    // Reset drift animation when revisiting slide 14
    if (index === 14 && driftGraph && window.__driftSnapshots) {
        stopDriftAnimation();
        driftCurrentStep = 0;
        driftGraph.graphData({ nodes: window.__driftSnapshots[0].nodes, links: window.__driftSnapshots[0].links });
        updateDriftUI(window.__driftSnapshots[0], 0);
        startDriftAnimation();
    }
}

// ═══════════════════════════════════════════════
// Slide 3: Bridge Diagram Animation
// ═══════════════════════════════════════════════

function animateBridgeDiagram(slide) {
    // 1. Variant pills stagger in from left
    gsapFrom(slide.querySelectorAll('.variant-pill'), {
        opacity: 0,
        x: -30,
        duration: 0.3,
        stagger: 0.05,
        ease: 'power2.out',
        clearProps: 'opacity,transform'
    });

    // 2. Canonical hubs scale in
    gsapFrom(slide.querySelectorAll('.canonical-hub'), {
        opacity: 0,
        scale: 0.7,
        duration: 0.5,
        stagger: 0.1,
        delay: 0.5,
        ease: 'back.out(1.7)',
        clearProps: 'opacity,transform'
    });

    // 3. Job profile tiles stagger in from right
    gsapFrom(slide.querySelectorAll('.job-profile-tile'), {
        opacity: 0,
        x: 30,
        duration: 0.4,
        stagger: 0.1,
        delay: 0.7,
        ease: 'power2.out',
        clearProps: 'opacity,transform'
    });

    // 4. Draw SVG bridge paths (after a delay for layout to settle)
    setTimeout(() => drawBridgePaths(slide), 1000);

    // 5. Gap section fades up and bars animate
    const gapSection = slide.querySelector('.bridge-gap-section');
    if (gapSection) {
        gsapFrom(gapSection, {
            opacity: 0,
            y: 20,
            duration: 0.5,
            delay: 1.5,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });

        // Animate gap bar fills
        const gapFills = gapSection.querySelectorAll('.bridge-gap-fill');
        gapFills.forEach((fill) => {
            const targetWidth = fill.style.width;
            fill.style.transition = 'none';
            fill.style.width = '0%';
            setTimeout(() => {
                fill.style.transition = '';
                fill.style.width = targetWidth;
            }, 1800);
        });
    }
}

function drawBridgePaths(slide) {
    const svg = slide.querySelector('#bridgeSvg');
    if (!svg) return;

    const bridgeContainer = slide.querySelector('.taxonomy-bridge');
    const containerRect = bridgeContainer.getBoundingClientRect();

    // Clear any previous paths
    svg.innerHTML = '';

    const groups = ['ml', 'cloud', 'finance', 'pm'];
    const colors = {
        ml: 'rgba(0,182,161,0.4)',
        cloud: 'rgba(59,148,220,0.4)',
        finance: 'rgba(104,97,226,0.4)',
        pm: 'rgba(255,150,48,0.4)'
    };

    groups.forEach(group => {
        const variants = slide.querySelectorAll(`.variant-pill[data-group="${group}"]`);
        const hub = slide.querySelector(`.canonical-hub[data-group="${group}"]`);
        const jobs = slide.querySelectorAll(`.job-profile-skill[data-group="${group}"]`);

        if (!hub) return;

        const hubRect = hub.getBoundingClientRect();
        const hubCX = hubRect.left - containerRect.left + hubRect.width / 2;
        const hubCY = hubRect.top - containerRect.top + hubRect.height / 2;

        // Variant → Hub paths
        variants.forEach(v => {
            const vRect = v.getBoundingClientRect();
            const startX = vRect.right - containerRect.left;
            const startY = vRect.top - containerRect.top + vRect.height / 2;
            const endX = hubRect.left - containerRect.left;
            const endY = hubCY;

            const cpX = startX + (endX - startX) * 0.5;
            const d = `M ${startX} ${startY} C ${cpX} ${startY}, ${cpX} ${endY}, ${endX} ${endY}`;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('stroke', colors[group]);
            path.setAttribute('stroke-width', '1.5');
            path.setAttribute('fill', 'none');
            svg.appendChild(path);

            // Animate draw-on
            const len = path.getTotalLength();
            path.style.strokeDasharray = len;
            path.style.strokeDashoffset = len;
            gsap.to(path, {
                strokeDashoffset: 0,
                duration: 0.8,
                ease: 'power2.inOut'
            });
        });

        // Hub → Job paths
        jobs.forEach(j => {
            const jRect = j.getBoundingClientRect();
            const startX = hubRect.right - containerRect.left;
            const startY = hubCY;
            const endX = jRect.left - containerRect.left;
            const endY = jRect.top - containerRect.top + jRect.height / 2;

            const cpX = startX + (endX - startX) * 0.5;
            const d = `M ${startX} ${startY} C ${cpX} ${startY}, ${cpX} ${endY}, ${endX} ${endY}`;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('stroke', colors[group]);
            path.setAttribute('stroke-width', '1.5');
            path.setAttribute('fill', 'none');
            svg.appendChild(path);

            const len = path.getTotalLength();
            path.style.strokeDasharray = len;
            path.style.strokeDashoffset = len;
            gsap.to(path, {
                strokeDashoffset: 0,
                duration: 0.8,
                delay: 0.3,
                ease: 'power2.inOut'
            });
        });
    });
}

// ═══════════════════════════════════════════════
// Slide 5: Resolver + Cluster + Cycle Animation
// ═══════════════════════════════════════════════

function animateResolverSlide(slide) {
    // 1. Input badge fades in from top
    gsapFrom(slide.querySelector('.resolver-input'), {
        opacity: 0,
        y: -20,
        duration: 0.4,
        delay: 0.2,
        ease: 'power2.out',
        clearProps: 'opacity,transform'
    });

    // 2. Signal cards stagger in
    gsapFrom(slide.querySelectorAll('.signal-card'), {
        opacity: 0,
        y: 20,
        duration: 0.4,
        stagger: 0.1,
        delay: 0.4,
        ease: 'power2.out',
        clearProps: 'opacity,transform'
    });

    // 3. Convergence lines fade in
    const convergeLines = slide.querySelectorAll('.converge-lines line');
    if (convergeLines.length) {
        convergeLines.forEach(line => {
            const length = line.getTotalLength();
            line.style.strokeDasharray = length;
            line.style.strokeDashoffset = length;
        });
        gsap.to(convergeLines, {
            strokeDashoffset: 0,
            duration: 0.5,
            stagger: 0.08,
            delay: 0.8,
            ease: 'power2.out'
        });
    }

    // 4. Candidates appear — winner scales up, loser fades
    gsapFrom(slide.querySelector('.candidate-winner'), {
        opacity: 0,
        scale: 0.8,
        duration: 0.5,
        delay: 1.2,
        ease: 'back.out(1.7)',
        clearProps: 'opacity,transform'
    });

    gsapFrom(slide.querySelector('.candidate-faded'), {
        opacity: 0,
        duration: 0.4,
        delay: 1.3,
        ease: 'power2.out',
        clearProps: 'opacity,transform'
    });

    // 5. Cluster dot animation — mixed → separated
    animateClusterDots(slide);

    // 6. Correction cycle
    animateCorrectionCycle(slide);
}

function animateClusterDots(slide) {
    const dots = slide.querySelectorAll('.cluster-dot');
    const divider = slide.querySelector('#clusterDivider');
    const labels = slide.querySelectorAll('.cluster-label');
    const badge = slide.querySelector('.cluster-badge');
    const title = slide.querySelector('.cluster-scatter-title');
    const scatterLabel = slide.querySelector('.cluster-scatter-label');

    // Scatter section label
    if (scatterLabel) {
        gsapFrom(scatterLabel, {
            opacity: 0,
            duration: 0.3,
            delay: 0.1,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
    }

    // Entrance: dots visible at initial (mixed) positions
    gsapFrom(dots, {
        opacity: 0,
        scale: 0,
        duration: 0.3,
        stagger: 0.03,
        delay: 0.3,
        ease: 'back.out(1.7)',
        clearProps: 'opacity,transform'
    });

    // After a pause, animate each dot to its target cluster position
    dots.forEach((dot, i) => {
        const tx = dot.dataset.tx + '%';
        const ty = dot.dataset.ty + '%';

        gsap.to(dot, {
            left: tx,
            top: ty,
            duration: 0.6 + Math.random() * 0.3,
            delay: 1.0 + i * 0.04,
            ease: 'power2.inOut'
        });
    });

    // Divider draws after dots settle
    if (divider) {
        gsap.to(divider, {
            opacity: 1,
            duration: 0.4,
            delay: 1.8,
            ease: 'power2.out'
        });
    }

    // Labels fade in
    gsapFrom(labels, {
        opacity: 0,
        y: 10,
        duration: 0.4,
        stagger: 0.1,
        delay: 2.0,
        ease: 'power2.out',
        clearProps: 'opacity,transform'
    });

    // Title strikethrough emphasis
    if (title) {
        gsap.to(title, {
            opacity: 1,
            duration: 0.3,
            delay: 2.2,
            ease: 'power2.out'
        });
    }

    // Badge
    if (badge) {
        gsapFrom(badge, {
            opacity: 0,
            y: 8,
            duration: 0.3,
            delay: 2.3,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
    }
}

function animateCorrectionCycle(slide) {
    const cycleHeader = slide.querySelector('.cycle-header');
    const steps = slide.querySelectorAll('.cycle-step');
    const arrows = slide.querySelectorAll('.cycle-arrow-down');
    const loopLabel = slide.querySelector('.cycle-loop-label');

    // Cycle header
    if (cycleHeader) {
        gsapFrom(cycleHeader, {
            opacity: 0,
            y: -10,
            duration: 0.3,
            delay: 0.3,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
    }

    // Steps stagger in
    gsapFrom(steps, {
        opacity: 0,
        x: 20,
        duration: 0.4,
        stagger: 0.2,
        delay: 0.5,
        ease: 'power2.out',
        clearProps: 'opacity,transform'
    });

    // Arrows between steps
    gsapFrom(arrows, {
        opacity: 0,
        duration: 0.3,
        stagger: 0.2,
        delay: 0.8,
        ease: 'power2.out',
        clearProps: 'opacity,transform'
    });

    // Loop label
    if (loopLabel) {
        gsapFrom(loopLabel, {
            opacity: 0,
            duration: 0.3,
            delay: 1.5,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
        });
    }
}
