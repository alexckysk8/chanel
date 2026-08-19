// Configurações do jogo
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Função para ajustar o tamanho do canvas conforme a tela
function resizeCanvas() {
    canvas.width = window.innerWidth * 0.9; // 90% da largura da tela
    canvas.height = window.innerHeight * 0.7; // 70% da altura da tela
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const scoreElement = document.getElementById('score');
let score = 0;

const chanelImage = new Image();
chanelImage.src = 'chanel.png'; // Substitua pelo caminho correto da imagem

const motoboyImage = new Image();
motoboyImage.src = 'motoboy.png'; // Substitua pelo caminho correto da imagem

// Som de latido
const barkSound = new Audio('latido.mp3');

// Posições e velocidades
let chanel = { x: 50, y: canvas.height / 2 - 50, width: 80, height: 80 };
let motoboys = [];
let spawnTimer = null;

function createMotoboy() {
    const x = canvas.width;
    const size = 70 + Math.random() * 20; // Tamanho entre 70 e 90 pixels
    const y = Math.random() * (canvas.height - size);
    
    // Velocidade base aumenta a cada 15 pontos
    const speedLevel = Math.floor(score / 15);
    const baseSpeed = 2 + speedLevel * 1.5;
    
    // Velocidade individual com variação aleatória de +-20%
    const speed = baseSpeed * (0.8 + Math.random() * 0.4);
    
    motoboys.push({ x, y, width: size, height: size, speed });
}

function scheduleNextMotoboy() {
    const speedLevel = Math.floor(score / 15);
    // Reduz o intervalo de surgimento à medida que a pontuação aumenta (fica mais frenético)
    const baseInterval = Math.max(400, 1000 - speedLevel * 100);
    const randomDelay = baseInterval + Math.random() * 600; // Variação de até 600ms
    
    spawnTimer = setTimeout(() => {
        createMotoboy();
        scheduleNextMotoboy();
    }, randomDelay);
}

function moveChanel() {
    window.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault(); // Impede rolagem da tela
            switch (e.key) {
                case 'ArrowUp':
                    if (chanel.y > 0) chanel.y -= 20;
                    break;
                case 'ArrowDown':
                    if (chanel.y < canvas.height - chanel.height) chanel.y += 20;
                    break;
            }
        }
    });

    // Suporte para toque em dispositivos móveis corrigido com getBoundingClientRect
    canvas.addEventListener('touchstart', function (e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touchY = e.touches[0].clientY - rect.top;
        if (touchY < chanel.y + chanel.height / 2) {
            if (chanel.y > 0) chanel.y -= 30; // Move para cima
        } else {
            if (chanel.y < canvas.height - chanel.height) chanel.y += 30; // Move para baixo
        }
    }, { passive: false });

    // Botões físicos virtuais na tela
    const upBtn = document.getElementById('up-btn');
    const downBtn = document.getElementById('down-btn');
    if (upBtn && downBtn) {
        const moveUp = (e) => {
            e.preventDefault();
            if (chanel.y > 0) chanel.y -= 30;
        };
        const moveDown = (e) => {
            e.preventDefault();
            if (chanel.y < canvas.height - chanel.height) chanel.y += 30;
        };
        upBtn.addEventListener('click', moveUp);
        upBtn.addEventListener('touchstart', moveUp, { passive: false });
        downBtn.addEventListener('click', moveDown);
        downBtn.addEventListener('touchstart', moveDown, { passive: false });
    }
}

function moveMotoboys() {
    motoboys.forEach((motoboy, index) => {
        motoboy.x -= motoboy.speed;
        if (motoboy.x + motoboy.width < 0) {
            motoboys.splice(index, 1);
        }

        // Verifica colisão
        if (chanel.x < motoboy.x + motoboy.width &&
            chanel.x + chanel.width > motoboy.x &&
            chanel.y < motoboy.y + motoboy.height &&
            chanel.height + chanel.y > motoboy.y) {
            // Toca som de latido
            barkSound.currentTime = 0;
            barkSound.play().catch(e => console.error("Erro ao tocar latido:", e));

            // Remove motoboy e aumenta pontuação
            motoboys.splice(index, 1);
            score += 5;
            scoreElement.textContent = score;

            // Termina o jogo ao atingir 100 pontos
            if (score >= 100) {
                alert('Chanel venceu! Você atingiu 100 pontos!');
                resetGame();
            }
        }
    });
}

function resetGame() {
    score = 0;
    scoreElement.textContent = score;
    chanel = { x: 50, y: canvas.height / 2 - 50, width: 80, height: 80 };
    motoboys = [];
    if (spawnTimer) clearTimeout(spawnTimer);
    scheduleNextMotoboy();
}

// Função principal do jogo
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha Chanel
    ctx.drawImage(chanelImage, chanel.x, chanel.y, chanel.width, chanel.height);

    // Desenha motoboys
    motoboys.forEach(motoboy => {
        ctx.drawImage(motoboyImage, motoboy.x, motoboy.y, motoboy.width, motoboy.height);
    });

    moveMotoboys();
    requestAnimationFrame(gameLoop);
}

// Inicialização do jogo
moveChanel();
scheduleNextMotoboy();
gameLoop();
