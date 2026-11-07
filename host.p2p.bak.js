// GFleth Party Game Hub - Host Spectator Application Controller (WebRTC P2P Serverless)
document.addEventListener('DOMContentLoaded', () => {
    // === 1. DOM ELEMENTS ===
    const screens = {
        lobby: document.getElementById('screen-lobby'),
        rocket: document.getElementById('screen-game-rocket'),
        catch: document.getElementById('screen-game-catch'),
        galaga: document.getElementById('screen-game-galaga'),
        buzz: document.getElementById('screen-game-buzz'),
        wheel: document.getElementById('screen-game-wheel'),
        popcat: document.getElementById('screen-game-popcat'),
        result: document.getElementById('screen-result')
    };

    // Lobby Screen Elements
    const textRoomId = document.getElementById('text-room-id');
    const btnCopyLink = document.getElementById('btn-copy-link');
    const listPlayers = document.getElementById('list-players');
    const playerCountLabel = document.getElementById('player-count');
    const btnStartGame = document.getElementById('btn-start-game');
    const lobbyStatusText = document.getElementById('lobby-status-text');
    const gameSelectCards = document.querySelectorAll('.game-select-card');

    // Rocket Racing Elements
    const rocketCountdown = document.getElementById('rocket-countdown');
    const rocketAnnouncement = document.getElementById('rocket-announcement');
    const rocketCanvas = document.getElementById('game-canvas');
    const rocketCtx = rocketCanvas.getContext('2d');
    const rocketLeaderboard = document.getElementById('rocket-leaderboard-list');

    // Catch It Elements (Live Top 3 Stages)
    const catchTimer = document.getElementById('catch-timer');
    const catchAnnouncement = document.getElementById('catch-announcement');
    const catchLeaderboard = document.getElementById('catch-leaderboard-list');
    const stageNames = [
        document.getElementById('stage-name-0'),
        document.getElementById('stage-name-1'),
        document.getElementById('stage-name-2')
    ];
    const stageScores = [
        document.getElementById('stage-score-0'),
        document.getElementById('stage-score-1'),
        document.getElementById('stage-score-2')
    ];
    const stageCanvases = [
        document.getElementById('catch-canvas-0'),
        document.getElementById('catch-canvas-1'),
        document.getElementById('catch-canvas-2')
    ];
    const stageContexts = stageCanvases.map(c => c ? c.getContext('2d') : null);

    // Galaga '88 Elements (Live Top 3 Stages)
    const galagaTimer = document.getElementById('galaga-timer');
    const galagaAnnouncement = document.getElementById('galaga-announcement');
    const galagaLeaderboard = document.getElementById('galaga-leaderboard-list');
    const galagaStageNames = [
        document.getElementById('galaga-stage-name-0'),
        document.getElementById('galaga-stage-name-1'),
        document.getElementById('galaga-stage-name-2')
    ];
    const galagaStageScores = [
        document.getElementById('galaga-stage-score-0'),
        document.getElementById('galaga-stage-score-1'),
        document.getElementById('galaga-stage-score-2')
    ];
    const galagaStageCanvases = [
        document.getElementById('galaga-canvas-0'),
        document.getElementById('galaga-canvas-1'),
        document.getElementById('galaga-canvas-2')
    ];
    const galagaStageContexts = galagaStageCanvases.map(c => c ? c.getContext('2d') : null);

    // PopCat Battle Elements (Live Top 3 Stages)
    const popcatTimer = document.getElementById('popcat-timer');
    const popcatAnnouncement = document.getElementById('popcat-announcement');
    const popcatLeaderboard = document.getElementById('popcat-leaderboard-list');
    const popcatStageNames = [
        document.getElementById('popcat-stage-name-0'),
        document.getElementById('popcat-stage-name-1'),
        document.getElementById('popcat-stage-name-2')
    ];
    const popcatStageScores = [
        document.getElementById('popcat-stage-score-0'),
        document.getElementById('popcat-stage-score-1'),
        document.getElementById('popcat-stage-score-2')
    ];
    const popcatStageCanvases = [
        document.getElementById('popcat-canvas-0'),
        document.getElementById('popcat-canvas-1'),
        document.getElementById('popcat-canvas-2')
    ];
    const popcatStageContexts = popcatStageCanvases.map(c => c ? c.getContext('2d') : null);

    // Fast Buzz Elements
    const buzzAnnouncement = document.getElementById('buzz-announcement');
    const buzzWinnerName = document.getElementById('buzz-winner-name');
    const buzzWinnerTime = document.getElementById('buzz-winner-time');
    const buzzQueueOl = document.getElementById('buzz-queue-ol');
    const btnBuzzReset = document.getElementById('btn-buzz-reset');
    const btnBuzzScorePlus = document.getElementById('btn-buzz-score-plus');
    const btnBuzzScoreMinus = document.getElementById('btn-buzz-score-minus');
    const buzzTimerText = document.getElementById('buzz-timer-text');

    // Lucky Wheel Elements
    const wheelWinnerModal = document.getElementById('wheel-winner-modal');
    const wheelWinnerLabel = document.getElementById('wheel-winner-label');
    const btnWheelWinnerClose = document.getElementById('btn-wheel-winner-close');
    const wheelPlayerCount = document.getElementById('wheel-player-count');
    const btnWheelSpin = document.getElementById('btn-wheel-spin');
    const wheelCanvas = document.getElementById('wheel-canvas');
    const wheelCtx = wheelCanvas.getContext('2d');
    const wheelAnnouncement = document.getElementById('wheel-announcement');

    // Result Screen Elements
    const winnerAnnouncement = document.querySelector('#winner-announcement span');
    const leaderboardList = document.getElementById('leaderboard-list');
    const btnRestartGame = document.getElementById('btn-restart-game');
    const btnQuit = document.getElementById('btn-quit');

    // === 2. STATE VARIABLES ===
    const STATIC_ROOM_CODE = 'GFLETH';
    const PEER_PREFIX = 'gfleth-rocket-';
    
    // WebRTC ICE Servers (STUN) สำหรับช่วยค้นหาเส้นทางข้ามเน็ตเวิร์ก
    const PEER_CONFIG = {
        debug: 1,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                { urls: 'stun:stun.services.mozilla.com' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        }
    };
    
    let myPeerId = PEER_PREFIX + STATIC_ROOM_CODE;
    let peer = null;
    let connections = [];
    let players = {}; // peerId -> { nickname, progress, ready, score, answers: {}, scores: {} }
    
    let activeGameMode = 'rocket'; // 'rocket', 'catch', 'buzz', 'wheel'
    let gameActive = false;
    let gameTimer = 60;

    // Catch It Game Variables
    let catchSeed = 0;
    let catchPrng = null;
    let catchItems = [];
    let catchItemNextId = 1;
    let catchSpawnTimer = 0;
    let catchCountdownInterval = null;
    let catchTimerInterval = null;
    let catchAnimId = null;
    let catchStagesState = [
        { currentBasketX: 0.5, particles: [], floatingTexts: [], lastScore: 0 },
        { currentBasketX: 0.5, particles: [], floatingTexts: [], lastScore: 0 },
        { currentBasketX: 0.5, particles: [], floatingTexts: [], lastScore: 0 }
    ];

    const CATCH_ITEM_TYPES = [
        { type: 'coin', symbol: '🪙', color: '#ffcc00', points: 10, comboInc: 1, weight: 35, speed: 0.32 },
        { type: 'gift', symbol: '🎁', color: '#ff3366', points: 20, comboInc: 1, weight: 25, speed: 0.36 },
        { type: 'star', symbol: '⭐', color: '#00f0ff', points: 50, comboInc: 2, weight: 15, speed: 0.40 },
        { type: 'diamond', symbol: '💎', color: '#b026ff', points: 100, comboInc: 3, weight: 10, speed: 0.45 },
        { type: 'bomb', symbol: '💣', color: '#ff0055', points: -30, comboInc: -999, isBad: true, weight: 10, speed: 0.38 },
        { type: 'banana', symbol: '🍌', color: '#ffaa00', points: -10, comboInc: -999, isBad: true, weight: 10, speed: 0.35 }
    ];

    // Galaga '88 Game Variables (Host Side)
    let galagaSeed = 0;
    let galagaPrng = null;
    let galagaEnemies = [];
    let galagaNextEnemyId = 1;
    let galagaSpawnTimer = 0;
    let galagaCountdownInterval = null;
    let galagaTimerInterval = null;
    let galagaAnimId = null;
    let galagaStagesState = [
        { currentShipX: 0.5, dualFighter: false, particles: [], floatingTexts: [], lasers: [], lastScore: 0, stars: [] },
        { currentShipX: 0.5, dualFighter: false, particles: [], floatingTexts: [], lasers: [], lastScore: 0, stars: [] },
        { currentShipX: 0.5, dualFighter: false, particles: [], floatingTexts: [], lasers: [], lastScore: 0, stars: [] }
    ];

    const GALAGA_ENEMY_TYPES = [
        { type: 'drone', symbol: '👾', name: 'Drone Bug', color: '#00f0ff', hp: 1, points: 10, speed: 0.22, weight: 45 },
        { type: 'armored', symbol: '🛸', name: 'Armored Alien', color: '#ffcc00', hp: 3, points: 30, speed: 0.16, weight: 22 },
        { type: 'boss', symbol: '👑', name: 'Boss Galaga', color: '#ff0055', hp: 5, points: 100, speed: 0.11, weight: 12 },
        { type: 'powerup', symbol: '🌟', name: 'Dual Fighter Capsule', color: '#00ff88', hp: 1, points: 50, speed: 0.18, weight: 9, isPowerUp: true },
        { type: 'friendly', symbol: '👨‍🚀', name: 'Friendly Astronaut', color: '#38ef7d', hp: 1, points: -30, speed: 0.13, weight: 16, isFriendly: true },
        { type: 'mine', symbol: '💣', name: 'Space Mine', color: '#ff0844', hp: 1, points: -20, speed: 0.15, weight: 14, isMine: true }
    ];

    // PopCat Battle Game Variables (Host Side)
    let popcatCountdownInterval = null;
    let popcatTimerInterval = null;
    let popcatAnimId = null;
    let popcatLastStandingsBroadcast = 0;
    let popcatStagesState = [
        { popScale: 1.0, floatingTexts: [], particles: [] },
        { popScale: 1.0, floatingTexts: [], particles: [] },
        { popScale: 1.0, floatingTexts: [], particles: [] }
    ];

    // โหลดรูปภาพ PopCat ฝั่งโฮสต์เพื่อวาดลง Canvas ถ่ายทอดสด
    const popcatHostImages = {
        normal: new Image(),
        open1: new Image(),
        open2: new Image(),
        loaded: false
    };
    popcatHostImages.normal.src = 'cat_normal.png';
    popcatHostImages.open1.src = 'cat_open1.png';
    popcatHostImages.open2.src = 'cat_open2.png';
    let popcatHostLoadedImgs = 0;
    const onHostCatImgLoad = () => {
        popcatHostLoadedImgs++;
        if (popcatHostLoadedImgs >= 3) popcatHostImages.loaded = true;
    };
    popcatHostImages.normal.onload = onHostCatImgLoad;
    popcatHostImages.open1.onload = onHostCatImgLoad;
    popcatHostImages.open2.onload = onHostCatImgLoad;

    // Fast Buzz Game Variables
    let buzzQueue = []; // Array of { peerId, nickname, delta }
    let firstBuzzTime = null;

    // Lucky Wheel Variables
    let wheelNames = [];
    let wheelRotation = 0;
    let wheelSpeed = 0;
    let isWheelSpinning = false;
    let wheelWinnerId = null;
    let wheelAnimationFrame = null;

    // Rocket Racing Canvas variables
    let animationFrameId = null;
    let stars = [];
    let particles = [];
    let screenShakeIntensity = 0;
    let gameCountdownInterval = null;
    let gameTimerInterval = null;
    let gameSyncInterval = null;

    // === 3. INITIALIZATION ===
    initHost();

    // === 4. EVENT LISTENERS ===
    btnStartGame.addEventListener('click', startGame);
    btnCopyLink.addEventListener('click', copyInviteLink);
    btnRestartGame.addEventListener('click', restartGameSuite);
    btnQuit.addEventListener('click', quitLobby);

    // Setup Game Mode selection listeners
    gameSelectCards.forEach(card => {
        card.addEventListener('click', () => {
            if (gameActive) return;
            gameSelectCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            activeGameMode = card.getAttribute('data-game');
            broadcastState({
                type: 'CHANGE_GAME',
                game: activeGameMode
            });
        });
    });

    // Buzz Events
    btnBuzzReset.addEventListener('click', resetBuzzGame);
    btnBuzzScorePlus.addEventListener('click', () => adjustBuzzWinnerScore(1));
    btnBuzzScoreMinus.addEventListener('click', () => adjustBuzzWinnerScore(-1));

    // Wheel Events
    btnWheelSpin.addEventListener('click', spinLuckyWheel);
    btnWheelWinnerClose.addEventListener('click', () => {
        wheelWinnerModal.classList.remove('active');
        broadcastState({ type: 'WHEEL_CLOSE_MODAL' });
    });

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('beforeunload', () => {
        if (peer) peer.destroy();
    });

    // Back to Lobby / Control Panel Events
    document.querySelectorAll('.btn-back-to-lobby').forEach(btn => {
        btn.addEventListener('click', backToLobby);
    });
    
    const btnResultBackLobby = document.getElementById('btn-result-back-lobby');
    if (btnResultBackLobby) {
        btnResultBackLobby.addEventListener('click', backToLobby);
    }

    // === 5. UTILITY FUNCTIONS ===
    function showScreen(screenKey) {
        Object.keys(screens).forEach(key => {
            if (key === screenKey) {
                screens[key].classList.add('active');
            } else {
                screens[key].classList.remove('active');
            }
        });
        
        if (screenKey === 'rocket') {
            setTimeout(() => {
                resizeCanvas();
                startGraphicsLoop();
            }, 100);
        } else {
            stopGraphicsLoop();
        }

        if (screenKey === 'wheel') {
            setTimeout(() => {
                resizeCanvas();
                drawWheel(0);
            }, 100);
        }

        if (screenKey === 'catch') {
            setTimeout(() => {
                resizeCanvas();
            }, 100);
        }
    }

    function copyInviteLink() {
        const currentPath = window.location.pathname;
        const basePath = currentPath.substring(0, currentPath.lastIndexOf('/')) + '/index.html';
        const inviteUrl = `${window.location.origin}${basePath}?room=${STATIC_ROOM_CODE}`;
        navigator.clipboard.writeText(inviteUrl).then(() => {
            alert('คัดลอกลิงก์คำเชิญเรียบร้อยแล้ว!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }

    function updateLobbyUI() {
        textRoomId.textContent = STATIC_ROOM_CODE;
        listPlayers.innerHTML = '';
        
        const playerIds = Object.keys(players);
        playerCountLabel.textContent = playerIds.length;

        playerIds.forEach(id => {
            const player = players[id];
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="player-item-name">
                    <span>👤</span>
                    <span>${escapeHTML(player.nickname)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="ready-badge">${player.score || 0} pts</span>
                    <button class="btn-kick-player" data-id="${id}" style="background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 0.85rem; font-weight: bold; padding: 2px 4px;" title="เตะผู้เล่นคนนี้ออก">❌</button>
                </div>
            `;
            listPlayers.appendChild(li);
        });

        // ผูก Listener สำหรับปุ่มเตะคนออก
        document.querySelectorAll('.btn-kick-player').forEach(btn => {
            btn.addEventListener('click', () => {
                const playerId = btn.getAttribute('data-id');
                kickPlayer(playerId);
            });
        });
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    function generateQRCode() {
        const container = document.getElementById('qrcode');
        container.innerHTML = '';
        const currentPath = window.location.pathname;
        const basePath = currentPath.substring(0, currentPath.lastIndexOf('/')) + '/index.html';
        const inviteUrl = `${window.location.origin}${basePath}?room=${STATIC_ROOM_CODE}`;
        new QRCode(container, {
            text: inviteUrl,
            width: 130,
            height: 130,
            colorDark: "#050814",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
    }

    function kickPlayer(playerId) {
        const player = players[playerId];
        if (!player) return;

        if (confirm(`คุณต้องการเตะผู้เล่น "${player.nickname}" ออกจากห้องใช่หรือไม่?`)) {
            const conn = connections.find(c => c.peer === playerId);
            if (conn) {
                conn.send({
                    type: 'KICK',
                    message: 'คุณถูกเตะออกจากห้องโดยแอดมิน'
                });
                setTimeout(() => {
                    conn.close();
                }, 500);
            }

            delete players[playerId];
            connections = connections.filter(c => c.peer !== playerId);

            broadcastState({ type: 'SYNC', players: players });
            updateLobbyUI();
        }
    }

    function backToLobby() {
        if (confirm('คุณต้องการยกเลิกการแข่งขันปัจจุบันและกลับสู่ศูนย์ควบคุมหลักหรือไม่?')) {
            gameActive = false;
            
            // ล้างการทำงานย่อย
            clearInterval(gameCountdownInterval);
            clearInterval(gameTimerInterval);
            clearInterval(gameSyncInterval);
            clearInterval(catchCountdownInterval);
            clearInterval(catchTimerInterval);
            if (catchAnimId) cancelAnimationFrame(catchAnimId);
            clearInterval(galagaCountdownInterval);
            clearInterval(galagaTimerInterval);
            if (galagaAnimId) cancelAnimationFrame(galagaAnimId);
            clearInterval(popcatCountdownInterval);
            clearInterval(popcatTimerInterval);
            if (popcatAnimId) cancelAnimationFrame(popcatAnimId);
            if (wheelAnimationFrame) cancelAnimationFrame(wheelAnimationFrame);
            stopGraphicsLoop();

            // ส่งข้อมูล Broadcast ไปแจ้งผู้เล่นทุกคน
            broadcastState({
                type: 'CHANGE_GAME',
                game: 'lobby'
            });

            // กลับหน้าล็อบบี้
            showScreen('lobby');
            updateLobbyUI();
        }
    }

    // Adjust canvas size
    function resizeCanvas() {
        if (activeGameMode === 'rocket') {
            const rect = rocketCanvas.getBoundingClientRect();
            rocketCanvas.width = rect.width * (window.devicePixelRatio || 1);
            rocketCanvas.height = rect.height * (window.devicePixelRatio || 1);
            rocketCtx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
            initStars();
        } else if (activeGameMode === 'catch') {
            stageCanvases.forEach((canvas, idx) => {
                if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    const dpr = window.devicePixelRatio || 1;
                    canvas.width = rect.width * dpr;
                    canvas.height = rect.height * dpr;
                    const ctx = stageContexts[idx];
                    if (ctx) ctx.scale(dpr, dpr);
                }
            });
        } else if (activeGameMode === 'galaga') {
            galagaStageCanvases.forEach((canvas, idx) => {
                if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    const dpr = window.devicePixelRatio || 1;
                    canvas.width = rect.width * dpr;
                    canvas.height = rect.height * dpr;
                    const ctx = galagaStageContexts[idx];
                    if (ctx) ctx.scale(dpr, dpr);
                }
            });
        } else if (activeGameMode === 'popcat') {
            popcatStageCanvases.forEach((canvas, idx) => {
                if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    const dpr = window.devicePixelRatio || 1;
                    canvas.width = rect.width * dpr;
                    canvas.height = rect.height * dpr;
                    const ctx = popcatStageContexts[idx];
                    if (ctx) ctx.scale(dpr, dpr);
                }
            });
        } else if (activeGameMode === 'wheel') {
            const rect = wheelCanvas.getBoundingClientRect();
            wheelCanvas.width = rect.width * (window.devicePixelRatio || 1);
            wheelCanvas.height = rect.height * (window.devicePixelRatio || 1);
            wheelCtx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        }
    }

    // === 6. NETWORK LOGIC (P2P SERVER) ===
    function initHost() {
        lobbyStatusText.textContent = 'กำลังเปิดห้อง...';
        // สร้าง QR Code ทันทีตั้งแต่เริ่มต้นหน้าเว็บ
        generateQRCode();

        try {
            peer = new Peer(myPeerId, PEER_CONFIG);
        } catch (e) {
            console.error('Failed to instantiate Peer:', e);
            peer = new Peer(myPeerId, { debug: 1 });
        }

        peer.on('open', (id) => {
            lobbyStatusText.textContent = 'ออนไลน์ (จอกลางหลัก)';
            updateLobbyUI();
            generateQRCode();
        });

        peer.on('error', (err) => {
            console.error('PeerJS Error:', err);
            lobbyStatusText.textContent = 'เชื่อมต่อล้มเหลว';
            if (err.type === 'id-taken') {
                alert('รหัสห้องนี้ถูกเปิดใช้งานอยู่แล้ว หรือเซสชันเดิมกำลังถูกรีเซ็ตในระบบ P2P กรุณารอสักครู่แล้วลองอีกครั้ง');
            } else {
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อ P2P: ' + err.message);
            }
        });

        peer.on('connection', (conn) => {
            conn.on('open', () => {
                connections.push(conn);
                conn.on('data', (data) => {
                    handleIncomingMessage(conn.peer, data);
                });
                
                // ส่งสถานะปัจจุบันของเกมไปให้ผู้เข้าร่วมที่จอยใหม่ทันที
                conn.send({
                    type: 'INIT_STATE',
                    game: activeGameMode,
                    gameActive: gameActive
                });
            });
            conn.on('close', () => { handlePlayerDisconnect(conn.peer); });
            conn.on('error', (err) => { handlePlayerDisconnect(conn.peer); });
        });
    }

    // Throttled Leaderboard Updates เพื่อป้องกัน DOM Layout Thrashing & Frame Drops เมื่อมีผู้เล่นจำนวนมาก
    const lastLeaderboardUpdateTimes = {
        rocket: 0,
        catch: 0,
        galaga: 0,
        popcat: 0
    };

    function requestThrottledLeaderboard(game) {
        const now = performance.now();
        if (now - (lastLeaderboardUpdateTimes[game] || 0) >= 200) { // จำกัดไม่เกิน 5 ครั้ง/วินาที (5 FPS สำหรับ DOM)
            lastLeaderboardUpdateTimes[game] = now;
            if (game === 'rocket') updateRocketLeaderboard();
            else if (game === 'catch') updateCatchLeaderboard();
            else if (game === 'galaga') updateGalagaLeaderboard();
            else if (game === 'popcat') updatePopcatLeaderboard();
        }
    }

    function handleIncomingMessage(senderPeerId, data) {
        if (data.type === 'JOIN') {
            // ถ้ารายชื่อเต็ม 120 คน
            if (Object.keys(players).length >= 120 && !players[senderPeerId]) {
                const conn = connections.find(c => c.peer === senderPeerId);
                if (conn) conn.send({ type: 'KICK', message: 'ห้องแข่งขันเต็ม 120 คนแล้วครับ' });
                return;
            }

            if (!players[senderPeerId]) {
                players[senderPeerId] = {
                    nickname: data.nickname,
                    progress: 0,
                    score: 0,
                    combo: 0,
                    basketX: 0.5,
                    currentBasketX: 0.5,
                    shipX: 0.5,
                    currentShipX: 0.5,
                    dualFighter: false,
                    catchItems: [],
                    galagaEnemies: [],
                    galagaLasers: [],
                    floatingTexts: [],
                    particles: [],
                    ready: true,
                    scores: { rocket: 0, catch: 0, galaga: 0, buzz: 0 }
                };
            }
            broadcastState({ type: 'SYNC', players: players });
            updateLobbyUI();
        } 
        else if (data.type === 'TAP') {
            if (!gameActive || activeGameMode !== 'rocket') return;
            if (players[senderPeerId]) {
                players[senderPeerId].progress = data.progress;
                createJetSparks(senderPeerId, 3);
                requestThrottledLeaderboard('rocket');
            }
        }
        else if (data.type === 'CATCH_UPDATE') {
            if (!gameActive || activeGameMode !== 'catch') return;
            const p = players[senderPeerId];
            if (p) {
                p.basketX = typeof data.basketX === 'number' ? data.basketX : (p.basketX || 0.5);
                if (typeof p.currentBasketX !== 'number') p.currentBasketX = p.basketX;
                p.score = typeof data.score === 'number' ? data.score : (p.score || 0);
                p.combo = typeof data.combo === 'number' ? data.combo : (p.combo || 0);

                if (Array.isArray(data.items)) {
                    p.catchItems = data.items.map(it => ({
                        x: it.x,
                        y: it.y,
                        speed: it.speed || 0.35,
                        rot: it.rot || 0,
                        rotSpeed: it.rotSpeed || 0,
                        symbol: it.symbol || '🪙',
                        color: it.color || '#ffcc00'
                    }));
                }

                if (Array.isArray(data.events) && data.events.length > 0) {
                    if (!p.floatingTexts) p.floatingTexts = [];
                    data.events.forEach(ev => {
                        const ex = typeof ev.x === 'number' ? ev.x : (p.basketX || 0.5);
                        const ey = typeof ev.y === 'number' ? ev.y : 0.80;
                        const ec = ev.color || '#00f0ff';
                        p.floatingTexts.push({
                            x: ex,
                            y: ey,
                            text: ev.text || '',
                            color: ec,
                            alpha: 1.0
                        });
                        spawnPlayerParticles(p, ex, 0.85, ec, 8);
                    });
                }
                requestThrottledLeaderboard('catch');
            }
        }
        else if (data.type === 'GALAGA_UPDATE') {
            if (!gameActive || activeGameMode !== 'galaga') return;
            const p = players[senderPeerId];
            if (p) {
                p.shipX = typeof data.shipX === 'number' ? data.shipX : (p.shipX || 0.5);
                if (typeof p.currentShipX !== 'number') p.currentShipX = p.shipX;
                p.score = typeof data.score === 'number' ? data.score : (p.score || 0);
                p.combo = typeof data.combo === 'number' ? data.combo : (p.combo || 0);
                p.dualFighter = !!data.dualFighter;

                if (Array.isArray(data.enemies)) {
                    p.galagaEnemies = data.enemies.map(e => ({
                        x: e.x,
                        y: e.y,
                        speed: e.speed || 0.2,
                        swoopOffset: e.swoopOffset || 0,
                        symbol: e.symbol || '👾',
                        color: e.color || '#00f0ff',
                        type: e.type || 'drone',
                        isFriendly: !!e.isFriendly,
                        isMine: !!e.isMine
                    }));
                }

                if (Array.isArray(data.lasers)) {
                    p.galagaLasers = data.lasers.map(l => ({
                        x: l.x,
                        y: l.y,
                        speed: l.speed || 1.3,
                        color: l.color || '#ff3366'
                    }));
                }

                if (Array.isArray(data.events) && data.events.length > 0) {
                    if (!p.floatingTexts) p.floatingTexts = [];
                    data.events.forEach(ev => {
                        const ex = typeof ev.x === 'number' ? ev.x : (p.shipX || 0.5);
                        const ey = typeof ev.y === 'number' ? ev.y : 0.70;
                        const ec = ev.color || '#00f0ff';
                        p.floatingTexts.push({
                            x: ex,
                            y: ey,
                            text: ev.text || '',
                            color: ec,
                            alpha: 1.0
                        });
                        spawnPlayerGalagaParticles(p, ex, ey, ec, 8);
                    });
                }
                requestThrottledLeaderboard('galaga');
            }
        }
        else if (data.type === 'POPCAT_POP') {
            if (!gameActive || activeGameMode !== 'popcat') return;
            const p = players[senderPeerId];
            if (p) {
                p.score = typeof data.score === 'number' ? data.score : (p.score || 0) + 1;
                p.pps = typeof data.pps === 'number' ? data.pps : (p.pps || 0);
                p.tier = typeof data.tier === 'number' ? data.tier : (p.score > 100 ? 2 : 1);
                p.isOpen = true;
                p.lastPopTime = Date.now();
                p.popScale = 0.88;

                if (!p.floatingTexts) p.floatingTexts = [];
                const signX = (Math.random() - 0.5) * 0.28;
                p.floatingTexts.push({
                    x: 0.5 + signX,
                    y: 0.50,
                    vx: signX * 0.35,
                    vy: -(0.55 + Math.random() * 0.3),
                    text: p.tier === 2 ? '+1 🔥' : '+1',
                    color: p.tier === 2 ? '#ff0077' : '#ffcc00',
                    alpha: 1.0,
                    size: p.tier === 2 ? 26 : 20,
                    created: Date.now()
                });
                if (p.floatingTexts.length > 25) p.floatingTexts.shift();

                requestThrottledLeaderboard('popcat');
            }
        }
        else if (data.type === 'POPCAT_RELEASE') {
            if (!gameActive || activeGameMode !== 'popcat') return;
            const p = players[senderPeerId];
            if (p) {
                p.isOpen = false;
                if (typeof data.score === 'number') p.score = data.score;
                if (typeof data.pps === 'number') p.pps = data.pps;
            }
        }
        else if (data.type === 'POPCAT_TELEMETRY') {
            if (!gameActive || activeGameMode !== 'popcat') return;
            const p = players[senderPeerId];
            if (p) {
                if (typeof data.score === 'number') p.score = data.score;
                if (typeof data.pps === 'number') p.pps = data.pps;
                if (typeof data.tier === 'number') p.tier = data.tier;
                p.isOpen = !!data.isOpen;
                requestThrottledLeaderboard('popcat');
            }
        }
        else if (data.type === 'BUZZ_PRESS') {
            if (!gameActive || activeGameMode !== 'buzz') return;
            if (!buzzQueue.some(b => b.peerId === senderPeerId)) {
                const now = Date.now();
                if (buzzQueue.length === 0) {
                    firstBuzzTime = now;
                    const delta = 0;
                    buzzQueue.push({ peerId: senderPeerId, nickname: players[senderPeerId].nickname, delta: delta });
                    handleFirstBuzz(senderPeerId);
                } else {
                    const delta = now - firstBuzzTime;
                    buzzQueue.push({ peerId: senderPeerId, nickname: players[senderPeerId].nickname, delta: delta });
                }
                updateBuzzQueueUI();
                
                // แจ้งอันดับผู้เล่นฝั่งมือถือ
                const conn = connections.find(c => c.peer === senderPeerId);
                if (conn) {
                    conn.send({
                        type: 'BUZZ_RANK',
                        rank: buzzQueue.length
                    });
                }
            }
        }
    }

    function handlePlayerDisconnect(peerId) {
        if (players[peerId]) {
            delete players[peerId];
            connections = connections.filter(c => c.peer !== peerId);
            broadcastState({ type: 'SYNC', players: players });
            updateLobbyUI();
        }
    }

    function broadcastState(data) {
        connections.forEach(conn => {
            if (conn.open) conn.send(data);
        });
    }

    // === 7. GENERAL GAME LAUNCH ROUTER ===
    function startGame() {
        if (Object.keys(players).length === 0) {
            alert('ต้องมีผู้เล่นเข้าร่วมอย่างน้อย 1 คนเพื่อเริ่มเกมครับเจ้านาย!');
            return;
        }

        gameActive = true;
        
        if (activeGameMode === 'rocket') {
            showScreen('rocket');
            startRocketCountdown();
        } else if (activeGameMode === 'catch') {
            showScreen('catch');
            startCatchCountdown();
        } else if (activeGameMode === 'galaga') {
            showScreen('galaga');
            startGalagaCountdown();
        } else if (activeGameMode === 'buzz') {
            showScreen('buzz');
            startBuzzGame();
        } else if (activeGameMode === 'popcat') {
            showScreen('popcat');
            startPopcatCountdown();
        } else if (activeGameMode === 'wheel') {
            showScreen('wheel');
            startWheelGame();
        }
    }

    // === 8. ROCKET RACING MODE GAME LOGIC ===
    function startRocketCountdown() {
        broadcastState({ type: 'START_COUNTDOWN' });
        rocketAnnouncement.textContent = 'นักบินสแตนด์บาย... กำลังเชื่อมต่อกระแสพลังงาน';
        
        // รีเซ็ตระยะทางผู้เล่นใหม่
        Object.keys(players).forEach(id => {
            players[id].progress = 0;
        });

        let count = 5;
        rocketCountdown.textContent = count;

        gameCountdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                rocketCountdown.textContent = count;
                rocketAnnouncement.textContent = `ระดมไอพ่นแกนพลังงาน... ${count}`;
            } else if (count === 0) {
                rocketCountdown.textContent = 'IGNITION!';
                rocketAnnouncement.textContent = 'บีบกำลังเร่งจรวดรัวมือได้! ⚡🚀';
                
                broadcastState({ type: 'START_GAME' });
                startRocketGamePlay();
            } else {
                clearInterval(gameCountdownInterval);
                rocketCountdown.textContent = '';
            }
        }, 1000);
    }

    function startRocketGamePlay() {
        gameTimer = 60; // 1 min (60 seconds)
        rocketCountdown.textContent = formatTime(gameTimer);

        gameTimerInterval = setInterval(() => {
            gameTimer--;
            if (gameTimer >= 0) {
                rocketCountdown.textContent = formatTime(gameTimer);
                broadcastState({
                    type: 'TIMER_TICK',
                    timeLeft: gameTimer
                });
                updateRocketLeaderboard();
            } else {
                clearInterval(gameTimerInterval);
                clearInterval(gameSyncInterval);
                endRocketGame();
            }
        }, 1000);

        // Sync Tick Rate (4Hz for 120 Players Optimization)
        gameSyncInterval = setInterval(() => {
            if (!gameActive || activeGameMode !== 'rocket') {
                clearInterval(gameSyncInterval);
                return;
            }
            broadcastState({
                type: 'UPDATE_PROGRESS',
                players: players
            });
        }, 250);
    }

    function updateRocketLeaderboard() {
        rocketLeaderboard.innerHTML = '';
        const sorted = Object.keys(players).map(id => {
            return { id, nickname: players[id].nickname, progress: players[id].progress };
        }).sort((a, b) => b.progress - a.progress);

        sorted.forEach((player, index) => {
            const li = document.createElement('li');
            const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
            if (rankClass) li.classList.add(rankClass);
            li.innerHTML = `
                <span>#${index + 1} ${escapeHTML(player.nickname)}</span>
                <span style="color: var(--accent); font-weight: bold;">${Math.round(player.progress)} เคาะ</span>
            `;
            rocketLeaderboard.appendChild(li);
        });
    }

    function endRocketGame() {
        gameActive = false;
        
        const sorted = Object.keys(players).map(id => {
            return { id, nickname: players[id].nickname, progress: players[id].progress };
        }).sort((a, b) => b.progress - a.progress);

        // แจกคะแนนรวม (ที่ 1 ได้ +15 คะแนน, ที่ 2 ได้ +12, ที่ 3 ได้ +10, ที่เหลือร่วมเล่นได้ +5)
        sorted.forEach((p, index) => {
            let pScore = 5;
            if (index === 0) pScore = 15;
            else if (index === 1) pScore = 12;
            else if (index === 2) pScore = 10;
            
            players[p.id].scores.rocket += pScore;
            players[p.id].score += pScore;
        });

        const winnerName = sorted.length > 0 ? sorted[0].nickname : 'ไม่มี';
        
        broadcastState({
            type: 'GAME_OVER',
            leaderboard: sorted,
            winnerName: winnerName
        });

        // จุดพลุฉลอง
        triggerConfetti();

        // ส่งข้อมูลไปหน้าสรุปผล
        showSuiteLeaderboard(winnerName);
    }

    // === 8.5 CATCH IT! (จับให้ไว ได้คะแนน) MODE GAME LOGIC ===
    function createMulberry32(seed) {
        let s = (seed || 12345678) >>> 0;
        return function() {
            s = (s + 0x6D2B79F5) >>> 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function startCatchCountdown() {
        catchSeed = Math.floor(Math.random() * 10000000) + 1;
        catchPrng = createMulberry32(catchSeed);
        catchItems = [];
        catchItemNextId = 1;
        catchSpawnTimer = 0;

        // Reset player catch values
        Object.keys(players).forEach(id => {
            players[id].basketX = 0.5;
            players[id].currentBasketX = 0.5;
            players[id].score = 0;
            players[id].combo = 0;
            players[id].catchItems = [];
            players[id].floatingTexts = [];
            players[id].particles = [];
            if (!players[id].scores) players[id].scores = {};
            players[id].scores.catch = 0;
        });

        catchStagesState = [
            { currentBasketX: 0.5, particles: [], floatingTexts: [], lastScore: 0 },
            { currentBasketX: 0.5, particles: [], floatingTexts: [], lastScore: 0 },
            { currentBasketX: 0.5, particles: [], floatingTexts: [], lastScore: 0 }
        ];

        resizeCanvas();
        updateCatchLeaderboard();

        catchAnnouncement.textContent = 'นักแข่งประจำที่... กำลังเชื่อมต่อกระดานแข่งขันสด';
        broadcastState({
            type: 'START_COUNTDOWN',
            game: 'catch',
            seed: catchSeed
        });

        let count = 3;
        catchTimer.textContent = `${count}s`;

        catchCountdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                catchTimer.textContent = `${count}s`;
                catchAnnouncement.textContent = `เตรียมตัวรับของรางวัล... ${count}`;
                playSynthBeep(440 + (3 - count) * 110, 0.1);
            } else if (count === 0) {
                catchTimer.textContent = 'GO!';
                catchAnnouncement.textContent = 'จับให้ไว! รับของใส่ตะกร้าโกยคะแนนเต็มที่! ⚡🎁';
                playSynthBeep(880, 0.3);

                broadcastState({
                    type: 'START_GAME',
                    game: 'catch',
                    seed: catchSeed,
                    duration: 60
                });
                startCatchGamePlay();
            } else {
                clearInterval(catchCountdownInterval);
            }
        }, 1000);
    }

    function startCatchGamePlay() {
        gameTimer = 60; // 1 minute (60s)
        catchTimer.textContent = `${gameTimer}s`;

        catchTimerInterval = setInterval(() => {
            gameTimer--;
            if (gameTimer >= 0) {
                catchTimer.textContent = `${gameTimer}s`;
                broadcastState({
                    type: 'TIMER_TICK',
                    game: 'catch',
                    timeLeft: gameTimer
                });
                updateCatchLeaderboard();
                broadcastCatchStandings();
            } else {
                clearInterval(catchTimerInterval);
                endCatchGame();
            }
        }, 1000);

        startCatchStagesLoop();
    }

    function broadcastCatchStandings() {
        const sorted = Object.keys(players).map(id => ({
            peerId: id,
            nickname: players[id].nickname,
            score: players[id].score || 0
        })).sort((a, b) => b.score - a.score);

        broadcastState({
            type: 'CATCH_STANDINGS',
            standings: sorted
        });
    }

    function updateCatchLeaderboard() {
        if (!catchLeaderboard) return;
        catchLeaderboard.innerHTML = '';
        const sorted = Object.keys(players).map(id => {
            return {
                id,
                nickname: players[id].nickname,
                score: players[id].score || 0,
                combo: players[id].combo || 0
            };
        }).sort((a, b) => b.score - a.score);

        sorted.forEach((player, index) => {
            const li = document.createElement('li');
            const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
            if (rankClass) li.classList.add(rankClass);
            
            const comboBadge = player.combo > 1 ? `<small style="color: var(--neon-gold); margin-left: 6px;">x${player.combo}</small>` : '';
            li.innerHTML = `
                <span>#${index + 1} ${escapeHTML(player.nickname)}${comboBadge}</span>
                <span style="color: var(--accent); font-weight: bold;">${player.score} pts</span>
            `;
            catchLeaderboard.appendChild(li);
        });
    }

    function spawnPlayerParticles(player, x, y, color, count = 8) {
        if (!player) return;
        if (!player.particles) player.particles = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.15 + Math.random() * 0.35;
            player.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.2,
                color: color,
                size: 3 + Math.random() * 4,
                alpha: 1.0
            });
        }
    }

    function startCatchStagesLoop() {
        let lastTime = performance.now();
        if (catchAnimId) cancelAnimationFrame(catchAnimId);

        function renderStagesLoop(timestamp) {
            if (!gameActive || activeGameMode !== 'catch') {
                catchAnimId = null;
                return;
            }

            const dt = Math.min(0.1, (timestamp - lastTime) / 1000);
            lastTime = timestamp;

            // Get Top 3 Players
            const sortedPlayers = Object.keys(players)
                .map(id => players[id])
                .sort((a, b) => (b.score || 0) - (a.score || 0));

            // Render each of the 3 stages
            for (let stageIdx = 0; stageIdx < 3; stageIdx++) {
                const player = sortedPlayers[stageIdx];
                const canvas = stageCanvases[stageIdx];
                const ctx = stageContexts[stageIdx];
                const stageState = catchStagesState[stageIdx];

                if (!canvas || !ctx) continue;

                const nameLabel = stageNames[stageIdx];
                const scoreLabel = stageScores[stageIdx];

                if (player) {
                    if (nameLabel) nameLabel.textContent = player.nickname || 'นักแข่ง';
                    if (scoreLabel) scoreLabel.textContent = `${player.score || 0} pts (x${player.combo || 0})`;

                    if (typeof player.currentBasketX !== 'number') {
                        player.currentBasketX = typeof player.basketX === 'number' ? player.basketX : 0.5;
                    } else {
                        const targetBasketX = typeof player.basketX === 'number' ? player.basketX : 0.5;
                        player.currentBasketX += (targetBasketX - player.currentBasketX) * 0.35;
                    }

                    // Advance player's real items at 60 FPS
                    if (player.catchItems && player.catchItems.length > 0) {
                        for (let i = player.catchItems.length - 1; i >= 0; i--) {
                            const item = player.catchItems[i];
                            item.y += (item.speed || 0.35) * dt;
                            item.rot += (item.rotSpeed || 0) * dt;
                            if (item.y > 1.1) {
                                player.catchItems.splice(i, 1);
                            }
                        }
                    }

                    // Update player's floating texts
                    if (player.floatingTexts && player.floatingTexts.length > 0) {
                        for (let j = player.floatingTexts.length - 1; j >= 0; j--) {
                            const ft = player.floatingTexts[j];
                            ft.y -= 0.12 * dt;
                            ft.alpha -= 1.2 * dt;
                            if (ft.alpha <= 0) player.floatingTexts.splice(j, 1);
                        }
                    }

                    // Update player's particles
                    if (player.particles && player.particles.length > 0) {
                        for (let j = player.particles.length - 1; j >= 0; j--) {
                            const p = player.particles[j];
                            p.x += p.vx * dt;
                            p.y += p.vy * dt;
                            p.alpha -= 1.5 * dt;
                            if (p.alpha <= 0) player.particles.splice(j, 1);
                        }
                    }
                } else {
                    if (nameLabel) nameLabel.textContent = 'รอผู้แข่งขัน...';
                    if (scoreLabel) scoreLabel.textContent = '0 pts';
                }

                drawCatchStageCanvas(ctx, canvas, stageIdx, player, stageState);
            }

            catchAnimId = requestAnimationFrame(renderStagesLoop);
        }

        catchAnimId = requestAnimationFrame(renderStagesLoop);
    }

    function drawCatchStageCanvas(ctx, canvas, stageIdx, player, stageState) {
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        if (w <= 0 || h <= 0) return;

        ctx.save();

        let rankColor = '#ffd700'; // Gold (#1)
        let rankBorder = 'rgba(255, 215, 0, 0.4)';
        if (stageIdx === 1) {
            rankColor = '#c0c0c0'; // Silver (#2)
            rankBorder = 'rgba(192, 192, 192, 0.4)';
        } else if (stageIdx === 2) {
            rankColor = '#cd7f32'; // Bronze (#3)
            rankBorder = 'rgba(205, 127, 50, 0.4)';
        }

        // 1. Stage Background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#070b18');
        bgGrad.addColorStop(1, '#020308');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Grid pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < w; gx += 28) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, h);
            ctx.stroke();
        }

        // Border glow
        ctx.strokeStyle = rankBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, w, h);

        if (player) {
            // 2. Real Falling Items from player
            const items = player.catchItems || [];
            items.forEach(item => {
                const ix = item.x * w;
                const iy = item.y * h;
                const itemSize = Math.max(22, w * 0.075);

                ctx.save();
                ctx.translate(ix, iy);
                ctx.rotate(item.rot || 0);

                ctx.shadowColor = item.color || '#ffcc00';
                ctx.shadowBlur = 10;

                ctx.font = `${Math.round(itemSize)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(item.symbol || '🪙', 0, 0);

                ctx.restore();
            });

            // 3. Basket for this player
            const currentX = typeof player.currentBasketX === 'number' ? player.currentBasketX : 0.5;
            const bx = currentX * w;
            const by = 0.85 * h;
            const bw = w * 0.24;
            const bh = Math.max(14, h * 0.045);

            ctx.save();
            ctx.shadowColor = rankColor;
            ctx.shadowBlur = 14;

            const basketGrad = ctx.createLinearGradient(bx - bw/2, by, bx + bw/2, by + bh);
            basketGrad.addColorStop(0, rankColor);
            basketGrad.addColorStop(1, '#4a00e0');

            ctx.fillStyle = basketGrad;
            ctx.beginPath();
            ctx.roundRect(bx - bw/2, by, bw, bh, [5, 5, 10, 10]);
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Player Name Tag on basket
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(player.nickname || '', bx, by - 5);
            ctx.restore();

            // 4. Floating texts
            const floatingTexts = player.floatingTexts || [];
            floatingTexts.forEach(ft => {
                ctx.save();
                ctx.globalAlpha = Math.max(0, ft.alpha);
                ctx.fillStyle = ft.color;
                ctx.shadowColor = ft.color;
                ctx.shadowBlur = 8;
                ctx.font = 'bold 14px Chakra Petch, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x * w, ft.y * h);
                ctx.restore();
            });

            // 5. Particles
            const particles = player.particles || [];
            particles.forEach(p => {
                ctx.save();
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(p.x * w, p.y * h, p.size || 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        } else {
            // Empty Stage watermark
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.font = 'bold 13px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ รอผู้เข้าแข่งขัน ⚡', w / 2, h / 2);
            ctx.restore();
        }

        ctx.restore();
    }

    function endCatchGame() {
        gameActive = false;
        clearInterval(catchTimerInterval);
        clearInterval(catchCountdownInterval);
        if (catchAnimId) {
            cancelAnimationFrame(catchAnimId);
            catchAnimId = null;
        }

        const sorted = Object.keys(players).map(id => {
            return { id, nickname: players[id].nickname, score: players[id].score || 0 };
        }).sort((a, b) => b.score - a.score);

        sorted.forEach((p, index) => {
            let pScore = 5;
            if (index === 0) pScore = 15;
            else if (index === 1) pScore = 12;
            else if (index === 2) pScore = 10;
            
            if (!players[p.id].scores) players[p.id].scores = {};
            players[p.id].scores.catch = p.score;
            players[p.id].score = (players[p.id].score || 0) + pScore;
        });

        const winnerName = sorted.length > 0 ? sorted[0].nickname : 'ไม่มี';

        broadcastState({
            type: 'GAME_OVER',
            game: 'catch',
            leaderboard: sorted,
            winnerName: winnerName
        });

        triggerConfetti();
        playSynthBeep(523.25, 0.15);
        setTimeout(() => playSynthBeep(659.25, 0.15), 150);
        setTimeout(() => playSynthBeep(783.99, 0.35), 300);

        setTimeout(() => {
            showSuiteLeaderboard(winnerName);
        }, 2500);
    }

    // === 8.7 GALAGA '88 (สงครามอวกาศล่าแต้ม) MODE GAME LOGIC ===
    function startGalagaCountdown() {
        galagaSeed = Math.floor(Math.random() * 10000000) + 1;
        galagaPrng = createMulberry32(galagaSeed);
        galagaEnemies = [];
        galagaNextEnemyId = 1;
        galagaSpawnTimer = 0;

        // Reset player values
        Object.keys(players).forEach(id => {
            players[id].shipX = 0.5;
            players[id].currentShipX = 0.5;
            players[id].score = 0;
            players[id].combo = 0;
            players[id].dualFighter = false;
            players[id].galagaEnemies = [];
            players[id].galagaLasers = [];
            players[id].floatingTexts = [];
            players[id].particles = [];
            if (!players[id].scores) players[id].scores = {};
            players[id].scores.galaga = 0;
        });

        galagaStagesState = [
            { currentShipX: 0.5, dualFighter: false, particles: [], floatingTexts: [], lasers: [], lastScore: 0, laserCooldown: 0, stars: [] },
            { currentShipX: 0.5, dualFighter: false, particles: [], floatingTexts: [], lasers: [], lastScore: 0, laserCooldown: 0, stars: [] },
            { currentShipX: 0.5, dualFighter: false, particles: [], floatingTexts: [], lasers: [], lastScore: 0, laserCooldown: 0, stars: [] }
        ];

        resizeCanvas();
        updateGalagaLeaderboard();

        galagaStageCanvases.forEach((canvas, idx) => {
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                const stars = [];
                for (let i = 0; i < 30; i++) {
                    stars.push({
                        x: Math.random() * rect.width,
                        y: Math.random() * rect.height,
                        size: Math.random() * 2 + 1,
                        speed: 35 + Math.random() * 70,
                        color: Math.random() > 0.5 ? '#00f0ff' : '#ffffff',
                        alpha: Math.random() * 0.7 + 0.3
                    });
                }
                galagaStagesState[idx].stars = stars;
            }
        });

        galagaAnnouncement.textContent = 'นักบินสแตนด์บาย... กำลังเชื่อมต่อกระดานสงครามอวกาศ';
        broadcastState({
            type: 'START_COUNTDOWN',
            game: 'galaga',
            seed: galagaSeed
        });

        let count = 3;
        galagaTimer.textContent = `${count}s`;

        galagaCountdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                galagaTimer.textContent = `${count}s`;
                galagaAnnouncement.textContent = `เตรียมตัวปล่อยยานรบ... ${count}`;
                playSynthBeep(440 + (3 - count) * 110, 0.1);
            } else if (count === 0) {
                galagaTimer.textContent = 'LAUNCH!';
                galagaAnnouncement.textContent = 'ยิงถล่มเอเลี่ยนล่าแต้มเต็มกำลัง! ⚡👾🛸';
                playSynthBeep(880, 0.3);

                broadcastState({
                    type: 'START_GAME',
                    game: 'galaga',
                    seed: galagaSeed,
                    duration: 60
                });
                startGalagaGamePlay();
            } else {
                clearInterval(galagaCountdownInterval);
            }
        }, 1000);
    }

    function startGalagaGamePlay() {
        gameTimer = 60;
        galagaTimer.textContent = `${gameTimer}s`;

        galagaTimerInterval = setInterval(() => {
            gameTimer--;
            if (gameTimer >= 0) {
                galagaTimer.textContent = `${gameTimer}s`;
                broadcastState({
                    type: 'TIMER_TICK',
                    game: 'galaga',
                    timeLeft: gameTimer
                });
                updateGalagaLeaderboard();
                broadcastGalagaStandings();
            } else {
                clearInterval(galagaTimerInterval);
                endGalagaGame();
            }
        }, 1000);

        startGalagaStagesLoop();
    }

    function broadcastGalagaStandings() {
        const sorted = Object.keys(players).map(id => ({
            peerId: id,
            nickname: players[id].nickname,
            score: players[id].score || 0
        })).sort((a, b) => b.score - a.score);

        broadcastState({
            type: 'GALAGA_STANDINGS',
            standings: sorted
        });
    }

    function updateGalagaLeaderboard() {
        if (!galagaLeaderboard) return;
        galagaLeaderboard.innerHTML = '';
        const sorted = Object.keys(players).map(id => {
            return {
                id,
                nickname: players[id].nickname,
                score: players[id].score || 0,
                combo: players[id].combo || 0,
                dualFighter: !!players[id].dualFighter
            };
        }).sort((a, b) => b.score - a.score);

        sorted.forEach((player, index) => {
            const li = document.createElement('li');
            const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
            if (rankClass) li.classList.add(rankClass);

            const dualBadge = player.dualFighter ? `<span style="color: #00ff88; font-size: 0.7rem; margin-left: 4px;">[DUAL]</span>` : '';
            const comboBadge = player.combo > 1 ? `<small style="color: var(--neon-gold); margin-left: 4px;">x${player.combo}</small>` : '';

            li.innerHTML = `
                <span>#${index + 1} ${escapeHTML(player.nickname)}${dualBadge}${comboBadge}</span>
                <span style="color: var(--accent); font-weight: bold;">${player.score} pts</span>
            `;
            galagaLeaderboard.appendChild(li);
        });
    }

    function spawnPlayerGalagaParticles(player, x, y, color, count = 8) {
        if (!player) return;
        if (!player.particles) player.particles = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.18 + Math.random() * 0.4;
            player.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: 2.5 + Math.random() * 3.5,
                alpha: 1.0
            });
        }
    }

    function startGalagaStagesLoop() {
        let lastTime = performance.now();
        if (galagaAnimId) cancelAnimationFrame(galagaAnimId);

        function renderStagesLoop(timestamp) {
            if (!gameActive || activeGameMode !== 'galaga') {
                galagaAnimId = null;
                return;
            }

            const dt = Math.min(0.1, (timestamp - lastTime) / 1000);
            lastTime = timestamp;

            const sortedPlayers = Object.keys(players)
                .map(id => players[id])
                .sort((a, b) => (b.score || 0) - (a.score || 0));

            for (let stageIdx = 0; stageIdx < 3; stageIdx++) {
                const player = sortedPlayers[stageIdx];
                const canvas = galagaStageCanvases[stageIdx];
                const ctx = galagaStageContexts[stageIdx];
                const stageState = galagaStagesState[stageIdx];

                if (!canvas || !ctx) continue;

                const nameLabel = galagaStageNames[stageIdx];
                const scoreLabel = galagaStageScores[stageIdx];

                if (player) {
                    if (nameLabel) nameLabel.textContent = player.nickname || 'นักบิน';
                    const dualTag = player.dualFighter ? ' [DUAL]' : '';
                    if (scoreLabel) scoreLabel.textContent = `${player.score || 0} pts (x${player.combo || 0})${dualTag}`;

                    if (typeof player.currentShipX !== 'number') {
                        player.currentShipX = typeof player.shipX === 'number' ? player.shipX : 0.5;
                    } else {
                        const targetShipX = typeof player.shipX === 'number' ? player.shipX : 0.5;
                        player.currentShipX += (targetShipX - player.currentShipX) * 0.38;
                    }

                    // Advance player's real enemies at 60 FPS
                    if (player.galagaEnemies && player.galagaEnemies.length > 0) {
                        for (let i = player.galagaEnemies.length - 1; i >= 0; i--) {
                            const enemy = player.galagaEnemies[i];
                            enemy.y += (enemy.speed || 0.2) * dt;
                            enemy.x += Math.sin(enemy.y * 7 + (enemy.swoopOffset || 0)) * 0.15 * dt;
                            enemy.x = Math.max(0.08, Math.min(0.92, enemy.x));

                            if (enemy.y > 1.1) {
                                player.galagaEnemies.splice(i, 1);
                            }
                        }
                    }

                    // Advance player's real lasers at 60 FPS
                    if (player.galagaLasers && player.galagaLasers.length > 0) {
                        for (let j = player.galagaLasers.length - 1; j >= 0; j--) {
                            const l = player.galagaLasers[j];
                            l.y -= (l.speed || 1.3) * dt;
                            if (l.y < -0.05) player.galagaLasers.splice(j, 1);
                        }
                    }

                    // Update player's floating texts
                    if (player.floatingTexts && player.floatingTexts.length > 0) {
                        for (let j = player.floatingTexts.length - 1; j >= 0; j--) {
                            const ft = player.floatingTexts[j];
                            ft.y -= 0.12 * dt;
                            ft.alpha -= 1.2 * dt;
                            if (ft.alpha <= 0) player.floatingTexts.splice(j, 1);
                        }
                    }

                    // Update player's particles
                    if (player.particles && player.particles.length > 0) {
                        for (let j = player.particles.length - 1; j >= 0; j--) {
                            const p = player.particles[j];
                            p.x += p.vx * dt;
                            p.y += p.vy * dt;
                            p.alpha -= 1.6 * dt;
                            if (p.alpha <= 0) player.particles.splice(j, 1);
                        }
                    }
                } else {
                    if (nameLabel) nameLabel.textContent = 'รอนักบิน...';
                    if (scoreLabel) scoreLabel.textContent = '0 pts';
                }

                drawGalagaStageCanvas(ctx, canvas, stageIdx, player, stageState, dt);
            }

            galagaAnimId = requestAnimationFrame(renderStagesLoop);
        }

        galagaAnimId = requestAnimationFrame(renderStagesLoop);
    }

    function drawGalagaStageCanvas(ctx, canvas, stageIdx, player, stageState, dt) {
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        if (w <= 0 || h <= 0) return;

        ctx.save();

        let rankColor = '#ffd700'; // Gold (#1)
        let rankBorder = 'rgba(255, 215, 0, 0.4)';
        if (stageIdx === 1) {
            rankColor = '#c0c0c0'; // Silver (#2)
            rankBorder = 'rgba(192, 192, 192, 0.4)';
        } else if (stageIdx === 2) {
            rankColor = '#cd7f32'; // Bronze (#3)
            rankBorder = 'rgba(205, 127, 50, 0.4)';
        }

        ctx.fillStyle = '#02030a';
        ctx.fillRect(0, 0, w, h);

        if (stageState.stars) {
            stageState.stars.forEach(s => {
                s.y += s.speed * dt;
                if (s.y > h) {
                    s.y = 0;
                    s.x = Math.random() * w;
                }
                ctx.save();
                ctx.globalAlpha = s.alpha;
                ctx.fillStyle = s.color;
                ctx.fillRect(s.x, s.y, s.size, s.size);
                ctx.restore();
            });
        }

        ctx.strokeStyle = rankBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, w, h);

        if (player) {
            // Real enemies from player
            const enemies = player.galagaEnemies || [];
            enemies.forEach(e => {
                const ex = e.x * w;
                const ey = e.y * h;
                const eSize = e.type === 'boss' ? 28 : 22;

                ctx.save();
                ctx.translate(ex, ey);
                ctx.shadowColor = e.color || '#00f0ff';
                ctx.shadowBlur = 10;
                ctx.font = `${eSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(e.symbol || '👾', 0, 0);

                if (e.isFriendly) {
                    ctx.save();
                    ctx.strokeStyle = 'rgba(56, 239, 125, 0.7)';
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.arc(0, 0, 14, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                } else if (e.isMine) {
                    ctx.save();
                    ctx.strokeStyle = 'rgba(255, 8, 68, 0.75)';
                    ctx.lineWidth = 1.2;
                    ctx.setLineDash([2, 2]);
                    ctx.beginPath();
                    ctx.arc(0, 0, 14, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }

                ctx.restore();
            });

            // Real lasers fired by player
            const lasers = player.galagaLasers || [];
            lasers.forEach(laser => {
                const lx = laser.x * w;
                const ly = laser.y * h;
                ctx.save();
                ctx.shadowColor = laser.color || '#ff3366';
                ctx.shadowBlur = 8;
                ctx.fillStyle = laser.color || '#ff3366';
                ctx.fillRect(lx - 2, ly - 8, 4, 16);
                ctx.restore();
            });

            // Player Ship
            const currentX = typeof player.currentShipX === 'number' ? player.currentShipX : 0.5;
            const sx = currentX * w;
            const sy = 0.84 * h;

            ctx.save();
            ctx.translate(sx, sy);

            const flameH = 10 + Math.random() * 6;
            ctx.fillStyle = '#00f0ff';
            ctx.beginPath();
            ctx.moveTo(-5, 8);
            ctx.lineTo(5, 8);
            ctx.lineTo(0, 8 + flameH);
            ctx.closePath();
            ctx.fill();

            if (player.dualFighter) {
                drawHostStarfighterUnit(ctx, -10, 0, rankColor);
                drawHostStarfighterUnit(ctx, 10, 0, rankColor);
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-8, 0);
                ctx.lineTo(8, 0);
                ctx.stroke();
            } else {
                drawHostStarfighterUnit(ctx, 0, 0, rankColor);
            }

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(player.nickname || '', 0, -18);

            ctx.restore();

            // Floating texts
            const floatingTexts = player.floatingTexts || [];
            floatingTexts.forEach(ft => {
                ctx.save();
                ctx.globalAlpha = Math.max(0, ft.alpha);
                ctx.fillStyle = ft.color;
                ctx.shadowColor = ft.color;
                ctx.shadowBlur = 8;
                ctx.font = 'bold 13px Chakra Petch, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x * w, ft.y * h);
                ctx.restore();
            });

            // Particles
            const particles = player.particles || [];
            particles.forEach(p => {
                ctx.save();
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(p.x * w, p.y * h, p.size || 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        } else {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.font = 'bold 13px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ รอนักบินอวกาศ ⚡', w / 2, h / 2);
            ctx.restore();
        }

        ctx.restore();
    }

    function drawHostStarfighterUnit(ctx, ox, oy, themeColor) {
        ctx.save();
        ctx.translate(ox, oy);

        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 10;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(10, 8);
        ctx.lineTo(5, 5);
        ctx.lineTo(-5, 5);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = themeColor;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(3, 2);
        ctx.lineTo(-3, 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    function endGalagaGame() {
        gameActive = false;
        clearInterval(galagaTimerInterval);
        clearInterval(galagaCountdownInterval);
        if (galagaAnimId) {
            cancelAnimationFrame(galagaAnimId);
            galagaAnimId = null;
        }

        const sorted = Object.keys(players).map(id => {
            return { id, nickname: players[id].nickname, score: players[id].score || 0 };
        }).sort((a, b) => b.score - a.score);

        sorted.forEach((p, index) => {
            let pScore = 5;
            if (index === 0) pScore = 15;
            else if (index === 1) pScore = 12;
            else if (index === 2) pScore = 10;
            
            if (!players[p.id].scores) players[p.id].scores = {};
            players[p.id].scores.galaga = p.score;
            players[p.id].score = (players[p.id].score || 0) + pScore;
        });

        const winnerName = sorted.length > 0 ? sorted[0].nickname : 'ไม่มี';

        broadcastState({
            type: 'GAME_OVER',
            game: 'galaga',
            leaderboard: sorted,
            winnerName: winnerName
        });

        triggerConfetti();
        playSynthBeep(523.25, 0.15);
        setTimeout(() => playSynthBeep(659.25, 0.15), 150);
        setTimeout(() => playSynthBeep(783.99, 0.35), 300);

        setTimeout(() => {
            showSuiteLeaderboard(winnerName);
        }, 2500);
    }

    // === 8.8 POPCAT BATTLE MODE GAME LOGIC (Host Spectator Top 3 Live Engine) ===
    function startPopcatCountdown() {
        broadcastState({
            type: 'START_COUNTDOWN',
            countdown: 5,
            duration: 60
        });

        popcatAnnouncement.textContent = 'เตรียมรัวนิ้วเคาะแมว PopCat ใน 1 นาที! เริ่มใน... 5 🐱💥';

        // รีเซ็ตข้อมูลเฉพาะของเกม PopCat สำหรับผู้เล่นทุกคน
        Object.keys(players).forEach(id => {
            players[id].score = 0;
            players[id].pps = 0;
            players[id].tier = 1;
            players[id].isOpen = false;
            players[id].popScale = 1.0;
            players[id].floatingTexts = [];
            if (!players[id].scores) players[id].scores = {};
            players[id].scores.popcat = 0;
        });

        popcatStagesState = [
            { popScale: 1.0, floatingTexts: [], particles: [] },
            { popScale: 1.0, floatingTexts: [], particles: [] },
            { popScale: 1.0, floatingTexts: [], particles: [] }
        ];

        resizeCanvas();
        updatePopcatLeaderboard();

        let count = 5;
        if (popcatTimer) popcatTimer.textContent = `${count}s`;
        playSynthBeep(440, 0.1);

        popcatCountdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                if (popcatTimer) popcatTimer.textContent = `${count}s`;
                popcatAnnouncement.textContent = `เตรียมรัวนิ้วเคาะแมว PopCat ใน 1 นาที! เริ่มใน... ${count} 🐱💥`;
                playSynthBeep(440 + (5 - count) * 80, 0.1);
            } else {
                clearInterval(popcatCountdownInterval);
                if (popcatTimer) popcatTimer.textContent = 'GO!';
                playSynthBeep(880, 0.3);
                startPopcatGamePlay();
            }
        }, 1000);
    }

    function startPopcatGamePlay() {
        gameActive = true;
        gameTimer = 60;

        popcatAnnouncement.textContent = '🔥 เริ่มได้! รัวเคาะแมวให้ไวที่สุด! (คลิกเกิน 100 เปลี่ยนร่าง!)';
        if (popcatTimer) popcatTimer.textContent = `${gameTimer}s`;

        broadcastState({
            type: 'START_GAME',
            duration: 60
        });

        // Loop นับเวลาถอยหลัง 60 วินาที
        popcatTimerInterval = setInterval(() => {
            gameTimer--;
            if (popcatTimer) popcatTimer.textContent = `${gameTimer}s`;

            broadcastState({
                type: 'TIMER_TICK',
                timeLeft: gameTimer
            });

            if (gameTimer <= 0) {
                endPopcatGame();
            }
        }, 1000);

        // เริ่มต้นการเรนเดอร์ถ่ายทอดสด 3 อันดับแรกแบบ 60 FPS
        startPopcatStagesLoop();
    }

    function startPopcatStagesLoop() {
        let lastTime = performance.now();
        if (popcatAnimId) cancelAnimationFrame(popcatAnimId);

        function renderPopcatStages(timestamp) {
            if (!gameActive || activeGameMode !== 'popcat') {
                popcatAnimId = null;
                return;
            }

            const dt = Math.min(0.1, (timestamp - lastTime) / 1000);
            lastTime = timestamp;

            // คัดเลือก 3 อันดับแรกตามจำนวนครั้งที่เคาะ (Score)
            const sortedPlayers = Object.keys(players)
                .map(id => players[id])
                .sort((a, b) => (b.score || 0) - (a.score || 0));

            // แสดงสดบน 3 เวที Top 3
            for (let stageIdx = 0; stageIdx < 3; stageIdx++) {
                const player = sortedPlayers[stageIdx];
                const canvas = popcatStageCanvases[stageIdx];
                const ctx = popcatStageContexts[stageIdx];
                const nameLabel = popcatStageNames[stageIdx];
                const scoreLabel = popcatStageScores[stageIdx];

                if (!canvas || !ctx) continue;

                if (player) {
                    if (nameLabel) nameLabel.textContent = player.nickname || 'นักเคาะ';
                    if (scoreLabel) {
                        const pps = player.pps || 0;
                        const ppsColor = pps > 7 ? 'var(--neon-pink)' : 'var(--neon-gold)';
                        scoreLabel.innerHTML = `${player.score || 0} pops <span style="font-size: 0.8rem; color: ${ppsColor}; margin-left: 4px;">⚡${pps} pps</span>`;
                    }
                } else {
                    if (nameLabel) nameLabel.textContent = 'รอนักเคาะ...';
                    if (scoreLabel) scoreLabel.textContent = '0 pops';
                }

                drawPopcatStageCanvas(ctx, canvas, player, stageIdx, timestamp, dt);
            }

            // ซิงค์อันดับสดให้มือถือผู้เล่นทุกคนทุก 200ms
            if (timestamp - popcatLastStandingsBroadcast > 200) {
                popcatLastStandingsBroadcast = timestamp;
                broadcastPopcatStandings();
            }

            popcatAnimId = requestAnimationFrame(renderPopcatStages);
        }

        popcatAnimId = requestAnimationFrame(renderPopcatStages);
    }

    function drawPopcatStageCanvas(ctx, canvas, player, stageIdx, timestamp, dt) {
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        if (w === 0 || h === 0) return;

        ctx.save();
        ctx.clearRect(0, 0, w, h);

        // วาดพื้นหลังเวทีถ่ายทอดสดสไตล์ Arcade Cyberspace
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#060914');
        bgGrad.addColorStop(1, '#0e1428');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // แสงสปอตไลต์เวทีตามอันดับ (ทอง / เงิน / ทองแดง)
        let spotColor = 'rgba(255, 215, 0, 0.15)';
        if (stageIdx === 1) spotColor = 'rgba(220, 220, 220, 0.12)';
        if (stageIdx === 2) spotColor = 'rgba(205, 127, 50, 0.12)';

        const spotGrad = ctx.createRadialGradient(w / 2, h * 0.55, 10, w / 2, h * 0.55, w * 0.55);
        spotGrad.addColorStop(0, spotColor);
        spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = spotGrad;
        ctx.fillRect(0, 0, w, h);

        if (player) {
            // ตรวจจับสถานะการเคาะอ้าปาก (เปิดค้าง หรือเคาะล่าสุดไม่เกิน 110ms)
            const isPopping = player.isOpen || (Date.now() - (player.lastPopTime || 0) < 110);
            if (isPopping) {
                player.popScale = 0.88;
            }

            // คำนวณแอนิเมชัน Squash & Stretch แบบฟิสิกส์คืนรูป
            if (typeof player.popScale !== 'number') player.popScale = 1.0;
            player.popScale += (1.0 - player.popScale) * Math.min(1.0, 16 * dt);

            // แอนิเมชันขยับขึ้นลงเบาๆ เมื่ออยู่นิ่ง (Idle Bobbing)
            const bob = isPopping ? 3 : Math.sin(timestamp * 0.003 + stageIdx * 1.5) * 4;

            // เลือกรูปภาพแมวตามเงื่อนไขที่เจ้านายกำหนด:
            // - ยังไม่คลิก / ปล่อย: cat_normal.png
            // - คลิกแล้วไม่เกิน 100 ครั้ง: cat_open1.png
            // - คลิกเกิน 100 ครั้ง: cat_open2.png
            let catImg = popcatHostImages.normal;
            const isTier2 = (player.score || 0) > 100;

            if (isPopping) {
                catImg = isTier2 ? popcatHostImages.open2 : popcatHostImages.open1;
            }

            const catSize = Math.min(w * 0.78, h * 0.58);
            const cx = w / 2;
            const cy = h / 2 + 10 + bob;

            // เอฟเฟกต์ออร่าเพลิงนีออนพิเศษเมื่อผู้เล่นก้าวข้าม 100 ครั้ง (Super Cat)
            if (isTier2) {
                ctx.save();
                ctx.translate(cx, cy);
                const pulseAura = 1 + Math.sin(timestamp * 0.008) * 0.06;
                const auraRadius = (catSize * 0.6) * pulseAura;
                const auraGrad = ctx.createRadialGradient(0, 0, catSize * 0.2, 0, 0, auraRadius);
                auraGrad.addColorStop(0, 'rgba(255, 0, 119, 0.45)');
                auraGrad.addColorStop(0.65, 'rgba(255, 204, 0, 0.25)');
                auraGrad.addColorStop(1, 'rgba(255, 0, 119, 0)');
                ctx.fillStyle = auraGrad;
                ctx.beginPath();
                ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // วาดรูปแมวลงบนเวทีพร้อมสเกล Squash
            ctx.save();
            ctx.translate(cx, cy);
            const sy = player.popScale;
            const sx = 2.0 - sy;
            ctx.scale(sx, sy);

            if (catImg && catImg.complete && catImg.naturalWidth > 0) {
                ctx.drawImage(catImg, -catSize / 2, -catSize / 2, catSize, catSize);
            } else {
                // Fallback ในกรณีรูปยังโหลดไม่เสร็จ
                ctx.fillStyle = '#ffcc00';
                ctx.beginPath();
                ctx.arc(0, 0, catSize * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            // วาดตัวเลขคะแนนลอย (+1 / +1 🔥) กระจายออกจากปากแมว
            if (player.floatingTexts && player.floatingTexts.length > 0) {
                for (let i = player.floatingTexts.length - 1; i >= 0; i--) {
                    const ft = player.floatingTexts[i];
                    ft.y += (ft.vy || -0.6) * dt;
                    ft.x += (ft.vx || 0) * dt;
                    ft.alpha -= 1.3 * dt;

                    if (ft.alpha <= 0) {
                        player.floatingTexts.splice(i, 1);
                        continue;
                    }

                    ctx.save();
                    ctx.globalAlpha = Math.max(0, ft.alpha);
                    ctx.fillStyle = ft.color || '#ffcc00';
                    ctx.shadowColor = ft.color || '#ffcc00';
                    ctx.shadowBlur = 10;
                    ctx.font = `bold ${ft.size || 20}px Inter, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillText(ft.text, ft.x * w, ft.y * h);
                    ctx.restore();
                }
            }

            // แถบป้ายสถิติความเร็วเคาะ (PPS Meter / Flame Badge)
            if ((player.pps || 0) >= 7) {
                ctx.save();
                ctx.font = 'bold 11px Inter, sans-serif';
                ctx.fillStyle = '#ff0077';
                ctx.shadowColor = '#ff0077';
                ctx.shadowBlur = 8;
                ctx.textAlign = 'center';
                ctx.fillText(`🔥 SPEED: ${player.pps} PPS ⚡`, cx, cy - catSize / 2 - 12);
                ctx.restore();
            } else if (isTier2) {
                ctx.save();
                ctx.font = 'bold 11px Inter, sans-serif';
                ctx.fillStyle = '#ffcc00';
                ctx.shadowColor = '#ffcc00';
                ctx.shadowBlur = 6;
                ctx.textAlign = 'center';
                ctx.fillText('⚡ SUPER POPCAT (ขั้น 2) 🐱', cx, cy - catSize / 2 - 10);
                ctx.restore();
            }
        } else {
            // กรณีไม่มีผู้เล่นในอันดับนี้ (เวทีว่าง)
            ctx.save();
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.textAlign = 'center';
            ctx.fillText('🐱 รอนักเคาะ...', w / 2, h / 2);
            ctx.restore();
        }

        ctx.restore();
    }

    function updatePopcatLeaderboard() {
        if (!popcatLeaderboard) return;
        popcatLeaderboard.innerHTML = '';
        const sorted = Object.keys(players).map(id => {
            return {
                id,
                nickname: players[id].nickname,
                score: players[id].score || 0,
                pps: players[id].pps || 0
            };
        }).sort((a, b) => b.score - a.score);

        sorted.forEach((player, index) => {
            const li = document.createElement('li');
            const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
            if (rankClass) li.classList.add(rankClass);

            const ppsBadge = player.pps > 0 ? `<small style="color: var(--neon-gold); margin-left: 6px;">⚡${player.pps} pps</small>` : '';
            li.innerHTML = `
                <span>#${index + 1} ${escapeHTML(player.nickname)}${ppsBadge}</span>
                <span style="color: var(--accent); font-weight: bold;">${player.score} pops</span>
            `;
            popcatLeaderboard.appendChild(li);
        });
    }

    function broadcastPopcatStandings() {
        const sorted = Object.keys(players).map(id => ({
            peerId: id,
            id: id,
            nickname: players[id].nickname,
            score: players[id].score || 0,
            pps: players[id].pps || 0
        })).sort((a, b) => b.score - a.score);

        broadcastState({
            type: 'POPCAT_STANDINGS',
            standings: sorted
        });
    }

    function endPopcatGame() {
        gameActive = false;
        clearInterval(popcatTimerInterval);
        clearInterval(popcatCountdownInterval);
        if (popcatAnimId) {
            cancelAnimationFrame(popcatAnimId);
            popcatAnimId = null;
        }

        const sorted = Object.keys(players).map(id => {
            return { id, nickname: players[id].nickname, score: players[id].score || 0 };
        }).sort((a, b) => b.score - a.score);

        sorted.forEach((p, index) => {
            let pScore = 5;
            if (index === 0) pScore = 15;
            else if (index === 1) pScore = 12;
            else if (index === 2) pScore = 10;

            if (!players[p.id].scores) players[p.id].scores = {};
            players[p.id].scores.popcat = p.score;
            players[p.id].score = (players[p.id].score || 0) + pScore;
        });

        const winnerName = sorted.length > 0 ? sorted[0].nickname : 'ไม่มี';

        broadcastState({
            type: 'GAME_OVER',
            game: 'popcat',
            leaderboard: sorted,
            winnerName: winnerName
        });

        triggerConfetti();
        playSynthBeep(523.25, 0.15);
        setTimeout(() => playSynthBeep(659.25, 0.15), 150);
        setTimeout(() => playSynthBeep(783.99, 0.35), 300);

        setTimeout(() => {
            showSuiteLeaderboard(winnerName);
        }, 2500);
    }

    // === 9. FAST BUZZ! MODE GAME LOGIC ===
    function startBuzzGame() {
        buzzQueue = [];
        firstBuzzTime = null;
        buzzAnnouncement.textContent = 'แอดมินกำลังรอสัญญาณ... เตรียมรอกดปุ่มสีแดงยักษ์!';
        buzzWinnerName.textContent = 'รอกดปุ่ม...';
        buzzWinnerTime.textContent = 'ความต่างเวลา: - ms';
        buzzQueueOl.innerHTML = '';
        buzzTimerText.textContent = 'STANDBY';

        // ปล่อยปุ่มสัญญาณหลัง 2-5 วินาทีสุ่ม
        const delay = 2000 + Math.random() * 3000;
        setTimeout(() => {
            if (activeGameMode !== 'buzz' || gameActive === false) return;
            buzzAnnouncement.textContent = '🚨 สัญญาณปล่อยแล้ว! แย่งกันกดด่วน! 🚨';
            buzzTimerText.textContent = 'GO!';
            playSynthBeep(880, 0.2); // เสียงสัญญาณเริ่ม
            
            // Broadcast ปล่อยปุ่มไฟเขียว
            broadcastState({
                type: 'BUZZ_RELEASE'
            });
        }, delay);
    }

    function handleFirstBuzz(peerId) {
        const player = players[peerId];
        if (player) {
            buzzWinnerName.textContent = player.nickname;
            buzzWinnerTime.textContent = 'ความต่างเวลา: 0 ms (คนแรก!)';
            
            // สั่นและเสียงเด่น
            playSynthBeep(600, 0.4);

            // แจ้งโฮสต์ให้เพิ่มคะแนนได้
            triggerConfetti();
        }
    }

    function updateBuzzQueueUI() {
        buzzQueueOl.innerHTML = '';
        buzzQueue.forEach((buzz, idx) => {
            if (idx === 0) return; // ข้ามคนแรก เพราะโชว์ด้านบนใหญ่แล้ว
            const li = document.createElement('li');
            li.innerHTML = `
                <span>#${idx + 1} <strong>${escapeHTML(buzz.nickname)}</strong></span>
                <span style="color:var(--text-muted); float:right;">+${buzz.delta} ms</span>
            `;
            buzzQueueOl.appendChild(li);
        });
    }

    function adjustBuzzWinnerScore(amount) {
        if (buzzQueue.length === 0) return;
        const winnerId = buzzQueue[0].peerId;
        const winner = players[winnerId];
        if (winner) {
            winner.scores.buzz = Math.max(0, winner.scores.buzz + amount);
            winner.score = Math.max(0, winner.score + amount);
            
            alert(`อัปเดตคะแนนของ ${winner.nickname} สำเร็จ (ได้รับ ${amount > 0 ? '+' : ''}${amount} คะแนน)`);
            updateLobbyUI();
            
            // จบเกม Buzz
            gameActive = false;
            showSuiteLeaderboard(winner.nickname);
        }
    }

    function resetBuzzGame() {
        startBuzzGame();
        broadcastState({
            type: 'BUZZ_RESET'
        });
    }

    // === 10. LUCKY WHEEL MODE GAME LOGIC ===
    function startWheelGame() {
        wheelWinnerModal.classList.remove('active');
        wheelAnnouncement.textContent = 'แอดมินสุ่มลุ้นรายชื่อผู้โชคดี';
        wheelWinnerId = null;
        isWheelSpinning = false;
        
        const playerIds = Object.keys(players);
        wheelPlayerCount.textContent = playerIds.length;
        
        drawWheel(0);
        
        broadcastState({
            type: 'WHEEL_START'
        });
    }

    function drawWheel(angle = 0) {
        const playerIds = Object.keys(players);
        const count = playerIds.length;
        
        const w = wheelCanvas.width / (window.devicePixelRatio || 1);
        const h = wheelCanvas.height / (window.devicePixelRatio || 1);
        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(cx, cy) - 20;

        wheelCtx.clearRect(0, 0, w, h);

        if (count === 0) {
            wheelCtx.fillStyle = 'rgba(255,255,255,0.2)';
            wheelCtx.font = '16px "Chakra Petch"';
            wheelCtx.textAlign = 'center';
            wheelCtx.fillText('รอผู้เล่นจอยล็อบบี้เพื่อสร้างวงล้อ...', cx, cy);
            return;
        }

        const arc = (Math.PI * 2) / count;

        playerIds.forEach((id, i) => {
            const currentAngle = angle + (i * arc);
            
            // วาดชิ้นส่วนวงล้อ
            wheelCtx.beginPath();
            wheelCtx.moveTo(cx, cy);
            wheelCtx.arc(cx, cy, r, currentAngle, currentAngle + arc);
            wheelCtx.closePath();
            
            // สลับสี
            const colors = ['#ff5e36', '#0088ff', '#ffbd59', '#22c55e', '#9d4edd', '#ff007f'];
            wheelCtx.fillStyle = colors[i % colors.length];
            wheelCtx.fill();
            wheelCtx.strokeStyle = 'rgba(5, 8, 20, 0.4)';
            wheelCtx.lineWidth = 2;
            wheelCtx.stroke();

            // วาดชื่อ
            wheelCtx.save();
            wheelCtx.translate(cx, cy);
            wheelCtx.rotate(currentAngle + (arc / 2));
            wheelCtx.textAlign = 'right';
            wheelCtx.fillStyle = (i % colors.length === 2) ? '#000' : '#fff'; // สีเหลืองใช้ข้อความสีดำ
            wheelCtx.font = 'bold 11px "Chakra Petch"';
            
            const name = players[id].nickname;
            const truncateName = name.length > 8 ? name.substring(0, 7) + '..' : name;
            wheelCtx.fillText(truncateName, r - 15, 4);
            wheelCtx.restore();
        });

        // วาดจุดกึ่งกลางวงล้อ
        wheelCtx.beginPath();
        wheelCtx.arc(cx, cy, 18, 0, Math.PI * 2);
        wheelCtx.fillStyle = '#ffffff';
        wheelCtx.fill();
        wheelCtx.lineWidth = 3;
        wheelCtx.strokeStyle = '#050814';
        wheelCtx.stroke();
    }

    function spinLuckyWheel() {
        if (isWheelSpinning) return;
        
        const playerIds = Object.keys(players);
        const count = playerIds.length;
        if (count === 0) return;

        isWheelSpinning = true;
        wheelWinnerModal.classList.remove('active');
        wheelAnnouncement.textContent = '🎡 วงล้อกำลังหมุนด้วยแรงฉุดเหนี่ยวนำ... 🎡';

        // กำหนดความเร็วและเวลาสุ่ม
        wheelSpeed = 0.4 + Math.random() * 0.3; // มุมต่อเฟรม
        const friction = 0.985; // ค่อยๆ ช้าลง
        let currentAngle = wheelRotation;

        function animateSpin() {
            wheelSpeed *= friction;
            currentAngle += wheelSpeed;

            drawWheel(currentAngle);

            if (wheelSpeed > 0.002) {
                wheelAnimationFrame = requestAnimationFrame(animateSpin);
            } else {
                isWheelSpinning = false;
                wheelRotation = currentAngle % (Math.PI * 2);
                
                // คำนวณหาผู้ชนะ (ลูกศรชี้อยู่ข้างบนสุด คือมุม -Math.PI/2 หรือ 270 องศา)
                const arc = (Math.PI * 2) / count;
                // คำนวณดัชนีของชิ้นส่วนที่ชี้ขึ้น
                const normalizedAngle = (Math.PI * 1.5 - wheelRotation + Math.PI * 4) % (Math.PI * 2);
                const winnerIndex = Math.floor(normalizedAngle / arc) % count;
                
                wheelWinnerId = playerIds[winnerIndex];
                const winner = players[wheelWinnerId];

                if (winner) {
                    // ส่งเอฟเฟกต์จุดพลุ
                    triggerConfetti();
                    
                    // แสดงป๊อปอัพผู้ชนะ
                    wheelWinnerLabel.textContent = winner.nickname;
                    wheelWinnerModal.classList.add('active');
                    wheelAnnouncement.textContent = `🎉 ผู้ได้รับรางวัลโชคดีคือ:คุณ ${winner.nickname}! 🎉`;

                    // แจ้งผู้ชนะทางโทรศัพท์สั่นและฉลอง
                    broadcastState({
                        type: 'WHEEL_WINNER',
                        winnerId: wheelWinnerId,
                        winnerName: winner.nickname
                    });
                }
            }
        }

        animateSpin();
    }

    // === 11. GLOBAL RESULT SUITE SCOREBOARD ===
    function showSuiteLeaderboard(winnerName) {
        // อัปเดตรายชื่อและคะแนนสะสมรวมจากทุกเกม
        leaderboardList.innerHTML = '';
        winnerAnnouncement.textContent = winnerName;

        const sorted = Object.keys(players).map(id => {
            return {
                id,
                nickname: players[id].nickname,
                score: players[id].score || 0
            };
        }).sort((a, b) => b.score - a.score);

        sorted.forEach((player, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="leaderboard-rank">#${index + 1}</span>
                <span class="leaderboard-name">${escapeHTML(player.nickname)}</span>
                <span class="leaderboard-score">${player.score} คะแนนสะสม</span>
            `;
            leaderboardList.appendChild(li);
        });

        // แจ้งทุกคนว่าสรุปผลแล้ว
        broadcastState({
            type: 'SUITE_RESULTS',
            leaderboard: sorted,
            winnerName: winnerName
        });

        showScreen('result');
    }

    function restartGameSuite() {
        // รีเซ็ตคะแนนเฉพาะของแต่ละเกม แต่คะแนนสะสมหลักยังคงอยู่
        Object.keys(players).forEach(id => {
            players[id].progress = 0;
            players[id].basketX = 0.5;
            players[id].shipX = 0.5;
            players[id].dualFighter = false;
            players[id].combo = 0;
            players[id].pps = 0;
            players[id].isOpen = false;
            players[id].popScale = 1.0;
            players[id].floatingTexts = [];
        });

        gameActive = false;
        
        broadcastState({
            type: 'SUITE_RESET',
            players: players
        });

        showScreen('lobby');
        updateLobbyUI();
    }

    function quitLobby() {
        if (peer) {
            peer.destroy();
            peer = null;
        }
        connections = [];
        players = {};
        gameActive = false;
        
        // เคลียร์ Interval ทั้งหมด
        clearInterval(gameCountdownInterval);
        clearInterval(gameTimerInterval);
        clearInterval(gameSyncInterval);
        if (wheelAnimationFrame) cancelAnimationFrame(wheelAnimationFrame);

        location.reload();
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    // === 12. CANVAS GAME GRAPHICS LOOP (Rocket Racing) ===
    function startGraphicsLoop() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        initStars();
        particles = [];
        
        function renderLoop() {
            updatePhysics();
            drawRocketCanvas();
            animationFrameId = requestAnimationFrame(renderLoop);
        }
        animationFrameId = requestAnimationFrame(renderLoop);
    }

    function stopGraphicsLoop() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    function initStars() {
        stars = [];
        const w = rocketCanvas.width / (window.devicePixelRatio || 1);
        const h = rocketCanvas.height / (window.devicePixelRatio || 1);
        for (let i = 0; i < 120; i++) {
            stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: 0.5 + Math.random() * 2,
                speed: 1 + Math.random() * 3
            });
        }
    }

    function updatePhysics() {
        let averageSpeedCoeff = 1.0;
        if (gameActive && activeGameMode === 'rocket') {
            const totalProgress = Object.keys(players).reduce((sum, id) => sum + players[id].progress, 0);
            const activeCount = Object.keys(players).length || 1;
            averageSpeedCoeff = 1.0 + (totalProgress / activeCount) * 0.15;
        }

        const w = rocketCanvas.width / (window.devicePixelRatio || 1);
        const h = rocketCanvas.height / (window.devicePixelRatio || 1);

        stars.forEach(star => {
            star.x -= star.speed * averageSpeedCoeff;
            if (star.x < 0) {
                star.x = w;
                star.y = Math.random() * h;
            }
        });

        particles.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            p.size *= 0.95;
            if (p.alpha <= 0 || p.size <= 0.2) {
                particles.splice(idx, 1);
            }
        });

        if (screenShakeIntensity > 0) {
            screenShakeIntensity *= 0.9;
            if (screenShakeIntensity < 0.2) screenShakeIntensity = 0;
        }
    }

    function createJetSparks(playerPeerId, count = 3) {
        if (!gameActive || activeGameMode !== 'rocket') return;
        const playerIds = Object.keys(players);
        const index = playerIds.indexOf(playerPeerId);
        if (index === -1) return;

        const w = rocketCanvas.width / (window.devicePixelRatio || 1);
        const h = rocketCanvas.height / (window.devicePixelRatio || 1);

        let centerY = 0;
        if (playerIds.length <= 8) {
            const laneHeight = h / playerIds.length;
            centerY = (index * laneHeight) + (laneHeight / 2) + 8;
        } else {
            const maxRows = 12;
            const padding = 20;
            const rowHeight = (h - padding * 2) / maxRows;
            centerY = padding + (index % maxRows) * rowHeight + (index * 7 % 10 - 5);
        }

        const player = players[playerPeerId];
        const progressVal = player ? player.progress : 0;
        const leftBoundary = 40;
        const rightBoundary = w - 60;
        const maxProgress = Math.max(...playerIds.map(id => players[id].progress), 1);
        const progressRatio = progressVal / maxProgress;
        const currentX = leftBoundary + progressRatio * (rightBoundary - leftBoundary);

        for (let i = 0; i < count; i++) {
            particles.push({
                x: currentX - 18,
                y: centerY + (Math.random() * 6 - 3),
                vx: -(2 + Math.random() * 4),
                vy: Math.random() * 2 - 1,
                size: 2 + Math.random() * 4,
                alpha: 1.0,
                decay: 0.05 + Math.random() * 0.05,
                color: 'rgba(255, 94, 54, '
            });
        }

        // เพิ่มการสั่นหน้าจอเล็กน้อยเมื่อมีการเคาะ
        screenShakeIntensity = Math.min(6, screenShakeIntensity + 0.6);
    }

    function drawRocketCanvas() {
        const w = rocketCanvas.width / (window.devicePixelRatio || 1);
        const h = rocketCanvas.height / (window.devicePixelRatio || 1);

        rocketCtx.save();
        if (screenShakeIntensity > 0) {
            const dx = (Math.random() - 0.5) * screenShakeIntensity;
            const dy = (Math.random() - 0.5) * screenShakeIntensity;
            rocketCtx.translate(dx, dy);
        }

        // พื้นหลังสีอวกาศมืด
        rocketCtx.fillStyle = '#03050c';
        rocketCtx.fillRect(0, 0, w, h);

        // วาดเส้นตารางตู้เกมแบบ Cyberpunk
        rocketCtx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
        rocketCtx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < w; x += gridSize) {
            rocketCtx.beginPath();
            rocketCtx.moveTo(x, 0);
            rocketCtx.lineTo(x, h);
            rocketCtx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            rocketCtx.beginPath();
            rocketCtx.moveTo(0, y);
            rocketCtx.lineTo(w, y);
            rocketCtx.stroke();
        }

        // วาดดวงดาววิ่งเคลื่อนไหว
        stars.forEach(star => {
            rocketCtx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.8, star.speed * 0.15)})`;
            rocketCtx.lineWidth = star.size;
            rocketCtx.beginPath();
            rocketCtx.moveTo(star.x, star.y);
            rocketCtx.lineTo(star.x + star.speed * 2.5, star.y);
            rocketCtx.stroke();
        });

        const playerIds = Object.keys(players);
        if (playerIds.length === 0) {
            rocketCtx.restore();
            return;
        }

        const isSwarmMode = playerIds.length > 8;

        // วาดเส้นชัยและเส้นเลน
        if (!isSwarmMode) {
            const laneHeight = h / playerIds.length;
            rocketCtx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
            rocketCtx.lineWidth = 1.5;
            for (let i = 1; i < playerIds.length; i++) {
                rocketCtx.beginPath();
                rocketCtx.moveTo(0, i * laneHeight);
                rocketCtx.lineTo(w, i * laneHeight);
                rocketCtx.stroke();
            }
        }

        // วาดอนุภาคไฟท้ายไอพ่น
        particles.forEach(p => {
            rocketCtx.fillStyle = p.color + p.alpha + ')';
            rocketCtx.beginPath();
            rocketCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            rocketCtx.fill();
        });

        const leftBoundary = 40;
        const rightBoundary = w - 60;
        const maxProgress = Math.max(...playerIds.map(id => players[id].progress), 1);
        const sortedRanks = playerIds.slice().sort((a, b) => players[b].progress - players[a].progress);

        // วาดจรวดผู้เล่นแต่ละคน
        playerIds.forEach((id, index) => {
            const player = players[id];
            
            let centerY = 0;
            if (!isSwarmMode) {
                const laneHeight = h / playerIds.length;
                centerY = (index * laneHeight) + (laneHeight / 2) + 8;
            } else {
                const maxRows = 12;
                const padding = 20;
                const rowHeight = (h - padding * 2) / maxRows;
                centerY = padding + (index % maxRows) * rowHeight + (index * 7 % 10 - 5);
            }

            const progressRatio = player.progress / maxProgress;
            const currentX = leftBoundary + progressRatio * (rightBoundary - leftBoundary);
            
            let scaleCoeff = 1.0;
            if (isSwarmMode) {
                scaleCoeff = Math.max(0.35, 1.0 - (playerIds.length - 8) * 0.005);
            }

            const rank = sortedRanks.indexOf(id) + 1;
            const shouldDrawName = !isSwarmMode || (rank <= 12);

            // แสดงชื่อผู้เล่นเหนือกรงจรวด
            if (shouldDrawName) {
                rocketCtx.fillStyle = 'rgba(240, 244, 248, 0.9)';
                rocketCtx.font = `bold 10px "Chakra Petch"`;
                rocketCtx.textAlign = 'left';
                rocketCtx.fillText(`${rank}. ${player.nickname} (${player.progress})`, currentX - 10, centerY - 12 * scaleCoeff);
            }

            // ตัวถังจรวด
            rocketCtx.save();
            rocketCtx.translate(currentX, centerY);
            rocketCtx.scale(scaleCoeff, scaleCoeff);

            // เอฟเฟกต์ไฟท้ายเรืองแสงเมื่อเคาะ
            if (player.progress > 0) {
                rocketCtx.fillStyle = 'rgba(255, 94, 54, 0.35)';
                rocketCtx.shadowColor = '#ff5e36';
                rocketCtx.shadowBlur = 12;
                rocketCtx.beginPath();
                rocketCtx.arc(-14, 0, 8 + Math.random() * 4, 0, Math.PI * 2);
                rocketCtx.fill();
                rocketCtx.shadowBlur = 0;
            }

            // ปีกจรวด
            rocketCtx.fillStyle = '#0077ff';
            rocketCtx.beginPath();
            rocketCtx.moveTo(-10, -8);
            rocketCtx.lineTo(-15, -12);
            rocketCtx.lineTo(-4, -4);
            rocketCtx.fill();
            rocketCtx.beginPath();
            rocketCtx.moveTo(-10, 8);
            rocketCtx.lineTo(-15, 12);
            rocketCtx.lineTo(-4, 4);
            rocketCtx.fill();

            // ตัวบอดี้จรวดหลัก
            rocketCtx.fillStyle = '#d2dcf0';
            rocketCtx.beginPath();
            rocketCtx.moveTo(-13, -5);
            rocketCtx.lineTo(8, -5);
            rocketCtx.quadraticCurveTo(20, 0, 8, 5);
            rocketCtx.lineTo(-13, 5);
            rocketCtx.closePath();
            rocketCtx.fill();

            // กระจก Cockpit
            rocketCtx.fillStyle = '#00f0ff';
            rocketCtx.beginPath();
            rocketCtx.moveTo(2, -2);
            rocketCtx.quadraticCurveTo(12, 0, 2, 2);
            rocketCtx.closePath();
            rocketCtx.fill();

            rocketCtx.restore();
        });

        rocketCtx.restore();
    }

    // === 13. CONFETTI & SOUND SYNTH EFFECTS ===
    function triggerConfetti() {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }

    // Shared Singleton AudioContext ป้องกัน Garbage Collection และ Audio Hardware Throttling
    let sharedHostAudioCtx = null;
    function getHostAudioContext() {
        if (!sharedHostAudioCtx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) sharedHostAudioCtx = new AudioCtx();
        }
        if (sharedHostAudioCtx && sharedHostAudioCtx.state === 'suspended') {
            sharedHostAudioCtx.resume().catch(() => {});
        }
        return sharedHostAudioCtx;
    }

    // สร้างเสียงบี๊บสังเคราะห์ผ่าน Web Audio API (ไม่ต้องพึ่งไฟล์เสียงจากภายนอก)
    function playSynthBeep(frequency = 440, duration = 0.1) {
        try {
            const audioCtx = getHostAudioContext();
            if (!audioCtx) return;
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
            
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.error('AudioContext error:', e);
        }
    }
});
