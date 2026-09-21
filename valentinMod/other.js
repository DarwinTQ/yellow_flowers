window.addEventListener("load", () => {
    const btn = document.querySelector('.joker-float');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const messages = ['¡La encontraste! 🌸', '¡Tan astuto! 💛', '¡Las flores te eligieron! 🌻'];
        const msg = messages[Math.floor(Math.random() * messages.length)];
        alert(msg);
    });

    btn.addEventListener('mouseover', moveButton);

    function moveButton(e) {
        const btnWidth = btn.offsetWidth;
        const btnHeight = btn.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let newX, newY;
        do {
            newX = Math.random() * (viewportWidth - btnWidth);
            newY = Math.random() * (viewportHeight - btnHeight);
        } while (isMouseOverButton(e.clientX, e.clientY, newX, newY, btnWidth, btnHeight));

        btn.style.position = "absolute";
        btn.style.top = newY + "px";
        btn.style.left = newX + "px";
    }

    function isMouseOverButton(mX, mY, x, y, width, height) {
        return mX > x && mX < (x + width) && mY > y && mY < (y + height);
    }

    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        const colors = ['#FFE082', '#FFD700', '#FFF176', '#FFA000', '#FF8F00'];
        const count = 20;
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
});
