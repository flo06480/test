// =============================================================================
// run.js — Run management: acts, encounters, progression
// =============================================================================

const Run = (() => {
    function create() {
        return {
            act: 0,
            encounter: 0,
            playerHp: 120,
            playerMaxHp: 120,
            gold: 50,
            deck: Deck.create(Cards.getStarterDeck()),
            relics: [],
            repairNextCombat: false,
            encounterPlan: generateActPlan(),
            state: 'combat', // 'combat', 'shop', 'reward', 'gameover', 'victory'
        };
    }

    function generateActPlan() {
        // Each act: 3 normal, 1 elite, 1 boss
        // Order: normal, normal, normal, elite, boss
        return [
            [
                { type: 'normal' },
                { type: 'normal' },
                { type: 'normal' },
                { type: 'elite' },
                { type: 'boss' },
            ],
            [
                { type: 'normal' },
                { type: 'normal' },
                { type: 'normal' },
                { type: 'elite' },
                { type: 'boss' },
            ],
            [
                { type: 'normal' },
                { type: 'normal' },
                { type: 'normal' },
                { type: 'elite' },
                { type: 'boss' },
            ],
        ];
    }

    function getCurrentEncounter(run) {
        if (run.act >= 3) return null;
        return run.encounterPlan[run.act][run.encounter];
    }

    function getEnemy(run) {
        const enc = getCurrentEncounter(run);
        if (!enc) return null;
        return Enemies.getEnemy(run.act, enc.type);
    }

    function advanceEncounter(run) {
        run.encounter++;
        if (run.encounter >= run.encounterPlan[run.act].length) {
            run.act++;
            run.encounter = 0;
            if (run.act < 3) {
                run.playerMaxHp += 20;
                run.playerHp = Math.min(run.playerHp + 20, run.playerMaxHp);
            }
        }
        if (run.act >= 3) {
            run.state = 'victory';
        }
        return run;
    }

    function getGoldReward(encounterType) {
        if (encounterType === 'normal') return Utils.randInt(15, 25);
        if (encounterType === 'elite') return Utils.randInt(30, 50);
        if (encounterType === 'boss') return Utils.randInt(50, 80);
        return 20;
    }

    return { create, getCurrentEncounter, getEnemy, advanceEncounter, getGoldReward };
})();
