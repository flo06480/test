// =============================================================================
// shop.js — Shop generation and transactions
// =============================================================================

const Shop = (() => {
    function generate(run) {
        const cards = Cards.getShopCards(3).map(c => ({
            card: c,
            cost: Cards.cardCost(c),
        }));

        const ownedRelicIds = (run.relics || []).map(r => r.id);
        const relic = Math.random() < 0.5 ? Relics.getRandomRelic(ownedRelicIds) : null;

        return {
            cards,
            relic: relic ? { relic, cost: Relics.relicCost(relic) } : null,
            removeCost: 50,
            repairCost: 30,
        };
    }

    function buyCard(run, shop, index) {
        const item = shop.cards[index];
        if (!item || run.gold < item.cost) return { run, shop, success: false };
        run.gold -= item.cost;
        run.deck = Deck.addCard(run.deck, item.card);
        shop.cards.splice(index, 1);
        return { run, shop, success: true };
    }

    function buyRelic(run, shop) {
        if (!shop.relic || run.gold < shop.relic.cost) return { run, shop, success: false };
        run.gold -= shop.relic.cost;
        run.relics.push(shop.relic.relic);
        if (shop.relic.relic.onAcquire) {
            shop.relic.relic.onAcquire(run);
        }
        shop.relic = null;
        return { run, shop, success: true };
    }

    function removeCard(run, shop, cardIndex) {
        if (run.gold < shop.removeCost) return { run, success: false };
        const allCards = Deck.getAllCards(run.deck);
        if (cardIndex < 0 || cardIndex >= allCards.length) return { run, success: false };
        run.gold -= shop.removeCost;
        run.deck = Deck.removeCard(run.deck, cardIndex);
        return { run, success: true };
    }

    function repairDie(run, shop) {
        if (run.gold < shop.repairCost) return { run, success: false };
        run.gold -= shop.repairCost;
        run.repairNextCombat = true;
        return { run, success: true };
    }

    return { generate, buyCard, buyRelic, removeCard, repairDie };
})();
