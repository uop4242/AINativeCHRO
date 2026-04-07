/**
 * graph.js — 3D Force Graphs for the Skill Universe (slide 4) and Talent Drift (slide 06b)
 */

let universeGraph = null;
let driftGraph = null;
let driftAnimationTimer = null;
let driftCurrentStep = 0;
let driftSlideIndex = 14; // talent drift slide position

function initUniverseGraph() {
    const container = document.getElementById('universeGraph');
    if (!container || universeGraph) return;

    const nodes = [];
    const links = [];
    const TEAL = '#00B6A1';
    const ORANGE = '#FF9630';
    const BLUE = '#3B94DC';

    // Central core node
    nodes.push({ id: 'core', color: TEAL, size: 4, fx: 0, fy: 0, fz: 0 });

    // Canonical hub positions
    const canonicals = [
        { id: 'can1', x: -70, y: 50, z: 10, variants: 5 },
        { id: 'can2', x: 65, y: 45, z: -20, variants: 4 },
        { id: 'can3', x: 15, y: -60, z: 35, variants: 5 },
        { id: 'can4', x: 55, y: -65, z: -25, variants: 4 },
        { id: 'can5', x: -60, y: -45, z: -30, variants: 4 },
        { id: 'can6', x: -20, y: 70, z: -40, variants: 3 }
    ];

    // Add canonical hubs (teal)
    canonicals.forEach(c => {
        nodes.push({ id: c.id, color: TEAL, size: 2.5, fx: c.x, fy: c.y, fz: c.z });
        links.push({ source: 'core', target: c.id, color: TEAL });
    });

    // Generate starburst variants with long spokes
    let variantId = 0;
    canonicals.forEach(c => {
        for (let i = 0; i < c.variants; i++) {
            const theta = (i / c.variants) * Math.PI * 2 + 0.2;
            const phi = Math.PI * 0.35 + (i % 2) * Math.PI * 0.35;
            const dist = 35 + (i % 3) * 8;

            const vx = c.x + dist * Math.sin(phi) * Math.cos(theta);
            const vy = c.y + dist * Math.cos(phi);
            const vz = c.z + dist * Math.sin(phi) * Math.sin(theta);

            nodes.push({ id: `v${variantId}`, color: ORANGE, size: 1.5, fx: vx, fy: vy, fz: vz });
            links.push({ source: c.id, target: `v${variantId}`, color: TEAL });
            variantId++;
        }
    });

    // One accent node
    nodes.push({ id: 'jt1', color: BLUE, size: 1.5, fx: -20, fy: 70, fz: -15 });
    links.push({ source: 'can1', target: 'jt1', color: TEAL });

    // Initialize 3D Force Graph
    universeGraph = ForceGraph3D()(container)
        .graphData({ nodes, links })
        .nodeLabel(node => node.name || '')
        .nodeColor(node => node.color)
        .nodeVal(node => node.size)
        .nodeOpacity(0.92)
        .nodeResolution(16)
        .linkColor(link => link.color || TEAL)
        .linkWidth(0.5)
        .linkOpacity(0.5)
        .backgroundColor('rgba(0,0,0,0)')
        .showNavInfo(false)
        .enableNodeDrag(false)
        .enableNavigationControls(false)
        .enablePointerInteraction(false)
        .width(280)
        .height(280)
        .d3AlphaDecay(0)
        .d3VelocityDecay(0.9)
        .warmupTicks(100)
        .cooldownTicks(0);

    // Set camera far back to see the full constellation
    universeGraph.cameraPosition({ x: 0, y: 0, z: 350 });

    // Smooth auto-rotation
    let angle = 0;
    function rotateGraph() {
        if (universeGraph) {
            angle += 0.003;
            const distance = 320;
            universeGraph.cameraPosition({
                x: distance * Math.sin(angle),
                y: 8 * Math.sin(angle * 0.4),
                z: distance * Math.cos(angle)
            }, { x: 0, y: 5, z: 0 });
        }
        requestAnimationFrame(rotateGraph);
    }
    rotateGraph();
}


