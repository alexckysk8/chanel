// Configurações do jogo
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreElement = document.getElementById('score');
const phaseElement = document.getElementById('phase');
const victoryScreen = document.getElementById('victory-screen');
const victoryVideo = document.getElementById('victory-video');
const restartBtn = document.getElementById('restart-btn');
const muteBtn = document.getElementById('mute-btn');

let score = 0;
let phase = 1;
let isGameOver = false;
let isMuted = localStorage.getItem('gameMuted') === 'true';

// Ajuste do tamanho do canvas para o formato vertical (9:16)
function resizeCanvas() {
    const container = document.getElementById('canvas-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Proporção vertical 9:16
    const targetRatio = 9 / 16;
    
    let width = containerWidth;
    let height = width / targetRatio;
    
    if (height > containerHeight) {
        height = containerHeight;
        width = height * targetRatio;
    }
    
    canvas.width = width;
    canvas.height = height;
}

window.addEventListener('resize', () => {
    resizeCanvas();
    // Reposiciona Chanel no fundo após redimensionar
    if (chanel) {
        chanel.y = canvas.height - chanel.height - 20;
    }
});

const chanelImage = new Image();
chanelImage.src = 'chanel.png';

const motoboyImage = new Image();
motoboyImage.src = 'motoboy.png';

// Som de latido
const barkSound = new Audio('latido.mp3');

// Posições e velocidades (Movimento Horizontal)
let chanel = { x: 0, y: 0, width: 60, height: 60, speed: 6 };
let motoboys = [];
let spawnTimer = null;
let moveDirection = 0; // -1 = esquerda, 1 = direita, 0 = parado

// Inicializa ou atualiza o estado de mute
function updateMuteState() {
    barkSound.muted = isMuted;
    victoryVideo.muted = isMuted;
    
    if (muteBtn) {
        muteBtn.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    }
    localStorage.setItem('gameMuted', isMuted);
}

if (muteBtn) {
    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        updateMuteState();
    });
}

function createMotoboy() {
    if (isGameOver) return;
    
    const size = canvas.width * 0.18; // Tamanho proporcional à largura do canvas
    const x = Math.random() * (canvas.width - size);
    const y = -size; // Começa fora da tela no topo
    
    // Velocidade de queda de acordo com a fase e pontuação
    let baseSpeed = 3.5;
    let speedIncrement = 0.04;

    if (phase === 2) {
        baseSpeed = 5.5;
        speedIncrement = 0.05;
    } else if (phase === 3) {
        baseSpeed = 7.5;
        speedIncrement = 0.06;
    }

    const currentSpeed = baseSpeed + (score * speedIncrement);
    const speed = currentSpeed * (0.85 + Math.random() * 0.3); // Variação aleatória
    
    motoboys.push({ x, y, width: size, height: size, speed });
}

function scheduleNextMotoboy() {
    if (isGameOver) return;
    if (spawnTimer) clearTimeout(spawnTimer);

    // Ajusta frequência de spawn de acordo com a fase
    let baseInterval = 1300;
    if (phase === 2) baseInterval = 1000;
    if (phase === 3) baseInterval = 800;

    const intervalReduction = Math.min(score * 6, baseInterval * 0.5);
    const randomDelay = (baseInterval - intervalReduction) + Math.random() * 500;
    
    spawnTimer = setTimeout(() => {
        createMotoboy();
        scheduleNextMotoboy();
    }, randomDelay);
}

function setupControls() {
    // Teclado - Pressionar
    window.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            moveDirection = -1;
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            moveDirection = 1;
        }
    });

    // Teclado - Soltar
    window.addEventListener('keyup', function (e) {
        if (e.key === 'ArrowLeft' && moveDirection === -1) {
            moveDirection = 0;
        } else if (e.key === 'ArrowRight' && moveDirection === 1) {
            moveDirection = 0;
        }
    });

    // Suporte a toque direto no Canvas (esquerda/direita)
    canvas.addEventListener('touchstart', function (e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        if (touchX < canvas.width / 2) {
            moveDirection = -1;
        } else {
            moveDirection = 1;
        }
    }, { passive: false });

    canvas.addEventListener('touchend', function (e) {
        e.preventDefault();
        moveDirection = 0;
    }, { passive: false });

    // Botões físicos virtuais na tela (Esquerda/Direita)
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    
    if (leftBtn && rightBtn) {
        const pressLeft = (e) => {
            e.preventDefault();
            moveDirection = -1;
        };
        const pressRight = (e) => {
            e.preventDefault();
            moveDirection = 1;
        };
        const stopMove = (e) => {
            e.preventDefault();
            moveDirection = 0;
        };

        // Eventos mouse
        leftBtn.addEventListener('mousedown', pressLeft);
        leftBtn.addEventListener('mouseup', stopMove);
        leftBtn.addEventListener('mouseleave', stopMove);
        
        rightBtn.addEventListener('mousedown', pressRight);
        rightBtn.addEventListener('mouseup', stopMove);
        rightBtn.addEventListener('mouseleave', stopMove);

        // Eventos touch
        leftBtn.addEventListener('touchstart', pressLeft, { passive: false });
        leftBtn.addEventListener('touchend', stopMove, { passive: false });
        
        rightBtn.addEventListener('touchstart', pressRight, { passive: false });
        rightBtn.addEventListener('touchend', stopMove, { passive: false });
    }

    // Botão de reiniciar
    if (restartBtn) {
        restartBtn.addEventListener('click', resetGame);
    }
}

