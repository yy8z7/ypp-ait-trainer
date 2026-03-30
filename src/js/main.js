/**
 * @file main.js
 * @description 应用入口，负责初始化、事件绑定以及答题核心逻辑控制
 */
import { state, loadState, saveState, resetState, getTodayString } from './store.js';
import {
    dom,
    renderHome,
    switchScreen,
    renderStudyProgressSegments,
    renderWrongBook,
    saveCertificate,
    generatePDF
} from './ui.js';

let questionsData = [];
let sessionQueue = [];
let currentQ = null;
let sessionTotal = 0;
const ROUND_SIZE = 50;

let isUltimateChallenge = false;
let ultimateScore = 0;

async function init() {
    try {
        const res = await fetch('./questions.json');
        questionsData = await res.json();
    } catch (e) {
        console.error('Failed to load questions', e);
        alert('题库加载失败，请检查 questions.json');
        return;
    }

    await loadState(questionsData);
    renderHome();
    bindEvents();
}

function bindEvents() {
    document.getElementById('start-btn').addEventListener('click', startSession);

    document.getElementById('back-btn').addEventListener('click', () => {
        if (confirm('确定要退出当前学习吗？进度将保留。')) {
            saveState();
            switchScreen(dom.homeScreen);
            renderHome();
        }
    });

    document
        .getElementById('ultimate-challenge-btn')
        .addEventListener('click', startUltimateChallenge);
    document
        .getElementById('view-cert-btn')
        .addEventListener('click', () => dom.certModal.classList.remove('hidden'));
    document
        .getElementById('close-cert-btn')
        .addEventListener('click', () => dom.certModal.classList.add('hidden'));
    document.getElementById('save-cert-btn').addEventListener('click', saveCertificate);

    document.getElementById('reset-btn').addEventListener('click', async () => {
        if (
            confirm(
                '警告：此操作将清空您的所有学习进度、错题记录和打卡天数！\n\n确定要重新开始吗？'
            )
        ) {
            await resetState();
            alert('进度已清空，页面将重新加载。');
            location.reload();
        }
    });

    document
        .getElementById('view-wrong-btn')
        .addEventListener('click', () => renderWrongBook(questionsData));
    document.getElementById('close-wrong-book-btn').addEventListener('click', () => {
        dom.wrongBookModal.classList.add('hidden');
    });
}

function startSession() {
    if (state.currentDay > 7) return;

    if (
        state.activeSession &&
        state.activeSession.isActive &&
        !state.activeSession.isUltimateChallenge
    ) {
        resumeSession();
        return;
    }

    if (!state.dailyStats[state.currentDay]) {
        let targetIds = [];
        if (state.currentDay <= 4) {
            targetIds = [...state.daySplit[state.currentDay - 1]];
        } else if (state.currentDay <= 6) {
            let allIds = questionsData.map((q) => q.id);
            allIds.sort(() => Math.random() - 0.5);
            targetIds = allIds.slice(0, 150);
        }

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
        remainingIds = stats.targetIds.filter((id) => !completed.includes(id));
    }

    if (remainingIds.length === 0) {
        finishDay();
        return;
    }

    let roundIds = remainingIds.slice(0, ROUND_SIZE);

    sessionQueue = roundIds.map((id) => ({
        id,
        step: 0,
        showAfter: 0,
        isWrongToday: false
    }));

    sessionTotal = sessionQueue.length;
    if (sessionTotal === 0) {
        alert('今日暂无任务！');
        return;
    }

    isUltimateChallenge = false;
    ultimateScore = 0;

    state.activeSession = {
        isActive: true,
        queue: sessionQueue,
        total: sessionTotal,
        currentQ: null,
        isUltimateChallenge: false,
        ultimateScore: 0
    };
    saveState();

    switchScreen(dom.studyScreen);
    nextQuestion();
}

function startUltimateChallenge() {
    if (
        state.activeSession &&
        state.activeSession.isActive &&
        state.activeSession.isUltimateChallenge
    ) {
        resumeSession();
        return;
    }

    isUltimateChallenge = true;
    ultimateScore = 0;
    let allIds = questionsData.map((q) => q.id);
    allIds.sort(() => Math.random() - 0.5);
    let challengeIds = allIds.slice(0, 30);

    sessionQueue = challengeIds.map((id) => ({
        id,
        step: 0,
        showAfter: 0,
        isWrongToday: false
    }));
    sessionTotal = 30;

    saveSessionState();
    switchScreen(dom.studyScreen);
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

    switchScreen(dom.studyScreen);
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

    let done = sessionTotal - sessionQueue.length;
    let remaining = sessionQueue.length;
    let estimatedMins = Math.ceil(remaining * 1.2);

    document.getElementById('study-progress-text').innerText =
        `本轮已做 ${done}/${sessionTotal} 题 | 预计 ${estimatedMins} 分钟`;
    renderStudyProgressSegments(sessionTotal, done);

    let now = Date.now();
    let idx = sessionQueue.findIndex((q) => q.showAfter <= now);
    if (idx === -1) idx = 0;

    currentQ = sessionQueue[idx];
    sessionQueue.splice(idx, 1);
    saveSessionState();

    renderCard(currentQ);
}

