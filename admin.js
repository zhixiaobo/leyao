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
const logoutButton = document.getElementById('logoutButton');
const adminUsername = document.getElementById('adminUsername');
const adminPassword = document.getElementById('adminPassword');
const saveAdminCredentials = document.getElementById('saveAdminCredentials');
const headerTitleInput = document.getElementById('headerTitleInput');
const saveHeaderTitle = document.getElementById('saveHeaderTitle');
const blocksList = document.getElementById('blocksList');
const addBlockButton = document.getElementById('addBlockButton');
const blockModal = document.getElementById('blockModal');
const closeBlockModal = document.getElementById('closeBlockModal');
const blockModalTitle = document.getElementById('blockModalTitle');
const blockText = document.getElementById('blockText');
const blockLink = document.getElementById('blockLink');
const blockId = document.getElementById('blockId');
const saveBlockButton = document.getElementById('saveBlockButton');
const marqueeTextInput = document.getElementById('marqueeTextInput');
const saveMarqueeText = document.getElementById('saveMarqueeText');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');
const notificationIcon = document.getElementById('notificationIcon');

// 用于存储 Sortable 实例
let blocksSortable;

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

// 检查用户是否已登录，如果未登录则跳转到主页
if (!sessionStorage.getItem('adminLoggedIn')) {
    window.location.href = 'index.html';
}

// 退出登录
logoutButton.addEventListener('click', () => {
    // 清除登录会话
    sessionStorage.removeItem('adminLoggedIn');
    window.location.href = 'index.html';
});

// 加载数据
function loadData() {
    // 加载管理员账号密码
    database.ref('admin').once('value')
        .then((snapshot) => {
            const adminData = snapshot.val();
            if (adminData) {
                adminUsername.value = adminData.username || '';
                adminPassword.value = adminData.password || '';
            }
        })
        .catch((error) => {
            console.error('加载管理员账号密码失败:', error);
        });
    
    // 加载标题
    database.ref('headerTitle').once('value')
        .then((snapshot) => {
            const title = snapshot.val();
            if (title) {
                headerTitleInput.value = title;
            }
        })
        .catch((error) => {
            console.error('加载标题失败:', error);
        });
    
    // 加载动态块和排序信息
    Promise.all([
        database.ref('blocks').once('value'),
        database.ref('blocksOrder').once('value')
    ])
    .then(([blocksSnapshot, orderSnapshot]) => {
        blocksList.innerHTML = ''; // 清空列表
        
        const blocks = blocksSnapshot.val();
        let blocksOrder = orderSnapshot.val() || [];
        
        if (blocks) {
            // 过滤掉不存在的块ID
            blocksOrder = blocksOrder.filter(id => blocks[id]);
            
            // 添加未在排序列表中的块
            Object.keys(blocks).forEach(blockId => {
                if (!blocksOrder.includes(blockId)) {
                    blocksOrder.push(blockId);
                }
            });
            
            // 按照排序顺序创建块列表项
            blocksOrder.forEach(blockId => {
                if (blocks[blockId]) {
                    createBlockListItem(blockId, blocks[blockId]);
                }
            });
        }
        
        // 初始化排序功能
        initSortable();
    })
    .catch((error) => {
        console.error('加载动态块失败:', error);
        showNotification('加载块数据失败', 'error');
    });
    
    // 加载底部滚动文字
    database.ref('marqueeText').once('value')
        .then((snapshot) => {
            const text = snapshot.val();
            if (text) {
                marqueeTextInput.value = text;
            }
        })
        .catch((error) => {
            console.error('加载滚动文字失败:', error);
        });
}

// 初始化排序功能
function initSortable() {
    // 如果已存在实例，先销毁
    if (blocksSortable) {
        blocksSortable.destroy();
    }
    
    // 创建新的排序实例
    blocksSortable = new Sortable(blocksList, {
        animation: 150, // 动画速度
        handle: '.block-content', // 通过块内容区域拖动
        ghostClass: 'sortable-ghost', // 拖动时的占位符类名
        chosenClass: 'sortable-chosen', // 被选中项的类名
        dragClass: 'sortable-drag', // 拖动中的类名
        onEnd: function(evt) {
            // 排序结束后自动保存
            saveBlocksOrder();
        }
    });
}

// 创建块列表项
function createBlockListItem(id, data) {
    const listItem = document.createElement('div');
    listItem.className = 'block-item';
    listItem.id = `list-${id}`;
    
    listItem.innerHTML = `
        <div class="block-content">
            <div class="block-title">${data.text || '未命名'}</div>
            <div class="block-actions">
                <button class="edit-button" data-id="${id}">✏️</button>
                <button class="delete-button" data-id="${id}">🗑️</button>
            </div>
        </div>
    `;
    
    // 添加编辑和删除事件
    const editButton = listItem.querySelector('.edit-button');
    const deleteButton = listItem.querySelector('.delete-button');
    
    editButton.addEventListener('click', () => {
        openBlockModal('edit', id, data);
    });
    
    deleteButton.addEventListener('click', () => {
        deleteBlock(id);
    });
    
    blocksList.appendChild(listItem);
}