// ══════════════════════════════════════════════════════════════════════════
// TALENT DRIFT — Full-bleed 3D Force Graph with time-series animation
// ══════════════════════════════════════════════════════════════════════════

function buildDriftSnapshots() {
    const BLUE   = '#3B94DC';
    const PURPLE = '#6861E2';
    const TEAL   = '#00B6A1';
    const ORANGE = '#FF9630';
    const DIM_BLUE = 'rgba(59, 148, 220, 0.25)';
    const DIM_PURPLE = 'rgba(104, 97, 226, 0.25)';
    const DIM_WHITE = 'rgba(255, 255, 255, 0.08)';

    // ── Primary cluster nodes (larger, labeled) ──────────────────────
    const mktNodes = [
        { id: 'excel',       label: 'Excel',              cluster: 'mkt' },
        { id: 'campaign',    label: 'Campaign Metrics',   cluster: 'mkt' },
        { id: 'segment',     label: 'Segmentation',       cluster: 'mkt' },
        { id: 'crm',         label: 'CRM Analytics',      cluster: 'mkt' },
        { id: 'ab_test',     label: 'A/B Testing',        cluster: 'mkt' },
        { id: 'ga',          label: 'Google Analytics',    cluster: 'mkt' },
        { id: 'seo',         label: 'SEO',                cluster: 'mkt' },
        { id: 'social',      label: 'Social Analytics',   cluster: 'mkt' },
        { id: 'email_mkt',   label: 'Email Marketing',    cluster: 'mkt' },
    ];

    const deNodes = [
        { id: 'sql_de',      label: 'SQL',                cluster: 'de' },
        { id: 'etl',         label: 'ETL Pipelines',      cluster: 'de' },
        { id: 'hadoop',      label: 'Hadoop',             cluster: 'de' },
        { id: 'spark',       label: 'Spark',              cluster: 'de' },
        { id: 'warehouse',   label: 'Data Warehousing',   cluster: 'de' },
        { id: 'airflow',     label: 'Airflow',            cluster: 'de' },
        { id: 'kafka',       label: 'Kafka',              cluster: 'de' },
        { id: 'dbt',         label: 'dbt',                cluster: 'de' },
        { id: 'snowflake',   label: 'Snowflake',          cluster: 'de' },
    ];

    // ── Secondary satellite nodes (smaller, orbit the primaries) ────
    const mktSatellites = [
        { id: 'mkt_s1',  label: 'Content Strategy',   cluster: 'mkt' },
        { id: 'mkt_s2',  label: 'Paid Media',          cluster: 'mkt' },
        { id: 'mkt_s3',  label: 'Attribution',         cluster: 'mkt' },
        { id: 'mkt_s4',  label: 'Brand Analytics',     cluster: 'mkt' },
        { id: 'mkt_s5',  label: 'Conversion Opt.',     cluster: 'mkt' },
        { id: 'mkt_s6',  label: 'Funnel Analysis',     cluster: 'mkt' },
        { id: 'mkt_s7',  label: 'Market Research',     cluster: 'mkt' },
    ];

    const deSatellites = [
        { id: 'de_s1',   label: 'Data Lakes',          cluster: 'de' },
        { id: 'de_s2',   label: 'Streaming',           cluster: 'de' },
        { id: 'de_s3',   label: 'Schema Design',       cluster: 'de' },
        { id: 'de_s4',   label: 'Data Quality',        cluster: 'de' },
        { id: 'de_s5',   label: 'Orchestration',       cluster: 'de' },
        { id: 'de_s6',   label: 'CDC Pipelines',       cluster: 'de' },
        { id: 'de_s7',   label: 'Data Governance',     cluster: 'de' },
    ];

    const bridgeNodes = [
        { id: 'python',      label: 'Python',             cluster: 'bridge' },
        { id: 'sql_mkt',     label: 'SQL (Analytics)',     cluster: 'bridge' },
        { id: 'viz',         label: 'Data Visualization',  cluster: 'bridge' },
        { id: 'stats',       label: 'Statistics',          cluster: 'bridge' },
        { id: 'jupyter',     label: 'Jupyter',            cluster: 'bridge' },
        { id: 'ml_basics',   label: 'ML Basics',          cluster: 'bridge' },
    ];

    // ── Base positions (wider spread for full-screen) ────────────────
    const mktBase = [
        { x:-120, y:   0, z:  0 },
        { x: -95, y:  50, z: 25 },
        { x: -85, y: -45, z: 30 },
        { x:-135, y: -30, z:-20 },
        { x: -75, y:  30, z:-35 },
        { x:-105, y: -15, z: 45 },
        { x: -80, y:  55, z:-15 },
        { x:-115, y:  40, z: 35 },
        { x: -90, y: -55, z:-10 },
    ];

    // Satellite positions — orbit around the cluster center, varied z-depth
    const mktSatBase = [
        { x: -65, y:  70, z: 55 },    // far layer
        { x:-150, y:  20, z:-55 },     // far layer
        { x: -70, y: -65, z:-50 },     // far layer
        { x:-140, y: -55, z: 50 },     // far layer
        { x: -60, y:  15, z: 60 },     // far layer
        { x:-130, y:  60, z:-45 },     // far layer
        { x: -90, y: -70, z: 55 },     // far layer
    ];

    const deBase = [
        { x: 120, y:   5, z:  5 },
        { x:  95, y:  45, z:-15 },
        { x: 140, y: -35, z: 15 },
        { x:  85, y: -50, z: 35 },
        { x: 125, y:  30, z:-40 },
        { x: 105, y: -15, z:-25 },
        { x:  80, y:  55, z: 20 },
        { x: 115, y: -45, z:-30 },
        { x: 135, y:  15, z: 40 },
    ];

    const deSatBase = [
        { x: 155, y:  40, z: 50 },     // far layer
        { x:  70, y: -70, z:-55 },     // far layer
        { x: 150, y: -55, z:-50 },     // far layer
        { x:  65, y:  65, z: 55 },     // far layer
        { x: 145, y:  10, z: 60 },     // far layer
        { x:  75, y: -20, z:-60 },     // far layer
        { x: 130, y:  65, z: 50 },     // far layer
    ];

    // ── Depth-shading helpers ────────────────────────────────────────
    // Nodes further from camera (larger |z|) render dimmer/smaller
    function depthColor(baseColor, z) {
        const absZ = Math.abs(z);
        if (absZ < 25) return baseColor;                        // foreground — full brightness
        const fade = Math.max(0.25, 1 - (absZ - 25) / 100);    // dim to 25% at z ±125
        // Parse hex or return rgba version
        if (baseColor.startsWith('#')) {
            const r = parseInt(baseColor.slice(1,3), 16);
            const g = parseInt(baseColor.slice(3,5), 16);
            const b = parseInt(baseColor.slice(5,7), 16);
            return `rgba(${r},${g},${b},${fade})`;
        }
        return baseColor;
    }
    function depthSize(baseSize, z) {
        const absZ = Math.abs(z);
        if (absZ < 25) return baseSize;
        return baseSize * Math.max(0.4, 1 - (absZ - 25) / 150);
    }

    // ── Ambient dust particles (tiny, dim, fill the space) ───────────
    const DUST_COUNT = 80;
    function makeDust(seed) {
        const dust = [];
        for (let i = 0; i < DUST_COUNT; i++) {
            const hash = (seed * 1000 + i * 137) % 997;
            const r = 100 + (hash % 140);
            const theta = ((hash * 7) % 360) * Math.PI / 180;
            const phi = ((hash * 13) % 180) * Math.PI / 180;
            const fz = r * Math.sin(phi) * Math.sin(theta);
            const absZ = Math.abs(fz);
            // Dust further away is dimmer — depth shading
            const alpha = absZ < 40 ? 0.12 : Math.max(0.03, 0.12 - (absZ - 40) * 0.001);
            dust.push({
                id: `dust_${i}`,
                label: '',
                color: `rgba(255, 255, 255, ${alpha})`,
                size: depthSize(0.3 + (hash % 5) * 0.1, fz),
                fx: r * Math.sin(phi) * Math.cos(theta),
                fy: r * Math.cos(phi),
                fz: fz,
            });
        }
        return dust;
    }

    const driftFactors = [0, 0.08, 0.22, 0.40, 0.58, 0.72];
    const snapshots = [];
    const years = [2015, 2017, 2019, 2021, 2023, 2025];
    const overlaps = [0, 5, 18, 34, 48, 54];
    const crossEdgeCounts = [0, 1, 4, 8, 14, 20];
    const bridgeCounts = [0, 0, 1, 3, 5, 6];
    const insights = [
        'In 2015, these two profiles shared <strong>zero common skills</strong>. Their worlds didn\'t touch.',
        'By 2017, early signals appear &mdash; Python starts showing up in marketing analytics roles.',
        'By 2019, SQL migrates into analytics. <strong>Bridge skills</strong> begin connecting the clusters.',
        'By 2021, data visualization and statistics appear across both domains. The overlap is accelerating.',
        'By 2023, nearly <strong>half</strong> of Candidate A\'s skills overlap with Candidate B\'s profile.',
        'By 2025, <strong>54% overlap</strong> &mdash; roles that were worlds apart are now deeply interconnected.',
    ];

    for (let s = 0; s < 6; s++) {
        const drift = driftFactors[s];
        const nodes = [];
        const links = [];

        // Marketing primary nodes
        mktNodes.forEach((n, i) => {
            const base = mktBase[i];
            const converged = s >= 4 && (n.id === 'ab_test' || n.id === 'ga' || n.id === 'seo');
            const px = base.x + (-base.x) * drift * 0.55;
            const py = base.y + (drift * 0.1 * base.y);
            const pz = base.z;
            const baseColor = converged ? TEAL : BLUE;
            nodes.push({
                id: n.id, label: n.label,
                color: depthColor(baseColor, pz),
                size: depthSize(converged ? 3.5 : 2.8, pz),
                fx: px, fy: py, fz: pz,
            });
        });

        // Marketing satellite nodes (smaller, dimmer, background layers)
        mktSatellites.forEach((n, i) => {
            const base = mktSatBase[i];
            const px = base.x + (-base.x) * drift * 0.45;
            const py = base.y + (drift * 0.08 * base.y);
            const pz = base.z;
            nodes.push({
                id: n.id, label: n.label,
                color: depthColor(BLUE, pz),
                size: depthSize(1.6, pz),
                fx: px, fy: py, fz: pz,
            });
        });

        // DE primary nodes
        deNodes.forEach((n, i) => {
            const base = deBase[i];
            const converged = s >= 4 && (n.id === 'sql_de' || n.id === 'warehouse' || n.id === 'snowflake');
            const px = base.x + (-base.x) * drift * 0.55;
            const py = base.y + (drift * 0.1 * base.y);
            const pz = base.z;
            const baseColor = converged ? TEAL : PURPLE;
            nodes.push({
                id: n.id, label: n.label,
                color: depthColor(baseColor, pz),
                size: depthSize(converged ? 3.5 : 2.8, pz),
                fx: px, fy: py, fz: pz,
            });
        });

        // DE satellite nodes
        deSatellites.forEach((n, i) => {
            const base = deSatBase[i];
            const px = base.x + (-base.x) * drift * 0.45;
            const py = base.y + (drift * 0.08 * base.y);
            const pz = base.z;
            nodes.push({
                id: n.id, label: n.label,
                color: depthColor(PURPLE, pz),
                size: depthSize(1.6, pz),
                fx: px, fy: py, fz: pz,
            });
        });

        // Intra-cluster links — marketing (primaries)
        const mktLinks = [
            ['excel','campaign'], ['excel','segment'], ['campaign','ab_test'],
            ['segment','crm'], ['ga','campaign'], ['ab_test','ga'],
            ['seo','ga'], ['social','campaign'], ['email_mkt','segment'],
            ['social','ab_test'], ['seo','email_mkt'], ['crm','email_mkt'],
        ];
        mktLinks.forEach(([a, b]) => {
            links.push({ source: a, target: b, color: s >= 4 ? TEAL : DIM_BLUE, width: 0.8 });
        });

        // Satellite → primary links — marketing (thin, faded)
        const mktSatLinks = [
            ['mkt_s1','campaign'], ['mkt_s2','ga'], ['mkt_s3','ab_test'],
            ['mkt_s4','segment'], ['mkt_s5','crm'], ['mkt_s6','excel'],
            ['mkt_s7','seo'],
            // inter-satellite links for depth mesh
            ['mkt_s1','mkt_s2'], ['mkt_s3','mkt_s5'], ['mkt_s6','mkt_s7'],
            ['mkt_s4','mkt_s1'],
        ];
        mktSatLinks.forEach(([a, b]) => {
            links.push({ source: a, target: b, color: 'rgba(59, 148, 220, 0.12)', width: 0.3 });
        });

        // Intra-cluster links — DE (primaries)
        const deLinks = [
            ['sql_de','etl'], ['etl','hadoop'], ['etl','spark'],
            ['sql_de','warehouse'], ['spark','airflow'], ['hadoop','warehouse'],
            ['kafka','spark'], ['kafka','airflow'], ['dbt','warehouse'],
            ['dbt','snowflake'], ['snowflake','sql_de'], ['spark','snowflake'],
        ];
        deLinks.forEach(([a, b]) => {
            links.push({ source: a, target: b, color: s >= 4 ? TEAL : DIM_PURPLE, width: 0.8 });
        });

        // Satellite → primary links — DE (thin, faded)
        const deSatLinks = [
            ['de_s1','warehouse'], ['de_s2','kafka'], ['de_s3','sql_de'],
            ['de_s4','dbt'], ['de_s5','airflow'], ['de_s6','etl'],
            ['de_s7','snowflake'],
            // inter-satellite links for depth mesh
            ['de_s1','de_s2'], ['de_s3','de_s5'], ['de_s6','de_s7'],
            ['de_s4','de_s1'],
        ];
        deSatLinks.forEach(([a, b]) => {
            links.push({ source: a, target: b, color: 'rgba(104, 97, 226, 0.12)', width: 0.3 });
        });

        // Bridge nodes — appear progressively
        const bridgePositions = [
            { x: 40 - drift * 65, y: 20, z: 0 },
            { x: -35 + drift * 45, y: -20, z: 15 },
            { x: 8, y: 45, z: -12 },
            { x: -12, y: -35, z: -8 },
            { x: 20, y: -10, z: 30 },
            { x: -5, y: 25, z: -25 },
        ];

        bridgeNodes.forEach((n, i) => {
            if (i >= bridgeCounts[s]) return;
            const pos = bridgePositions[i];
            nodes.push({
                id: n.id, label: n.label,
                color: depthColor(ORANGE, pos.z), size: depthSize(3.2, pos.z),
                fx: pos.x, fy: pos.y, fz: pos.z,
            });
        });

        // Cross-cluster links — grow with time
        const allCrossLinks = [
            { s: 1, source: 'python', target: 'spark', color: ORANGE },
            { s: 2, source: 'python', target: 'ab_test', color: ORANGE },
            { s: 2, source: 'sql_mkt', target: 'excel', color: ORANGE },
            { s: 2, source: 'python', target: 'social', color: ORANGE },
            { s: 3, source: 'sql_mkt', target: 'sql_de', color: ORANGE },
            { s: 3, source: 'viz', target: 'ga', color: ORANGE },
            { s: 3, source: 'viz', target: 'warehouse', color: ORANGE },
            { s: 3, source: 'sql_mkt', target: 'dbt', color: ORANGE },
            { s: 4, source: 'stats', target: 'ab_test', color: TEAL },
            { s: 4, source: 'stats', target: 'spark', color: TEAL },
            { s: 4, source: 'python', target: 'ga', color: TEAL },
            { s: 4, source: 'sql_mkt', target: 'campaign', color: TEAL },
            { s: 4, source: 'jupyter', target: 'python', color: TEAL },
            { s: 4, source: 'jupyter', target: 'stats', color: TEAL },
            { s: 5, source: 'viz', target: 'campaign', color: TEAL },
            { s: 5, source: 'stats', target: 'segment', color: TEAL },
            { s: 5, source: 'python', target: 'excel', color: TEAL },
            { s: 5, source: 'viz', target: 'etl', color: TEAL },
            { s: 5, source: 'ml_basics', target: 'python', color: TEAL },
            { s: 5, source: 'ml_basics', target: 'stats', color: TEAL },
        ];

        allCrossLinks.forEach(cl => {
            if (s >= cl.s) {
                const srcExists = nodes.find(n => n.id === cl.source);
                const tgtExists = nodes.find(n => n.id === cl.target);
                if (srcExists && tgtExists) {
                    links.push({ source: cl.source, target: cl.target, color: cl.color, width: 1.0 });
                }
            }
        });

        // Ambient dust
        const dust = makeDust(s);
        dust.forEach(d => nodes.push(d));

        // Faint dust connections (creates a dense mesh-like ambient field)
        for (let i = 0; i < 40; i++) {
            const a = `dust_${i * 2 % DUST_COUNT}`;
            const b = `dust_${(i * 2 + 1) % DUST_COUNT}`;
            links.push({ source: a, target: b, color: 'rgba(255,255,255,0.025)', width: 0.15 });
        }
        // Second layer of diagonal dust connections
        for (let i = 0; i < 15; i++) {
            const a = `dust_${(i * 3) % DUST_COUNT}`;
            const b = `dust_${(i * 5 + 7) % DUST_COUNT}`;
            links.push({ source: a, target: b, color: 'rgba(255,255,255,0.015)', width: 0.1 });
        }

        snapshots.push({
            year: years[s], overlap: overlaps[s],
            crossEdges: crossEdgeCounts[s], bridgeSkills: bridgeCounts[s],
            insight: insights[s], nodes, links,
        });
    }

    return snapshots;
}


