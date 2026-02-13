// =============================================================================
// dice.js — Dice system: rolling, fatigue, states
// =============================================================================

const DiceSystem = (() => {
    const STATE = { NORMAL: 'normal', CRACKED: 'cracked', BROKEN: 'broken' };

    function createDie(id) {
        return {
            id,
            value: 0,
            fatigue: 0,
            state: STATE.NORMAL,
            frozen: false,
            used: false,
        };
    }

    function createDicePool(count = 5) {
        return Array.from({ length: count }, (_, i) => createDie(i));
    }

    function rollDie(die) {
        if (die.frozen) return die;
        let raw;
        if (die.state === STATE.BROKEN) {
            raw = Utils.randInt(1, 3);
        } else {
            raw = Utils.randInt(1, 6);
        }
        let finalValue = raw;
        if (die.state === STATE.CRACKED) {
            finalValue = Math.max(1, raw - 1);
        }
        return { ...die, value: finalValue };
    }

    function rollAll(dice) {
        return dice.map(d => rollDie(d));
    }

    function applyFatigue(die) {
        const newFatigue = die.fatigue + 1;
        let newState = die.state;
        if (newFatigue >= 5) {
            newState = STATE.BROKEN;
        } else if (newFatigue >= 3) {
            newState = STATE.CRACKED;
        }
        return { ...die, fatigue: newFatigue, state: newState };
    }

    function resetFatigue(dice) {
        return dice.map(d => ({ ...d, fatigue: 0, state: STATE.NORMAL }));
    }

    function resetForTurn(dice) {
        return dice.map(d => ({ ...d, frozen: false, used: false }));
    }

    function getAvailableDice(dice) {
        return dice.filter(d => !d.used);
    }

    return {
        STATE,
        createDicePool,
        rollDie,
        rollAll,
        applyFatigue,
        resetFatigue,
        resetForTurn,
        getAvailableDice,
    };
})();
