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

plantBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const colors = ['🌻', '🌼', '💛', '🌞', '🌺'];
    const emoji = colors[Math.floor(Math.random() * colors.length)];

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
    flower.style.left = (window.innerWidth / 2 + (Math.random() - 0.5) * 200) + 'px';
    flower.style.top = '50%';
    flower.style.position = 'fixed';
    flower.style.zIndex = '5';
    document.body.appendChild(flower);

    setTimeout(() => flower.remove(), 2500);
});

celebrateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    for (let i = 0; i < 12; i++) {
        setTimeout(() => {
            const spark = document.createElement('div');
            spark.style.position = 'fixed';
            spark.style.left = Math.random() * window.innerWidth + 'px';
            spark.style.top = Math.random() * window.innerHeight + 'px';
            spark.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
            spark.style.zIndex = '20';
            spark.style.pointerEvents = 'none';
            spark.style.animation = 'fadeInUp 1s ease-out forwards';
            spark.innerHTML = ['✨', '💛', '🌟', '🌻', '💫'][Math.floor(Math.random() * 5)];
            document.body.appendChild(spark);
            setTimeout(() => spark.remove(), 1000);
        }, i * 100);
    }
});

const isYayPage = document.querySelector('.joker-float') !== null;
if (!isYayPage) {
    createFloatingPetals();
}

const togepiGif = document.getElementById('togepi-gif');
let currentGif = 0;
const gifs = [
    'assets/images/togepi-happy.gif',
    'assets/images/togepi-love.gif',
    'assets/images/togepi-and-pikachu.gif'
];

setInterval(() => {
    currentGif = (currentGif + 1) % gifs.length;
    togepiGif.src = gifs[currentGif];
}, 5000);
