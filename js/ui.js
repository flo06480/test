// =============================================================================
// ui.js — UI rendering layer
// =============================================================================

const UI = (() => {
    const root = () => document.getElementById('game-root');

    function h(tag, attrs = {}, ...children) {
        const el = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs)) {
            if (k === 'className') el.className = v;
            else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
            else if (k === 'disabled') { if (v) el.setAttribute('disabled', ''); }
            else if (k === 'title') el.title = v;
            else if (k === 'style') Object.assign(el.style, v);
            else el.setAttribute(k, v);
        }
        for (const child of children.flat()) {
            if (child == null) continue;
            if (typeof child === 'string' || typeof child === 'number') {
                el.appendChild(document.createTextNode(child));
            } else {
                el.appendChild(child);
            }
        }
        return el;
    }

    function clear() {
        root().innerHTML = '';
    }

    function render(...elements) {
        clear();
        for (const el of elements.flat()) {
            root().appendChild(el);
        }
    }

    // ---- Reusable components ----

    function hpBar(current, max, className = '') {
        const pct = Math.max(0, (current / max) * 100);
        let fillClass = 'hp-bar-fill';
        if (pct < 25) fillClass += ' low';
        else if (pct < 50) fillClass += ' medium';
        return h('span', { className: `hp-bar ${className}` },
            h('span', { className: fillClass, style: { width: pct + '%' } })
        );
    }

    function renderTopBar(run, combat) {
        const hp = combat ? combat.playerHp : run.playerHp;
        const maxHp = combat ? combat.playerMaxHp : run.playerMaxHp;

        const relicEls = (run.relics || []).map(r =>
            h('span', { className: 'relic-badge', title: r.description }, r.name)
        );

        return h('div', { className: 'top-bar' },
            h('span', { className: 'stat' },
                h('span', { className: 'stat-label' }, 'PV:'),
                ` ${hp}/${maxHp} `,
                hpBar(hp, maxHp)
            ),
            h('span', { className: 'stat' },
                h('span', { className: 'stat-label' }, 'Or:'),
                ` ${run.gold}`
            ),
            h('span', { className: 'stat' },
                h('span', { className: 'stat-label' }, 'Acte:'),
                ` ${run.act + 1}`
            ),
            h('span', { className: 'stat' },
                h('span', { className: 'stat-label' }, 'Combat:'),
                ` ${run.encounter + 1}/5`
            ),
            h('span', { className: 'stat' },
                h('span', { className: 'stat-label' }, 'Armure:'),
                ` ${combat ? combat.playerArmor : 0}`
            ),
            ...relicEls,
        );
    }

    function renderEnemyPanel(enemy) {
        const pct = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100);
        const armorText = enemy.armor > 0 ? ` | Armure: ${enemy.armor}` : '';
        const buffText = enemy.attackBuff > 0 ? ` | ATK+${enemy.attackBuff}` : '';
        return h('div', { className: 'enemy-panel fade-in' },
            h('h2', {}, enemy.name),
            h('div', { className: 'enemy-hp-bar' },
                h('div', { className: 'enemy-hp-fill', style: { width: pct + '%' } })
            ),
            h('div', { className: 'enemy-info' },
                `PV: ${enemy.currentHp}/${enemy.maxHp}${armorText}${buffText} | ATK: ${enemy.attack + enemy.attackBuff}`
            ),
        );
    }

    function renderDie(die, index, onClick, isSelected) {
        let cls = 'die';
        if (die.used) cls += ' used';
        else if (isSelected) cls += ' selected';
        if (die.state === 'cracked') cls += ' cracked';
        if (die.state === 'broken') cls += ' broken';

        return h('div', {
            className: cls,
            onClick: die.used ? null : () => onClick(index),
        },
            String(die.value),
            die.fatigue > 0
                ? h('span', { className: 'die-fatigue' }, String(die.fatigue))
                : null
        );
    }

    function renderCard(card, index, onClick, isSelected) {
        let cls = `card rarity-${card.rarity}`;
        if (isSelected) cls += ' selected';

        return h('div', {
            className: cls,
            onClick: () => onClick(index),
        },
            h('span', { className: `rarity-tag ${card.rarity}` }, card.rarity),
            h('div', { className: 'card-name' }, card.name),
            h('div', { className: 'card-desc' }, card.description),
            h('span', { className: 'card-dice-req' }, `${card.diceRequired} dé(s)`)
        );
    }

    function renderLog(log) {
        const el = h('div', { className: 'combat-log' },
            ...log.map(msg => h('div', {}, msg))
        );
        setTimeout(() => el.scrollTop = el.scrollHeight, 0);
        return el;
    }

    return { h, clear, render, hpBar, renderTopBar, renderEnemyPanel, renderDie, renderCard, renderLog };
})();
