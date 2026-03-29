const STATE_KEY = 'study_app_state';
let questionsData = [];
let state = {
    currentDay: 1,
    startDate: null,
    streak: 0,
    lastDate: null,
    daySplit: [],
    wrongBook: {}, // id -> { reviewDays: [] }
    dailyStats: {}, // day -> { wrongIds: [] }
    activeSession: { isActive: false }
};

let sessionQueue = [];
let currentQ = null;
let sessionTotal = 0;

const ROUND_SIZE = 50; // Dynamic round size config

// DOM Elements
const homeScreen = document.getElementById('home-screen');
const studyScreen = document.getElementById('study-screen');
const printScreen = document.getElementById('print-screen');
const certModal = document.getElementById('cert-modal');
const wrongBookModal = document.getElementById('wrong-book-modal');

// Init
async function init() {
    try {
        const res = await fetch('questions.json');
        questionsData = await res.json();
    } catch (e) {
        console.error("Failed to load questions", e);
        alert("题库加载失败，请检查 questions.json");
        return;
    }

    await loadState();
    renderHome();

    document.getElementById('start-btn').addEventListener('click', startSession);
    document.getElementById('back-btn').addEventListener('click', () => {
        if(confirm('确定要退出当前学习吗？进度将保留。')) {
            saveState();
            switchScreen(homeScreen);
            renderHome();
        }
    });

    document.getElementById('ultimate-challenge-btn').addEventListener('click', startUltimateChallenge);
    document.getElementById('view-cert-btn').addEventListener('click', () => certModal.classList.remove('hidden'));
    document.getElementById('close-cert-btn').addEventListener('click', () => certModal.classList.add('hidden'));
    document.getElementById('save-cert-btn').addEventListener('click', saveCertificate);
    
    // Add reset and view wrong book handlers
    document.getElementById('reset-btn').addEventListener('click', async () => {
        if (confirm('警告：此操作将清空您的所有学习进度、错题记录和打卡天数！\n\n确定要重新开始吗？')) {
            await fetch('/api/state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(null)
            });
            localStorage.removeItem(STATE_KEY); // Keep it for compatibility
            alert('进度已清空，页面将重新加载。');
            location.reload();
        }
    });

    document.getElementById('view-wrong-btn').addEventListener('click', renderWrongBook);
    document.getElementById('close-wrong-book-btn').addEventListener('click', () => {
        wrongBookModal.classList.add('hidden');
    });
}

async function loadState() {
    let saved = null;
    try {
        const res = await fetch('/api/state');
        if (res.ok) {
            saved = await res.json();
        }
    } catch (e) {
        console.warn('Failed to load state from server, falling back to localStorage', e);
    }

    // Auto-migrate from localStorage if server has no data
    if (!saved) {
        const local = localStorage.getItem(STATE_KEY);
        if (local) {
            console.log('Migrating state from localStorage to server...');
            saved = JSON.parse(local);
            state = saved;
            saveState(); // Save to server immediately
        }
    }

    if (saved) {
        state = saved;
    } else {
        // First time initialization
        state.startDate = new Date().toISOString();
        state.lastDate = null;
        state.streak = 0;
        state.currentDay = 1;
        
        // Shuffle and split 1432 questions
        let allIds = questionsData.map(q => q.id);
        allIds.sort(() => Math.random() - 0.5);
        
        state.daySplit = [
            allIds.slice(0, 573), // Day 1
            allIds.slice(573, 859), // Day 2
            allIds.slice(859, 1145), // Day 3
            allIds.slice(1145) // Day 4
        ];
        state.activeSession = { isActive: false };
        saveState();
    }
}

function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
    }).catch(e => console.warn('Failed to save state to server', e));
}

function getTodayString() {
    return new Date().toLocaleDateString('zh-CN');
}