// 保存管理员账号密码
saveAdminCredentials.addEventListener('click', () => {
    const username = adminUsername.value.trim();
    const password = adminPassword.value.trim();
    
    if (username && password) {
        database.ref('admin').set({
            username: username,
            password: password
        })
        .then(() => {
            showNotification('管理员账号密码保存成功！', 'success');
        })
        .catch((error) => {
            console.error('保存管理员账号密码失败:', error);
            showNotification('保存失败，请稍后再试', 'error');
        });
    } else {
        showNotification('请输入账号和密码', 'warning');
    }
});

// 保存标题
saveHeaderTitle.addEventListener('click', () => {
    const title = headerTitleInput.value.trim();
    
    if (title) {
        database.ref('headerTitle').set(title)
            .then(() => {
                showNotification('标题保存成功！', 'success');
            })
            .catch((error) => {
                console.error('保存标题失败:', error);
                showNotification('保存失败，请稍后再试', 'error');
            });
    } else {
        showNotification('请输入标题', 'warning');
    }
});

// 保存块顺序函数
function saveBlocksOrder() {
    // 获取所有块元素的ID
    const blockElements = blocksList.querySelectorAll('.block-item');
    const blocksOrder = Array.from(blockElements).map(item => {
        // 从元素ID中提取块ID，格式为 list-{blockId}
        return item.id.replace('list-', '');
    });
    
    // 保存到Firebase
    database.ref('blocksOrder').set(blocksOrder)
        .then(() => {
            showNotification('顺序已更新', 'success');
        })
        .catch((error) => {
            console.error('保存块顺序失败:', error);
            showNotification('保存顺序失败', 'error');
        });
}

// 保存滚动文字
saveMarqueeText.addEventListener('click', () => {
    const text = marqueeTextInput.value.trim();
    
    if (text) {
        database.ref('marqueeText').set(text)
            .then(() => {
                showNotification('滚动文字保存成功！', 'success');
            })
            .catch((error) => {
                console.error('保存滚动文字失败:', error);
                showNotification('保存失败，请稍后再试', 'error');
            });
    } else {
        showNotification('请输入滚动文字', 'warning');
    }
});

// 打开添加/编辑块模态框
function openBlockModal(mode, id = null, data = null) {
    if (mode === 'add') {
        blockModalTitle.style.display = 'none'; // 隐藏标题
        blockText.value = '';
        blockLink.value = '';
        blockId.value = '';
    } else if (mode === 'edit' && data) {
        blockModalTitle.style.display = 'none'; // 隐藏标题
        blockText.value = data.text || '';
        blockLink.value = data.link || '';
        blockId.value = id;
    }
    
    blockModal.style.display = 'block';
}

// 关闭块模态框
closeBlockModal.addEventListener('click', () => {
    blockModal.style.display = 'none';
});

// 添加新块按钮
addBlockButton.addEventListener('click', () => {
    openBlockModal('add');
});

// 保存块
saveBlockButton.addEventListener('click', () => {
    const text = blockText.value.trim();
    const link = blockLink.value.trim();
    const id = blockId.value;
    
    if (!text) {
        showNotification('请输入显示文字', 'warning');
        return;
    }
    
    // 处理链接格式
    let processedLink = link;
    if (processedLink && processedLink !== '#' && !processedLink.startsWith('http://') && !processedLink.startsWith('https://')) {
        // 如果用户输入的是相对路径，保持原样；如果是域名，添加https前缀
        if (processedLink.includes('.') && !processedLink.startsWith('/')) {
            processedLink = 'https://' + processedLink;
        }
    }
    
    const blockData = {
        text: text,
        link: processedLink || '#'
    };
    
    let savePromise;
    let blockIdToUse = id;
    
    if (id) {
        // 编辑现有块
        savePromise = database.ref(`blocks/${id}`).update(blockData);
    } else {
        // 添加新块
        blockIdToUse = `block-${Date.now()}`;
        savePromise = database.ref(`blocks/${blockIdToUse}`).set(blockData)
            .then(() => {
                // 添加到排序列表末尾
                return database.ref('blocksOrder').once('value');
            })
            .then((snapshot) => {
                let blocksOrder = snapshot.val() || [];
                blocksOrder.push(blockIdToUse);
                return database.ref('blocksOrder').set(blocksOrder);
            });
    }
    
    savePromise
        .then(() => {
            showNotification('保存成功！', 'success');
            blockModal.style.display = 'none';
            loadData(); // 重新加载数据
        })
        .catch((error) => {
            console.error('保存块失败:', error);
            showNotification('保存失败，请稍后再试', 'error');
        });
});

// 删除块
function deleteBlock(id) {
    database.ref(`blocks/${id}`).remove()
        .then(() => {
            // 同时从排序数组中移除
            return database.ref('blocksOrder').once('value');
        })
        .then((snapshot) => {
            let blocksOrder = snapshot.val() || [];
            blocksOrder = blocksOrder.filter(blockId => blockId !== id);
            return database.ref('blocksOrder').set(blocksOrder);
        })
        .then(() => {
            const listItem = document.getElementById(`list-${id}`);
            if (listItem) {
                listItem.remove();
            }
            showNotification('删除成功！', 'success');
        })
        .catch((error) => {
            console.error('删除块失败:', error);
            showNotification('删除失败，请稍后再试', 'error');
        });
}

// 页面加载时获取数据
document.addEventListener('DOMContentLoaded', loadData);