function updateChanelPosition() {
    if (moveDirection === -1 && chanel.x > 0) {
        chanel.x -= chanel.speed;
    } else if (moveDirection === 1 && chanel.x < canvas.width - chanel.width) {
        chanel.x += chanel.speed;
    }
}

function moveMotoboys() {
    for (let i = motoboys.length - 1; i >= 0; i--) {
        const motoboy = motoboys[i];
        // Move para baixo (vertical)
        motoboy.y += motoboy.speed;

        // Se sair da tela na parte inferior, remove
        if (motoboy.y > canvas.height) {
            motoboys.splice(i, 1);
            continue;
        }

        // Verifica colisão com Chanel
        if (chanel.x < motoboy.x + motoboy.width &&
            chanel.x + chanel.width > motoboy.x &&
            chanel.y < motoboy.y + motoboy.height &&
            chanel.height + chanel.y > motoboy.y) {
            
            // Som de latido
            if (!isMuted) {
                barkSound.currentTime = 0;
                barkSound.play().catch(e => console.log("Erro ao tocar latido:", e));
            }

            // Remove motoboy e pontua
            motoboys.splice(i, 1);
            score += 5;
            scoreElement.textContent = score;

            // Avanço de fase ou vitória final
            if (score >= 100) {
                if (phase < 3) {
                    phase++;
                    score = 0;
                    scoreElement.textContent = score;
                    phaseElement.textContent = phase;
                    motoboys = [];
                } else {
                    triggerVictory();
                }
            }
        }
    }
}

function triggerVictory() {
    isGameOver = true;
    moveDirection = 0;
    if (spawnTimer) clearTimeout(spawnTimer);
    
    // Mostra tela de vitória
    victoryScreen.classList.remove('hidden');
    
    // Toca o vídeo chanel.mp4
    victoryVideo.muted = isMuted;
    victoryVideo.currentTime = 0;
    
    // Tenta reproduzir o vídeo. Se falhar (por restrição de som do navegador), tenta mutado.
    const playPromise = victoryVideo.play();
    if (playPromise !== undefined) {
        playPromise.catch(err => {
            console.log("Falha ao tocar vídeo com som. Forçando mudo:", err);
            victoryVideo.muted = true;
            victoryVideo.play();
        });
    }
}

function resetGame() {
    score = 0;
    phase = 1;
    isGameOver = false;
    moveDirection = 0;
    
    scoreElement.textContent = score;
    phaseElement.textContent = phase;
    
    // Configura canvas inicialmente
    resizeCanvas();
    
    // Chanel tamanho proporcional ao canvas horizontal
    const size = Math.min(canvas.width * 0.16, 65);
    chanel = { 
        x: canvas.width / 2 - size / 2, 
        y: canvas.height - size - 20, 
        width: size, 
        height: size, 
        speed: Math.max(canvas.width * 0.02, 6) 
    };

    motoboys = [];
    
    // Pausa e reseta o vídeo
    victoryVideo.pause();
    victoryVideo.currentTime = 0;
    victoryScreen.classList.add('hidden');

    updateMuteState();

    if (spawnTimer) clearTimeout(spawnTimer);
    scheduleNextMotoboy();
}

// Função principal do loop de rendering
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isGameOver) {
        updateChanelPosition();
        moveMotoboys();
    }

    // Desenha Chanel no fundo
    ctx.drawImage(chanelImage, chanel.x, chanel.y, chanel.width, chanel.height);

    // Desenha Motoboys caindo
    motoboys.forEach(motoboy => {
        ctx.drawImage(motoboyImage, motoboy.x, motoboy.y, motoboy.width, motoboy.height);
    });

    requestAnimationFrame(gameLoop);
}

// Inicialização
setupControls();
resetGame();
gameLoop();