function renderHome() {
    document.getElementById('streak-count').innerText = state.streak;
    document.getElementById('current-day-text').innerText = state.currentDay;
    
    let totalDone = state.currentDay > 1 ? (state.currentDay - 1) * 14.2 : 0; // rough %

    // Update wrong count badge
    let totalWrong = Object.keys(state.wrongBook).length;
    document.getElementById('wrong-count').innerText = totalWrong;

    let desc = "";
    let todayStats = state.dailyStats[state.currentDay];
    
    let targetTotal = 0;
    let completedTotal = 0;

    if (state.currentDay <= 4) {
        let splitArr = (state.daySplit && state.daySplit[state.currentDay-1]) ? state.daySplit[state.currentDay-1] : [];
        targetTotal = (todayStats && todayStats.targetIds) ? todayStats.targetIds.length : splitArr.length;
        completedTotal = todayStats?.completedIds?.length || 0;
        desc = `今日新学及复习 共 ${targetTotal} 题 (已完成 ${completedTotal})`;
    } else if (state.currentDay <= 6) {
        targetTotal = (todayStats && todayStats.targetIds) ? todayStats.targetIds.length : 150;
        completedTotal = todayStats?.completedIds?.length || 0;
        desc = `今日混合测试 共 ${targetTotal} 题 (已完成 ${completedTotal})`;
    } else if (state.currentDay === 7) {
        desc = `终极挑战准备！`;
        document.getElementById('start-btn').classList.add('hidden');
        document.getElementById('certificate-section').classList.remove('hidden');
    } else {
        desc = `已完成7日计划！`;
        document.getElementById('start-btn').classList.add('hidden');
        document.getElementById('certificate-section').classList.remove('hidden');
        document.getElementById('view-cert-btn').classList.remove('hidden');
        document.getElementById('ultimate-challenge-btn').classList.add('hidden');
    }
    
    // Render progress segments
    renderProgressSegments(targetTotal, completedTotal);
    
    // Check if already completed today
    let isMakeup = false;
    if (state.lastDate) {
        let lastDateObj = new Date(state.lastDate);
        let todayObj = new Date(getTodayString());
        let diffDays = (todayObj - lastDateObj) / (1000 * 60 * 60 * 24);
        if (diffDays > 1) {
            isMakeup = true;
        }
    }

    if (state.activeSession && state.activeSession.isActive) {
        document.getElementById('start-btn').innerText = "继续当前练习";
    } else if (state.lastDate === getTodayString() && state.currentDay < 7) {
        document.getElementById('start-btn').innerText = "今日已完成 (继续复习)";
    } else if (isMakeup) {
        document.getElementById('start-btn').innerText = "补刷第" + state.currentDay + "天任务";
    } else {
        document.getElementById('start-btn').innerText = "开始今日任务";
    }

    document.getElementById('today-task-desc').innerText = desc;
}

function renderProgressSegments(total, completed) {
    const container = document.getElementById('daily-progress-container');
    const textEl = document.getElementById('overall-progress-text');
    
    if (!container || !textEl) return;
    
    container.innerHTML = '';
    if (total === 0) {
        textEl.innerText = '0%';
        return;
    }

    let percent = Math.floor((completed / total) * 100);
    textEl.innerText = `${percent}%`;

    let totalRounds = Math.ceil(total / ROUND_SIZE);
    let completedRounds = Math.floor(completed / ROUND_SIZE);
    let currentRoundHasProgress = completed % ROUND_SIZE > 0;

    for (let i = 0; i < totalRounds; i++) {
        let segment = document.createElement('div');
        segment.className = 'progress-segment';
        segment.style.flex = '1';
        
        if (i < completedRounds) {
            segment.classList.add('completed');
        } else if (i === completedRounds && currentRoundHasProgress) {
            segment.classList.add('current');
            // Partially fill the current segment
            let innerFill = document.createElement('div');
            innerFill.style.height = '100%';
            innerFill.style.width = `${((completed % ROUND_SIZE) / ROUND_SIZE) * 100}%`;
            innerFill.style.background = 'linear-gradient(90deg, var(--success-color), #34d399)';
            segment.appendChild(innerFill);
        }
        
        container.appendChild(segment);
    }
}

