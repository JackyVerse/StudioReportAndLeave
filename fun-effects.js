// Nhạc nền + meme sm1/sm2 bay troll khắp trang
(function () {
    const MUSIC_KEY = 'bgMusicEnabled';
    const MUSIC_VOLUME = 0.35;

    class TrollSprite {
        constructor(element, options = {}) {
            this.el = element;
            this.x = options.x ?? Math.random() * (window.innerWidth - 120);
            this.y = options.y ?? Math.random() * (window.innerHeight - 120);
            this.vx = options.vx ?? (Math.random() > 0.5 ? 1 : -1) * (1.8 + Math.random() * 2.2);
            this.vy = options.vy ?? (Math.random() > 0.5 ? 1 : -1) * (1.8 + Math.random() * 2.2);
            this.rotation = Math.random() * 360;
            this.rotationSpeed = (Math.random() - 0.5) * 1.8;
            this.wobble = Math.random() * Math.PI * 2;
            this.flipTimer = 0;
            this.scaleX = 1;
        }

        get size() {
            return this.el.offsetWidth || 100;
        }

        bounds() {
            const size = this.size;
            return {
                maxX: Math.max(0, window.innerWidth - size),
                maxY: Math.max(0, window.innerHeight - size)
            };
        }

        boost() {
            this.vx = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 6);
            this.vy = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 6);
            this.rotationSpeed = (Math.random() - 0.5) * 12;
            this.el.classList.add('is-chaos');
            setTimeout(() => this.el.classList.remove('is-chaos'), 350);
        }

        collideWith(other) {
            const dx = (this.x + this.size / 2) - (other.x + other.size / 2);
            const dy = (this.y + this.size / 2) - (other.y + other.size / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.size * 0.85) {
                [this.vx, other.vx] = [other.vx * 1.4, this.vx * 1.4];
                [this.vy, other.vy] = [other.vy * 1.4, this.vy * 1.4];
                this.boost();
                other.boost();
            }
        }

        update() {
            const { maxX, maxY } = this.bounds();

            this.x += this.vx;
            this.y += this.vy;
            this.rotation += this.rotationSpeed;
            this.wobble += 0.04;
            this.flipTimer += 1;

            if (this.x <= 0) {
                this.x = 0;
                this.vx = Math.abs(this.vx) * (1 + Math.random() * 0.6);
                this.rotationSpeed *= -1;
            } else if (this.x >= maxX) {
                this.x = maxX;
                this.vx = -Math.abs(this.vx) * (1 + Math.random() * 0.6);
                this.rotationSpeed *= -1;
            }

            if (this.y <= 0) {
                this.y = 0;
                this.vy = Math.abs(this.vy) * (1 + Math.random() * 0.6);
            } else if (this.y >= maxY) {
                this.y = maxY;
                this.vy = -Math.abs(this.vy) * (1 + Math.random() * 0.6);
            }

            // Thỉnh thoảng đổi hướng bất ngờ cho troll
            if (Math.random() < 0.003) {
                this.vx = (Math.random() - 0.5) * 10;
                this.vy = (Math.random() - 0.5) * 10;
            }

            // Lật ngang ngẫu nhiên
            if (this.flipTimer > 180 + Math.random() * 120) {
                this.scaleX *= -1;
                this.flipTimer = 0;
            }

            const wobbleY = Math.sin(this.wobble) * 6;
            this.el.style.transform =
                `translate(${this.x}px, ${this.y + wobbleY}px) rotate(${this.rotation}deg) scaleX(${this.scaleX})`;
        }
    }

    let sprites = [];
    let rafId = null;
    let audio = null;
    let musicEnabled = false;

    function updateMusicUI() {
        const fab = document.getElementById('musicFab');
        const label = document.getElementById('toggleMusicLabel');
        if (fab) {
            fab.textContent = musicEnabled ? '🔊' : '🔇';
            fab.classList.toggle('is-playing', musicEnabled);
            fab.title = musicEnabled ? 'Tắt nhạc nền' : 'Bật nhạc nền';
        }
        if (label) {
            label.textContent = musicEnabled ? 'Nhạc nền: Bật' : 'Nhạc nền: Tắt';
        }
    }

    async function setMusicEnabled(enabled) {
        musicEnabled = enabled;
        localStorage.setItem(MUSIC_KEY, enabled ? '1' : '0');
        updateMusicUI();

        if (!audio) return;

        if (enabled) {
            audio.volume = MUSIC_VOLUME;
            try {
                await audio.play();
            } catch {
                // Trình duyệt chặn autoplay — cần click nút nhạc
            }
        } else {
            audio.pause();
        }
    }

    function toggleMusic() {
        setMusicEnabled(!musicEnabled);
    }

    function animateLoop() {
        if (sprites.length === 2) {
            sprites[0].collideWith(sprites[1]);
        }
        sprites.forEach(sprite => sprite.update());
        rafId = requestAnimationFrame(animateLoop);
    }

    function initSprites() {
        const sm1 = document.getElementById('trollSm1');
        const sm2 = document.getElementById('trollSm2');
        if (!sm1 || !sm2) return;

        sprites = [
            new TrollSprite(sm1, { x: 40, y: 80, vx: 2.5, vy: 2 }),
            new TrollSprite(sm2, { x: window.innerWidth - 160, y: window.innerHeight - 180, vx: -2.2, vy: -2.8 })
        ];

        sprites.forEach(sprite => {
            sprite.el.addEventListener('click', () => sprite.boost());
        });

        if (!rafId) {
            animateLoop();
        }
    }

    function onResize() {
        sprites.forEach(sprite => {
            const { maxX, maxY } = sprite.bounds();
            sprite.x = Math.min(sprite.x, maxX);
            sprite.y = Math.min(sprite.y, maxY);
        });
    }

    function initFunEffects() {
        audio = document.getElementById('bgMusic');
        musicEnabled = localStorage.getItem(MUSIC_KEY) === '1';
        updateMusicUI();

        const fab = document.getElementById('musicFab');
        const menuBtn = document.getElementById('toggleMusicBtn');

        if (fab) fab.addEventListener('click', toggleMusic);
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                toggleMusic();
                const menu = document.getElementById('menuDropdown');
                if (menu) menu.style.display = 'none';
            });
        }

        initSprites();
        window.addEventListener('resize', onResize);

        if (musicEnabled && audio) {
            audio.volume = MUSIC_VOLUME;
            audio.play().catch(() => {});
        }
    }

    document.addEventListener('DOMContentLoaded', initFunEffects);
})();
