// =============================================================================
// relics.js — Relic definitions and effects
// =============================================================================

const Relics = (() => {
    const RELIC_POOL = [
        {
            id: 'lucky_coin',
            name: 'Pièce Chanceuse',
            description: '+5 or après chaque combat.',
            rarity: 'common',
            onCombatEnd: (run) => { run.gold += 5; },
        },
        {
            id: 'iron_skin',
            name: 'Peau de Fer',
            description: '+5 armure au début de chaque combat.',
            rarity: 'common',
            onCombatStart: (combat) => { combat.playerArmor += 5; },
        },
        {
            id: 'vitality_ring',
            name: 'Anneau de Vitalité',
            description: '+15 PV max.',
            rarity: 'common',
            onAcquire: (run) => { run.playerMaxHp += 15; run.playerHp += 15; },
        },
        {
            id: 'loaded_dice',
            name: 'Dés Pipés',
            description: '+1 relance par tour.',
            rarity: 'rare',
            modifyRerolls: (count) => count + 1,
        },
        {
            id: 'fatigue_guard',
            name: 'Garde-Fatigue',
            description: 'La fatigue fissuré passe à 4 au lieu de 3.',
            rarity: 'rare',
            modifyCrackedThreshold: (val) => val + 1,
        },
        {
            id: 'vampiric_edge',
            name: 'Lame Vampirique',
            description: 'Soin de 3 PV par carte jouée.',
            rarity: 'rare',
            onCardPlayed: (combat) => {
                combat.playerHp = Math.min(combat.playerMaxHp, combat.playerHp + 3);
            },
        },
        {
            id: 'chaos_orb',
            name: 'Orbe du Chaos',
            description: 'Pioche 1 carte supplémentaire au début de chaque tour.',
            rarity: 'legendary',
            modifyDraw: (count) => count + 1,
        },
        {
            id: 'phoenix_feather',
            name: 'Plume de Phénix',
            description: 'Résurrection unique avec 30 PV.',
            rarity: 'legendary',
            onDeath: (combat) => {
                combat.playerHp = 30;
                return true; // survived
            },
            singleUse: true,
        },
    ];

    function getRandomRelic(ownedIds = []) {
        const available = RELIC_POOL.filter(r => !ownedIds.includes(r.id));
        if (available.length === 0) return null;
        return { ...Utils.pickRandom(available) };
    }

    function relicCost(relic) {
        if (relic.rarity === 'common') return 50;
        if (relic.rarity === 'rare') return 100;
        return 150;
    }

    return { RELIC_POOL, getRandomRelic, relicCost };
})();
