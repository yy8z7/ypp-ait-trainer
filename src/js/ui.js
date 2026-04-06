/**
 * @file ui.js
 * @description 界面渲染与 DOM 操作模块
 */
import { state, getTodayString, config } from './store.js';

const ROUND_SIZE = 50;

// DOM Elements
export const dom = {
    homeScreen: document.getElementById('home-screen'),
    studyScreen: document.getElementById('study-screen'),
    printScreen: document.getElementById('print-screen'),
    certModal: document.getElementById('cert-modal'),
    wrongBookModal: document.getElementById('wrong-book-modal'),
    cardContainer: document.getElementById('card-container')
};

export function switchScreen(screen) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    screen.classList.add('active');
}

export function initDynamicTexts() {
    document.title = `${config.totalDays}日刷题通关`;
    const titleEl = document.getElementById('dynamic-title');
    if (titleEl) titleEl.innerText = `${config.totalDays}日通关计划`;
    const certTitleEl = document.getElementById('dynamic-cert-title');
    if (certTitleEl) certTitleEl.innerText = `🎉 ${config.totalDays}日通关证书 🎉`;
}

export function renderHome() {
    renderJourneyTrack();
    document.getElementById('streak-count').innerText = state.streak;
    document.getElementById('current-day-text').innerText = state.currentDay <= config.totalDays ? state.currentDay : config.totalDays;

    let totalWrong = Object.keys(state.wrongBook).length;
    document.getElementById('wrong-count').innerText = totalWrong;

    let desc = '';
    let todayStats = state.dailyStats[state.currentDay];

    let targetTotal = 0;
    let completedTotal = 0;

    if (state.currentDay <= config.learningDays) {
        let splitArr =
            state.daySplit && state.daySplit[state.currentDay - 1]
                ? state.daySplit[state.currentDay - 1]
                : [];
        targetTotal =
            todayStats && todayStats.targetIds ? todayStats.targetIds.length : splitArr.length;
        completedTotal = todayStats?.completedIds?.length || 0;
        desc = `今日新学及复习 共 ${targetTotal} 题 (已完成 ${completedTotal})`;
    } else if (state.currentDay <= config.mixedDays) {
        targetTotal = todayStats && todayStats.targetIds ? todayStats.targetIds.length : 150;
        completedTotal = todayStats?.completedIds?.length || 0;
        desc = `今日混合测试 共 ${targetTotal} 题 (已完成 ${completedTotal})`;
    } else if (state.currentDay === config.totalDays) {
        desc = `终极挑战准备！`;
        document.getElementById('start-btn').classList.add('hidden');
        document.getElementById('certificate-section').classList.remove('hidden');
    } else {
        desc = `已完成${config.totalDays}日计划！`;
        document.getElementById('start-btn').classList.add('hidden');
        document.getElementById('certificate-section').classList.remove('hidden');
        document.getElementById('view-cert-btn').classList.remove('hidden');
        document.getElementById('ultimate-challenge-btn').classList.add('hidden');
    }

    renderProgressSegments(targetTotal, completedTotal);

    let isMakeup = false;
    if (state.lastDate) {
        let lastDateStr = state.lastDate.replace(/-/g, '/');
        let todayStr = getTodayString().replace(/-/g, '/');

        let lastDateObj = new Date(lastDateStr);
        let todayObj = new Date(todayStr);

        lastDateObj.setHours(0, 0, 0, 0);
        todayObj.setHours(0, 0, 0, 0);

        let diffDays = Math.round((todayObj - lastDateObj) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
            isMakeup = true;
        }
    } else {
        // 如果因为某种旧版本数据导致 lastDate 为空，则安全地设为非补刷
        isMakeup = false;
    }

    if (state.activeSession && state.activeSession.isActive) {
        document.getElementById('start-btn').innerText = '继续当前练习';
    } else if (state.lastDate === getTodayString() && state.currentDay < config.totalDays) {
        document.getElementById('start-btn').innerText = '今日已完成 (继续复习)';
    } else if (isMakeup) {
        document.getElementById('start-btn').innerText = '补刷第' + state.currentDay + '天任务';
    } else {
        document.getElementById('start-btn').innerText = '开始今日任务';
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
        
        let blockCapacity = (i === totalRounds - 1 && total % ROUND_SIZE !== 0) ? total % ROUND_SIZE : ROUND_SIZE;
        let segmentLabel = document.createElement('span');
        segmentLabel.className = 'segment-label';

        if (i < completedRounds) {
            segment.classList.add('completed');
            segmentLabel.style.color = '#fff';
            segmentLabel.style.textShadow = 'none';
            segmentLabel.innerText = blockCapacity;
        } else if (i === completedRounds) {
            segment.classList.add('current');
            let innerCompleted = completed % ROUND_SIZE;
            segmentLabel.innerText = `${innerCompleted}/${blockCapacity}`;
            
            if (innerCompleted > 0) {
                let innerFill = document.createElement('div');
                innerFill.style.height = '100%';
                innerFill.style.width = `${(innerCompleted / blockCapacity) * 100}%`;
                innerFill.style.background = 'linear-gradient(90deg, var(--success-color), #34d399)';
                innerFill.style.position = 'absolute';
                innerFill.style.left = '0';
                innerFill.style.top = '0';
                segment.appendChild(innerFill);
            }
        } else {
            segmentLabel.innerText = blockCapacity;
        }
        
        segment.appendChild(segmentLabel);
        container.appendChild(segment);
    }
}

