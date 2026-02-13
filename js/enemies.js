// =============================================================================
// enemies.js — Enemy definitions per act
// =============================================================================

const Enemies = (() => {
    // Each enemy: { name, hp, attack, special?, intent patterns }
    // Special effects: 'buff_attack', 'heal', 'armor'

    const ACT1_NORMAL = [
        { name: 'Gobelin Errant', hp: 120, attack: 12, special: null },
        { name: 'Rat Géant', hp: 100, attack: 15, special: null },
        { name: 'Squelette Fragile', hp: 140, attack: 10, special: null },
        { name: 'Slime Acide', hp: 130, attack: 11, special: null },
        { name: 'Bandit', hp: 150, attack: 13, special: null },
    ];

    const ACT1_ELITE = [
        {
            name: 'Chevalier Noir',
            hp: 250,
            attack: 18,
            special: { type: 'armor', value: 8, chance: 0.3 },
        },
        {
            name: 'Sorcier Fou',
            hp: 200,
            attack: 22,
            special: { type: 'buff_attack', value: 3, chance: 0.25 },
        },
    ];

    const ACT1_BOSS = [
        {
            name: 'Le Roi Gobelin',
            hp: 300,
            attack: 20,
            special: { type: 'heal', value: 15, chance: 0.3 },
        },
    ];

    const ACT2_NORMAL = [
        { name: 'Golem de Pierre', hp: 350, attack: 18, special: null },
        { name: 'Spectre', hp: 300, attack: 22, special: null },
        { name: 'Loup Enragé', hp: 320, attack: 20, special: null },
        { name: 'Cultiste', hp: 280, attack: 24, special: null },
        { name: 'Ogre', hp: 400, attack: 16, special: null },
    ];

    const ACT2_ELITE = [
        {
            name: 'Dragon Mineur',
            hp: 500,
            attack: 25,
            special: { type: 'buff_attack', value: 4, chance: 0.3 },
        },
        {
            name: 'Nécromancien',
            hp: 450,
            attack: 22,
            special: { type: 'heal', value: 25, chance: 0.35 },
        },
    ];

    const ACT2_BOSS = [
        {
            name: 'La Hydre',
            hp: 550,
            attack: 28,
            special: { type: 'heal', value: 20, chance: 0.25 },
        },
    ];

    const ACT3_NORMAL = [
        { name: 'Démon Inférieur', hp: 450, attack: 25, special: null },
        { name: 'Élémentaire', hp: 500, attack: 22, special: null },
        { name: 'Chevalier Maudit', hp: 480, attack: 24, special: null },
        { name: 'Chimère', hp: 520, attack: 23, special: null },
        { name: 'Liche Mineure', hp: 400, attack: 28, special: null },
    ];

    const ACT3_ELITE = [
        {
            name: 'Archidémon',
            hp: 700,
            attack: 30,
            special: { type: 'buff_attack', value: 5, chance: 0.3 },
        },
        {
            name: 'Faucheur',
            hp: 650,
            attack: 35,
            special: { type: 'armor', value: 15, chance: 0.35 },
        },
    ];

    const ACT3_BOSS = [
        {
            name: 'Le Dieu Brisé',
            hp: 1000,
            attack: 32,
            special: { type: 'buff_attack', value: 3, chance: 0.4 },
        },
    ];

    const ACTS = [
        { normal: ACT1_NORMAL, elite: ACT1_ELITE, boss: ACT1_BOSS },
        { normal: ACT2_NORMAL, elite: ACT2_ELITE, boss: ACT2_BOSS },
        { normal: ACT3_NORMAL, elite: ACT3_ELITE, boss: ACT3_BOSS },
    ];

    function getEnemy(actIndex, type) {
        const act = ACTS[actIndex];
        if (!act) return null;
        const pool = act[type];
        const template = Utils.pickRandom(pool);
        return {
            ...template,
            maxHp: template.hp,
            currentHp: template.hp,
            armor: 0,
            attackBuff: 0,
        };
    }

    function enemyTurn(enemy) {
        const actions = [];
        let damage = enemy.attack + enemy.attackBuff;

        if (enemy.special) {
            if (Math.random() < enemy.special.chance) {
                const s = enemy.special;
                if (s.type === 'buff_attack') {
                    enemy.attackBuff += s.value;
                    actions.push(`${enemy.name} se renforce (+${s.value} ATK) !`);
                } else if (s.type === 'heal') {
                    const healed = Math.min(s.value, enemy.maxHp - enemy.currentHp);
                    enemy.currentHp += healed;
                    actions.push(`${enemy.name} se soigne de ${healed} PV !`);
                } else if (s.type === 'armor') {
                    enemy.armor += s.value;
                    actions.push(`${enemy.name} gagne ${s.value} armure !`);
                }
            }
        }

        actions.push(`${enemy.name} attaque pour ${damage} dégâts !`);
        return { damage, actions, enemy };
    }

    function applyDamageToEnemy(enemy, damage) {
        let remaining = damage;
        if (enemy.armor > 0) {
            const absorbed = Math.min(enemy.armor, remaining);
            enemy.armor -= absorbed;
            remaining -= absorbed;
        }
        enemy.currentHp = Math.max(0, enemy.currentHp - remaining);
        return enemy;
    }

    return { getEnemy, enemyTurn, applyDamageToEnemy };
})();