function renderCard(qState) {
    const qData = questionsData.find((q) => q.id === qState.id);
    if (!qData) return;

    dom.cardContainer.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'card fade-hidden';

    let typeName = '单选题';
    if (qData.type === 'multiple') typeName = '多选题';
    if (qData.type === 'determine') typeName = '判断题';

    let html = `<div class="question-type">${typeName}</div>
                <div class="question-stem">${qData.stem}</div>
                <ul class="options-list">`;

    qData.options.forEach((opt) => {
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
    dom.cardContainer.appendChild(card);

    setTimeout(() => {
        card.classList.remove('fade-hidden');
    }, 30);

    const options = card.querySelectorAll('.option-item');
    options.forEach((opt) => {
        opt.addEventListener('click', () => {
            if (qData.type === 'multiple') {
                opt.classList.toggle('selected');
            } else {
                options.forEach((o) => o.classList.remove('selected'));
                opt.classList.add('selected');
            }
        });
    });

    document.getElementById('submit-ans-btn').addEventListener('click', () => {
        checkAnswer(qData, options);
    });

    let touchstartX = 0;
    let touchendX = 0;

    card.addEventListener(
        'touchstart',
        (e) => {
            touchstartX = e.changedTouches[0].screenX;
        },
        { passive: true }
    );

    card.addEventListener(
        'touchend',
        (e) => {
            touchendX = e.changedTouches[0].screenX;
            handleSwipe();
        },
        { passive: true }
    );

    function handleSwipe() {
        const nextBtn = document.getElementById('next-q-btn');
        if (nextBtn && !nextBtn.parentElement.classList.contains('hidden')) {
            if (touchendX < touchstartX - 50) {
                card.classList.add('fade-hidden');
                setTimeout(nextQuestion, 250);
            }
        }
    }
}

function getOptionValue(type, optText) {
    if (type === 'determine') return optText;
    return optText.substring(0, 1);
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
            saveState();
        }
    }
}

function checkAnswer(qData, optionsElements) {
    let selected = [];
    optionsElements.forEach((opt) => {
        if (opt.classList.contains('selected')) {
            selected.push(opt.dataset.val);
        }
    });

    if (selected.length === 0) return;

    document.getElementById('submit-ans-btn').classList.add('hidden');
    optionsElements.forEach((opt) => (opt.style.pointerEvents = 'none'));

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
        optionsElements.forEach((opt) => {
            if (opt.classList.contains('selected')) opt.classList.add('correct');
        });

        if (currentQ.step === 0 && !currentQ.isWrongToday) {
            markQuestionCompleted(currentQ.id);
            currentQ = null;
            saveSessionState();
            setTimeout(nextQuestion, 800);
        } else {
            currentQ.step++;
            if (currentQ.step < 3) {
                currentQ.showAfter = Date.now() + 60 * 60 * 1000;
                sessionQueue.push(currentQ);
            } else {
                markQuestionCompleted(currentQ.id);
            }
            currentQ = null;
            saveSessionState();
            setTimeout(nextQuestion, 800);
        }
    } else {
        currentQ.isWrongToday = true;
        currentQ.step = 1;
        currentQ.showAfter = Date.now() + 10 * 60 * 1000;
        sessionQueue.push(currentQ);

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

        if (!state.wrongBook[currentQ.id].reviewDays.includes(state.currentDay + 1)) {
            state.wrongBook[currentQ.id].reviewDays.push(state.currentDay + 1);
        }
        if (
            failCount > 1 &&
            !state.wrongBook[currentQ.id].reviewDays.includes(state.currentDay + 2)
        ) {
            state.wrongBook[currentQ.id].reviewDays.push(state.currentDay + 2);
        }

        currentQ = null;
        saveSessionState();
        saveState();

        optionsElements.forEach((opt) => {
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
            switchScreen(dom.homeScreen);
            document.getElementById('cert-date').innerText = getTodayString();
            dom.certModal.classList.remove('hidden');
            renderHome();
        } else {
            alert(
                `挑战失败！正确率: ${(rate * 100).toFixed(1)}%\n需要达到 90% 才能通关。请再试一次！`
            );
            switchScreen(dom.homeScreen);
        }
        return;
    }

    let stats = state.dailyStats[state.currentDay];
    let remainingIds = [];
    if (stats && stats.targetIds) {
        let completed = stats.completedIds || [];
        remainingIds = stats.targetIds.filter((id) => !completed.includes(id));
    }

    if (remainingIds.length === 0) {
        finishDay();
    } else {
        alert(`本轮已完成！今日还剩 ${remainingIds.length} 题，可以休息一下再继续。`);
        switchScreen(dom.homeScreen);
        renderHome();
    }
}

function finishDay() {
    if (state.lastDate !== getTodayString()) {
        let isMakeup = false;
        if (state.lastDate) {
            let lastDateStr = state.lastDate.replace(/\//g, '-');
            let todayStr = getTodayString().replace(/\//g, '-');

            let lastDateObj = new Date(lastDateStr);
            let todayObj = new Date(todayStr);

            // Set time to midnight to avoid daylight saving or time zone issues
            lastDateObj.setHours(0, 0, 0, 0);
            todayObj.setHours(0, 0, 0, 0);

            let diffDays = Math.round((todayObj - lastDateObj) / (1000 * 60 * 60 * 24));
            if (diffDays > 1) {
                isMakeup = true;
            }
        } else {
            // 如果因为某种旧版本数据导致 lastDate 为空，则安全地设为连续
            isMakeup = false;
        }

        if (isMakeup) {
            state.streak = 1;
        } else {
            // 如果是第一天（0天连续）完成任务，就变成1天；如果原本就是连续的，累加
            state.streak = state.streak === 0 ? 1 : state.streak + 1;
        }

        state.lastDate = getTodayString();
        state.currentDay++;
    }
    saveState();

    generatePDF(questionsData);

    alert('今日所有任务已完成！为您生成知识点小结。');
    switchScreen(dom.homeScreen);
    renderHome();
}

window.addEventListener('DOMContentLoaded', init);
