// 预加载飞机图片
const planeImage = new Image();
planeImage.src = 'plane.png';

// 游戏参数
let score = 0;
let planeX = 150;
let planeY = 450;
let lastBulletTime = 0;  // 记录上次生成子弹的时间
let bullets = [];
let bulletSpeed = 2;
let bulletFrequency = 1;
let gameInterval;
let bulletInterval;
let keys = {};
let startTime = 0; // 新增：记录游戏开始时间
let currentTime = 0; // 新增：记录当前游戏时间
let isMouseDown = false;
let targetX = planeX;
let targetY = planeY;
const planeSpeed = 5; // 飞机移动速度
// 在文件顶部变量声明区域添加
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
const bgm = document.getElementById('bgm');
const muteBtn = document.getElementById('mute-btn');
let isMuted = false;



// 获取 DOM 元素
const gameContainer = document.getElementById('game-container');
const plane = document.getElementById('plane');
const scoreBoard = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over');
const finalScore = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const timeElement = document.getElementById('time'); // 新增：获取时间元素
const startBtn = document.getElementById('start-btn');

// 修改init函数
function init() {
    // 设置飞机初始位置为屏幕中央
    planeX = 190;
    planeY = 420;
    plane.style.left = planeX + 'px';
    plane.style.top = planeY + 'px';
        // 初始化排行榜显示
        updateLeaderboard();
    
    startBtn.style.display = 'block';
    // 添加点击事件
    startBtn.addEventListener('click', function() {
        this.style.display = 'none';
        document.getElementById('scores-list').style.display = 'none'; // 隐藏排行榜
        document.getElementById('leaderboard').style.display = 'none';
        startGame();
    });
    // 添加触摸事件
    startBtn.addEventListener('touchstart', function(e) {
        e.preventDefault(); // 防止触摸事件触发其他行为
        this.style.display = 'none';
        document.getElementById('leaderboard').style.display = 'none'; // 隐藏排行榜
        document.getElementById('scores-list').style.display = 'none'; 
        startGame();
    });
    
    gameOverScreen.style.display = 'none';
    
    
    
    // 添加事件监听
    document.getElementById('save-btn').addEventListener('click', saveScore);
    
    // 添加静音按钮事件
    muteBtn.addEventListener('click', toggleMute);
}

