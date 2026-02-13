// =============================================================================
// deck.js — Deck management: draw pile, hand, discard
// =============================================================================

const Deck = (() => {
    function create(cards) {
        return {
            drawPile: Utils.shuffle([...cards]),
            hand: [],
            discard: [],
        };
    }

    function draw(deck, count = 5) {
        const d = { ...deck, drawPile: [...deck.drawPile], hand: [...deck.hand], discard: [...deck.discard] };
        for (let i = 0; i < count; i++) {
            if (d.drawPile.length === 0) {
                if (d.discard.length === 0) break;
                d.drawPile = Utils.shuffle(d.discard);
                d.discard = [];
            }
            d.hand.push(d.drawPile.pop());
        }
        return d;
    }

    function discardHand(deck) {
        return {
            ...deck,
            discard: [...deck.discard, ...deck.hand],
            hand: [],
        };
    }

    function discardCards(deck, cardIndices) {
        const newHand = [...deck.hand];
        const discarded = [];
        const sortedIndices = [...cardIndices].sort((a, b) => b - a);
        for (const idx of sortedIndices) {
            discarded.push(...newHand.splice(idx, 1));
        }
        return {
            ...deck,
            hand: newHand,
            discard: [...deck.discard, ...discarded],
        };
    }

    function addCard(deck, card) {
        return {
            ...deck,
            drawPile: [...deck.drawPile, { ...card }],
        };
    }

    function removeCard(deck, cardIndex) {
        const allCards = [...deck.drawPile, ...deck.hand, ...deck.discard];
        if (cardIndex >= 0 && cardIndex < allCards.length) {
            allCards.splice(cardIndex, 1);
        }
        return create(allCards);
    }

    function getAllCards(deck) {
        return [...deck.drawPile, ...deck.hand, ...deck.discard];
    }

    return { create, draw, discardHand, discardCards, addCard, removeCard, getAllCards };
})();
