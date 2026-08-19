// Configurações do jogo
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreElement = document.getElementById('score');
const phaseElement = document.getElementById('phase');
const victoryScreen = document.getElementById('victory-screen');
const victoryVideo = document.getElementById('victory-video');
const restartBtn = document.getElementById('restart-btn');

let score = 0;
let phase = 1;
let isGameOver = false;

// Ajuste do tamanho do canvas
function resizeCanvas() {
    // Definir proporção padrão landscape para o jogo (ex: 16:9 ou similar)
    const maxWidth = window.innerWidth * 0.95;
    const maxHeight = window.innerHeight * 0.6;
    
    // Proporção ideal
    const targetWidth = 800;
    const targetHeight = 450;
    const aspectRatio = targetWidth / targetHeight;

    let width = maxWidth;
    let height = width / aspectRatio;

    if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
    }

    canvas.width = width;
    canvas.height = height;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const chanelImage = new Image();
chanelImage.src = 'chanel.png';

const motoboyImage = new Image();
motoboyImage.src = 'motoboy.png';

// Som de latido
const barkSound = new Audio('latido.mp3');

// Posições e velocidades
let chanel = { x: 50, y: canvas.height / 2 - 25, width: 60, height: 60, speed: 6 };
let motoboys = [];
let spawnTimer = null;
let moveDirection = 0; // -1 = cima, 1 = baixo, 0 = parado

function createMotoboy() {
    if (isGameOver) return;
    const x = canvas.width;
    // Tamanho proporcional ao canvas
    const size = (canvas.height * 0.15) + Math.random() * (canvas.height * 0.05);
    const y = Math.random() * (canvas.height - size);
    
    // Velocidade de acordo com a fase e pontuação
    let baseSpeed = 3;
    let speedIncrement = 0.03;

    if (phase === 2) {
        baseSpeed = 5;
        speedIncrement = 0.04;
    } else if (phase === 3) {
        baseSpeed = 7.5;
        speedIncrement = 0.05;
    }

    const currentSpeed = baseSpeed + (score * speedIncrement);
    const speed = currentSpeed * (0.85 + Math.random() * 0.3); // Pequena variação aleatória de velocidade
    
    motoboys.push({ x, y, width: size, height: size, speed });
}

function scheduleNextMotoboy() {
    if (isGameOver) return;
    if (spawnTimer) clearTimeout(spawnTimer);

    // Ajusta frequência de spawn com base na fase e pontuação
    let baseInterval = 1200;
    if (phase === 2) baseInterval = 900;
    if (phase === 3) baseInterval = 700;

    const intervalReduction = Math.min(score * 5, baseInterval * 0.5);
    const randomDelay = (baseInterval - intervalReduction) + Math.random() * 500;
    
    spawnTimer = setTimeout(() => {
        createMotoboy();
        scheduleNextMotoboy();
    }, randomDelay);
}

function setupControls() {
    // Teclado - Pressionar
    window.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            moveDirection = -1;
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            moveDirection = 1;
        }
    });

    // Teclado - Soltar
    window.addEventListener('keyup', function (e) {
        if (e.key === 'ArrowUp' && moveDirection === -1) {
            moveDirection = 0;
        } else if (e.key === 'ArrowDown' && moveDirection === 1) {
            moveDirection = 0;
        }
    });

    // Suporte a Toque na tela (Canvas)
    canvas.addEventListener('touchstart', function (e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touchY = e.touches[0].clientY - rect.top;
        if (touchY < chanel.y + chanel.height / 2) {
            moveDirection = -1;
        } else {
            moveDirection = 1;
        }
    }, { passive: false });

    canvas.addEventListener('touchend', function (e) {
        e.preventDefault();
        moveDirection = 0;
    }, { passive: false });

    // Botões físicos virtuais na tela
    const upBtn = document.getElementById('up-btn');
    const downBtn = document.getElementById('down-btn');
    
    if (upBtn && downBtn) {
        const pressUp = (e) => {
            e.preventDefault();
            moveDirection = -1;
        };
        const pressDown = (e) => {
            e.preventDefault();
            moveDirection = 1;
        };
        const stopMove = (e) => {
            e.preventDefault();
            moveDirection = 0;
        };

        // Eventos mouse
        upBtn.addEventListener('mousedown', pressUp);
        upBtn.addEventListener('mouseup', stopMove);
        upBtn.addEventListener('mouseleave', stopMove);
        
        downBtn.addEventListener('mousedown', pressDown);
        downBtn.addEventListener('mouseup', stopMove);
        downBtn.addEventListener('mouseleave', stopMove);

        // Eventos touch
        upBtn.addEventListener('touchstart', pressUp, { passive: false });
        upBtn.addEventListener('touchend', stopMove, { passive: false });
        
        downBtn.addEventListener('touchstart', pressDown, { passive: false });
        downBtn.addEventListener('touchend', stopMove, { passive: false });
    }

    // Botão de reiniciar
    if (restartBtn) {
        restartBtn.addEventListener('click', resetGame);
    }
}

function updateChanelPosition() {
    if (moveDirection === -1 && chanel.y > 0) {
        chanel.y -= chanel.speed;
    } else if (moveDirection === 1 && chanel.y < canvas.height - chanel.height) {
        chanel.y += chanel.speed;
    }
}

function moveMotoboys() {
    for (let i = motoboys.length - 1; i >= 0; i--) {
        const motoboy = motoboys[i];
        motoboy.x -= motoboy.speed;

        // Se sair da tela, remove
        if (motoboy.x + motoboy.width < 0) {
            motoboys.splice(i, 1);
            continue;
        }

        // Verifica colisão com Chanel
        if (chanel.x < motoboy.x + motoboy.width &&
            chanel.x + chanel.width > motoboy.x &&
            chanel.y < motoboy.y + motoboy.height &&
            chanel.height + chanel.y > motoboy.y) {
            
            // Som de latido
            barkSound.currentTime = 0;
            barkSound.play().catch(e => console.log("Erro ao tocar som:", e));

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
                    // Limpa motoboys para dar uma pausa visual e iniciar a nova fase
                    motoboys = [];
                } else {
                    // Ganhou a Fase 3
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
    victoryVideo.muted = false;
    victoryVideo.currentTime = 0;
    victoryVideo.play().catch(err => {
        console.log("Autoplay com som bloqueado, tentando mudo:", err);
        victoryVideo.muted = true;
        victoryVideo.play();
    });
}

function resetGame() {
    score = 0;
    phase = 1;
    isGameOver = false;
    moveDirection = 0;
    
    scoreElement.textContent = score;
    phaseElement.textContent = phase;
    
    // Ajusta o tamanho inicial de Chanel proporcional ao canvas
    const size = Math.min(canvas.width * 0.12, 60);
    chanel = { 
        x: 50, 
        y: canvas.height / 2 - size / 2, 
        width: size, 
        height: size, 
        speed: Math.max(canvas.height * 0.015, 6) 
    };

    motoboys = [];
    
    // Pausa e reseta o vídeo
    victoryVideo.pause();
    victoryVideo.currentTime = 0;
    victoryScreen.classList.add('hidden');

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

    // Desenha Chanel
    ctx.drawImage(chanelImage, chanel.x, chanel.y, chanel.width, chanel.height);

    // Desenha Motoboys
    motoboys.forEach(motoboy => {
        ctx.drawImage(motoboyImage, motoboy.x, motoboy.y, motoboy.width, motoboy.height);
    });

    requestAnimationFrame(gameLoop);
}

// Inicialização
setupControls();
resetGame();
gameLoop();