function renderStudyProgressSegments(total, completed) {
    const container = document.getElementById('study-progress-container');
    if (!container) return;
    
    container.innerHTML = '';
    if (total === 0) return;

    // 动态计算 4-5 个大块的逻辑
    // 我们优先选择分成 5 块，如果 total 太小导致每块太少（比如 < 2），则根据需要退化，但一般 total=50 会稳定分 5 块，每块 10 题。
    let numBlocks = 5;
    if (total < 5) numBlocks = total; // 极端情况处理

    let baseSize = Math.floor(total / numBlocks);
    let remainder = total % numBlocks;

    // 生成每个大块的容量数组，例如 [10, 10, 10, 10, 10]
    let blocks = [];
    for (let i = 0; i < numBlocks; i++) {
        blocks.push(baseSize + (i < remainder ? 1 : 0));
    }

    // 计算当前处于哪个大块，以及该大块内部的完成比例
    let currentBlockIndex = -1;
    let accumulated = 0;
    
    for (let i = 0; i < numBlocks; i++) {
        let segment = document.createElement('div');
        segment.className = 'progress-segment';
        segment.style.flex = '1';
        
        let blockCapacity = blocks[i];
        
        // Add label for block capacity
        let label = document.createElement('span');
        label.className = 'segment-label';
        label.innerText = blockCapacity;
        
        if (completed >= accumulated + blockCapacity) {
            // 这个大块已经全部完成
            segment.classList.add('completed');
            label.style.color = '#fff';
            label.style.textShadow = 'none';
        } else if (completed >= accumulated && completed < accumulated + blockCapacity) {
            // 当前进度落在这个大块里
            segment.classList.add('current');
            
            // 计算这个大块内部的填充百分比
            let innerCompleted = completed - accumulated;
            let percent = (innerCompleted / blockCapacity) * 100;
            
            if (innerCompleted > 0) {
                let innerFill = document.createElement('div');
                innerFill.style.height = '100%';
                innerFill.style.width = `${percent}%`;
                innerFill.style.background = 'linear-gradient(90deg, var(--success-color), #34d399)';
                innerFill.style.position = 'absolute';
                innerFill.style.left = '0';
                innerFill.style.top = '0';
                innerFill.style.zIndex = '1';
                segment.appendChild(innerFill);
            }
        }
        
        segment.appendChild(label);
        accumulated += blockCapacity;
        container.appendChild(segment);
    }
}

function startSession() {
    if (state.currentDay > 7) return;

    if (state.activeSession && state.activeSession.isActive && !state.activeSession.isUltimateChallenge) {
        resumeSession();
        return;
    }

    // Initialize day target if not exists
    if (!state.dailyStats[state.currentDay]) {
        let targetIds = [];
        if (state.currentDay <= 4) {
            targetIds = [...state.daySplit[state.currentDay - 1]];
        } else if (state.currentDay <= 6) {
            let allIds = questionsData.map(q => q.id);
            allIds.sort(() => Math.random() - 0.5);
            targetIds = allIds.slice(0, 150);
        }

        // Add review items
        let reviewIds = [];
        for (let id in state.wrongBook) {
            if (state.wrongBook[id].reviewDays.includes(state.currentDay)) {
                reviewIds.push(id);
            }
        }

        let uniqueIds = Array.from(new Set([...targetIds, ...reviewIds]));
        
        state.dailyStats[state.currentDay] = { 
            targetIds: uniqueIds,
            completedIds: [],
            wrongIds: [] 
        };
        saveState();
    }

    let stats = state.dailyStats[state.currentDay];
    let remainingIds = [];
    if (stats && stats.targetIds) {
        let completed = stats.completedIds || [];
        remainingIds = stats.targetIds.filter(id => !completed.includes(id));
    }

    if (remainingIds.length === 0) {
        finishDay();
        return;
    }

    // Take up to ROUND_SIZE for this round
    let roundIds = remainingIds.slice(0, ROUND_SIZE);

    sessionQueue = roundIds.map(id => ({
        id,
        step: 0,
        showAfter: 0,
        isWrongToday: false
    }));

    sessionTotal = sessionQueue.length;
    if (sessionTotal === 0) {
        alert("今日暂无任务！");
        return;
    }

    isUltimateChallenge = false;
    ultimateScore = 0;

    // Reset active session for the new round
    state.activeSession = {
        isActive: true,
        queue: sessionQueue,
        total: sessionTotal,
        currentQ: null,
        isUltimateChallenge: false,
        ultimateScore: 0
    };
    saveState();

    switchScreen(studyScreen);
    nextQuestion();
}

