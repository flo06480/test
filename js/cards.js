// =============================================================================
// cards.js — Card definitions, validation logic, and card pool
// =============================================================================

const Cards = (() => {
    // -------------------------------------------------------------------------
    // Validation helpers — all operate on an array of die values
    // -------------------------------------------------------------------------

    function freq(values) {
        return Utils.frequencyMap(values);
    }

    function hasPair(values) {
        const f = freq(values);
        return Object.values(f).some(c => c >= 2);
    }

    function hasDoublePair(values) {
        const f = freq(values);
        const pairs = Object.values(f).filter(c => c >= 2);
        return pairs.length >= 2;
    }

    function hasTriple(values) {
        const f = freq(values);
        return Object.values(f).some(c => c >= 3);
    }

    function hasQuad(values) {
        const f = freq(values);
        return Object.values(f).some(c => c >= 4);
    }

    function hasFull(values) {
        const f = freq(values);
        const counts = Object.values(f).sort((a, b) => b - a);
        return counts.length >= 2 && counts[0] >= 3 && counts[1] >= 2;
    }

    function hasFiveOfAKind(values) {
        const f = freq(values);
        return Object.values(f).some(c => c >= 5);
    }

    function hasStraightLow(values) {
        const set = new Set(values);
        return [1, 2, 3, 4, 5].every(v => set.has(v));
    }

    function hasStraightHigh(values) {
        const set = new Set(values);
        return [2, 3, 4, 5, 6].every(v => set.has(v));
    }

    function hasNoPair(values) {
        const f = freq(values);
        return Object.values(f).every(c => c === 1);
    }

    function hasFourDifferent(values) {
        const unique = new Set(values);
        return unique.size >= 4;
    }

    function hasExactValue(target) {
        return (values) => values.includes(target);
    }

    function sumOf(values) {
        return values.reduce((a, b) => a + b, 0);
    }

    // -------------------------------------------------------------------------
    // Card definitions
    // -------------------------------------------------------------------------

    const CARD_POOL = [
        // --- COMMON (rarity: 'common') ---
        {
            id: 'impulse',
            name: 'Impulsion',
            description: 'Utilise 1 dé quelconque. Dégâts = valeur × 3.',
            rarity: 'common',
            diceRequired: 1,
            validate: (_vals) => true,
            computeDamage: (vals) => vals[0] * 3,
            effect: null,
        },
        {
            id: 'pair',
            name: 'Paire',
            description: '2 dés de même valeur. Dégâts = somme × 3.',
            rarity: 'common',
            diceRequired: 2,
            validate: (vals) => hasPair(vals),
            computeDamage: (vals) => sumOf(vals) * 3,
            effect: null,
        },
        {
            id: 'small_strike',
            name: 'Frappe Mineure',
            description: '1 dé ≥ 3. Dégâts = valeur × 4.',
            rarity: 'common',
            diceRequired: 1,
            validate: (vals) => vals[0] >= 3,
            computeDamage: (vals) => vals[0] * 4,
            effect: null,
        },
        {
            id: 'shield_bash',
            name: 'Coup de Bouclier',
            description: '1 dé quelconque. Dégâts = 8 + valeur. Gagne armure = valeur.',
            rarity: 'common',
            diceRequired: 1,
            validate: (_vals) => true,
            computeDamage: (vals) => 8 + vals[0],
            effect: (vals, combat) => { combat.playerArmor += vals[0]; },
        },
        {
            id: 'double_tap',
            name: 'Double Frappe',
            description: '2 dés quelconques. Dégâts = somme × 2.',
            rarity: 'common',
            diceRequired: 2,
            validate: (_vals) => true,
            computeDamage: (vals) => sumOf(vals) * 2,
            effect: null,
        },
        {
            id: 'guard',
            name: 'Garde',
            description: '1 dé quelconque. Armure = valeur × 3.',
            rarity: 'common',
            diceRequired: 1,
            validate: (_vals) => true,
            computeDamage: (_vals) => 0,
            effect: (vals, combat) => { combat.playerArmor += vals[0] * 3; },
        },
        {
            id: 'precise_shot',
            name: 'Tir Précis',
            description: '1 dé = 6. Dégâts = 30.',
            rarity: 'common',
            diceRequired: 1,
            validate: (vals) => vals[0] === 6,
            computeDamage: (_vals) => 30,
            effect: null,
        },
        {
            id: 'scatter',
            name: 'Dispersion',
            description: '3 dés quelconques. Dégâts = somme × 2.',
            rarity: 'common',
            diceRequired: 3,
            validate: (_vals) => true,
            computeDamage: (vals) => sumOf(vals) * 2,
            effect: null,
        },

        {
            id: 'healing_pair',
            name: 'Paire Curative',
            description: 'Paire (2 identiques). Soin = somme × 2.',
            rarity: 'common',
            diceRequired: 2,
            validate: (vals) => hasPair(vals),
            computeDamage: (_vals) => 0,
            effect: (vals, combat) => {
                combat.playerHp = Math.min(combat.playerMaxHp, combat.playerHp + sumOf(vals) * 2);
            },
        },

        // --- RARE ---
        {
            id: 'royal_duo',
            name: 'Duo Royal',
            description: '2 dés valeur 5 ou 6. Dégâts = somme × 4.',
            rarity: 'rare',
            diceRequired: 2,
            validate: (vals) => vals.every(v => v >= 5),
            computeDamage: (vals) => sumOf(vals) * 4,
            effect: null,
        },
        {
            id: 'triple_threat',
            name: 'Triple Menace',
            description: 'Brelan (3 identiques). Dégâts = somme × 4.',
            rarity: 'rare',
            diceRequired: 3,
            validate: (vals) => hasTriple(vals),
            computeDamage: (vals) => sumOf(vals) * 4,
            effect: null,
        },
        {
            id: 'double_pair',
            name: 'Double Paire',
            description: '4 dés formant 2 paires. Dégâts = somme × 3.',
            rarity: 'rare',
            diceRequired: 4,
            validate: (vals) => hasDoublePair(vals),
            computeDamage: (vals) => sumOf(vals) * 3,
            effect: null,
        },
        {
            id: 'low_straight',
            name: 'Suite Basse',
            description: '5 dés formant 1-2-3-4-5. Dégâts = 60.',
            rarity: 'rare',
            diceRequired: 5,
            validate: (vals) => hasStraightLow(vals),
            computeDamage: (_vals) => 60,
            effect: null,
        },
        {
            id: 'high_straight',
            name: 'Suite Haute',
            description: '5 dés formant 2-3-4-5-6. Dégâts = 70.',
            rarity: 'rare',
            diceRequired: 5,
            validate: (vals) => hasStraightHigh(vals),
            computeDamage: (_vals) => 70,
            effect: null,
        },
        {
            id: 'chaos_burst',
            name: 'Éruption Chaos',
            description: '4 dés tous différents. Dégâts = somme × 3.',
            rarity: 'rare',
            diceRequired: 4,
            validate: (vals) => hasFourDifferent(vals),
            computeDamage: (vals) => sumOf(vals) * 3,
            effect: null,
        },
        {
            id: 'iron_wall',
            name: 'Mur de Fer',
            description: 'Paire. Armure = somme × 4.',
            rarity: 'rare',
            diceRequired: 2,
            validate: (vals) => hasPair(vals),
            computeDamage: (_vals) => 0,
            effect: (vals, combat) => { combat.playerArmor += sumOf(vals) * 4; },
        },
        {
            id: 'drain_strike',
            name: 'Frappe Drain',
            description: '2 dés quelconques. Dégâts = somme × 2. Soin = somme.',
            rarity: 'rare',
            diceRequired: 2,
            validate: (_vals) => true,
            computeDamage: (vals) => sumOf(vals) * 2,
            effect: (vals, combat) => {
                combat.playerHp = Math.min(combat.playerMaxHp, combat.playerHp + sumOf(vals));
            },
        },
        {
            id: 'no_pair_strike',
            name: 'Chaos Pur',
            description: '5 dés tous différents. Dégâts = somme × 3.',
            rarity: 'rare',
            diceRequired: 5,
            validate: (vals) => hasNoPair(vals),
            computeDamage: (vals) => sumOf(vals) * 3,
            effect: null,
        },
        {
            id: 'armored_triple',
            name: 'Brelan Blindé',
            description: 'Brelan (3 identiques). Dégâts = 15. Armure = somme × 3.',
            rarity: 'rare',
            diceRequired: 3,
            validate: (vals) => hasTriple(vals),
            computeDamage: (_vals) => 15,
            effect: (vals, combat) => { combat.playerArmor += sumOf(vals) * 3; },
        },
        {
            id: 'vampiric_triple',
            name: 'Brelan Vampirique',
            description: 'Brelan (3 identiques). Dégâts = somme × 3. Soin = somme.',
            rarity: 'rare',
            diceRequired: 3,
            validate: (vals) => hasTriple(vals),
            computeDamage: (vals) => sumOf(vals) * 3,
            effect: (vals, combat) => {
                combat.playerHp = Math.min(combat.playerMaxHp, combat.playerHp + sumOf(vals));
            },
        },
        {
            id: 'double_pair_heal',
            name: 'Double Paire Curative',
            description: 'Double Paire (4 dés, 2 paires). Dégâts = somme × 2. Soin = somme.',
            rarity: 'rare',
            diceRequired: 4,
            validate: (vals) => hasDoublePair(vals),
            computeDamage: (vals) => sumOf(vals) * 2,
            effect: (vals, combat) => {
                combat.playerHp = Math.min(combat.playerMaxHp, combat.playerHp + sumOf(vals));
            },
        },
        {
            id: 'full_shield',
            name: 'Full Défensif',
            description: 'Full (brelan + paire). Armure = somme × 4. Soin = 10.',
            rarity: 'rare',
            diceRequired: 5,
            validate: (vals) => hasFull(vals),
            computeDamage: (_vals) => 0,
            effect: (vals, combat) => {
                combat.playerArmor += sumOf(vals) * 4;
                combat.playerHp = Math.min(combat.playerMaxHp, combat.playerHp + 10);
            },
        },

        // --- LEGENDARY ---
        {
            id: 'full_house',
            name: 'Full',
            description: 'Full (brelan + paire). Dégâts = somme × 5.',
            rarity: 'legendary',
            diceRequired: 5,
            validate: (vals) => hasFull(vals),
            computeDamage: (vals) => sumOf(vals) * 5,
            effect: null,
        },
        {
            id: 'quad_strike',
            name: 'Frappe Carrée',
            description: 'Carré (4 identiques). Dégâts = somme × 6.',
            rarity: 'legendary',
            diceRequired: 4,
            validate: (vals) => hasQuad(vals),
            computeDamage: (vals) => sumOf(vals) * 6,
            effect: null,
        },
        {
            id: 'five_of_kind',
            name: 'Quintuplé',
            description: '5 dés identiques. Dégâts = somme × 8.',
            rarity: 'legendary',
            diceRequired: 5,
            validate: (vals) => hasFiveOfAKind(vals),
            computeDamage: (vals) => sumOf(vals) * 8,
            effect: null,
        },
        {
            id: 'annihilate',
            name: 'Annihilation',
            description: '3 dés ≥ 5. Dégâts = 80.',
            rarity: 'legendary',
            diceRequired: 3,
            validate: (vals) => vals.every(v => v >= 5),
            computeDamage: (_vals) => 80,
            effect: null,
        },
        {
            id: 'fortify',
            name: 'Fortification',
            description: 'Brelan. Armure = somme × 5. Soin = 10.',
            rarity: 'legendary',
            diceRequired: 3,
            validate: (vals) => hasTriple(vals),
            computeDamage: (_vals) => 0,
            effect: (vals, combat) => {
                combat.playerArmor += sumOf(vals) * 5;
                combat.playerHp = Math.min(combat.playerMaxHp, combat.playerHp + 10);
            },
        },
        {
            id: 'soul_rend',
            name: 'Déchirure d\'Âme',
            description: 'Full. Dégâts = 60. Soin = 20.',
            rarity: 'legendary',
            diceRequired: 5,
            validate: (vals) => hasFull(vals),
            computeDamage: (_vals) => 60,
            effect: (_vals, combat) => {
                combat.playerHp = Math.min(combat.playerMaxHp, combat.playerHp + 20);
            },
        },
        {
            id: 'devastating_quad',
            name: 'Carré Dévastateur',
            description: 'Carré (4 identiques). Dégâts = somme × 8.',
            rarity: 'legendary',
            diceRequired: 4,
            validate: (vals) => hasQuad(vals),
            computeDamage: (vals) => sumOf(vals) * 8,
            effect: null,
        },
        {
            id: 'armored_full',
            name: 'Full Blindé',
            description: 'Full (brelan + paire). Dégâts = somme × 3. Armure = somme × 3.',
            rarity: 'legendary',
            diceRequired: 5,
            validate: (vals) => hasFull(vals),
            computeDamage: (vals) => sumOf(vals) * 3,
            effect: (vals, combat) => { combat.playerArmor += sumOf(vals) * 3; },
        },
        {
            id: 'supreme_triple',
            name: 'Brelan Suprême',
            description: 'Brelan de valeur ≥ 4. Dégâts = 85.',
            rarity: 'legendary',
            diceRequired: 3,
            validate: (vals) => hasTriple(vals) && vals.every(v => v >= 4),
            computeDamage: (_vals) => 85,
            effect: null,
        },
        {
            id: 'quad_fortress',
            name: 'Forteresse Carrée',
            description: 'Carré (4 identiques). Armure = somme × 6. Soin = 15.',
            rarity: 'legendary',
            diceRequired: 4,
            validate: (vals) => hasQuad(vals),
            computeDamage: (_vals) => 0,
            effect: (vals, combat) => {
                combat.playerArmor += sumOf(vals) * 6;
                combat.playerHp = Math.min(combat.playerMaxHp, combat.playerHp + 15);
            },
        },
    ];

    function getStarterDeck() {
        return [
            { ...CARD_POOL.find(c => c.id === 'impulse') },
            { ...CARD_POOL.find(c => c.id === 'impulse') },
            { ...CARD_POOL.find(c => c.id === 'pair') },
            { ...CARD_POOL.find(c => c.id === 'pair') },
            { ...CARD_POOL.find(c => c.id === 'small_strike') },
            { ...CARD_POOL.find(c => c.id === 'double_tap') },
            { ...CARD_POOL.find(c => c.id === 'guard') },
            { ...CARD_POOL.find(c => c.id === 'shield_bash') },
            { ...CARD_POOL.find(c => c.id === 'scatter') },
            { ...CARD_POOL.find(c => c.id === 'precise_shot') },
        ];
    }

    function getRandomCard(rarity) {
        const r = rarity || Utils.pickByRarity();
        const pool = CARD_POOL.filter(c => c.rarity === r);
        if (pool.length === 0) return { ...Utils.pickRandom(CARD_POOL) };
        return { ...Utils.pickRandom(pool) };
    }

    function getShopCards(count = 3) {
        const cards = [];
        for (let i = 0; i < count; i++) {
            cards.push(getRandomCard());
        }
        return cards;
    }

    function cardCost(card) {
        if (card.rarity === 'common') return 30;
        if (card.rarity === 'rare') return 60;
        return 100;
    }

    return { CARD_POOL, getStarterDeck, getRandomCard, getShopCards, cardCost };
})();
