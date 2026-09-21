const particlesContainer = document.getElementById('particles');
const garden = document.getElementById('garden');
const colors = ['#FFE082', '#FFD700', '#FFF176', '#FFA000', '#FF8F00'];

function createFloatingPetals() {
    const count = 15;
    for (let i = 0; i < count; i++) {
        const petal = document.createElement('div');
        petal.classList.add('petal-particle');
        petal.style.left = Math.random() * 100 + '%';
        petal.style.width = (4 + Math.random() * 8) + 'px';
        petal.style.height = petal.style.width;
        petal.style.animationDelay = Math.random() * 8 + 's';
        petal.style.animationDuration = (4 + Math.random() * 4) + 's';
        petal.style.background = `radial-gradient(circle, ${colors[Math.floor(Math.random() * colors.length)]}, #FFD700)`;
        particlesContainer.appendChild(petal);
    }
}

function createFlowerAt(x, y) {
    const flower = document.createElement('div');
    flower.classList.add('new-flower');
    flower.innerHTML = `
        <div class="petal petal-a"></div>
        <div class="petal petal-b"></div>
        <div class="petal petal-c"></div>
        <div class="petal petal-d"></div>
        <div class="petal petal-e"></div>
        <div class="petal petal-f"></div>
        <div class="center"></div>
        <div class="stem"></div>
        <div class="leaf"></div>
    `;
    flower.style.left = x + 'px';
    flower.style.top = y + 'px';
    flower.style.position = 'fixed';
    flower.style.zIndex = '5';
    document.body.appendChild(flower);

    setTimeout(() => flower.remove(), 2000);
}

document.addEventListener('click', (e) => {
    if (e.target.closest('.el-btn')) return;
    createFlowerAt(e.clientX, e.clientY);
});

const plantBtn = document.getElementById('plant-btn');
const celebrateBtn = document.getElementById('celebrate-btn');

/* Crea (una sola vez) una capa a pantalla completa para los elementos dinámicos */
function ensureLayer(id, className) {
    let layer = document.getElementById(id);
    if (!layer) {
        layer = document.createElement('div');
        layer.id = id;
        layer.className = className;
        document.body.appendChild(layer);
    }
    return layer;
}

/* ======================================================
   Plantar una flor: crece en los bordes y se acumula
   ====================================================== */

const FLOWER_W = 60;
const FLOWER_H = 120;
const MAX_PLANTED = 140;
const petalTones = ['#FFD700', '#FFC107', '#FFE082', '#FFCA28', '#FFB300'];

let plantedLayer = null;
const plantedFlowers = [];

/* Zona ocupada por el contenido central, con un margen de respeto */
function contentSafeRect() {
    const content = document.querySelector('.content');
    if (!content) return null;
    const r = content.getBoundingClientRect();
    const m = 24;
    return { left: r.left - m, right: r.right + m, top: r.top - m, bottom: r.bottom + m };
}

/* Elige un punto al azar en las franjas libres (izquierda, derecha o bajo el contenido) */
function pickPlantingSpot(scale) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const halfW = (FLOWER_W * scale) / 2;
    const fullH = FLOWER_H * scale;
    const edge = 6;
    const safe = contentSafeRect();
    const bands = [];

    if (safe) {
        const sideTop = H * 0.45; // altura máxima a la que sube una flor lateral

        const leftMax = safe.left - halfW;
        if (leftMax - (edge + halfW) > 10) {
            bands.push({ x0: edge + halfW, x1: leftMax, y0: 0, y1: sideTop, weight: (leftMax - edge) * sideTop });
        }

        const rightMin = safe.right + halfW;
        const rightMax = W - edge - halfW;
        if (rightMax - rightMin > 10) {
            bands.push({ x0: rightMin, x1: rightMax, y0: 0, y1: sideTop, weight: (rightMax - rightMin) * sideTop });
        }

        const bottomMax = H - safe.bottom - fullH; // queda por debajo del contenido
        if (bottomMax > 6) {
            bands.push({ x0: edge + halfW, x1: W - edge - halfW, y0: 0, y1: bottomMax, weight: W * bottomMax });
        }
    }

    if (!bands.length) {
        // Pantallas muy pequeñas: pegada a un borde inferior, sin tapar nada importante
        const onLeft = Math.random() < 0.5;
        return {
            xPct: ((onLeft ? edge + halfW : W - edge - halfW) / W) * 100,
            bottomPct: (Math.random() * H * 0.06 / H) * 100
        };
    }

    const total = bands.reduce((sum, b) => sum + b.weight, 0);
    let pick = Math.random() * total;
    let band = bands[bands.length - 1];
    for (const b of bands) {
        if (pick < b.weight) { band = b; break; }
        pick -= b.weight;
    }

    const x = band.x0 + Math.random() * (band.x1 - band.x0);
    const y = band.y0 + Math.random() * (band.y1 - band.y0);

    // En porcentajes para que las flores acompañen los cambios de tamaño de ventana
    return { xPct: (x / W) * 100, bottomPct: (y / H) * 100 };
}

