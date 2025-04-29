// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyA0FUYw_qt1PRBklf-QvJscHFDh7oLKhb4",
    authDomain: "server-d137e.firebaseapp.com",
    databaseURL: "https://server-d137e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "server-d137e",
    storageBucket: "server-d137e.firebasestorage.app",
    messagingSenderId: "294497125389",
    appId: "1:294497125389:web:ae3426d6a424320f28c144",
    measurementId: "G-7C1Z271Y9J"  
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 获取DOM元素
const settingsIcon = document.getElementById('settingsIcon');
const loginModal = document.getElementById('loginModal');
const closeModal = document.getElementById('closeModal');
const loginButton = document.getElementById('loginButton');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginMessage = document.getElementById('loginMessage');
const blocksContainer = document.getElementById('blocksContainer');
const headerTitle = document.getElementById('headerTitle');
const marqueeContent = document.getElementById('marqueeContent');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');
const notificationIcon = document.getElementById('notificationIcon');

// 自定义通知函数
function showNotification(message, type = 'success') {
    // 设置消息
    notificationMessage.textContent = message;
    
    // 设置图标和类型
    notification.className = 'notification ' + type;
    
    if (type === 'success') {
        notificationIcon.textContent = '✓';
    } else if (type === 'error') {
        notificationIcon.textContent = '✖';
    } else if (type === 'warning') {
        notificationIcon.textContent = '⚠';
    } else {
        notificationIcon.textContent = 'ℹ';
    }
    
    // 显示通知
    notification.classList.add('show');
    
    // 2秒后自动关闭
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

// 打开登录模态框
settingsIcon.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

// 关闭登录模态框
closeModal.addEventListener('click', () => {
    loginModal.style.display = 'none';
    // 清空输入框和消息
    usernameInput.value = '';
    passwordInput.value = '';
    loginMessage.textContent = '';
});

// 更新块布局函数
function updateBlocksLayout() {
    const blocks = blocksContainer.querySelectorAll('.block');
    
    // 根据块的数量决定布局
    if (blocks.length === 1) {
        // 只有一个块时，应用单块布局样式
        blocksContainer.classList.add('single-block');
    } else {
        // 两个或更多块时，应用多块布局样式
        blocksContainer.classList.remove('single-block');
    }
    
    console.log(`布局已更新: ${blocks.length}个块, 使用${blocks.length === 1 ? '单列' : '两列'}布局`);
}

// 创建动态块元素
function createBlockElement(blockId, blockData) {
    const blockElement = document.createElement('div');
    blockElement.className = 'block';
    blockElement.id = blockId;
    
    blockElement.innerHTML = `
        <h3>${blockData.text || '未命名'}</h3>
    `;
    
    // 添加点击事件，跳转到指定链接
    blockElement.addEventListener('click', () => {
        if (blockData.link && blockData.link !== '#') {
            // 检查链接是否包含协议前缀，如果没有则添加
            let url = blockData.link;
            if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            window.location.href = url;
        }
    });
    
    blocksContainer.appendChild(blockElement);
    
    // 每次添加块后更新布局
    updateBlocksLayout();
}

// 登录验证
loginButton.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username || !password) {
        loginMessage.textContent = '请输入账号和密码';
        loginMessage.style.color = '#e74c3c';
        showNotification('请输入账号和密码', 'warning');
        return;
    }
    
    // 从数据库验证账号密码
    database.ref('admin').once('value')
        .then((snapshot) => {
            const adminData = snapshot.val();
            
            // 如果数据库中没有管理员数据，显示错误
            if (!adminData) {
                loginMessage.textContent = '管理员账号不存在';
                loginMessage.style.color = '#e74c3c';
                showNotification('管理员账号不存在', 'error');
                return;
            }
            
            // 验证账号密码
            if (username === adminData.username && password === adminData.password) {
                // 登录成功，设置本地会话状态
                sessionStorage.setItem('adminLoggedIn', 'true');
                
                // 显示成功消息
                loginMessage.textContent = '登录成功，正在跳转...';
                loginMessage.style.color = '#2ecc71';
                
                // 显示自定义通知
                showNotification('登录成功，正在跳转...', 'success');
                
                // 延迟一下再跳转，给用户看到成功消息
                setTimeout(() => {
                    window.location.href = 'houtai.html';
                }, 1000);
            } else {
                // 登录失败
                loginMessage.textContent = '账号或密码错误';
                loginMessage.style.color = '#e74c3c';
                
                // 显示自定义通知
                showNotification('账号或密码错误', 'error');
            }
        })
        .catch((error) => {
            console.error('验证账号密码失败:', error);
            loginMessage.textContent = '登录失败，请稍后再试';
            loginMessage.style.color = '#e74c3c';
            
            // 显示自定义通知
            showNotification('登录失败，请稍后再试', 'error');
        });
});

// 从 Firebase 加载数据
function loadData() {
    console.log("开始加载数据");
    
    // 加载标题
    database.ref('headerTitle').once('value')
        .then((snapshot) => {
            const title = snapshot.val();
            if (title) {
                headerTitle.textContent = title;
            }
        })
        .catch((error) => {
            console.error('加载标题失败:', error);
        });
    
    // 加载动态块 - 先获取排序信息，再按顺序加载块
    Promise.all([
        database.ref('blocks').once('value'),
        database.ref('blocksOrder').once('value')
    ])
    .then(([blocksSnapshot, orderSnapshot]) => {
        console.log("获取到blocks数据:", blocksSnapshot.val());
        blocksContainer.innerHTML = ''; // 清空容器
        
        const blocks = blocksSnapshot.val();
        let blocksOrder = orderSnapshot.val() || [];
        
        if (blocks) {
            // 过滤掉不存在的块ID
            blocksOrder = blocksOrder.filter(id => blocks[id]);
            
            // 添加未在顺序中的块
            Object.keys(blocks).forEach(blockId => {
                if (!blocksOrder.includes(blockId)) {
                    blocksOrder.push(blockId);
                }
            });
            
            // 按照顺序创建块
            blocksOrder.forEach(blockId => {
                if (blocks[blockId]) {
                    console.log("创建块:", blockId, blocks[blockId]);
                    createBlockElement(blockId, blocks[blockId]);
                }
            });
            
            // 在所有块加载完成后更新布局
            updateBlocksLayout();
        }
    })
    .catch((error) => {
        console.error('加载动态块失败:', error);
        showNotification('加载动态块失败', 'error');
    });
    
    // 加载底部滚动文字
    database.ref('marqueeText').once('value')
        .then((snapshot) => {
            const text = snapshot.val();
            if (text) {
                marqueeContent.textContent = text;
            }
        })
        .catch((error) => {
            console.error('加载滚动文字失败:', error);
            showNotification('加载滚动文字失败', 'error');
        });
}

// 页面加载时获取数据
document.addEventListener('DOMContentLoaded', loadData);

// 窗口大小改变时也更新布局
window.addEventListener('resize', updateBlocksLayout);

// 添加调试日志
console.log("script.js加载完成");

// 添加Firebase数据库调试
function checkFirebaseConnection() {
    database.ref('.info/connected').on('value', (snap) => {
        if (snap.val() === true) {
            console.log("已连接到Firebase数据库");
        } else {
            console.log("未连接到Firebase数据库");
        }
    });
}

// 启动连接检查
checkFirebaseConnection();