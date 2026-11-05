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
        peer = new Peer(myPeerId, { debug: 1 });

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
                    shipX: 0.5,
                    dualFighter: false,
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
                updateRocketLeaderboard();
            }
        }
        else if (data.type === 'CATCH_UPDATE') {
            if (!gameActive || activeGameMode !== 'catch') return;
            if (players[senderPeerId]) {
                players[senderPeerId].basketX = data.basketX;
                players[senderPeerId].score = data.score;
                players[senderPeerId].combo = data.combo;
                updateCatchLeaderboard();
            }
        }
        else if (data.type === 'GALAGA_UPDATE') {
            if (!gameActive || activeGameMode !== 'galaga') return;
            if (players[senderPeerId]) {
                players[senderPeerId].shipX = data.shipX;
                players[senderPeerId].score = data.score;
                players[senderPeerId].combo = data.combo;
                players[senderPeerId].dualFighter = data.dualFighter;
                updateGalagaLeaderboard();
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
            players[id].score = 0;
            players[id].combo = 0;
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

    function spawnHostCatchItem() {
        if (!catchPrng) return;
        const totalWeight = CATCH_ITEM_TYPES.reduce((acc, t) => acc + t.weight, 0);
        let randVal = catchPrng() * totalWeight;
        let selectedType = CATCH_ITEM_TYPES[0];
        for (const itemType of CATCH_ITEM_TYPES) {
            if (randVal < itemType.weight) {
                selectedType = itemType;
                break;
            }
            randVal -= itemType.weight;
        }

        const normX = 0.12 + catchPrng() * 0.76;
        catchItems.push({
            id: catchItemNextId++,
            type: selectedType.type,
            symbol: selectedType.symbol,
            color: selectedType.color,
            points: selectedType.points,
            comboInc: selectedType.comboInc,
            isBad: !!selectedType.isBad,
            x: normX,
            y: -0.06,
            speed: selectedType.speed + (catchPrng() * 0.08 - 0.04),
            rot: 0,
            rotSpeed: (catchPrng() - 0.5) * 3
        });
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

            // Spawn items according to host PRNG
            catchSpawnTimer += dt;
            if (catchSpawnTimer > 0.65) {
                spawnHostCatchItem();
                catchSpawnTimer = 0;
            }

            // Update host falling items
            for (let i = catchItems.length - 1; i >= 0; i--) {
                const item = catchItems[i];
                item.y += item.speed * dt;
                item.rot += item.rotSpeed * dt;
                if (item.y > 1.1) {
                    catchItems.splice(i, 1);
                }
            }

            // Get Top 3 Players
            const sortedPlayers = Object.keys(players).map(id => ({
                id,
                nickname: players[id].nickname,
                score: players[id].score || 0,
                combo: players[id].combo || 0,
                basketX: typeof players[id].basketX === 'number' ? players[id].basketX : 0.5
            })).sort((a, b) => b.score - a.score);

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
                    if (nameLabel) nameLabel.textContent = player.nickname;
                    if (scoreLabel) scoreLabel.textContent = `${player.score} pts (x${player.combo})`;

                    if (player.score !== stageState.lastScore) {
                        const diff = player.score - stageState.lastScore;
                        if (diff > 0) {
                            stageState.floatingTexts.push({
                                x: stageState.currentBasketX,
                                y: 0.80,
                                text: `+${diff}`,
                                color: '#00f0ff',
                                alpha: 1.0
                            });
                            spawnStageParticles(stageState, stageState.currentBasketX, 0.85, '#00f0ff', 6);
                        } else if (diff < 0) {
                            stageState.floatingTexts.push({
                                x: stageState.currentBasketX,
                                y: 0.80,
                                text: `${diff} 💥`,
                                color: '#ff0055',
                                alpha: 1.0
                            });
                            spawnStageParticles(stageState, stageState.currentBasketX, 0.85, '#ff0055', 8);
                        }
                        stageState.lastScore = player.score;
                    }

                    stageState.currentBasketX += (player.basketX - stageState.currentBasketX) * 0.35;
                } else {
                    if (nameLabel) nameLabel.textContent = 'รอผู้แข่งขัน...';
                    if (scoreLabel) scoreLabel.textContent = '0 pts';
                }

                // Update stage floating texts & particles
                for (let j = stageState.floatingTexts.length - 1; j >= 0; j--) {
                    const ft = stageState.floatingTexts[j];
                    ft.y -= 0.12 * dt;
                    ft.alpha -= 1.2 * dt;
                    if (ft.alpha <= 0) stageState.floatingTexts.splice(j, 1);
                }

                for (let j = stageState.particles.length - 1; j >= 0; j--) {
                    const p = stageState.particles[j];
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.alpha -= 1.5 * dt;
                    if (p.alpha <= 0) stageState.particles.splice(j, 1);
                }

                drawCatchStageCanvas(ctx, canvas, stageIdx, player, stageState);
            }

            catchAnimId = requestAnimationFrame(renderStagesLoop);
        }

        catchAnimId = requestAnimationFrame(renderStagesLoop);
    }

    function spawnStageParticles(stageState, x, y, color, count = 6) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.15 + Math.random() * 0.3;
            stageState.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.15,
                color: color,
                size: 2.5 + Math.random() * 3,
                alpha: 1.0
            });
        }
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

        // 2. Falling Items (Shared Simulation)
        catchItems.forEach(item => {
            const ix = item.x * w;
            const iy = item.y * h;
            const itemSize = Math.max(22, w * 0.075);

            ctx.save();
            ctx.translate(ix, iy);
            ctx.rotate(item.rot);

            ctx.shadowColor = item.color;
            ctx.shadowBlur = 10;

            ctx.font = `${Math.round(itemSize)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.symbol, 0, 0);

            ctx.restore();
        });

        if (player) {
            // 3. Basket for this player
            const bx = stageState.currentBasketX * w;
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
            ctx.fillText(player.nickname, bx, by - 5);
            ctx.restore();

            // 4. Floating texts
            stageState.floatingTexts.forEach(ft => {
                ctx.save();
                ctx.globalAlpha = Math.max(0, ft.alpha);
                ctx.fillStyle = ft.color;
                ctx.shadowColor = ft.color;
                ctx.shadowBlur = 8;
                ctx.font = 'bold 14px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x * w, ft.y * h);
                ctx.restore();
            });

            // 5. Particles
            stageState.particles.forEach(p => {
                ctx.save();
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
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
            players[id].score = 0;
            players[id].combo = 0;
            players[id].dualFighter = false;
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

    function spawnHostGalagaEnemy() {
        if (!galagaPrng) return;
        const totalWeight = GALAGA_ENEMY_TYPES.reduce((acc, t) => acc + t.weight, 0);
        let randVal = galagaPrng() * totalWeight;
        let selected = GALAGA_ENEMY_TYPES[0];
        for (const t of GALAGA_ENEMY_TYPES) {
            if (randVal < t.weight) {
                selected = t;
                break;
            }
            randVal -= t.weight;
        }

        const normX = 0.1 + galagaPrng() * 0.8;
        galagaEnemies.push({
            id: galagaNextEnemyId++,
            type: selected.type,
            name: selected.name,
            symbol: selected.symbol,
            color: selected.color,
            hp: selected.hp,
            maxHp: selected.hp,
            points: selected.points,
            speed: selected.speed + (galagaPrng() * 0.05 - 0.025),
            isPowerUp: !!selected.isPowerUp,
            isFriendly: !!selected.isFriendly,
            isMine: !!selected.isMine,
            x: normX,
            y: -0.08,
            swoopOffset: galagaPrng() * Math.PI * 2,
            rot: 0
        });
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

            galagaSpawnTimer += dt;
            if (galagaSpawnTimer > 0.55) {
                spawnHostGalagaEnemy();
                galagaSpawnTimer = 0;
            }

            for (let i = galagaEnemies.length - 1; i >= 0; i--) {
                const enemy = galagaEnemies[i];
                enemy.y += enemy.speed * dt;
                enemy.x += Math.sin(enemy.y * 7 + enemy.swoopOffset) * 0.15 * dt;
                enemy.x = Math.max(0.08, Math.min(0.92, enemy.x));

                if (enemy.y > 1.1) {
                    galagaEnemies.splice(i, 1);
                }
            }

            const sortedPlayers = Object.keys(players).map(id => ({
                id,
                nickname: players[id].nickname,
                score: players[id].score || 0,
                combo: players[id].combo || 0,
                dualFighter: !!players[id].dualFighter,
                shipX: typeof players[id].shipX === 'number' ? players[id].shipX : 0.5
            })).sort((a, b) => b.score - a.score);

            for (let stageIdx = 0; stageIdx < 3; stageIdx++) {
                const player = sortedPlayers[stageIdx];
                const canvas = galagaStageCanvases[stageIdx];
                const ctx = galagaStageContexts[stageIdx];
                const stageState = galagaStagesState[stageIdx];

                if (!canvas || !ctx) continue;

                const nameLabel = galagaStageNames[stageIdx];
                const scoreLabel = galagaStageScores[stageIdx];

                if (player) {
                    if (nameLabel) nameLabel.textContent = player.nickname;
                    const dualTag = player.dualFighter ? ' [DUAL]' : '';
                    if (scoreLabel) scoreLabel.textContent = `${player.score} pts (x${player.combo})${dualTag}`;

                    if (player.score !== stageState.lastScore) {
                        const diff = player.score - stageState.lastScore;
                        if (diff > 0) {
                            stageState.floatingTexts.push({
                                x: stageState.currentShipX,
                                y: 0.70,
                                text: `+${diff}`,
                                color: '#00f0ff',
                                alpha: 1.0
                            });
                            spawnHostGalagaParticles(stageState, stageState.currentShipX, 0.65, '#00f0ff', 6);
                        } else if (diff < 0) {
                            stageState.floatingTexts.push({
                                x: stageState.currentShipX,
                                y: 0.70,
                                text: `${diff} 💥`,
                                color: '#ff0055',
                                alpha: 1.0
                            });
                            spawnHostGalagaParticles(stageState, stageState.currentShipX, 0.84, '#ff0055', 8);
                        }
                        stageState.lastScore = player.score;
                    }

                    stageState.currentShipX += (player.shipX - stageState.currentShipX) * 0.38;
                    stageState.dualFighter = player.dualFighter;

                    stageState.laserCooldown -= dt;
                    if (stageState.laserCooldown <= 0) {
                        stageState.laserCooldown = 0.16;
                        if (stageState.dualFighter) {
                            stageState.lasers.push({ x: stageState.currentShipX - 0.045, y: 0.82, speed: 1.3, color: '#00ffff' });
                            stageState.lasers.push({ x: stageState.currentShipX + 0.045, y: 0.82, speed: 1.3, color: '#00ffff' });
                        } else {
                            stageState.lasers.push({ x: stageState.currentShipX, y: 0.82, speed: 1.3, color: '#ff3366' });
                        }
                    }
                } else {
                    if (nameLabel) nameLabel.textContent = 'รอนักบิน...';
                    if (scoreLabel) scoreLabel.textContent = '0 pts';
                }

                for (let j = stageState.lasers.length - 1; j >= 0; j--) {
                    const l = stageState.lasers[j];
                    l.y -= l.speed * dt;
                    if (l.y < -0.05) stageState.lasers.splice(j, 1);
                }

                for (let j = stageState.floatingTexts.length - 1; j >= 0; j--) {
                    const ft = stageState.floatingTexts[j];
                    ft.y -= 0.12 * dt;
                    ft.alpha -= 1.2 * dt;
                    if (ft.alpha <= 0) stageState.floatingTexts.splice(j, 1);
                }

                for (let j = stageState.particles.length - 1; j >= 0; j--) {
                    const p = stageState.particles[j];
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.alpha -= 1.6 * dt;
                    if (p.alpha <= 0) stageState.particles.splice(j, 1);
                }

                drawGalagaStageCanvas(ctx, canvas, stageIdx, player, stageState, dt);
            }

            galagaAnimId = requestAnimationFrame(renderStagesLoop);
        }

        galagaAnimId = requestAnimationFrame(renderStagesLoop);
    }

    function spawnHostGalagaParticles(stageState, x, y, color, count = 6) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.15 + Math.random() * 0.35;
            stageState.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: 2 + Math.random() * 3,
                alpha: 1.0
            });
        }
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

        galagaEnemies.forEach(e => {
            const ex = e.x * w;
            const ey = e.y * h;
            const eSize = e.type === 'boss' ? 28 : 22;

            ctx.save();
            ctx.translate(ex, ey);
            ctx.shadowColor = e.color;
            ctx.shadowBlur = 10;
            ctx.font = `${eSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(e.symbol, 0, 0);

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

        if (player) {
            stageState.lasers.forEach(laser => {
                const lx = laser.x * w;
                const ly = laser.y * h;
                ctx.save();
                ctx.shadowColor = laser.color;
                ctx.shadowBlur = 8;
                ctx.fillStyle = laser.color;
                ctx.fillRect(lx - 2, ly - 8, 4, 16);
                ctx.restore();
            });

            const sx = stageState.currentShipX * w;
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

            if (stageState.dualFighter) {
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
            ctx.fillText(player.nickname, 0, -18);

            ctx.restore();

            stageState.floatingTexts.forEach(ft => {
                ctx.save();
                ctx.globalAlpha = Math.max(0, ft.alpha);
                ctx.fillStyle = ft.color;
                ctx.shadowColor = ft.color;
                ctx.shadowBlur = 8;
                ctx.font = 'bold 13px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x * w, ft.y * h);
                ctx.restore();
            });

            stageState.particles.forEach(p => {
                ctx.save();
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
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

    // สร้างเสียงบี๊บสังเคราะห์ผ่าน Web Audio API (ไม่ต้องพึ่งไฟล์เสียงจากภายนอก)
    function playSynthBeep(frequency = 440, duration = 0.1) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
