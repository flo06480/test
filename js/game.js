// =============================================================================
// game.js — Main game controller: screens, flow, state management
// =============================================================================

const Game = (() => {
    let run = null;
    let combat = null;
    let shop = null;
    let modal = null;
    let diceRolling = false;

    function start() {
        renderMenu();
    }

    // =========================================================================
    // MENU SCREEN
    // =========================================================================
    function renderMenu() {
        run = null;
        combat = null;
        UI.render(
            UI.h('div', { className: 'menu-screen' },
                UI.h('h1', {}, 'Broken Probability'),
                UI.h('div', { className: 'subtitle' }, 'Roguelite Deckbuilder à Dés'),
                UI.h('button', { className: 'btn btn-primary', onClick: startRun }, 'Nouvelle Run'),
            )
        );
    }

    // =========================================================================
    // START RUN
    // =========================================================================
    function startRun() {
        run = Run.create();
        startNextCombat();
    }

    function startNextCombat() {
        const enemy = Run.getEnemy(run);
        if (!enemy) {
            renderVictory();
            return;
        }
        run.playerHp = Math.min(run.playerHp, run.playerMaxHp);
        combat = Combat.create(run, enemy);
        combat = Combat.startRoll(combat);
        diceRolling = true;
        renderCombat();
        setTimeout(() => { diceRolling = false; renderCombat(); }, 1200);
    }

    // =========================================================================
    // COMBAT RENDERING
    // =========================================================================
    function renderCombat() {
        if (!combat) return;

        const elements = [];
        elements.push(UI.renderTopBar(run, combat));
        elements.push(UI.renderEnemyPanel(combat.enemy));

        // Phase banner
        const phaseLabels = {
            [Combat.PHASE.ROLL]: 'Lancer les dés',
            [Combat.PHASE.REROLL]: `Relance (${combat.rerollsLeft} restantes)`,
            [Combat.PHASE.PLACE]: 'Placement des dés',
            [Combat.PHASE.RESOLVE]: 'Résolution...',
            [Combat.PHASE.ENEMY_TURN]: 'Tour ennemi...',
            [Combat.PHASE.VICTORY]: 'Victoire !',
            [Combat.PHASE.DEFEAT]: 'Défaite...',
        };
        elements.push(UI.h('div', { className: 'phase-banner' }, phaseLabels[combat.phase] || ''));

        // Dice
        elements.push(renderDiceArea());

        // Cards in hand
        if (combat.phase === Combat.PHASE.PLACE || combat.phase === Combat.PHASE.REROLL) {
            elements.push(renderHandArea());
        }

        // Actions
        elements.push(renderActions());

        // Log
        elements.push(UI.renderLog(combat.log));

        UI.render(...elements);
    }

    function renderDiceArea() {
        const isRerollPhase = combat.phase === Combat.PHASE.REROLL;
        const isPlacePhase = combat.phase === Combat.PHASE.PLACE;

        const diceEls = combat.dice.map((d, i) => {
            const isSelected = combat.selectedDice.includes(i);
            const onClick = isRerollPhase
                ? (idx) => { combat = Combat.toggleDieSelection(combat, idx); renderCombat(); }
                : isPlacePhase
                    ? (idx) => { combat = Combat.toggleDieForCard(combat, idx); renderCombat(); }
                    : () => {};
            return UI.renderDie(d, i, onClick, isSelected, diceRolling);
        });

        return UI.h('div', { className: 'dice-area' },
            UI.h('div', { className: 'dice-row' }, ...diceEls),
        );
    }

    function renderHandArea() {
        const isPlacePhase = combat.phase === Combat.PHASE.PLACE;
        const cards = combat.deck.hand.map((card, i) => {
            const isSelected = isPlacePhase && combat.selectedCard === i;
            return UI.renderCard(card, i, (idx) => {
                if (!isPlacePhase) return;
                combat = Combat.selectCardForPlacement(combat, idx);
                renderCombat();
            }, isSelected);
        });

        return UI.h('div', { className: 'hand-area' },
            UI.h('h3', {}, `Main (${combat.deck.hand.length} cartes) — Pioche: ${combat.deck.drawPile.length} | Défausse: ${combat.deck.discard.length}`),
            UI.h('div', { className: 'hand-row' }, ...cards)
        );
    }

    function renderActions() {
        const btns = [];
        const phase = combat.phase;

        if (phase === Combat.PHASE.REROLL) {
            btns.push(UI.h('button', {
                className: 'btn btn-primary',
                onClick: doReroll,
                disabled: combat.rerollsLeft <= 0 || combat.selectedDice.length === 0,
            }, `Relancer (${combat.rerollsLeft})`));

            btns.push(UI.h('button', {
                className: 'btn',
                onClick: () => { combat = Combat.goToPlacement(combat); renderCombat(); },
            }, 'Passer au Placement'));
        }

        if (phase === Combat.PHASE.PLACE) {
            const canPlay = Combat.canPlayCard(combat);
            btns.push(UI.h('button', {
                className: 'btn btn-primary',
                onClick: doPlayCard,
                disabled: !canPlay,
            }, 'Jouer la Carte'));

            btns.push(UI.h('button', {
                className: 'btn btn-danger',
                onClick: doEndTurn,
            }, 'Fin du Tour'));
        }

        if (phase === Combat.PHASE.VICTORY) {
            btns.push(UI.h('button', {
                className: 'btn btn-primary',
                onClick: handleVictory,
            }, 'Continuer'));
        }

        if (phase === Combat.PHASE.DEFEAT) {
            btns.push(UI.h('button', {
                className: 'btn btn-danger',
                onClick: renderGameOver,
            }, 'Game Over'));
        }

        return UI.h('div', { className: 'dice-controls' }, ...btns);
    }

    // =========================================================================
    // COMBAT ACTIONS
    // =========================================================================
    function doReroll() {
        combat = Combat.reroll(combat);
        diceRolling = true;
        renderCombat();
        setTimeout(() => { diceRolling = false; renderCombat(); }, 1200);
    }

    function doPlayCard() {
        const selectedCardEl = document.querySelector('.card.selected');
        if (selectedCardEl) {
            selectedCardEl.classList.add('card-playing');
            setTimeout(() => {
                combat = Combat.playCard(combat);
                renderCombat();
            }, 400);
        } else {
            combat = Combat.playCard(combat);
            renderCombat();
        }
    }

    function doEndTurn() {
        combat = Combat.endPlayerTurn(combat);
        renderCombat();

        if (combat.phase === Combat.PHASE.ENEMY_TURN) {
            setTimeout(() => {
                combat = Combat.executeEnemyTurn(combat);
                if (combat.phase === Combat.PHASE.ROLL) {
                    combat = Combat.startRoll(combat);
                    diceRolling = true;
                    renderCombat();
                    setTimeout(() => { diceRolling = false; renderCombat(); }, 1200);
                } else {
                    renderCombat();
                }
            }, 800);
        }
    }

    // =========================================================================
    // POST-COMBAT
    // =========================================================================
    function handleVictory() {
        // Sync HP back to run
        run.playerHp = combat.playerHp;
        run.playerMaxHp = combat.playerMaxHp;

        const enc = Run.getCurrentEncounter(run);
        const goldReward = Run.getGoldReward(enc.type);
        run.gold += goldReward;

        // Relic onCombatEnd
        for (const relic of run.relics) {
            if (relic.onCombatEnd) relic.onCombatEnd(run);
        }

        // Advance
        Run.advanceEncounter(run);

        if (run.state === 'victory') {
            renderVictory();
            return;
        }

        // Show reward / shop
        renderReward(goldReward);
    }

    function renderReward(goldReward) {
        const cardRewards = Cards.getShopCards(3);

        let picked = false;
        function pickCard(idx) {
            if (picked) return;
            picked = true;
            run.deck = Deck.addCard(run.deck, cardRewards[idx]);
            goToShopOrNextCombat();
        }

        function skipReward() {
            goToShopOrNextCombat();
        }

        const cardEls = cardRewards.map((card, i) =>
            UI.renderCard(card, i, (idx) => pickCard(idx), false)
        );

        UI.render(
            UI.renderTopBar(run, null),
            UI.h('div', { className: 'reward-screen fade-in' },
                UI.h('h2', {}, 'Victoire !'),
                UI.h('p', {}, `+${goldReward} or`),
                UI.h('p', { style: { margin: '16px 0', color: '#8b949e' } }, 'Choisissez une carte (ou passez) :'),
                UI.h('div', { className: 'hand-row', style: { justifyContent: 'center' } }, ...cardEls),
                UI.h('div', { style: { marginTop: '20px' } },
                    UI.h('button', { className: 'btn', onClick: skipReward }, 'Passer')
                )
            )
        );
    }

    function goToShopOrNextCombat() {
        // Show shop after every combat
        shop = Shop.generate(run);
        renderShop();
    }

    // =========================================================================
    // SHOP SCREEN
    // =========================================================================
    function renderShop() {
        const elements = [];
        elements.push(UI.renderTopBar(run, null));

        const shopEl = UI.h('div', { className: 'shop-screen fade-in' },
            UI.h('h2', {}, 'Boutique'),
        );

        // Cards
        const cardSection = UI.h('div', { className: 'shop-section' },
            UI.h('h3', {}, 'Cartes disponibles')
        );
        const cardItems = UI.h('div', { className: 'shop-items' });

        shop.cards.forEach((item, i) => {
            const card = item.card;
            const itemEl = UI.h('div', { className: `shop-item` },
                UI.h('div', { className: 'item-name' },
                    UI.h('span', { className: `rarity-tag ${card.rarity}` }, `[${card.rarity}] `),
                    card.name
                ),
                UI.h('div', { className: 'item-desc' }, card.description),
                UI.h('div', { className: 'item-cost' }, `${item.cost} or`),
                UI.h('button', {
                    className: 'btn btn-gold btn-small',
                    onClick: () => {
                        const result = Shop.buyCard(run, shop, i);
                        run = result.run;
                        shop = result.shop;
                        renderShop();
                    },
                    disabled: run.gold < item.cost,
                }, 'Acheter')
            );
            cardItems.appendChild(itemEl);
        });
        cardSection.appendChild(cardItems);
        shopEl.appendChild(cardSection);

        // Relic
        if (shop.relic) {
            const relicSection = UI.h('div', { className: 'shop-section' },
                UI.h('h3', {}, 'Relique')
            );
            const r = shop.relic.relic;
            const relicItem = UI.h('div', { className: 'shop-item' },
                UI.h('div', { className: 'item-name' }, r.name),
                UI.h('div', { className: 'item-desc' }, r.description),
                UI.h('div', { className: 'item-cost' }, `${shop.relic.cost} or`),
                UI.h('button', {
                    className: 'btn btn-gold btn-small',
                    onClick: () => {
                        const result = Shop.buyRelic(run, shop);
                        run = result.run;
                        shop = result.shop;
                        renderShop();
                    },
                    disabled: run.gold < shop.relic.cost,
                }, 'Acheter')
            );
            relicSection.appendChild(UI.h('div', { className: 'shop-items' }, relicItem));
            shopEl.appendChild(relicSection);
        }

        // Services
        const serviceSection = UI.h('div', { className: 'shop-section' },
            UI.h('h3', {}, 'Services')
        );
        const serviceItems = UI.h('div', { className: 'shop-items' });

        // Remove card
        serviceItems.appendChild(UI.h('div', { className: 'shop-item' },
            UI.h('div', { className: 'item-name' }, 'Retirer une carte'),
            UI.h('div', { className: 'item-desc' }, 'Retirez une carte de votre deck.'),
            UI.h('div', { className: 'item-cost' }, `${shop.removeCost} or`),
            UI.h('button', {
                className: 'btn btn-danger btn-small',
                onClick: () => openRemoveCardModal(),
                disabled: run.gold < shop.removeCost,
            }, 'Choisir')
        ));

        // Repair die
        serviceItems.appendChild(UI.h('div', { className: 'shop-item' },
            UI.h('div', { className: 'item-name' }, 'Réparer un dé'),
            UI.h('div', { className: 'item-desc' }, 'Remet la fatigue à 0 au prochain combat.'),
            UI.h('div', { className: 'item-cost' }, `${shop.repairCost} or`),
            UI.h('button', {
                className: 'btn btn-gold btn-small',
                onClick: () => {
                    const result = Shop.repairDie(run, shop);
                    run = result.run;
                    renderShop();
                },
                disabled: run.gold < shop.repairCost || run.repairNextCombat,
            }, run.repairNextCombat ? 'Acheté' : 'Acheter')
        ));

        serviceSection.appendChild(serviceItems);
        shopEl.appendChild(serviceSection);

        // Continue button
        shopEl.appendChild(UI.h('div', { style: { textAlign: 'center', marginTop: '24px' } },
            UI.h('button', { className: 'btn btn-primary', onClick: () => startNextCombat() }, 'Combat Suivant')
        ));

        elements.push(shopEl);
        UI.render(...elements);
    }

    function openRemoveCardModal() {
        const allCards = Deck.getAllCards(run.deck);
        const overlay = UI.h('div', { className: 'modal-overlay', onClick: (e) => {
            if (e.target === overlay) { overlay.remove(); }
        }});
        const modalEl = UI.h('div', { className: 'modal' },
            UI.h('h3', {}, 'Choisissez une carte à retirer'),
            UI.h('div', { className: 'card-list' },
                ...allCards.map((card, i) =>
                    UI.h('div', { className: 'card-list-item' },
                        UI.h('span', {},
                            UI.h('span', { className: `rarity-tag ${card.rarity}`, style: { marginRight: '8px' } }, `[${card.rarity}]`),
                            card.name
                        ),
                        UI.h('button', {
                            className: 'btn btn-danger btn-small',
                            onClick: () => {
                                const result = Shop.removeCard(run, shop, i);
                                run = result.run;
                                overlay.remove();
                                renderShop();
                            }
                        }, 'Retirer')
                    )
                )
            ),
            UI.h('div', { style: { textAlign: 'center', marginTop: '16px' } },
                UI.h('button', { className: 'btn btn-small', onClick: () => overlay.remove() }, 'Annuler')
            )
        );
        overlay.appendChild(modalEl);
        document.body.appendChild(overlay);
    }

    // =========================================================================
    // GAME OVER
    // =========================================================================
    function renderGameOver() {
        UI.render(
            UI.h('div', { className: 'gameover-screen' },
                UI.h('h1', {}, 'Game Over'),
                UI.h('div', { className: 'stats' },
                    `Acte ${run.act + 1} — Combat ${run.encounter + 1}`,
                    UI.h('br'),
                    `Or accumulé : ${run.gold}`,
                    UI.h('br'),
                    `Cartes dans le deck : ${Deck.getAllCards(run.deck).length}`,
                    UI.h('br'),
                    `Reliques : ${run.relics.length}`,
                ),
                UI.h('button', { className: 'btn btn-primary', onClick: renderMenu }, 'Retour au Menu')
            )
        );
    }

    // =========================================================================
    // VICTORY SCREEN (full run)
    // =========================================================================
    function renderVictory() {
        UI.render(
            UI.h('div', { className: 'victory-screen' },
                UI.h('h1', {}, 'Victoire Totale !'),
                UI.h('div', { className: 'stats' },
                    'Vous avez vaincu Le Dieu Brisé !',
                    UI.h('br'),
                    `Or accumulé : ${run.gold}`,
                    UI.h('br'),
                    `Cartes dans le deck : ${Deck.getAllCards(run.deck).length}`,
                    UI.h('br'),
                    `Reliques : ${run.relics.length}`,
                ),
                UI.h('button', { className: 'btn btn-primary', onClick: renderMenu }, 'Retour au Menu')
            )
        );
    }

    return { start };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => Game.start());