let isUltimateChallenge = false;
let ultimateScore = 0;

function startUltimateChallenge() {
    if (state.activeSession && state.activeSession.isActive && state.activeSession.isUltimateChallenge) {
        resumeSession();
        return;
    }

    isUltimateChallenge = true;
    ultimateScore = 0;
    let allIds = questionsData.map(q => q.id);
    allIds.sort(() => Math.random() - 0.5);
    let challengeIds = allIds.slice(0, 30);
    
    sessionQueue = challengeIds.map(id => ({
        id, step: 0, showAfter: 0, isWrongToday: false
    }));
    sessionTotal = 30;
    
    saveSessionState();
    switchScreen(studyScreen);
    nextQuestion();
}

function resumeSession() {
    sessionQueue = state.activeSession.queue || [];
    sessionTotal = state.activeSession.total || 0;
    currentQ = state.activeSession.currentQ || null;
    isUltimateChallenge = state.activeSession.isUltimateChallenge || false;
    ultimateScore = state.activeSession.ultimateScore || 0;
    
    if (currentQ) {
        sessionQueue.unshift(currentQ);
        currentQ = null;
    }
    
    switchScreen(studyScreen);
    nextQuestion();
}

function saveSessionState() {
    state.activeSession = {
        isActive: true,
        queue: sessionQueue,
        total: sessionTotal,
        currentQ: currentQ,
        isUltimateChallenge: isUltimateChallenge,
        ultimateScore: ultimateScore
    };
    saveState();
}

function switchScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

function nextQuestion() {
    const existingCard = document.querySelector('.card');
    if (existingCard && !existingCard.classList.contains('fade-hidden')) {
        existingCard.classList.add('fade-hidden');
        setTimeout(processNextQuestion, 250);
    } else {
        processNextQuestion();
    }
}

function processNextQuestion() {
    if (sessionQueue.length === 0) {
        finishRound();
        return;
    }

    // Update progress
    let done = sessionTotal - sessionQueue.length;
    let remaining = sessionQueue.length;
    let estimatedMins = Math.ceil(remaining * 1.2); // 假设每题1.2分钟
    
    // 显示本轮进度
    document.getElementById('study-progress-text').innerText = `本轮已做 ${done}/${sessionTotal} 题 | 预计 ${estimatedMins} 分钟`;
    renderStudyProgressSegments(sessionTotal, done);

    let now = Date.now();
    // find first available
    let idx = sessionQueue.findIndex(q => q.showAfter <= now);
    if (idx === -1) idx = 0; // if all in future, just pick first

    currentQ = sessionQueue[idx];
    sessionQueue.splice(idx, 1);
    saveSessionState();

    renderCard(currentQ);
}

function renderCard(qState) {
    const qData = questionsData.find(q => q.id === qState.id);
    const container = document.getElementById('card-container');
    container.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'card fade-hidden';
    
    let typeName = '单选题';
    if (qData.type === 'multiple') typeName = '多选题';
    if (qData.type === 'determine') typeName = '判断题';
    
    let html = `<div class="question-type">${typeName}</div>
                <div class="question-stem">${qData.stem}</div>
                <ul class="options-list">`;
    
    qData.options.forEach((opt, i) => {
        html += `<li class="option-item" data-val="${getOptionValue(qData.type, opt)}">${opt}</li>`;
    });
    
    html += `</ul>
             <button id="submit-ans-btn" class="primary-btn btn-large submit-btn">提交答案</button>
             <div id="analysis-box" class="analysis-section hidden">
                <h4>答案与解析</h4>
                <p><strong>正确答案:</strong> ${qData.answer}</p>
                <p>${qData.analysis}</p>
                <button id="next-q-btn" class="primary-btn btn-large mt-20">继续下一题</button>
             </div>`;
             
    card.innerHTML = html;
    container.appendChild(card);
    
    // Animation
    setTimeout(() => {
        card.classList.remove('fade-hidden');
    }, 30);

    // Event listeners for options
    const options = card.querySelectorAll('.option-item');
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            if (qData.type === 'multiple') {
                opt.classList.toggle('selected');
            } else {
                options.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            }
        });
    });

    document.getElementById('submit-ans-btn').addEventListener('click', () => {
        checkAnswer(qData, options, card);
    });

    // Swipe support for next question (only active after answer)
    let touchstartX = 0;
    let touchendX = 0;
    
    card.addEventListener('touchstart', e => {
        touchstartX = e.changedTouches[0].screenX;
    }, {passive: true});

    card.addEventListener('touchend', e => {
        touchendX = e.changedTouches[0].screenX;
        handleSwipe();
    }, {passive: true});

    function handleSwipe() {
        // Only allow swipe to next if the next button is visible
        const nextBtn = document.getElementById('next-q-btn');
        if (nextBtn && !nextBtn.parentElement.classList.contains('hidden')) {
            if (touchendX < touchstartX - 50) { // Swiped left
                card.classList.add('fade-hidden');
                setTimeout(nextQuestion, 250);
            }
        }
    }
}

