// =============================================================================
// utils.js — Utility functions
// =============================================================================

const Utils = (() => {
    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = randInt(0, i);
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function pickRandom(arr) {
        return arr[randInt(0, arr.length - 1)];
    }

    function pickByRarity() {
        const roll = Math.random();
        if (roll < 0.60) return 'common';
        if (roll < 0.90) return 'rare';
        return 'legendary';
    }

    function frequencyMap(values) {
        const freq = {};
        for (const v of values) {
            freq[v] = (freq[v] || 0) + 1;
        }
        return freq;
    }

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    return { randInt, shuffle, pickRandom, pickByRarity, frequencyMap, clamp };
})();