// 新增全局函数：更新排行榜显示
function updateLeaderboard() {
    const scoresList = document.getElementById('scores-list');
    scoresList.innerHTML = '';
    
    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${index + 1}. ${entry.id} - ${entry.score} (${entry.date})`;
        scoresList.appendChild(li);
    });
}

// 新增全局函数：保存分数
function saveScore() {
    const playerId = document.getElementById('player-id').value.trim();
    if (!playerId) return;
    
    const newScore = {
        id: playerId,
        score: score,
        date: new Date().toLocaleString()
    };
    
    leaderboard.push(newScore);
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    updateLeaderboard();
    
    document.getElementById('save-btn').style.display = 'none';
    document.getElementById('restart-btn').style.display = 'block';


    
}

// 修改startGame函数
function startGame() {
    // 隐藏开始按钮
    startBtn.style.display = 'none';
    // 重置游戏状态
    score = 0;
    bullets = [];
    bulletSpeed = 2;
    bulletFrequency = 1;
    lastBulletTime = Date.now();
    
    // 隐藏游戏结束界面
    timeElement.textContent = '0';
    scoreBoard.textContent = '0';
    gameOverScreen.style.display = 'none';
    document.getElementById('leaderboard').style.display = 'none'; // 隐藏排行榜
    document.getElementById('scores-list').style.display = 'none'; // 隐藏分数
    
    // 重置按钮状态
    document.getElementById('save-btn').style.display = 'block';
    document.getElementById('restart-btn').style.display = 'none';
    
    // 重置飞机位置
    planeX = 190;
    planeY = 420;
    plane.style.left = planeX + 'px';
    plane.style.top = planeY + 'px';
    
    // 启动游戏循环
    startTime = Date.now();
    gameInterval = setInterval(updateGame, 16);
    
    // 设置事件监听
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}
// 修改updateGame函数
function updateGame() {
    currentTime = Math.floor((Date.now() - startTime) / 1000);
    timeElement.textContent = currentTime;
    score = currentTime * currentTime + currentTime;
    scoreBoard.textContent = score;

    // 移动飞机
    movePlane();

    // 移动子弹
    moveBullets();

    // 检查碰撞
    checkCollision();

    // 增加子弹速度和频率
    bulletSpeed = 2 + currentTime * 0.05;
    bulletFrequency = 1 + currentTime * 0.3;

    // 基于时间的子弹生成逻辑
    const now = Date.now();
    if (now - lastBulletTime >= 1000 / bulletFrequency) {
        createBullet();
        lastBulletTime = now;
    }
}


// 移动飞机
// 修改触摸事件处理函数
function updateTargetPosition(touch) {
    const rect = gameContainer.getBoundingClientRect();
    targetX = touch.clientX - rect.left;
    targetY = touch.clientY - rect.top;
    isMouseDown = true;  // 确保触摸时设置isMouseDown为true
}

// 修改movePlane函数中的触摸控制部分
function movePlane() {
    let dx = 0;
    let dy = 0;
    
    // 触摸/鼠标控制逻辑
    if(isMouseDown) {
        // 计算飞机中心点
        const planeCenterX = planeX + plane.offsetWidth / 2;
        const planeCenterY = planeY + plane.offsetHeight / 2;
        
        // 计算方向向量
        const dirX = targetX - planeCenterX;
        const dirY = targetY - planeCenterY;
        const distance = Math.sqrt(dirX*dirX + dirY*dirY);
        
        // 如果距离足够近则直接到达目标点
        if(distance < planeSpeed) {
            planeX = targetX - plane.offsetWidth / 2;
            planeY = targetY - plane.offsetHeight / 2;
        } else {
            // 标准化方向向量并乘以速度
            const vx = (dirX/distance) * planeSpeed;
            const vy = (dirY/distance) * planeSpeed;
            
            planeX += vx;
            planeY += vy;
        }
    }
    


    planeX += dx;
    planeY += dy;

    // 边界检测
    planeX = Math.max(0, Math.min(planeX, gameContainer.offsetWidth - plane.offsetWidth));
    planeY = Math.max(0, Math.min(planeY, gameContainer.offsetHeight - plane.offsetHeight));

    plane.style.left = planeX + 'px';
    plane.style.top = planeY + 'px';
}

// 添加鼠标事件监听
gameContainer.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    targetX = e.clientX - gameContainer.getBoundingClientRect().left;
    targetY = e.clientY - gameContainer.getBoundingClientRect().top;
});

gameContainer.addEventListener('mousemove', (e) => {
    if(isMouseDown) {
        targetX = e.clientX - gameContainer.getBoundingClientRect().left;
        targetY = e.clientY - gameContainer.getBoundingClientRect().top;
    }
});

gameContainer.addEventListener('mouseup', () => {
    isMouseDown = false;
});

gameContainer.addEventListener('mouseleave', () => {
    isMouseDown = false;
});
// 创建子弹
function createBullet() {
    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    gameContainer.appendChild(bullet);

    // 随机选择屏幕边缘（0=上,1=右,2=下,3=左）
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(edge) {
        case 0: // 上边缘
            x = Math.random() * gameContainer.offsetWidth;
            y = 0;
            break;
        case 1: // 右边缘
            x = gameContainer.offsetWidth;
            y = Math.random() * gameContainer.offsetHeight;
            break;
        case 2: // 下边缘
            x = Math.random() * gameContainer.offsetWidth;
            y = gameContainer.offsetHeight;
            break;
        case 3: // 左边缘
            x = 0;
            y = Math.random() * gameContainer.offsetHeight;
            break;
    }

    bullet.style.left = x + 'px';
    bullet.style.top = y + 'px';

    // 计算子弹方向（朝向飞机）
    const angle = Math.atan2(planeY - y, planeX - x);
    
    bullets.push({
        element: bullet,
        x: x,
        y: y,
        angle: angle
    });
}


// 移动子弹
function moveBullets() {
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        bullet.x += bulletSpeed * Math.cos(bullet.angle);
        bullet.y += bulletSpeed * Math.sin(bullet.angle);
        bullet.element.style.left = bullet.x + 'px';
        bullet.element.style.top = bullet.y + 'px';

        // 移除超出屏幕的子弹
        if (bullet.x < 0 || bullet.x > gameContainer.offsetWidth || bullet.y < 0 || bullet.y > gameContainer.offsetHeight) {
            gameContainer.removeChild(bullet.element);
            bullets.splice(i, 1);
            i--;
        }
    }
}

// 检查碰撞
function checkCollision() {
    // 获取飞机矩形边界
    const planeRect = {
        left: planeX,
        right: planeX + plane.offsetWidth,
        top: planeY,
        bottom: planeY + plane.offsetHeight
    };

    // 遍历所有子弹
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // 获取子弹矩形边界
        const bulletRect = {
            left: bullet.x,
            right: bullet.x + bullet.element.offsetWidth,
            top: bullet.y,
            bottom: bullet.y + bullet.element.offsetHeight
        };

        // 矩形碰撞检测
        if (planeRect.left < bulletRect.right &&
            planeRect.right > bulletRect.left &&
            planeRect.top < bulletRect.bottom &&
            planeRect.bottom > bulletRect.top) {
            gameOver();
            return;
        }
    }
}

// 游戏结束
function gameOver() {
    clearInterval(gameInterval);
    clearInterval(bulletInterval);
    
    // 清空场上所有子弹
    for (let i = bullets.length - 1; i >= 0; i--) {
        gameContainer.removeChild(bullets[i].element);
        bullets.splice(i, 1);
    }
    document.getElementById('scores-list').style.display = 'block'; 
    document.getElementById('leaderboard').style.display = 'block'; // 显示排行榜
    // 清除按键信息
    keys = {};
    
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    gameOverScreen.style.display = 'block';
    finalScore.textContent = score;
    
    // 显示保存分数界面
    document.getElementById('player-id').value = '';
    document.getElementById('save-btn').style.display = 'block';
    document.getElementById('restart-btn').style.display = 'none';
}



gameContainer.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for(let i = 0; i < e.changedTouches.length; i++) {
        if(e.changedTouches[i].identifier === touchId) {
            updateTargetPosition(e.changedTouches[i]);
            break;
        }
    }
});

gameContainer.addEventListener('touchend', (e) => {
    e.preventDefault();
    for(let i = 0; i < e.changedTouches.length; i++) {
        if(e.changedTouches[i].identifier === touchId) {
            isMouseDown = false;
            touchId = null;
            break;
        }
    }
});

function updateTargetPosition(touch) {
    const rect = gameContainer.getBoundingClientRect();
    targetX = touch.clientX - rect.left;
    targetY = touch.clientY - rect.top;
}

// 处理按键按下事件
function handleKeyDown(event) {
    keys[event.code] = true;
}

// 处理按键释放事件
function handleKeyUp(event) {
    keys[event.code] = false;
}

// 重新开始游戏
restartBtn.addEventListener('click', startGame);

// 初始化游戏
init();

// 新增函数：切换静音状态
function toggleMute() {
    isMuted = !isMuted;
    bgm.muted = isMuted;
    muteBtn.textContent = isMuted ? "🔇" : "🔊";
    console.log(`音乐已${isMuted ? '静音' : '恢复'}, 当前音量: ${bgm.volume}`);
}