function getOptionValue(type, optText) {
    if (type === 'determine') return optText; // '正确' or '错误'
    return optText.substring(0, 1); // 'A', 'B', etc.
}

function markQuestionCompleted(id) {
    if (isUltimateChallenge) return;
    let stats = state.dailyStats[state.currentDay];
    if (stats) {
        if (!stats.completedIds) {
            stats.completedIds = [];
        }
        if (!stats.completedIds.includes(id)) {
            stats.completedIds.push(id);
            saveState(); // Ensure state is saved when progress is made
        }
    }
}

function checkAnswer(qData, optionsElements, card) {
    let selected = [];
    optionsElements.forEach(opt => {
        if (opt.classList.contains('selected')) {
            selected.push(opt.dataset.val);
        }
    });

    if (selected.length === 0) return; // ignore empty submit

    document.getElementById('submit-ans-btn').classList.add('hidden');
    optionsElements.forEach(opt => opt.style.pointerEvents = 'none');

    let userAns = selected.sort().join(',');
    let correctAns = qData.answer;
    
    let isCorrect = userAns === correctAns;

    if (isUltimateChallenge) {
        if (isCorrect) ultimateScore++;
        currentQ = null;
        saveSessionState();
        setTimeout(nextQuestion, 500);
        return;
    }

    if (isCorrect) {
        optionsElements.forEach(opt => {
            if (opt.classList.contains('selected')) opt.classList.add('correct');
        });

        if (currentQ.step === 0 && !currentQ.isWrongToday) {
            // First time correct today -> mastered
            markQuestionCompleted(currentQ.id);
            currentQ = null;
            saveSessionState();
            setTimeout(nextQuestion, 800);
        } else {
            // It was a repeated question, advance step
            currentQ.step++;
            if (currentQ.step < 3) {
                currentQ.showAfter = Date.now() + 60 * 60 * 1000; // 1 hour
                sessionQueue.push(currentQ);
            } else {
                markQuestionCompleted(currentQ.id);
            }
            currentQ = null;
            saveSessionState();
            setTimeout(nextQuestion, 800);
        }
    } else {
        // Wrong
        currentQ.isWrongToday = true;
        currentQ.step = 1;
        currentQ.showAfter = Date.now() + 10 * 60 * 1000; // 10 mins
        sessionQueue.push(currentQ);
        
        // Mark wrong in state
        let stats = state.dailyStats[state.currentDay];
        if (stats) {
            if (!stats.wrongIds) stats.wrongIds = [];
            if (!stats.wrongIds.includes(currentQ.id)) {
                stats.wrongIds.push(currentQ.id);
            }
        }
        
        if (!state.wrongBook[currentQ.id]) {
            state.wrongBook[currentQ.id] = { reviewDays: [], failCount: 0 };
        }
        state.wrongBook[currentQ.id].failCount = (state.wrongBook[currentQ.id].failCount || 0) + 1;
        let failCount = state.wrongBook[currentQ.id].failCount;
        
        // System judgement
        if (!state.wrongBook[currentQ.id].reviewDays.includes(state.currentDay + 1)) {
            state.wrongBook[currentQ.id].reviewDays.push(state.currentDay + 1);
        }
        if (failCount > 1 && !state.wrongBook[currentQ.id].reviewDays.includes(state.currentDay + 2)) {
            state.wrongBook[currentQ.id].reviewDays.push(state.currentDay + 2);
        }

        currentQ = null;
        saveSessionState();
        saveState(); // Ensure overall state is synced with server after a wrong answer

        optionsElements.forEach(opt => {
            if (opt.classList.contains('selected')) opt.classList.add('wrong');
            if (correctAns.includes(opt.dataset.val)) opt.classList.add('correct');
        });

        const analysisBox = document.getElementById('analysis-box');
        analysisBox.classList.remove('hidden');
        document.getElementById('next-q-btn').addEventListener('click', nextQuestion);
    }
}