/**
 * Initialize the drift graph — FULL-BLEED background
 */
function initDriftGraph() {
    const container = document.getElementById('driftGraphBg');
    if (!container || driftGraph) return;

    const snapshots = buildDriftSnapshots();
    window.__driftSnapshots = snapshots;
    driftCurrentStep = 0;

    const slide = document.getElementById('driftSlide');
    const w = slide ? slide.offsetWidth : window.innerWidth;
    const h = slide ? slide.offsetHeight : window.innerHeight;

    const snap = snapshots[0];

    driftGraph = ForceGraph3D()(container)
        .graphData({ nodes: snap.nodes, links: snap.links })
        .nodeLabel(node => node.label || '')
        .nodeColor(node => node.color)
        .nodeVal(node => node.size)
        .nodeOpacity(0.88)
        .nodeResolution(20)
        .linkColor(link => link.color || '#00B6A1')
        .linkWidth(link => link.width || 0.5)
        .linkOpacity(0.6)
        .backgroundColor('rgba(0,0,0,0)')
        .showNavInfo(false)
        .enableNodeDrag(false)
        .enableNavigationControls(false)
        .enablePointerInteraction(false)
        .width(w)
        .height(h)
        .d3AlphaDecay(0)
        .d3VelocityDecay(0.9)
        .warmupTicks(100)
        .cooldownTicks(0);

    // Camera starts further back for the wider graph
    driftGraph.cameraPosition({ x: 0, y: 0, z: 380 });

    // Smooth rotation — slightly off-axis for drama
    let dAngle = 0;
    function rotateDrift() {
        if (driftGraph) {
            dAngle += 0.0015;
            const dist = 360;
            driftGraph.cameraPosition({
                x: dist * Math.sin(dAngle),
                y: 15 * Math.sin(dAngle * 0.5),
                z: dist * Math.cos(dAngle)
            }, { x: 0, y: 0, z: 0 });
        }
        requestAnimationFrame(rotateDrift);
    }
    rotateDrift();

    // Ambient glow pulse (via GSAP if available)
    const glow = document.getElementById('driftAmbientGlow');
    if (glow && typeof gsap !== 'undefined') {
        gsap.to(glow, {
            opacity: 0.7,
            scale: 1.05,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: 'power1.inOut'
        });
    }

    updateDriftUI(snapshots[0], 0);
    startDriftAnimation();
}