function renderJourneyTrack() {
    const container = document.getElementById('journey-track-container');
    if (!container) return;
    container.innerHTML = '';
    
    for (let i = 1; i <= config.totalDays; i++) {
        const node = document.createElement('div');
        node.className = 'journey-node';
        
        if (i < state.currentDay) {
            node.classList.add('completed');
            node.innerHTML = `<i class="fas fa-check"></i>`;
        } else if (i === state.currentDay) {
            node.classList.add('current');
            node.innerHTML = `<span>D${i}</span>`;
            const pulse = document.createElement('div');
            pulse.className = 'node-pulse';
            node.appendChild(pulse);
        } else {
            node.classList.add('locked');
            node.innerHTML = `<span>D${i}</span>`;
        }
        
        container.appendChild(node);
        
        if (i < config.totalDays) {
            const line = document.createElement('div');
            line.className = 'journey-line';
            if (i < state.currentDay) {
                line.classList.add('completed');
            }
            container.appendChild(line);
        }
    }
}

export function renderStudyProgressSegments(total, completed) {
    const container = document.getElementById('study-progress-container');
    if (!container) return;

    container.innerHTML = '';
    if (total === 0) return;

    let numBlocks = 5;
    if (total < 5) numBlocks = total;

    let baseSize = Math.floor(total / numBlocks);
    let remainder = total % numBlocks;

    let blocks = [];
    for (let i = 0; i < numBlocks; i++) {
        blocks.push(baseSize + (i < remainder ? 1 : 0));
    }

    let accumulated = 0;

    for (let i = 0; i < numBlocks; i++) {
        let segment = document.createElement('div');
        segment.className = 'progress-segment';
        segment.style.flex = '1';

        let blockCapacity = blocks[i];

        let label = document.createElement('span');
        label.className = 'segment-label';

        if (completed >= accumulated + blockCapacity) {
            segment.classList.add('completed');
            label.style.color = '#fff';
            label.style.textShadow = 'none';
            label.innerText = blockCapacity;
        } else if (completed >= accumulated && completed < accumulated + blockCapacity) {
            segment.classList.add('current');
            let innerCompleted = completed - accumulated;
            label.innerText = `${innerCompleted}/${blockCapacity}`;

            let percent = (innerCompleted / blockCapacity) * 100;

            if (innerCompleted > 0) {
                let innerFill = document.createElement('div');
                innerFill.style.height = '100%';
                innerFill.style.width = `${percent}%`;
                innerFill.style.background =
                    'linear-gradient(90deg, var(--success-color), #34d399)';
                innerFill.style.position = 'absolute';
                innerFill.style.left = '0';
                innerFill.style.top = '0';
                innerFill.style.zIndex = '1';
                segment.appendChild(innerFill);
            }
        } else {
            label.innerText = blockCapacity;
        }

        segment.appendChild(label);
        accumulated += blockCapacity;
        container.appendChild(segment);
    }
}

export function renderWrongBook(questionsData) {
    const list = document.getElementById('wrong-book-list');
    list.innerHTML = '';

    let wrongIds = Object.keys(state.wrongBook);
    if (wrongIds.length === 0) {
        list.innerHTML =
            '<p style="text-align: center; color: var(--text-muted); margin-top: 3rem;">太棒了！您当前没有错题记录。</p>';
    } else {
        wrongIds.forEach((id, idx) => {
            let q = questionsData.find((x) => x.id === id);
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

    dom.wrongBookModal.classList.remove('hidden');
}

export function generatePDF(questionsData) {
    let wrongIds = state.dailyStats[state.currentDay - 1]?.wrongIds || [];
    if (wrongIds.length === 0) return;

    document.getElementById('print-date').innerText = getTodayString();
    let content = document.getElementById('print-content');
    content.innerHTML = '';

    wrongIds.forEach((id, idx) => {
        let q = questionsData.find((x) => x.id === id);
        if (!q) return;

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

export function saveCertificate() {
    if (window.html2canvas) {
        window.html2canvas(document.getElementById('cert-content')).then((canvas) => {
            let link = document.createElement('a');
            link.download = `${config.totalDays}日通关证书.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    } else {
        alert('证书生成插件尚未加载完成，请稍后再试。');
    }
}

export function showToast(message) {
    // Remove existing toast if any to prevent stacking
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
        existingToast.remove();
    }

    let toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}
