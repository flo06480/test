// =============================================================================
// combat.js — Combat state machine
// =============================================================================

const Combat = (() => {
    const PHASE = {
        ROLL: 'roll',
        REROLL: 'reroll',
        PLACE: 'place',
        RESOLVE: 'resolve',
        ENEMY_TURN: 'enemy_turn',
        VICTORY: 'victory',
        DEFEAT: 'defeat',
    };

    function create(run, enemy) {
        const maxRerolls = getMaxRerolls(run);
        const drawCount = getDrawCount(run);
        const combat = {
            phase: PHASE.ROLL,
            turn: 1,
            dice: DiceSystem.createDicePool(5),
            rerollsLeft: maxRerolls,
            maxRerolls,
            deck: Deck.create(Deck.getAllCards(run.deck)),
            enemy: { ...enemy },
            playerHp: run.playerHp,
            playerMaxHp: run.playerMaxHp,
            playerArmor: 0,
            log: [],
            selectedDice: [],
            selectedCard: null,
            playedCards: [],
            drawCount,
            relics: run.relics || [],
        };

        // Apply onCombatStart relics
        for (const relic of combat.relics) {
            if (relic.onCombatStart) relic.onCombatStart(combat);
        }

        // Draw initial hand
        combat.deck = Deck.draw(combat.deck, drawCount);
        combat.log.push('--- Combat commence ! ---');
        combat.log.push(`Ennemi : ${enemy.name} (${enemy.currentHp} PV)`);

        return combat;
    }

    function getMaxRerolls(run) {
        let rerolls = 2;
        for (const relic of (run.relics || [])) {
            if (relic.modifyRerolls) rerolls = relic.modifyRerolls(rerolls);
        }
        return rerolls;
    }

    function getDrawCount(run) {
        let draw = 5;
        for (const relic of (run.relics || [])) {
            if (relic.modifyDraw) draw = relic.modifyDraw(draw);
        }
        return draw;
    }

    function startRoll(combat) {
        combat.dice = DiceSystem.resetForTurn(combat.dice);
        combat.dice = DiceSystem.rollAll(combat.dice);
        combat.rerollsLeft = combat.maxRerolls;
        combat.selectedDice = [];
        combat.selectedCard = null;
        combat.playedCards = [];
        combat.phase = PHASE.REROLL;
        combat.playerArmor = 0;

        const vals = combat.dice.map(d => d.value).join(', ');
        combat.log.push(`Tour ${combat.turn} — Lancer : [${vals}]`);
        return combat;
    }

    function toggleDieSelection(combat, dieIndex) {
        const idx = combat.selectedDice.indexOf(dieIndex);
        if (idx >= 0) {
            combat.selectedDice.splice(idx, 1);
        } else {
            combat.selectedDice.push(dieIndex);
        }
        return combat;
    }

    function reroll(combat) {
        if (combat.rerollsLeft <= 0) return combat;
        if (combat.selectedDice.length === 0) return combat;

        // Freeze all dice NOT selected for reroll
        combat.dice = combat.dice.map((d, i) => ({
            ...d,
            frozen: !combat.selectedDice.includes(i),
        }));

        combat.dice = DiceSystem.rollAll(combat.dice);
        combat.rerollsLeft--;
        combat.selectedDice = [];

        // Unfreeze all
        combat.dice = combat.dice.map(d => ({ ...d, frozen: false }));

        const vals = combat.dice.map(d => d.value).join(', ');
        combat.log.push(`Relance → [${vals}] (${combat.rerollsLeft} relances restantes)`);
        return combat;
    }

    function goToPlacement(combat) {
        combat.phase = PHASE.PLACE;
        combat.selectedDice = [];
        combat.selectedCard = null;
        return combat;
    }

    function selectCardForPlacement(combat, handIndex) {
        combat.selectedCard = handIndex;
        combat.selectedDice = [];
        return combat;
    }

    function toggleDieForCard(combat, dieIndex) {
        if (combat.dice[dieIndex].used) return combat;
        const idx = combat.selectedDice.indexOf(dieIndex);
        if (idx >= 0) {
            combat.selectedDice.splice(idx, 1);
        } else {
            combat.selectedDice.push(dieIndex);
        }
        return combat;
    }

    function canPlayCard(combat) {
        if (combat.selectedCard === null) return false;
        const card = combat.deck.hand[combat.selectedCard];
        if (!card) return false;
        if (combat.selectedDice.length !== card.diceRequired) return false;

        const values = combat.selectedDice.map(i => combat.dice[i].value);
        return card.validate(values);
    }

    function playCard(combat) {
        if (!canPlayCard(combat)) return combat;

        const card = combat.deck.hand[combat.selectedCard];
        const diceIndices = [...combat.selectedDice];
        const values = diceIndices.map(i => combat.dice[i].value);

        // Mark dice as used and apply fatigue
        for (const i of diceIndices) {
            combat.dice[i].used = true;
            combat.dice[i] = DiceSystem.applyFatigue(combat.dice[i]);
        }

        // Compute damage
        const damage = card.computeDamage(values);

        // Apply card effect
        if (card.effect) {
            card.effect(values, combat);
        }

        // Apply relic onCardPlayed
        for (const relic of combat.relics) {
            if (relic.onCardPlayed) relic.onCardPlayed(combat);
        }

        combat.playedCards.push({ card, diceIndices, values, damage });
        combat.log.push(`▸ ${card.name} [${values.join(',')}] → ${damage} dégâts`);

        // Move card to discard
        combat.deck = Deck.discardCards(combat.deck, [combat.selectedCard]);
        combat.selectedCard = null;
        combat.selectedDice = [];

        return combat;
    }

    function endPlayerTurn(combat) {
        // Resolve all played cards — damage already computed
        let totalDamage = 0;
        for (const played of combat.playedCards) {
            totalDamage += played.damage;
        }

        if (totalDamage > 0) {
            Enemies.applyDamageToEnemy(combat.enemy, totalDamage);
            combat.log.push(`Total : ${totalDamage} dégâts → ${combat.enemy.name} (${combat.enemy.currentHp}/${combat.enemy.maxHp} PV)`);
        }

        if (combat.enemy.currentHp <= 0) {
            combat.phase = PHASE.VICTORY;
            combat.log.push(`${combat.enemy.name} est vaincu !`);
            return combat;
        }

        combat.phase = PHASE.ENEMY_TURN;
        return combat;
    }

    function executeEnemyTurn(combat) {
        const result = Enemies.enemyTurn(combat.enemy);
        for (const msg of result.actions) {
            combat.log.push(msg);
        }

        // Apply damage to player (armor first)
        let dmg = result.damage;
        if (combat.playerArmor > 0) {
            const absorbed = Math.min(combat.playerArmor, dmg);
            combat.playerArmor -= absorbed;
            dmg -= absorbed;
            if (absorbed > 0) {
                combat.log.push(`Armure absorbe ${absorbed} dégâts.`);
            }
        }
        combat.playerHp -= dmg;
        combat.log.push(`Vous subissez ${dmg} dégâts. (PV: ${combat.playerHp}/${combat.playerMaxHp})`);

        if (combat.playerHp <= 0) {
            // Check phoenix feather
            for (let i = 0; i < combat.relics.length; i++) {
                const relic = combat.relics[i];
                if (relic.onDeath) {
                    const survived = relic.onDeath(combat);
                    if (survived) {
                        combat.log.push(`${relic.name} vous sauve ! (${combat.playerHp} PV)`);
                        if (relic.singleUse) {
                            combat.relics.splice(i, 1);
                        }
                        break;
                    }
                }
            }
        }

        if (combat.playerHp <= 0) {
            combat.phase = PHASE.DEFEAT;
            combat.log.push('Vous êtes mort...');
            return combat;
        }

        // New turn
        combat.turn++;
        combat.deck = Deck.discardHand(combat.deck);
        combat.deck = Deck.draw(combat.deck, combat.drawCount);
        combat.phase = PHASE.ROLL;

        return combat;
    }

    return {
        PHASE,
        create,
        startRoll,
        toggleDieSelection,
        reroll,
        goToPlacement,
        selectCardForPlacement,
        toggleDieForCard,
        canPlayCard,
        playCard,
        endPlayerTurn,
        executeEnemyTurn,
    };
})();