/**
 * Advance to the next drift snapshot
 */
function advanceDriftStep() {
    const snapshots = window.__driftSnapshots;
    if (!snapshots || !driftGraph) return;

    driftCurrentStep++;
    if (driftCurrentStep >= snapshots.length) {
        stopDriftAnimation();
        setTimeout(() => {
            driftCurrentStep = 0;
            if (driftGraph && window.currentSlide === driftSlideIndex) {
                driftGraph.graphData({ nodes: snapshots[0].nodes, links: snapshots[0].links });
                updateDriftUI(snapshots[0], 0);
                startDriftAnimation();
            }
        }, 3500);
        return;
    }

    const snap = snapshots[driftCurrentStep];
    driftGraph.graphData({ nodes: snap.nodes, links: snap.links });
    updateDriftUI(snap, driftCurrentStep);
}


/**
 * Update timeline, metrics, narrative, and ambient glow
 */
function updateDriftUI(snap, stepIndex) {
    const totalSteps = 5;
    const pct = (stepIndex / totalSteps) * 100;

    const fill = document.getElementById('driftTimelineFill');
    const thumb = document.getElementById('driftTimelineThumb');
    if (fill) fill.style.width = pct + '%';
    if (thumb) thumb.style.left = pct + '%';

    const badge = document.getElementById('driftYearBadge');
    if (badge) badge.textContent = snap.year;

    const mOverlap = document.getElementById('driftMetricOverlap');
    const mEdges = document.getElementById('driftMetricEdges');
    const mBridge = document.getElementById('driftMetricBridge');
    if (mOverlap) mOverlap.textContent = snap.overlap + '%';
    if (mEdges) mEdges.textContent = snap.crossEdges;
    if (mBridge) mBridge.textContent = snap.bridgeSkills;

    const overlapLabel = document.getElementById('driftOverlapLabel');
    if (overlapLabel) {
        overlapLabel.textContent = snap.overlap + '% overlap';
        overlapLabel.style.color = snap.overlap > 30 ? '#00B6A1' : '#FF9630';
    }

    const insight = document.getElementById('driftInsightText');
    if (insight) insight.innerHTML = snap.insight;

    // Shift ambient glow color as convergence increases
    const glow = document.getElementById('driftAmbientGlow');
    if (glow) {
        const intensity = 0.05 + (stepIndex / totalSteps) * 0.08;
        glow.style.background = `radial-gradient(ellipse at center, rgba(0, 182, 161, ${intensity}) 0%, rgba(255, 150, 48, ${intensity * 0.4}) 25%, transparent 60%)`;
    }
}


/**
 * Start auto-advancing through snapshots
 */
function startDriftAnimation() {
    stopDriftAnimation();
    if (window.currentSlide !== driftSlideIndex) return;
    driftAnimationTimer = setInterval(() => {
        if (window.currentSlide !== driftSlideIndex) {
            stopDriftAnimation();
            return;
        }
        advanceDriftStep();
    }, 3500);
}


/**
 * Stop the drift animation timer
 */
function stopDriftAnimation() {
    if (driftAnimationTimer) {
        clearInterval(driftAnimationTimer);
        driftAnimationTimer = null;
    }
}