function finishRound() {
    state.activeSession = { isActive: false };
    saveState();
    
    if (isUltimateChallenge) {
        let rate = ultimateScore / 30;
        if (rate >= 0.9) {
            state.currentDay = 8;
            saveState();
            switchScreen(homeScreen);
            document.getElementById('cert-date').innerText = getTodayString();
            certModal.classList.remove('hidden');
            renderHome();
        } else {
            alert(`挑战失败！正确率: ${(rate*100).toFixed(1)}%\n需要达到 90% 才能通关。请再试一次！`);
            switchScreen(homeScreen);
        }
        return;
    }

    let stats = state.dailyStats[state.currentDay];
    let remainingIds = [];
    if (stats && stats.targetIds) {
        let completed = stats.completedIds || [];
        remainingIds = stats.targetIds.filter(id => !completed.includes(id));
    }

    if (remainingIds.length === 0) {
        finishDay();
    } else {
        alert(`本轮已完成！今日还剩 ${remainingIds.length} 题，可以休息一下再继续。`);
        switchScreen(homeScreen);
        renderHome();
    }
}

function finishDay() {
    if (state.lastDate !== getTodayString()) {
        let isMakeup = false;
        if (state.lastDate) {
            let lastDateObj = new Date(state.lastDate);
            let todayObj = new Date(getTodayString());
            let diffDays = (todayObj - lastDateObj) / (1000 * 60 * 60 * 24);
            if (diffDays > 1.5) { // more than 1 day difference
                isMakeup = true;
            }
        }

        if (isMakeup) {
            state.streak = 1; // reset streak
        } else {
            state.streak++;
        }
        
        state.lastDate = getTodayString();
        state.currentDay++;
    }
    saveState();
    
    generatePDF();
    
    alert("今日所有任务已完成！为您生成知识点小结。");
    switchScreen(homeScreen);
    renderHome();
}

function generatePDF() {
    let wrongIds = state.dailyStats[state.currentDay - 1]?.wrongIds || [];
    if (wrongIds.length === 0) return; // No wrongs to print
    
    document.getElementById('print-date').innerText = getTodayString();
    let content = document.getElementById('print-content');
    content.innerHTML = '';
    
    wrongIds.forEach((id, idx) => {
        let q = questionsData.find(x => x.id === id);
        let div = document.createElement('div');
        div.className = 'print-item';
        div.innerHTML = `
            <h3>${idx + 1}. ${q.stem}</h3>
            <p><strong>正确答案:</strong> ${q.answer}</p>
            <p><strong>解析:</strong> ${q.analysis}</p>
        `;
        content.appendChild(div);
    });
    
    window.print();
}

function saveCertificate() {
    html2canvas(document.getElementById('cert-content')).then(canvas => {
        let link = document.createElement('a');
        link.download = '7日通关证书.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

function renderWrongBook() {
    const list = document.getElementById('wrong-book-list');
    list.innerHTML = '';
    
    let wrongIds = Object.keys(state.wrongBook);
    if (wrongIds.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 3rem;">太棒了！您当前没有错题记录。</p>';
    } else {
        wrongIds.forEach((id, idx) => {
            let q = questionsData.find(x => x.id === id);
            if (!q) return;
            
            let div = document.createElement('div');
            div.className = 'wrong-item';
            div.innerHTML = `
                <h4>${idx + 1}. ${q.stem}</h4>
                <div class="wrong-answer">正确答案: ${q.answer}</div>
                <div class="wrong-analysis">${q.analysis}</div>
            `;
            list.appendChild(div);
        });
    }
    
    wrongBookModal.classList.remove('hidden');
}

window.addEventListener('DOMContentLoaded', init);