function plantFlower() {
    plantedLayer = plantedLayer || ensureLayer('planted-garden', 'planted-garden');

    const scale = 0.5 + Math.random() * 0.45;
    const spot = pickPlantingSpot(scale);
    const tone = petalTones[Math.floor(Math.random() * petalTones.length)];
    const leafRot = Math.random() < 0.5 ? -30 : 150;

    const flower = document.createElement('div');
    flower.className = 'planted-flower';
    flower.style.left = spot.xPct.toFixed(2) + '%';
    flower.style.bottom = spot.bottomPct.toFixed(2) + '%';
    flower.style.setProperty('--pf-scale', scale.toFixed(3));
    flower.style.setProperty('--pf-tone', tone);
    flower.style.setProperty('--pf-leaf-rot', leafRot + 'deg');
    // Las flores más pequeñas (más "lejanas") quedan detrás
    flower.style.zIndex = String(Math.round(scale * 100));

    flower.innerHTML = `
        <div class="pf-sway" style="animation-delay: ${(0.7 + Math.random() * 1.6).toFixed(2)}s">
            <div class="stem"></div>
            <div class="leaf"></div>
            <div class="pf-head">
                <div class="petal petal-a"></div>
                <div class="petal petal-b"></div>
                <div class="petal petal-c"></div>
                <div class="petal petal-d"></div>
                <div class="petal petal-e"></div>
                <div class="petal petal-f"></div>
                <div class="center"></div>
            </div>
        </div>
    `;

    plantedLayer.appendChild(flower);
    plantedFlowers.push(flower);

    // Techo de seguridad: las más antiguas se marchitan para no degradar el rendimiento
    while (plantedFlowers.length > MAX_PLANTED) {
        const oldest = plantedFlowers.shift();
        oldest.classList.add('pf-out');
        setTimeout(() => oldest.remove(), 500);
    }
}

if (plantBtn) {
    plantBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        plantFlower();
    });
}

/* ======================================================
   Celebrar: lluvia de pétalos con requestAnimationFrame
   ====================================================== */

const RAIN_SPAWN_MS = 2600;   // cuánto tiempo siguen cayendo pétalos nuevos
const RAIN_RATE = 75;         // pétalos por segundo
const MAX_RAIN_PETALS = 300;

let rainLayer = null;
const rainPetals = [];
let rainFrame = null;
let rainLastTs = 0;
let rainSpawnUntil = 0;
let rainSpawnAcc = 0;

function spawnRainPetal() {
    if (rainPetals.length >= MAX_RAIN_PETALS) return;

    const W = window.innerWidth;
    const size = 8 + Math.random() * 15;
    const el = document.createElement('div');
    el.className = 'rain-petal';
    el.style.width = size.toFixed(1) + 'px';
    el.style.height = (size * (0.7 + Math.random() * 0.55)).toFixed(1) + 'px';
    el.style.background = `radial-gradient(circle at 30% 30%, #FFF59D, ${colors[Math.floor(Math.random() * colors.length)]})`;
    el.style.opacity = (0.7 + Math.random() * 0.3).toFixed(2);
    rainLayer.appendChild(el);

    rainPetals.push({
        el,
        baseX: Math.random() * (W + 60) - 30,
        y: -size * 2 - Math.random() * 260,
        vy: 110 + Math.random() * 190,              // velocidad de caída (px/s)
        swayAmp: 10 + Math.random() * 40,           // amplitud del balanceo
        swayFreq: 0.35 + Math.random() * 0.9,       // vaivén (ciclos/s)
        phase: Math.random() * Math.PI * 2,
        rot: Math.random() * 360,
        vrot: (Math.random() - 0.5) * 260,          // giro (grados/s)
        t: 0,
        size
    });
}

function rainStep(ts) {
    const dt = rainLastTs ? Math.min((ts - rainLastTs) / 1000, 0.05) : 0.016;
    rainLastTs = ts;

    if (ts < rainSpawnUntil) {
        rainSpawnAcc += dt * RAIN_RATE;
        while (rainSpawnAcc >= 1) {
            spawnRainPetal();
            rainSpawnAcc -= 1;
        }
    }

    const limit = window.innerHeight + 60;

    for (let i = rainPetals.length - 1; i >= 0; i--) {
        const p = rainPetals[i];
        p.t += dt;
        p.y += p.vy * dt;
        p.rot += p.vrot * dt;

        const x = p.baseX + Math.sin(p.t * p.swayFreq * Math.PI * 2 + p.phase) * p.swayAmp;
        p.el.style.transform = `translate3d(${x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) rotate(${p.rot.toFixed(1)}deg)`;

        // Al salir de pantalla se elimina del DOM
        if (p.y > limit) {
            p.el.remove();
            rainPetals.splice(i, 1);
        }
    }

    if (rainPetals.length || ts < rainSpawnUntil) {
        rainFrame = requestAnimationFrame(rainStep);
    } else {
        rainFrame = null;
        rainLastTs = 0;
    }
}

function startPetalRain() {
    rainLayer = rainLayer || ensureLayer('petal-rain', 'petal-rain');
    rainSpawnUntil = performance.now() + RAIN_SPAWN_MS;
    if (rainFrame === null) {
        rainLastTs = 0;
        rainSpawnAcc = 0;
        rainFrame = requestAnimationFrame(rainStep);
    }
}

if (celebrateBtn) {
    celebrateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startPetalRain();
    });
}

/* Pausa la lluvia si la pestaña deja de verse (evita acumular trabajo en segundo plano) */
document.addEventListener('visibilitychange', () => {
    if (document.hidden && rainFrame !== null) {
        cancelAnimationFrame(rainFrame);
        rainFrame = null;
        rainLastTs = 0;
        rainPetals.forEach(p => p.el.remove());
        rainPetals.length = 0;
        rainSpawnUntil = 0;
    }
});

const isYayPage = document.querySelector('.joker-float') !== null;
if (!isYayPage) {
    createFloatingPetals();
}

const togepiGif = document.getElementById('togepi-gif');
let currentGif = 0;
const gifs = [
    '../public/assets/images/togepi-happy.gif',
    '../public/assets/images/togepi-love.gif',
    '../public/assets/images/togepi-and-pikachu.gif'
];

if (togepiGif) {
    setInterval(() => {
        currentGif = (currentGif + 1) % gifs.length;
        togepiGif.src = gifs[currentGif];
    }, 5000);
}
