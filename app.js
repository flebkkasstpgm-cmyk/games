// GFleth Party Game Hub - Player Mobile Application Controller (WebRTC P2P Client)
document.addEventListener('DOMContentLoaded', () => {
    // === 1. DOM ELEMENTS ===
    const screens = {
        landing: document.getElementById('screen-landing'),
        lobby: document.getElementById('screen-lobby'),
        rocket: document.getElementById('screen-controller-rocket'),
        catch: document.getElementById('screen-controller-catch'),
        galaga: document.getElementById('screen-controller-galaga'),
        buzz: document.getElementById('screen-controller-buzz'),
        wheel: document.getElementById('screen-controller-wheel'),
        result: document.getElementById('screen-result')
    };

    // Landing Screen Elements
    const inputNickname = document.getElementById('input-nickname');
    const inputRoomId = document.getElementById('input-room-id');
    const btnJoinLobby = document.getElementById('btn-join-lobby');
    const btnCreateLobby = document.getElementById('btn-create-lobby'); // สำหรับ showhost=true fallback

    // Lobby Screen Elements
    const btnLobbyBack = document.getElementById('btn-lobby-back');
    const lobbyStatusText = document.getElementById('lobby-status-text');
    const listPlayers = document.getElementById('list-players');
    const playerCountLabel = document.getElementById('player-count');
    const playerWelcomeTitle = document.getElementById('player-welcome-title');
    const lobbyInstruction = document.getElementById('lobby-instruction');

    // Rocket Controller Elements
    const btnTap = document.getElementById('btn-tap');
    const statSpeed = document.getElementById('stat-speed');
    const statRank = document.getElementById('stat-rank');
    const statProgress = document.getElementById('stat-progress');
    const rocketCountdown = document.getElementById('rocket-countdown');
    const rocketAnnouncement = document.getElementById('rocket-announcement');
    const overdriveBar = document.getElementById('overdrive-bar');

    // Catch It Controller Elements
    const catchPlayerScore = document.getElementById('catch-player-score');
    const catchPlayerCombo = document.getElementById('catch-player-combo');
    const catchPlayerRank = document.getElementById('catch-player-rank');
    const catchPlayerTimer = document.getElementById('catch-player-timer');
    const catchPlayerAnnouncement = document.getElementById('catch-player-announcement');
    const catchPlayerCanvas = document.getElementById('catch-player-canvas');
    const catchDragHint = document.getElementById('catch-drag-hint');
    const catchCanvasContainer = document.querySelector('.catch-canvas-container');

    // Galaga '88 Controller Elements
    const galagaPlayerScore = document.getElementById('galaga-player-score');
    const galagaPlayerCombo = document.getElementById('galaga-player-combo');
    const galagaPlayerRank = document.getElementById('galaga-player-rank');
    const galagaPlayerTimer = document.getElementById('galaga-player-timer');
    const galagaPlayerAnnouncement = document.getElementById('galaga-player-announcement');
    const galagaPlayerCanvas = document.getElementById('galaga-player-canvas');
    const btnGalagaFire = document.getElementById('btn-galaga-fire');
    const galagaDragHint = document.getElementById('galaga-drag-hint');

    // Fast Buzz Elements
    const btnBuzz = document.getElementById('btn-buzz');
    const buzzStateLabel = document.getElementById('buzz-state-label');
    const buzzRankBadge = document.getElementById('buzz-rank-badge');

    // Lucky Wheel Elements
    const wheelPlayerStatus = document.getElementById('wheel-player-status');
    const wheelPlayerInstruction = document.getElementById('wheel-player-instruction');
    const wheelStatusIcon = document.getElementById('wheel-status-icon');

    // Floating Fullscreen & Prompt Elements
    const btnFullscreenToggle = document.getElementById('btn-fullscreen-toggle');
    const fullscreenIcon = document.getElementById('fullscreen-icon');
    const fullscreenPrompt = document.getElementById('fullscreen-prompt');
    const fsPromptBanner = document.getElementById('fs-prompt-banner');
    const btnFsPromptAction = document.getElementById('btn-fs-prompt-action');

    // Result Screen Elements
    const winnerAnnouncement = document.querySelector('#winner-announcement span');
    const leaderboardList = document.getElementById('leaderboard-list');
    const btnQuit = document.getElementById('btn-quit');

    // === 2. STATE VARIABLES ===
    let myNickname = '';
    let myPeerId = '';
    let roomCode = 'GFLETH';
    let isHost = false; // ตัวควบคุมสิทธิ์

    let peer = null;
    let hostConnection = null;
    let connections = []; // เผื่อรันโหมดโฮสต์ fallback
    
    let currentMode = 'lobby'; // หน้าควบคุมปัจจุบัน
    let gameActive = false;

    // Rocket physics
    let tapTimes = [];
    let myProgress = 0;
    let myRank = '-';

    // Catch It physics & state
    let catchCtx = null;
    let catchBasketX = 0.5; // Normalized (0.0 to 1.0)
    let catchTargetBasketX = 0.5;
    let catchScore = 0;
    let catchCombo = 0;
    let catchMaxCombo = 0;
    let catchItems = [];
    let catchPrng = null;
    let catchSpawnTimer = 0;
    let catchNextItemId = 1;
    let catchAnimId = null;
    let catchLastFrameTime = 0;
    let catchParticles = [];
    let catchFloatingTexts = [];
    let catchLastTelemetryTime = 0;
    let catchCountdownTimer = null;
    let catchIsDragging = false;
    let catchShakeTimer = 0;

    const CATCH_ITEM_TYPES = [
        { type: 'coin', symbol: '🪙', color: '#ffcc00', points: 10, comboInc: 1, soundFreq: 650, weight: 35, speed: 0.32 },
        { type: 'gift', symbol: '🎁', color: '#ff3366', points: 20, comboInc: 1, soundFreq: 800, weight: 25, speed: 0.36 },
        { type: 'star', symbol: '⭐', color: '#00f0ff', points: 50, comboInc: 2, soundFreq: 980, weight: 15, speed: 0.40 },
        { type: 'diamond', symbol: '💎', color: '#b026ff', points: 100, comboInc: 3, soundFreq: 1200, weight: 10, speed: 0.45 },
        { type: 'bomb', symbol: '💣', color: '#ff0055', points: -30, comboInc: -999, isBad: true, soundFreq: 140, weight: 10, speed: 0.38 },
        { type: 'banana', symbol: '🍌', color: '#ffaa00', points: -10, comboInc: -999, isBad: true, soundFreq: 200, weight: 10, speed: 0.35 }
    ];

    // Galaga '88 physics & state
    let galagaCtx = null;
    let galagaShipX = 0.5;
    let galagaTargetShipX = 0.5;
    let galagaScore = 0;
    let galagaCombo = 0;
    let galagaMaxCombo = 0;
    let galagaLasers = [];
    let galagaEnemies = [];
    let galagaParticles = [];
    let galagaFloatingTexts = [];
    let galagaDualFighter = false;
    let galagaDualTimer = 0;
    let galagaFireCooldown = 0;
    let galagaIsFiring = false;
    let galagaAnimId = null;
    let galagaPrng = null;
    let galagaSpawnTimer = 0;
    let galagaLastFrameTime = 0;
    let galagaLastTelemetryTime = 0;
    let galagaStars = [];
    let galagaShakeTimer = 0;
    let galagaCountdownTimer = null;
    let galagaNextEnemyId = 1;

    const GALAGA_ENEMY_TYPES = [
        { type: 'drone', symbol: '👾', name: 'Drone Bug', color: '#00f0ff', hp: 1, points: 10, speed: 0.22, weight: 45 },
        { type: 'armored', symbol: '🛸', name: 'Armored Alien', color: '#ffcc00', hp: 3, points: 30, speed: 0.16, weight: 22 },
        { type: 'boss', symbol: '👑', name: 'Boss Galaga', color: '#ff0055', hp: 5, points: 100, speed: 0.11, weight: 12 },
        { type: 'powerup', symbol: '🌟', name: 'Dual Fighter Capsule', color: '#00ff88', hp: 1, points: 50, speed: 0.18, weight: 9, isPowerUp: true },
        { type: 'friendly', symbol: '👨‍🚀', name: 'Friendly Astronaut', color: '#38ef7d', hp: 1, points: -30, speed: 0.13, weight: 16, isFriendly: true },
        { type: 'mine', symbol: '💣', name: 'Space Mine', color: '#ff0844', hp: 1, points: -20, speed: 0.15, weight: 14, isMine: true }
    ];

    const PEER_PREFIX = 'gfleth-rocket-';

    // Auto-fill room ID
    inputRoomId.value = 'GFLETH';

    // === 3. EVENT LISTENERS ===
    btnJoinLobby.addEventListener('click', handleJoinLobby);
    btnLobbyBack.addEventListener('click', leaveLobby);
    btnQuit.addEventListener('click', leaveLobby);

    // Floating Fullscreen & Prompt Listeners
    if (btnFullscreenToggle) {
        btnFullscreenToggle.addEventListener('click', toggleFullscreen);
    }
    if (fsPromptBanner) {
        fsPromptBanner.addEventListener('click', (e) => {
            e.stopPropagation();
            requestFullscreenAndLockPortrait();
            if (fullscreenPrompt) fullscreenPrompt.classList.add('hidden');
        });
    }
    if (btnFsPromptAction) {
        btnFsPromptAction.addEventListener('click', (e) => {
            e.stopPropagation();
            requestFullscreenAndLockPortrait();
            if (fullscreenPrompt) fullscreenPrompt.classList.add('hidden');
        });
    }

    document.addEventListener('fullscreenchange', updateFullscreenUI);
    document.addEventListener('webkitfullscreenchange', updateFullscreenUI);

    // === ป้องกันการซูมหน้าจอ (Pinch-to-zoom / Double-tap zoom) เพื่อความเท่าเทียมกันของผู้เล่นทุกคน ===
    document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    let lastTouchEndTime = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEndTime <= 300) {
            const target = e.target;
            if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) {
                e.preventDefault();
            }
        }
        lastTouchEndTime = now;
    }, { passive: false });

    // ปรับขนาด Canvas อัตโนมัติเมื่อเข้า/ออกเต็มจอ หรือเปลี่ยนการหมุนหน้าจอ
    window.addEventListener('resize', () => {
        if (currentMode === 'catch') {
            initCatchCanvas();
        } else if (currentMode === 'galaga') {
            initGalagaCanvas();
        }
    });
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (currentMode === 'catch') {
                initCatchCanvas();
            } else if (currentMode === 'galaga') {
                initGalagaCanvas();
            }
        }, 150);
    });

    // Rocket Tap Event
    btnTap.addEventListener('mousedown', handleTap);
    btnTap.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleTap();
    });

    // Buzz Event
    btnBuzz.addEventListener('mousedown', pressBuzz);
    btnBuzz.addEventListener('touchstart', (e) => {
        e.preventDefault();
        pressBuzz();
    });

    // Catch Touch & Mouse Drag Events
    function updateCatchTouchPos(clientX) {
        if (!catchPlayerCanvas) return;
        const rect = catchPlayerCanvas.getBoundingClientRect();
        if (rect.width <= 0) return;
        const rawX = (clientX - rect.left) / rect.width;
        catchTargetBasketX = Math.max(0.12, Math.min(0.88, rawX));
        if (catchDragHint) catchDragHint.style.opacity = '0';
    }

    if (catchPlayerCanvas) {
        catchPlayerCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            catchIsDragging = true;
            if (e.touches && e.touches[0]) updateCatchTouchPos(e.touches[0].clientX);
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (!catchIsDragging || currentMode !== 'catch') return;
            if (e.touches && e.touches[0]) updateCatchTouchPos(e.touches[0].clientX);
        }, { passive: false });

        window.addEventListener('touchend', () => {
            catchIsDragging = false;
        });

        catchPlayerCanvas.addEventListener('mousedown', (e) => {
            catchIsDragging = true;
            updateCatchTouchPos(e.clientX);
        });

        window.addEventListener('mousemove', (e) => {
            if (!catchIsDragging || currentMode !== 'catch') return;
            updateCatchTouchPos(e.clientX);
        });

        window.addEventListener('mouseup', () => {
            catchIsDragging = false;
        });
    }

    // Galaga Touch & Drag Events
    function updateGalagaTouchPos(clientX) {
        if (!galagaPlayerCanvas) return;
        const rect = galagaPlayerCanvas.getBoundingClientRect();
        if (rect.width <= 0) return;
        const rawX = (clientX - rect.left) / rect.width;
        galagaTargetShipX = Math.max(0.1, Math.min(0.9, rawX));
        if (galagaDragHint) galagaDragHint.style.opacity = '0';
    }

    if (galagaPlayerCanvas) {
        let isGalagaDragging = false;
        galagaPlayerCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isGalagaDragging = true;
            if (e.touches && e.touches[0]) updateGalagaTouchPos(e.touches[0].clientX);
            galagaIsFiring = true;
            triggerFireLaser();
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (!isGalagaDragging || currentMode !== 'galaga') return;
            if (e.touches && e.touches[0]) updateGalagaTouchPos(e.touches[0].clientX);
        }, { passive: false });

        window.addEventListener('touchend', () => {
            isGalagaDragging = false;
            galagaIsFiring = false;
        });

        galagaPlayerCanvas.addEventListener('mousedown', (e) => {
            isGalagaDragging = true;
            updateGalagaTouchPos(e.clientX);
            galagaIsFiring = true;
            triggerFireLaser();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isGalagaDragging || currentMode !== 'galaga') return;
            updateGalagaTouchPos(e.clientX);
        });

        window.addEventListener('mouseup', () => {
            isGalagaDragging = false;
            galagaIsFiring = false;
        });
    }

    // Galaga Fire Button
    if (btnGalagaFire) {
        btnGalagaFire.addEventListener('touchstart', (e) => {
            e.preventDefault();
            galagaIsFiring = true;
            triggerFireLaser();
        }, { passive: false });

        btnGalagaFire.addEventListener('touchend', () => {
            galagaIsFiring = false;
        });

        btnGalagaFire.addEventListener('mousedown', () => {
            galagaIsFiring = true;
            triggerFireLaser();
        });

        btnGalagaFire.addEventListener('mouseup', () => {
            galagaIsFiring = false;
        });
    }

    // For showhost parameter (Fallback)
    const urlParams = new URLSearchParams(window.location.search);
    const isShowHostParam = urlParams.get('showhost') === 'true';
    if (isShowHostParam) {
        btnCreateLobby.classList.remove('hidden');
        btnCreateLobby.addEventListener('click', () => {
            // พาไปหน้า host.html แทนเพื่อความเป็นระเบียบและไม่มีเซิร์ฟเวอร์
            window.location.href = 'host.html';
        });
    }

    // === 3.5 FULLSCREEN & PORTRAIT ORIENTATION CONTROLLER ===
    function requestFullscreenAndLockPortrait() {
        const docEl = document.documentElement;
        const requestFS = docEl.requestFullscreen || 
                          docEl.webkitRequestFullscreen || 
                          docEl.mozRequestFullScreen || 
                          docEl.msRequestFullscreen;

        if (requestFS && !document.fullscreenElement && !document.webkitFullscreenElement) {
            try {
                const p = requestFS.call(docEl);
                if (p && p.catch) {
                    p.catch(err => {
                        console.log('Fullscreen request bypassed:', err);
                    });
                }
            } catch (err) {
                console.log('Fullscreen error:', err);
            }
        }

        // ล็อคหน้าจอแนวตั้ง (Portrait Lock)
        try {
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('portrait').catch(err => {
                    console.log('Orientation lock bypassed:', err);
                });
            } else if (screen.lockOrientation) {
                screen.lockOrientation('portrait');
            } else if (screen.webkitLockOrientation) {
                screen.webkitLockOrientation('portrait');
            } else if (screen.mozLockOrientation) {
                screen.mozLockOrientation('portrait');
            }
        } catch (err) {
            console.log('Orientation error:', err);
        }
    }

    function exitFullscreenSafe() {
        const exitFS = document.exitFullscreen || 
                       document.webkitExitFullscreen || 
                       document.mozCancelFullScreen || 
                       document.msExitFullscreen;

        if (exitFS && (document.fullscreenElement || document.webkitFullscreenElement)) {
            try {
                const p = exitFS.call(document);
                if (p && p.catch) {
                    p.catch(err => console.log('Exit fullscreen error:', err));
                }
            } catch (err) {
                console.log('Exit fullscreen error:', err);
            }
        }

        try {
            if (screen.orientation && screen.orientation.unlock) {
                screen.orientation.unlock();
            } else if (screen.unlockOrientation) {
                screen.unlockOrientation();
            }
        } catch (err) {}
    }

    function toggleFullscreen() {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            exitFullscreenSafe();
        } else {
            requestFullscreenAndLockPortrait();
        }
    }

    function updateFullscreenUI() {
        const isFS = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
        if (btnFullscreenToggle) {
            if (isFS) {
                btnFullscreenToggle.classList.add('is-fullscreen');
                btnFullscreenToggle.title = 'ออกจากโหมดเต็มจอ';
                if (fullscreenIcon) fullscreenIcon.textContent = '🗗';
            } else {
                btnFullscreenToggle.classList.remove('is-fullscreen');
                btnFullscreenToggle.title = 'สลับโหมดเต็มจอแนวตั้ง';
                if (fullscreenIcon) fullscreenIcon.textContent = '⛶';
            }
        }

        if (isFS && fullscreenPrompt) {
            fullscreenPrompt.classList.add('hidden');
        }
    }

    let promptTimer = null;
    function triggerFullscreenPrompt() {
        if (document.fullscreenElement || document.webkitFullscreenElement) return;
        if (!fullscreenPrompt) return;
        fullscreenPrompt.classList.remove('hidden');
        if (promptTimer) clearTimeout(promptTimer);
        promptTimer = setTimeout(() => {
            if (fullscreenPrompt) fullscreenPrompt.classList.add('hidden');
        }, 9000);
    }

    // === 4. SCREEN SWITCHING ===
    function showScreen(screenKey) {
        currentMode = screenKey;
        Object.keys(screens).forEach(key => {
            if (key === screenKey) {
                screens[key].classList.add('active');
            } else {
                screens[key].classList.remove('active');
            }
        });
    }

    // === 5. CONNECTION LOGIC (P2P CLIENT) ===
    function handleJoinLobby() {
        myNickname = inputNickname.value.trim();
        if (!myNickname) {
            alert('กรุณากรอกชื่อเล่นของคุณก่อนเข้าร่วมปาร์ตี้ครับ!');
            return;
        }

        // ขอเข้าสู่โหมดเต็มจอแนวตั้งทันทีเมื่อผู้ใช้แตะปุ่ม Join (User Gesture ที่เบราว์เซอร์อนุญาต)
        requestFullscreenAndLockPortrait();

        btnJoinLobby.disabled = true;
        btnJoinLobby.textContent = '🔌 กำลังเชื่อมต่อไปยังจอกลาง...';

        // สร้าง Peer ID แบบสุ่มของผู้เล่นเอง
        myPeerId = PEER_PREFIX + 'player-' + Math.random().toString(36).substr(2, 9);
        peer = new Peer(myPeerId, { debug: 1 });

        peer.on('open', (id) => {
            connectToHost();
        });

        peer.on('error', (err) => {
            console.error('PeerJS Client Error:', err);
            resetJoinButton('❌ เชื่อมต่อผิดพลาด ลองใหม่อีกครั้ง');
        });
    }

    function connectToHost() {
        const hostPeerId = PEER_PREFIX + roomCode;
        hostConnection = peer.connect(hostPeerId);

        hostConnection.on('open', () => {
            // ส่งแพ็คเกจลงทะเบียนชื่อเล่นเข้าห้อง
            hostConnection.send({
                type: 'JOIN',
                nickname: myNickname
            });

            playerWelcomeTitle.textContent = `กัปตัน ${myNickname}`;
            lobbyStatusText.textContent = 'พร้อมแข่ง!';
            showScreen('lobby');
            
            // เปลี่ยนชื่อเล่นในหน้าต่างๆ
            document.querySelectorAll('.my-nickname-span').forEach(el => {
                el.textContent = myNickname;
            });
        });

        hostConnection.on('data', (data) => {
            handleHostData(data);
        });

        hostConnection.on('close', () => {
            alert('การเชื่อมต่อกับจอกลาง (Host) ขาดหายไปแล้วครับ');
            location.reload();
        });

        hostConnection.on('error', (err) => {
            console.error('Host connection error:', err);
            resetJoinButton('❌ การเชื่อมต่อล้มเหลว');
        });
    }

    function resetJoinButton(msg) {
        btnJoinLobby.disabled = false;
        btnJoinLobby.textContent = '🚀 เข้าร่วมปาร์ตี้ (JOIN LOBBY)';
        alert(msg);
    }

    function handleHostData(data) {
        if (data.type === 'SYNC') {
            updatePlayersList(data.players);
        }
        else if (data.type === 'KICK') {
            alert(data.message || 'คุณถูกเตะออกจากห้องโดยแอดมิน');
            if (peer) peer.destroy();
            location.reload();
        }
        else if (data.type === 'CHANGE_GAME') {
            switchGameMode(data.game);
            triggerFullscreenPrompt();
        }
        else if (data.type === 'INIT_STATE') {
            if (data.gameActive) {
                switchGameMode(data.game);
                triggerFullscreenPrompt();
            }
        }
        else if (data.type === 'START_COUNTDOWN') {
            triggerFullscreenPrompt();
            if (currentMode === 'rocket') {
                runRocketCountdown();
            } else if (currentMode === 'catch') {
                runCatchCountdown(data.seed);
            } else if (currentMode === 'galaga') {
                runGalagaCountdown(data.seed);
            }
        }
        else if (data.type === 'START_GAME') {
            triggerFullscreenPrompt();
            if (currentMode === 'rocket') {
                startRocketController();
            } else if (currentMode === 'catch') {
                startCatchController(data.seed, data.duration || 60);
            } else if (currentMode === 'galaga') {
                startGalagaController(data.seed, data.duration || 60);
            }
        }
        else if (data.type === 'TIMER_TICK') {
            if (currentMode === 'rocket') {
                rocketCountdown.textContent = formatTime(data.timeLeft);
            } else if (currentMode === 'catch') {
                if (catchPlayerTimer) catchPlayerTimer.textContent = `${data.timeLeft}s`;
            } else if (currentMode === 'galaga') {
                if (galagaPlayerTimer) galagaPlayerTimer.textContent = `${data.timeLeft}s`;
            }
        }
        else if (data.type === 'UPDATE_PROGRESS') {
            if (currentMode === 'rocket') {
                updateRocketStandings(data.players);
            }
        }
        else if (data.type === 'CATCH_STANDINGS') {
            updateCatchStandings(data.standings);
        }
        else if (data.type === 'GALAGA_STANDINGS') {
            updateGalagaStandings(data.standings);
        }
        else if (data.type === 'GAME_OVER') {
            gameActive = false;
            if (currentMode === 'rocket') {
                btnTap.disabled = true;
                rocketAnnouncement.textContent = '🏁 สิ้นสุดการแข่งขัน!';
            } else if (currentMode === 'catch') {
                endCatchController();
            } else if (currentMode === 'galaga') {
                endGalagaController();
            }
        }
        // Buzz events
        else if (data.type === 'BUZZ_RELEASE') {
            btnBuzz.disabled = false;
            buzzStateLabel.textContent = '🚨 กดเลย! แย่งสัญญาณ! 🚨';
        }
        else if (data.type === 'BUZZ_RESET') {
            btnBuzz.disabled = true;
            buzzStateLabel.textContent = 'รอมุมปล่อยสัญญาณจากจอกลาง...';
            buzzRankBadge.textContent = '-';
        }
        // Wheel events
        else if (data.type === 'WHEEL_START') {
            showScreen('wheel');
            wheelPlayerStatus.textContent = 'ร่วมลุ้นรางวัล!';
            wheelPlayerStatus.style.color = '#fff';
            wheelPlayerInstruction.textContent = 'รายชื่อของคุณแสดงบนวงล้อที่จอกลางแล้ว รอลุ้นหมุนเสี่ยงทาย...';
            wheelStatusIcon.textContent = '🎡';
        }
        else if (data.type === 'WHEEL_WINNER') {
            if (data.winnerId === myPeerId) {
                triggerMobileConfetti();
                triggerDeviceVibrate([100, 50, 100, 50, 200]);
                wheelPlayerStatus.textContent = '🎉 คุณคือผู้ชนะ! 🎁';
                wheelPlayerStatus.style.color = 'var(--neon-gold)';
                wheelPlayerInstruction.textContent = `ยินดีด้วยกับคุณ ${data.winnerName}! แอดมินสุ่มวงล้อได้ชื่อคุณเป็นผู้ได้รับรางวัลประจำเวที!`;
                wheelStatusIcon.textContent = '👑';
            } else {
                wheelPlayerStatus.textContent = 'สุ่มวงล้อเสร็จสิ้น';
                wheelPlayerInstruction.textContent = `ผู้ได้รับรางวัลโชคดีคือ คุณ ${data.winnerName} ครับ`;
            }
        }
        else if (data.type === 'WHEEL_CLOSE_MODAL') {
            wheelPlayerStatus.textContent = 'ร่วมลุ้นของรางวัลรอบถัดไป...';
            wheelPlayerInstruction.textContent = 'กำลังรอแอดมินสุ่มวงล้อประจำรางวัลรอบใหม่';
            wheelStatusIcon.textContent = '🎡';
        }
        // Suite global results
        else if (data.type === 'SUITE_RESULTS') {
            showSuiteResults(data.leaderboard, data.winnerName);
        }
        else if (data.type === 'SUITE_RESET') {
            showScreen('lobby');
            lobbyInstruction.textContent = 'แอดมินล้างหน้าสรุปผลเรียบร้อย รอลุยโหมดเกมใหม่...';
        }
    }

    function updatePlayersList(players) {
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
                <div class="ready-badge">${player.score || 0} pts</div>
            `;
            listPlayers.appendChild(li);
        });
    }

    function switchGameMode(gameMode) {
        gameActive = false;
        triggerFullscreenPrompt();
        if (gameMode === 'rocket') {
            showScreen('rocket');
            btnTap.disabled = true;
            rocketAnnouncement.textContent = 'เตรียมตัวให้พร้อม...';
            rocketCountdown.textContent = '5';
            overdriveBar.style.width = '0%';
            myProgress = 0;
            statProgress.textContent = '0';
            statRank.textContent = '# -';
            statSpeed.textContent = '0 km/h';
        } else if (gameMode === 'catch') {
            showScreen('catch');
            resetCatchPlayerState();
            setTimeout(initCatchCanvas, 80);
        } else if (gameMode === 'galaga') {
            showScreen('galaga');
            resetGalagaPlayerState();
            setTimeout(initGalagaCanvas, 80);
        } else if (gameMode === 'buzz') {
            showScreen('buzz');
            btnBuzz.disabled = true;
            buzzStateLabel.textContent = 'รอมุมปล่อยสัญญาณจากจอกลาง...';
            buzzRankBadge.textContent = '-';
        } else if (gameMode === 'wheel') {
            showScreen('wheel');
            wheelPlayerStatus.textContent = 'ร่วมลุ้นรางวัล!';
            wheelPlayerInstruction.textContent = 'ชื่อของคุณอยู่บนวงล้อแล้ว รอลุ้นหมุนสุ่ม...';
        } else if (gameMode === 'lobby') {
            showScreen('lobby');
            lobbyInstruction.textContent = 'กลับสู่ห้องคอยหลักแล้ว รอลุยโหมดถัดไป...';
        }
    }

    // === 6. GAME 1: ROCKET RACING PLAYER LOGIC ===
    function runRocketCountdown() {
        rocketAnnouncement.textContent = 'เตรียมตัวออกตัว!';
        triggerDeviceVibrate(80);
    }

    function startRocketController() {
        gameActive = true;
        btnTap.disabled = false;
        rocketAnnouncement.textContent = 'เคาะรัวนิ้วพุ่งจรวดไปเล้ยยย! ⚡🔥';
    }

    function handleTap() {
        if (!gameActive || currentMode !== 'rocket') return;

        myProgress++;
        statProgress.textContent = myProgress;

        const now = Date.now();
        tapTimes.push(now);

        // คำนวณความเร็วการเคาะใน 1 วินาทีที่ผ่านมา (km/h)
        tapTimes = tapTimes.filter(t => now - t < 1000);
        const tapCount = tapTimes.length;
        const currentSpeed = Math.round(tapCount * 22.5); // สเกลตัวคูณความเร็ว
        statSpeed.innerHTML = `${currentSpeed} <small>km/h</small>`;

        // อัพเดตแถบ Overdrive (0-100%)
        const overdrivePct = Math.min(100, tapCount * 10);
        overdriveBar.style.width = `${overdrivePct}%`;

        // สั่นกระตุ้นมือถือเล็กน้อย
        triggerDeviceVibrate(25);

        // ส่งข้อมูลระยะทางกลับไปยังโฮสต์
        if (hostConnection && hostConnection.open) {
            hostConnection.send({
                type: 'TAP',
                progress: myProgress
            });
        }
    }

    function updateRocketStandings(players) {
        const sorted = Object.keys(players).sort((a, b) => players[b].progress - players[a].progress);
        const rank = sorted.indexOf(myPeerId) + 1;
        myRank = rank > 0 ? `#${rank}` : '# -';
        statRank.textContent = myRank;
    }

    // === 6.5 GAME 2: CATCH IT! (จับให้ไว ได้คะแนน) PLAYER LOGIC ===
    function createMulberry32(seed) {
        let s = (seed || 12345678) >>> 0;
        return function() {
            s = (s + 0x6D2B79F5) >>> 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function initCatchCanvas() {
        if (!catchPlayerCanvas) return;
        const rect = catchPlayerCanvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        catchPlayerCanvas.width = rect.width * dpr;
        catchPlayerCanvas.height = rect.height * dpr;
        catchCtx = catchPlayerCanvas.getContext('2d');
        catchCtx.scale(dpr, dpr);
        drawCatchStaticPreview();
    }

    function resetCatchPlayerState() {
        catchBasketX = 0.5;
        catchTargetBasketX = 0.5;
        catchScore = 0;
        catchCombo = 0;
        catchMaxCombo = 0;
        catchItems = [];
        catchParticles = [];
        catchFloatingTexts = [];
        catchShakeTimer = 0;
        if (catchAnimId) {
            cancelAnimationFrame(catchAnimId);
            catchAnimId = null;
        }
        if (catchCountdownTimer) {
            clearInterval(catchCountdownTimer);
            catchCountdownTimer = null;
        }
        if (catchPlayerScore) catchPlayerScore.textContent = '0';
        if (catchPlayerCombo) catchPlayerCombo.textContent = 'x0';
        if (catchPlayerRank) catchPlayerRank.textContent = '# -';
        if (catchPlayerTimer) catchPlayerTimer.textContent = '60s';
        if (catchPlayerAnnouncement) catchPlayerAnnouncement.textContent = 'เตรียมรับของรางวัลใน 1 นาที!';
        if (catchDragHint) catchDragHint.style.opacity = '1';
    }

    function runCatchCountdown(seed) {
        resetCatchPlayerState();
        initCatchCanvas();
        let count = 3;
        if (catchPlayerAnnouncement) catchPlayerAnnouncement.textContent = `พร้อมแล้วลุย... ${count}`;
        triggerDeviceVibrate(60);

        catchCountdownTimer = setInterval(() => {
            count--;
            if (count > 0) {
                if (catchPlayerAnnouncement) catchPlayerAnnouncement.textContent = `พร้อมแล้วลุย... ${count}`;
                triggerDeviceVibrate(60);
            } else if (count === 0) {
                if (catchPlayerAnnouncement) catchPlayerAnnouncement.textContent = 'จับให้ไว! ได้คะแนนเต็มที่! ⚡';
                clearInterval(catchCountdownTimer);
                catchCountdownTimer = null;
            }
        }, 1000);
    }

    function startCatchController(seed, duration = 60) {
        gameActive = true;
        resetCatchPlayerState();
        initCatchCanvas();
        catchPrng = createMulberry32(seed || Date.now());
        if (catchPlayerAnnouncement) catchPlayerAnnouncement.textContent = 'ลากนิ้วเลื่อนตะกร้ารับของให้ไว! 🏃‍♂️💨';
        if (catchPlayerTimer) catchPlayerTimer.textContent = `${duration}s`;
        
        catchLastFrameTime = performance.now();
        catchSpawnTimer = 0;
        catchLastTelemetryTime = 0;
        
        if (catchAnimId) cancelAnimationFrame(catchAnimId);
        catchAnimId = requestAnimationFrame(catchGameLoop);
    }

    function spawnCatchItem() {
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
            id: catchNextItemId++,
            type: selectedType.type,
            symbol: selectedType.symbol,
            color: selectedType.color,
            points: selectedType.points,
            comboInc: selectedType.comboInc,
            isBad: !!selectedType.isBad,
            soundFreq: selectedType.soundFreq,
            x: normX,
            y: -0.06,
            speed: selectedType.speed + (catchPrng() * 0.08 - 0.04),
            rot: 0,
            rotSpeed: (catchPrng() - 0.5) * 3
        });
    }

    function catchGameLoop(timestamp) {
        if (!gameActive || currentMode !== 'catch') {
            catchAnimId = null;
            return;
        }

        const dt = Math.min(0.1, (timestamp - catchLastFrameTime) / 1000);
        catchLastFrameTime = timestamp;

        // Smooth basket interpolation
        catchBasketX += (catchTargetBasketX - catchBasketX) * 0.35;

        // Spawn items (every ~0.65s)
        catchSpawnTimer += dt;
        if (catchSpawnTimer > 0.65) {
            spawnCatchItem();
            catchSpawnTimer = 0;
        }

        // Update items
        for (let i = catchItems.length - 1; i >= 0; i--) {
            const item = catchItems[i];
            item.y += item.speed * dt;
            item.rot += item.rotSpeed * dt;

            // Basket collision check (basket is at y = 0.85, width 0.24)
            const basketY = 0.85;
            const basketHalfW = 0.12;

            if (item.y >= basketY - 0.04 && item.y <= basketY + 0.05) {
                if (Math.abs(item.x - catchBasketX) < basketHalfW) {
                    handleItemCaught(item);
                    catchItems.splice(i, 1);
                    continue;
                }
            }

            // Missed item dropped past bottom
            if (item.y > 1.05) {
                if (!item.isBad && catchCombo > 5) {
                    catchCombo = Math.floor(catchCombo / 2);
                    if (catchPlayerCombo) catchPlayerCombo.textContent = `x${catchCombo}`;
                }
                catchItems.splice(i, 1);
            }
        }

        // Update floating texts
        for (let i = catchFloatingTexts.length - 1; i >= 0; i--) {
            const ft = catchFloatingTexts[i];
            ft.y -= 0.12 * dt;
            ft.alpha -= 1.2 * dt;
            if (ft.alpha <= 0) catchFloatingTexts.splice(i, 1);
        }

        // Update particles
        for (let i = catchParticles.length - 1; i >= 0; i--) {
            const p = catchParticles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.alpha -= 1.5 * dt;
            if (p.alpha <= 0) catchParticles.splice(i, 1);
        }

        // Screen shake decay
        if (catchShakeTimer > 0) catchShakeTimer -= dt;

        // Send telemetry (approx 15 times per second)
        if (timestamp - catchLastTelemetryTime > 65) {
            sendCatchTelemetry();
            catchLastTelemetryTime = timestamp;
        }

        // Render scene
        drawCatchScene();

        catchAnimId = requestAnimationFrame(catchGameLoop);
    }

    function handleItemCaught(item) {
        if (item.isBad) {
            const penalty = Math.abs(item.points);
            catchScore = Math.max(0, catchScore - penalty);
            catchCombo = 0;
            catchShakeTimer = 0.3;
            triggerDeviceVibrate([100, 50, 100]);
            playSynthBeep(item.soundFreq || 140, 0.25);
            
            addCatchFloatingText(catchBasketX, 0.81, `-${penalty} 💥`, '#ff0055');
            spawnCatchParticles(catchBasketX, 0.85, '#ff0055', 12);
        } else {
            catchCombo++;
            if (catchCombo > catchMaxCombo) catchMaxCombo = catchCombo;
            const comboMultiplier = 1 + Math.floor(catchCombo / 5) * 0.2;
            const earned = Math.round(item.points * comboMultiplier);
            catchScore += earned;

            triggerDeviceVibrate(25);
            playSynthBeep(item.soundFreq || 700, 0.1);

            const comboText = catchCombo > 1 ? `+${earned} (x${catchCombo})` : `+${earned}`;
            addCatchFloatingText(catchBasketX, 0.81, comboText, item.color);
            spawnCatchParticles(catchBasketX, 0.85, item.color, 10);
        }

        if (catchPlayerScore) catchPlayerScore.textContent = catchScore;
        if (catchPlayerCombo) catchPlayerCombo.textContent = `x${catchCombo}`;

        sendCatchTelemetry();
    }

    function addCatchFloatingText(x, y, text, color) {
        catchFloatingTexts.push({ x, y, text, color, alpha: 1.0 });
    }

    function spawnCatchParticles(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.15 + Math.random() * 0.35;
            catchParticles.push({
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

    function sendCatchTelemetry() {
        if (!hostConnection || !hostConnection.open) return;
        hostConnection.send({
            type: 'CATCH_UPDATE',
            basketX: catchBasketX,
            score: catchScore,
            combo: catchCombo
        });
    }

    function updateCatchStandings(standings) {
        if (!standings || !Array.isArray(standings)) return;
        const myIdx = standings.findIndex(s => s.peerId === myPeerId);
        if (myIdx >= 0) {
            const myRankNum = myIdx + 1;
            if (catchPlayerRank) {
                catchPlayerRank.textContent = `#${myRankNum}`;
                catchPlayerRank.style.color = myRankNum === 1 ? 'var(--neon-gold)' : 
                                             myRankNum === 2 ? '#c0c0c0' : 
                                             myRankNum === 3 ? '#cd7f32' : 'var(--accent)';
            }
        }
    }

    function drawCatchScene() {
        if (!catchCtx || !catchPlayerCanvas) return;
        const rect = catchPlayerCanvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        catchCtx.save();

        if (catchShakeTimer > 0) {
            const shakeMagnitude = (catchShakeTimer / 0.3) * 6;
            const offsetX = (Math.random() - 0.5) * shakeMagnitude;
            const offsetY = (Math.random() - 0.5) * shakeMagnitude;
            catchCtx.translate(offsetX, offsetY);
        }

        // Background
        const bgGrad = catchCtx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#060a17');
        bgGrad.addColorStop(1, '#020308');
        catchCtx.fillStyle = bgGrad;
        catchCtx.fillRect(0, 0, w, h);

        // Grid lines
        catchCtx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
        catchCtx.lineWidth = 1;
        const gridSize = 32;
        for (let gx = 0; gx < w; gx += gridSize) {
            catchCtx.beginPath();
            catchCtx.moveTo(gx, 0);
            catchCtx.lineTo(gx, h);
            catchCtx.stroke();
        }

        // Falling items
        catchItems.forEach(item => {
            const ix = item.x * w;
            const iy = item.y * h;
            const itemSize = Math.max(26, w * 0.08);

            catchCtx.save();
            catchCtx.translate(ix, iy);
            catchCtx.rotate(item.rot);

            catchCtx.shadowColor = item.color;
            catchCtx.shadowBlur = 12;

            catchCtx.font = `${Math.round(itemSize)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
            catchCtx.textAlign = 'center';
            catchCtx.textBaseline = 'middle';
            catchCtx.fillText(item.symbol, 0, 0);

            catchCtx.restore();
        });

        // Basket
        const bx = catchBasketX * w;
        const by = 0.85 * h;
        const bw = w * 0.24;
        const bh = Math.max(16, h * 0.045);

        catchCtx.shadowColor = catchCombo > 5 ? '#ffcc00' : 'rgba(0, 240, 255, 0.8)';
        catchCtx.shadowBlur = catchCombo > 5 ? 20 : 12;

        const basketGrad = catchCtx.createLinearGradient(bx - bw/2, by, bx + bw/2, by + bh);
        if (catchCombo > 10) {
            basketGrad.addColorStop(0, '#ff0077');
            basketGrad.addColorStop(0.5, '#ffcc00');
            basketGrad.addColorStop(1, '#00f0ff');
        } else {
            basketGrad.addColorStop(0, '#00f0ff');
            basketGrad.addColorStop(1, '#7000ff');
        }

        catchCtx.fillStyle = basketGrad;
        catchCtx.beginPath();
        catchCtx.roundRect(bx - bw/2, by, bw, bh, [6, 6, 12, 12]);
        catchCtx.fill();

        catchCtx.strokeStyle = '#ffffff';
        catchCtx.lineWidth = 2;
        catchCtx.stroke();

        catchCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        catchCtx.lineWidth = 1;
        catchCtx.beginPath();
        catchCtx.moveTo(bx - bw * 0.35, by + 4);
        catchCtx.lineTo(bx - bw * 0.35, by + bh - 2);
        catchCtx.moveTo(bx, by + 4);
        catchCtx.lineTo(bx, by + bh - 2);
        catchCtx.moveTo(bx + bw * 0.35, by + 4);
        catchCtx.lineTo(bx + bw * 0.35, by + bh - 2);
        catchCtx.stroke();

        // Player Tag
        catchCtx.shadowBlur = 0;
        catchCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        catchCtx.font = 'bold 11px Inter, sans-serif';
        catchCtx.textAlign = 'center';
        catchCtx.fillText(myNickname || 'YOU', bx, by - 6);

        // Particles
        catchParticles.forEach(p => {
            catchCtx.save();
            catchCtx.globalAlpha = Math.max(0, p.alpha);
            catchCtx.fillStyle = p.color;
            catchCtx.shadowColor = p.color;
            catchCtx.shadowBlur = 8;
            catchCtx.beginPath();
            catchCtx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
            catchCtx.fill();
            catchCtx.restore();
        });

        // Floating texts
        catchFloatingTexts.forEach(ft => {
            catchCtx.save();
            catchCtx.globalAlpha = Math.max(0, ft.alpha);
            catchCtx.fillStyle = ft.color;
            catchCtx.shadowColor = ft.color;
            catchCtx.shadowBlur = 10;
            catchCtx.font = 'bold 15px Inter, sans-serif';
            catchCtx.textAlign = 'center';
            catchCtx.fillText(ft.text, ft.x * w, ft.y * h);
            catchCtx.restore();
        });

        catchCtx.restore();
    }

    function drawCatchStaticPreview() {
        if (!catchCtx || !catchPlayerCanvas) return;
        const rect = catchPlayerCanvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        catchCtx.save();
        const bgGrad = catchCtx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#060a17');
        bgGrad.addColorStop(1, '#020308');
        catchCtx.fillStyle = bgGrad;
        catchCtx.fillRect(0, 0, w, h);

        const bx = 0.5 * w;
        const by = 0.85 * h;
        const bw = w * 0.24;
        const bh = Math.max(16, h * 0.045);
        catchCtx.fillStyle = '#00f0ff';
        catchCtx.beginPath();
        catchCtx.roundRect(bx - bw/2, by, bw, bh, [6, 6, 12, 12]);
        catchCtx.fill();
        catchCtx.restore();
    }

    function endCatchController() {
        gameActive = false;
        if (catchAnimId) {
            cancelAnimationFrame(catchAnimId);
            catchAnimId = null;
        }
        if (catchPlayerAnnouncement) catchPlayerAnnouncement.textContent = '🏁 หมดเวลา 1 นาทีแล้วครับ!';
        triggerMobileConfetti();
        triggerDeviceVibrate([100, 50, 100, 50, 200]);
    }

    function playSynthBeep(frequency = 440, duration = 0.1) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
            
            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + duration);
        } catch (e) {
            // AudioContext might be restricted until user interaction
        }
    }

    // === 6.7 GAME: GALAGA '88 (สงครามอวกาศล่าแต้ม) PLAYER LOGIC ===
    function initGalagaCanvas() {
        if (!galagaPlayerCanvas) return;
        const rect = galagaPlayerCanvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        galagaPlayerCanvas.width = rect.width * dpr;
        galagaPlayerCanvas.height = rect.height * dpr;
        galagaCtx = galagaPlayerCanvas.getContext('2d');
        galagaCtx.scale(dpr, dpr);
        initGalagaStars(rect.width, rect.height);
        drawGalagaStaticPreview();
    }

    function initGalagaStars(w, h) {
        galagaStars = [];
        for (let i = 0; i < 40; i++) {
            galagaStars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: Math.random() * 2 + 1,
                speed: 40 + Math.random() * 80,
                color: Math.random() > 0.6 ? '#00f0ff' : Math.random() > 0.3 ? '#ffffff' : '#ff00aa',
                alpha: Math.random() * 0.7 + 0.3
            });
        }
    }

    function resetGalagaPlayerState() {
        galagaShipX = 0.5;
        galagaTargetShipX = 0.5;
        galagaScore = 0;
        galagaCombo = 0;
        galagaMaxCombo = 0;
        galagaLasers = [];
        galagaEnemies = [];
        galagaParticles = [];
        galagaFloatingTexts = [];
        galagaDualFighter = false;
        galagaDualTimer = 0;
        galagaFireCooldown = 0;
        galagaIsFiring = false;
        galagaShakeTimer = 0;
        galagaSpawnTimer = 0;
        galagaNextEnemyId = 1;

        if (galagaAnimId) {
            cancelAnimationFrame(galagaAnimId);
            galagaAnimId = null;
        }
        if (galagaCountdownTimer) {
            clearInterval(galagaCountdownTimer);
            galagaCountdownTimer = null;
        }

        if (galagaPlayerScore) galagaPlayerScore.textContent = '0';
        if (galagaPlayerCombo) galagaPlayerCombo.textContent = 'x0';
        if (galagaPlayerRank) galagaPlayerRank.textContent = '# -';
        if (galagaPlayerTimer) galagaPlayerTimer.textContent = '60s';
        if (galagaPlayerAnnouncement) galagaPlayerAnnouncement.textContent = 'เตรียมสอยฝูงเอเลี่ยนใน 1 นาที!';
        if (galagaDragHint) galagaDragHint.style.opacity = '1';
    }

    function runGalagaCountdown(seed) {
        resetGalagaPlayerState();
        initGalagaCanvas();
        let count = 3;
        if (galagaPlayerAnnouncement) galagaPlayerAnnouncement.textContent = `ระบบอาวุธพร้อม... ${count}`;
        triggerDeviceVibrate(60);

        galagaCountdownTimer = setInterval(() => {
            count--;
            if (count > 0) {
                if (galagaPlayerAnnouncement) galagaPlayerAnnouncement.textContent = `ระบบอาวุธพร้อม... ${count}`;
                triggerDeviceVibrate(60);
            } else if (count === 0) {
                if (galagaPlayerAnnouncement) galagaPlayerAnnouncement.textContent = 'ยิงถล่มเอเลี่ยนล่าแต้มเต็มกำลัง! ⚡👾';
                clearInterval(galagaCountdownTimer);
                galagaCountdownTimer = null;
            }
        }, 1000);
    }

    function startGalagaController(seed, duration = 60) {
        gameActive = true;
        resetGalagaPlayerState();
        initGalagaCanvas();
        galagaPrng = createMulberry32(seed || Date.now());
        if (galagaPlayerAnnouncement) galagaPlayerAnnouncement.textContent = 'ยิงเอเลี่ยน! ระวังยิงผิดพวก 👨‍🚀 หรือระเบิด 💣 ลดคะแนน!';
        if (galagaPlayerTimer) galagaPlayerTimer.textContent = `${duration}s`;

        galagaLastFrameTime = performance.now();
        galagaLastTelemetryTime = 0;

        if (galagaAnimId) cancelAnimationFrame(galagaAnimId);
        galagaAnimId = requestAnimationFrame(galagaGameLoop);
    }

    function triggerFireLaser() {
        if (!gameActive || currentMode !== 'galaga') return;
        if (galagaFireCooldown > 0) return;

        galagaFireCooldown = 0.15;

        if (galagaDualFighter) {
            galagaLasers.push({ x: galagaShipX - 0.045, y: 0.81, speed: 1.3, damage: 1, color: '#00ffff' });
            galagaLasers.push({ x: galagaShipX + 0.045, y: 0.81, speed: 1.3, damage: 1, color: '#00ffff' });
            playSynthBeep(980, 0.04);
            setTimeout(() => playSynthBeep(1200, 0.04), 20);
        } else {
            galagaLasers.push({ x: galagaShipX, y: 0.81, speed: 1.3, damage: 1, color: '#ff3366' });
            playSynthBeep(880, 0.05);
        }

        triggerDeviceVibrate(15);
    }

    function spawnGalagaEnemy() {
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

    function galagaGameLoop(timestamp) {
        if (!gameActive || currentMode !== 'galaga') {
            galagaAnimId = null;
            return;
        }

        const dt = Math.min(0.1, (timestamp - galagaLastFrameTime) / 1000);
        galagaLastFrameTime = timestamp;

        if (!galagaPlayerCanvas) return;
        const rect = galagaPlayerCanvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        // Ship movement lerp
        galagaShipX += (galagaTargetShipX - galagaShipX) * 0.38;

        // Laser cooldown & auto-fire
        if (galagaFireCooldown > 0) galagaFireCooldown -= dt;
        if (galagaIsFiring && galagaFireCooldown <= 0) {
            triggerFireLaser();
        }

        // Dual Fighter Timer
        if (galagaDualFighter) {
            galagaDualTimer -= dt;
            if (galagaDualTimer <= 0) {
                galagaDualFighter = false;
                addGalagaFloatingText(galagaShipX, 0.78, 'DUAL EXPIRED', '#ffaa00');
            }
        }

        // Stars scroll down
        galagaStars.forEach(star => {
            star.y += star.speed * dt;
            if (star.y > h) {
                star.y = 0;
                star.x = Math.random() * w;
            }
        });

        // Spawn Enemies
        galagaSpawnTimer += dt;
        if (galagaSpawnTimer > 0.55) {
            spawnGalagaEnemy();
            galagaSpawnTimer = 0;
        }

        // Update Lasers
        for (let i = galagaLasers.length - 1; i >= 0; i--) {
            const laser = galagaLasers[i];
            laser.y -= laser.speed * dt;
            if (laser.y < -0.05) {
                galagaLasers.splice(i, 1);
                // ยิงวืดหลุดขอบจอ (Missed Laser Penalty: ลด -2 แต้ม ป้องกันกดยิงมั่ว)
                if (galagaScore > 0) {
                    galagaScore = Math.max(0, galagaScore - 2);
                    if (galagaPlayerScore) galagaPlayerScore.textContent = galagaScore;
                    addGalagaFloatingText(laser.x, 0.06, '-2 MISS', 'rgba(255, 90, 90, 0.7)');
                }
            }
        }

        // Update Enemies & Collision with Lasers
        for (let i = galagaEnemies.length - 1; i >= 0; i--) {
            const enemy = galagaEnemies[i];
            enemy.y += enemy.speed * dt;
            enemy.x += Math.sin(enemy.y * 7 + enemy.swoopOffset) * 0.15 * dt;
            enemy.x = Math.max(0.08, Math.min(0.92, enemy.x));

            let enemyDestroyed = false;

            for (let j = galagaLasers.length - 1; j >= 0; j--) {
                const laser = galagaLasers[j];
                const hitRadius = enemy.type === 'boss' ? 0.08 : 0.055;
                if (Math.abs(laser.x - enemy.x) < hitRadius && Math.abs(laser.y - enemy.y) < hitRadius) {
                    enemy.hp -= laser.damage;
                    galagaLasers.splice(j, 1);
                    spawnGalagaParticles(enemy.x, enemy.y, laser.color, 4);

                    if (enemy.hp <= 0) {
                        enemyDestroyed = true;
                        handleEnemyDestroyed(enemy);
                        galagaEnemies.splice(i, 1);
                        break;
                    } else {
                        playSynthBeep(400, 0.04);
                    }
                }
            }

            if (enemyDestroyed) continue;

            // Collision with ship
            if (Math.abs(enemy.y - 0.84) < 0.05 && Math.abs(enemy.x - galagaShipX) < 0.08) {
                if (enemy.isFriendly) {
                    // ช่วยเหลือนักบินอวกาศพวกเดียวกันได้สำเร็จ!
                    galagaScore += 20;
                    playSynthBeep(920, 0.18);
                    triggerDeviceVibrate([40, 40, 60]);
                    addGalagaFloatingText(galagaShipX, 0.78, '+20 👨‍🚀 RESCUED!', '#00ff88');
                    spawnGalagaParticles(galagaShipX, 0.84, '#00ff88', 10);
                } else {
                    galagaShakeTimer = 0.35;
                    galagaCombo = 0;
                    galagaScore = Math.max(0, galagaScore - 20);
                    triggerDeviceVibrate([100, 50, 100]);
                    playSynthBeep(140, 0.25);
                    const hitLabel = enemy.isMine ? '-20 💣 ชนทุ่นระเบิด!' : '-20 💥 ยานถูกชน!';
                    addGalagaFloatingText(galagaShipX, 0.78, hitLabel, '#ff0055');
                    spawnGalagaParticles(galagaShipX, 0.84, '#ff0055', 12);
                }
                galagaEnemies.splice(i, 1);
                if (galagaPlayerScore) galagaPlayerScore.textContent = galagaScore;
                if (galagaPlayerCombo) galagaPlayerCombo.textContent = `x${galagaCombo}`;
                sendGalagaTelemetry();
                continue;
            }

            if (enemy.y > 1.05) {
                galagaEnemies.splice(i, 1);
            }
        }

        // Floating texts
        for (let i = galagaFloatingTexts.length - 1; i >= 0; i--) {
            const ft = galagaFloatingTexts[i];
            ft.y -= 0.12 * dt;
            ft.alpha -= 1.2 * dt;
            if (ft.alpha <= 0) galagaFloatingTexts.splice(i, 1);
        }

        // Particles
        for (let i = galagaParticles.length - 1; i >= 0; i--) {
            const p = galagaParticles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.alpha -= 1.6 * dt;
            if (p.alpha <= 0) galagaParticles.splice(i, 1);
        }

        if (galagaShakeTimer > 0) galagaShakeTimer -= dt;

        if (timestamp - galagaLastTelemetryTime > 65) {
            sendGalagaTelemetry();
            galagaLastTelemetryTime = timestamp;
        }

        drawGalagaScene(w, h);

        galagaAnimId = requestAnimationFrame(galagaGameLoop);
    }

    function handleEnemyDestroyed(enemy) {
        if (enemy.isPowerUp) {
            galagaDualFighter = true;
            galagaDualTimer = 15;
            galagaScore += enemy.points;
            playSynthBeep(1200, 0.2);
            triggerDeviceVibrate([50, 50, 100]);
            addGalagaFloatingText(enemy.x, enemy.y, '⭐ DUAL FIGHTER! +50', '#00ff88');
            spawnGalagaParticles(enemy.x, enemy.y, '#00ff88', 14);
        } else if (enemy.isFriendly) {
            // ยิงผิด! ยิงโดนนักบินพวกเดียวกัน (Friendly Fire)
            const penalty = 30;
            galagaScore = Math.max(0, galagaScore - penalty);
            galagaCombo = 0; // ล้างคอมโบ
            galagaShakeTimer = 0.25;
            playSynthBeep(160, 0.25); // เสียงเตือนติดลบ
            triggerDeviceVibrate([100, 50, 100]);
            addGalagaFloatingText(enemy.x, enemy.y, '-30 👨‍🚀 ยิงผิดพวก!', '#ff0055');
            spawnGalagaParticles(enemy.x, enemy.y, '#ff0055', 12);
        } else if (enemy.isMine) {
            // ยิงผิด! ยิงโดนทุ่นระเบิดอวกาศ (Space Mine)
            const penalty = 20;
            galagaScore = Math.max(0, galagaScore - penalty);
            galagaCombo = 0; // ล้างคอมโบ
            galagaShakeTimer = 0.35;
            playSynthBeep(120, 0.3); // เสียงบึ้ม
            triggerDeviceVibrate([120, 60, 120]);
            addGalagaFloatingText(enemy.x, enemy.y, '-20 💣 บึ้ม! โดนระเบิด', '#ff4400');
            spawnGalagaParticles(enemy.x, enemy.y, '#ff4400', 16);
        } else {
            galagaCombo++;
            if (galagaCombo > galagaMaxCombo) galagaMaxCombo = galagaCombo;
            const mult = 1 + Math.floor(galagaCombo / 4) * 0.25;
            const earned = Math.round(enemy.points * mult);
            galagaScore += earned;

            playSynthBeep(enemy.type === 'boss' ? 220 : 600, 0.1);
            triggerDeviceVibrate(20);

            const comboLabel = galagaCombo > 1 ? `+${earned} (x${galagaCombo})` : `+${earned}`;
            addGalagaFloatingText(enemy.x, enemy.y, comboLabel, enemy.color);
            spawnGalagaParticles(enemy.x, enemy.y, enemy.color, enemy.type === 'boss' ? 18 : 8);
        }

        if (galagaPlayerScore) galagaPlayerScore.textContent = galagaScore;
        if (galagaPlayerCombo) galagaPlayerCombo.textContent = `x${galagaCombo}`;

        sendGalagaTelemetry();
    }

    function addGalagaFloatingText(x, y, text, color) {
        galagaFloatingTexts.push({ x, y, text, color, alpha: 1.0 });
    }

    function spawnGalagaParticles(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.15 + Math.random() * 0.4;
            galagaParticles.push({
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

    function sendGalagaTelemetry() {
        if (!hostConnection || !hostConnection.open) return;
        hostConnection.send({
            type: 'GALAGA_UPDATE',
            shipX: galagaShipX,
            score: galagaScore,
            combo: galagaCombo,
            dualFighter: galagaDualFighter
        });
    }

    function updateGalagaStandings(standings) {
        if (!standings || !Array.isArray(standings)) return;
        const myIdx = standings.findIndex(s => s.peerId === myPeerId);
        if (myIdx >= 0) {
            const myRankNum = myIdx + 1;
            if (galagaPlayerRank) {
                galagaPlayerRank.textContent = `#${myRankNum}`;
                galagaPlayerRank.style.color = myRankNum === 1 ? 'var(--neon-gold)' : 
                                              myRankNum === 2 ? '#c0c0c0' : 
                                              myRankNum === 3 ? '#cd7f32' : 'var(--accent)';
            }
        }
    }

    function drawGalagaScene(w, h) {
        if (!galagaCtx) return;

        galagaCtx.save();

        if (galagaShakeTimer > 0) {
            const mag = (galagaShakeTimer / 0.35) * 7;
            galagaCtx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
        }

        galagaCtx.fillStyle = '#02030a';
        galagaCtx.fillRect(0, 0, w, h);

        galagaStars.forEach(s => {
            galagaCtx.save();
            galagaCtx.globalAlpha = s.alpha;
            galagaCtx.fillStyle = s.color;
            galagaCtx.fillRect(s.x, s.y, s.size, s.size);
            galagaCtx.restore();
        });

        galagaLasers.forEach(laser => {
            const lx = laser.x * w;
            const ly = laser.y * h;
            galagaCtx.save();
            galagaCtx.shadowColor = laser.color;
            galagaCtx.shadowBlur = 10;
            galagaCtx.fillStyle = laser.color;
            galagaCtx.fillRect(lx - 2.5, ly - 10, 5, 20);
            galagaCtx.restore();
        });

        galagaEnemies.forEach(e => {
            const ex = e.x * w;
            const ey = e.y * h;
            const eSize = e.type === 'boss' ? 34 : 26;

            galagaCtx.save();
            galagaCtx.translate(ex, ey);

            galagaCtx.shadowColor = e.color;
            galagaCtx.shadowBlur = 12;

            galagaCtx.font = `${eSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
            galagaCtx.textAlign = 'center';
            galagaCtx.textBaseline = 'middle';
            galagaCtx.fillText(e.symbol, 0, 0);

            if (e.isFriendly) {
                galagaCtx.save();
                galagaCtx.strokeStyle = 'rgba(56, 239, 125, 0.75)';
                galagaCtx.lineWidth = 1.5;
                galagaCtx.beginPath();
                galagaCtx.arc(0, 0, 16, 0, Math.PI * 2);
                galagaCtx.stroke();
                galagaCtx.font = 'bold 9px Inter, sans-serif';
                galagaCtx.fillStyle = '#38ef7d';
                galagaCtx.fillText('FRIEND', 0, -18);
                galagaCtx.restore();
            } else if (e.isMine) {
                galagaCtx.save();
                galagaCtx.strokeStyle = 'rgba(255, 8, 68, 0.8)';
                galagaCtx.lineWidth = 1.5;
                galagaCtx.setLineDash([3, 3]);
                galagaCtx.beginPath();
                galagaCtx.arc(0, 0, 16, 0, Math.PI * 2);
                galagaCtx.stroke();
                galagaCtx.font = 'bold 9px Inter, sans-serif';
                galagaCtx.fillStyle = '#ff0844';
                galagaCtx.fillText('DANGER', 0, -18);
                galagaCtx.restore();
            }

            if (e.maxHp > 1) {
                const barW = 28;
                const barH = 3;
                const hpPct = Math.max(0, e.hp / e.maxHp);
                galagaCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                galagaCtx.fillRect(-barW/2, -eSize/2 - 6, barW, barH);
                galagaCtx.fillStyle = e.color;
                galagaCtx.fillRect(-barW/2, -eSize/2 - 6, barW * hpPct, barH);
            }

            galagaCtx.restore();
        });

        const sx = galagaShipX * w;
        const sy = 0.84 * h;

        galagaCtx.save();
        galagaCtx.translate(sx, sy);

        const flameH = 12 + Math.random() * 8;
        const flameGrad = galagaCtx.createLinearGradient(0, 10, 0, 10 + flameH);
        flameGrad.addColorStop(0, '#00f0ff');
        flameGrad.addColorStop(1, 'transparent');
        galagaCtx.fillStyle = flameGrad;
        galagaCtx.beginPath();
        galagaCtx.moveTo(-6, 10);
        galagaCtx.lineTo(6, 10);
        galagaCtx.lineTo(0, 10 + flameH);
        galagaCtx.closePath();
        galagaCtx.fill();

        if (galagaDualFighter) {
            drawStarfighterUnit(galagaCtx, -12, 0, '#00f0ff');
            drawStarfighterUnit(galagaCtx, 12, 0, '#00f0ff');
            galagaCtx.strokeStyle = '#00ff88';
            galagaCtx.lineWidth = 2;
            galagaCtx.beginPath();
            galagaCtx.moveTo(-10, 0);
            galagaCtx.lineTo(10, 0);
            galagaCtx.stroke();
        } else {
            drawStarfighterUnit(galagaCtx, 0, 0, '#ff3366');
        }

        galagaCtx.shadowBlur = 0;
        galagaCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        galagaCtx.font = 'bold 10px Inter, sans-serif';
        galagaCtx.textAlign = 'center';
        galagaCtx.fillText(myNickname || 'PILOT', 0, -22);

        galagaCtx.restore();

        galagaParticles.forEach(p => {
            galagaCtx.save();
            galagaCtx.globalAlpha = Math.max(0, p.alpha);
            galagaCtx.fillStyle = p.color;
            galagaCtx.shadowColor = p.color;
            galagaCtx.shadowBlur = 8;
            galagaCtx.beginPath();
            galagaCtx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
            galagaCtx.fill();
            galagaCtx.restore();
        });

        galagaFloatingTexts.forEach(ft => {
            galagaCtx.save();
            galagaCtx.globalAlpha = Math.max(0, ft.alpha);
            galagaCtx.fillStyle = ft.color;
            galagaCtx.shadowColor = ft.color;
            galagaCtx.shadowBlur = 10;
            galagaCtx.font = 'bold 15px Inter, sans-serif';
            galagaCtx.textAlign = 'center';
            galagaCtx.fillText(ft.text, ft.x * w, ft.y * h);
            galagaCtx.restore();
        });

        galagaCtx.restore();
    }

    function drawStarfighterUnit(ctx, ox, oy, themeColor) {
        ctx.save();
        ctx.translate(ox, oy);

        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 12;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(12, 10);
        ctx.lineTo(6, 6);
        ctx.lineTo(-6, 6);
        ctx.lineTo(-12, 10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = themeColor;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(4, 2);
        ctx.lineTo(-4, 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    function drawGalagaStaticPreview() {
        if (!galagaCtx || !galagaPlayerCanvas) return;
        const rect = galagaPlayerCanvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        galagaCtx.save();
        galagaCtx.fillStyle = '#02030a';
        galagaCtx.fillRect(0, 0, w, h);
        drawStarfighterUnit(galagaCtx, 0.5 * w, 0.84 * h, '#ff3366');
        galagaCtx.restore();
    }

    function endGalagaController() {
        gameActive = false;
        if (galagaAnimId) {
            cancelAnimationFrame(galagaAnimId);
            galagaAnimId = null;
        }
        if (galagaPlayerAnnouncement) galagaPlayerAnnouncement.textContent = '🏁 สิ้นสุดภารกิจอวกาศ 1 นาที!';
        triggerMobileConfetti();
        triggerDeviceVibrate([100, 50, 100, 50, 200]);
    }

    // === 7. GAME 2: FAST BUZZ! PLAYER LOGIC ===
    function pressBuzz() {
        if (btnBuzz.disabled) return;
        btnBuzz.disabled = true;
        
        buzzStateLabel.textContent = '⚡ ส่งสัญญาณไปที่เวทีแล้ว! ⚡';
        triggerDeviceVibrate(150);

        if (hostConnection && hostConnection.open) {
            hostConnection.send({
                type: 'BUZZ_PRESS'
            });
        }
    }

    // === 8. GLOBAL RESULT SUITE SCOREBOARD ===
    function showSuiteResults(leaderboard, winnerName) {
        winnerAnnouncement.textContent = winnerName;
        leaderboardList.innerHTML = '';

        leaderboard.forEach((player, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="leaderboard-rank">#${index + 1}</span>
                <span class="leaderboard-name">${escapeHTML(player.nickname)}</span>
                <span class="leaderboard-score">${player.score} คะแนนสะสม</span>
            `;
            leaderboardList.appendChild(li);
        });

        showScreen('result');
    }

    function leaveLobby() {
        if (confirm('คุณแน่ใจว่าต้องการออกจากการปาร์ตี้ห้องนี้ใช่ไหมครับ?')) {
            if (peer) peer.destroy();
            location.reload();
        }
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    // === 9. DEVICE API EFFECTS ===
    function triggerDeviceVibrate(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    function triggerMobileConfetti() {
        confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.8 }
        });
    }
});
