// GFleth Party Game Hub - Firebase Cloud Realtime Configuration
// ใช้สำหรับเชื่อมต่อคลาวด์ศูนย์กลางผ่านพอร์ต 443 (HTTPS/WSS) รองรับมือถือ 4G/5G และ Wi-Fi 100%

let defaultFirebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// ดึงคอนฟิกจาก LocalStorage หากผู้ใช้เคยกดบันทึกไว้ในเบราว์เซอร์
function getActiveFirebaseConfig() {
    try {
        const saved = localStorage.getItem('gfleth_firebase_config');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.apiKey && parsed.databaseURL && parsed.apiKey !== "YOUR_API_KEY") {
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Cannot read localStorage firebase config:', e);
    }
    return defaultFirebaseConfig;
}

function isFirebaseConfigured() {
    const cfg = getActiveFirebaseConfig();
    return cfg && cfg.apiKey && cfg.apiKey !== "YOUR_API_KEY" && cfg.databaseURL && cfg.databaseURL.indexOf("YOUR_PROJECT_ID") === -1;
}

// ฟังก์ชันเริ่มต้นเชื่อมต่อ Firebase App และ Database
function initFirebaseApp() {
    const config = getActiveFirebaseConfig();
    if (!firebase.apps.length) {
        firebase.initializeApp(config);
    }
    return firebase.database();
}
