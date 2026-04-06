/**
 * @file store.js
 * @description 状态管理模块，负责数据的本地与远程双路同步
 */

export const STATE_KEY = 'study_app_state';

export const config = {
    totalDays: 7, // 动态调整总天数
    get learningDays() { return Math.max(1, this.totalDays - 3); },
    get mixedDays() { return Math.max(1, this.totalDays - 1); }
};

export const state = {
    currentDay: 1,
    startDate: null,
    streak: 0,
    lastDate: null,
    daySplit: [],
    wrongBook: {}, // id -> { reviewDays: [], failCount: 0 }
    dailyStats: {}, // day -> { targetIds: [], completedIds: [], wrongIds: [] }
    activeSession: { isActive: false }
};

/**
 * 加载系统状态
 * @param {Array} questionsData - 题库数据
 */
export async function loadState(questionsData) {
    let saved = null;
    try {
        const res = await fetch('./api/state');
        if (res.ok) {
            saved = await res.json();
        }
    } catch (e) {
        console.warn('Failed to load state from server, falling back to localStorage', e);
    }

    if (!saved) {
        const local = localStorage.getItem(STATE_KEY);
        if (local) {
            console.log('Migrating state from localStorage to server...');
            saved = JSON.parse(local);
            Object.assign(state, saved);
            saveState();
        }
    }

    if (saved) {
        Object.assign(state, saved);
    } else {
        state.startDate = new Date().toISOString();
        state.lastDate = getTodayString(); // 初始化第一天时，不能把 lastDate 设为 null，否则第二天计算直接算断签
        state.streak = 0;
        state.currentDay = 1;

        let allIds = questionsData.map((q) => q.id);
        allIds.sort(() => Math.random() - 0.5);

        let totalQ = allIds.length;
        let dailyQ = Math.ceil(totalQ / config.learningDays);
        state.daySplit = [];
        for (let i = 0; i < config.learningDays; i++) {
            state.daySplit.push(allIds.slice(i * dailyQ, (i + 1) * dailyQ));
        }
        state.activeSession = { isActive: false };
        saveState();
    }
}

/**
 * 保存系统状态
 */
export function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    fetch('./api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
    }).catch((e) => console.warn('Failed to save state to server', e));
}

/**
 * 重置系统状态
 */
export async function resetState() {
    try {
        await fetch('./api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(null)
        });
    } catch (e) {
        // ignore
    }
    localStorage.removeItem(STATE_KEY);
}

/**
 * 获取今日日期字符串
 * @returns {string} 日期字符串 (YYYY-MM-DD 格式，避免各浏览器解析差异)
 */
export function getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
