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

    // ---- Dice pip patterns (3x3 grid, row-major) ----
    const PIP_PATTERNS = {
        1: [0,0,0, 0,1,0, 0,0,0],
        2: [0,0,1, 0,0,0, 1,0,0],
        3: [0,0,1, 0,1,0, 1,0,0],
        4: [1,0,1, 0,0,0, 1,0,1],
        5: [1,0,1, 0,1,0, 1,0,1],
        6: [1,0,1, 1,0,1, 1,0,1],
    };

    function renderDieFace(value) {
        const pattern = PIP_PATTERNS[value] || PIP_PATTERNS[1];
        const cells = pattern.map(hasPip =>
            h('span', { className: hasPip ? 'pip' : 'pip-empty' })
        );
        return h('div', { className: 'die-pips' }, ...cells);
    }

    function renderDie(die, index, onClick, isSelected, rolling) {
        let cls = 'die';
        if (die.used) cls += ' used';
        else if (isSelected) cls += ' selected';
        if (die.state === 'cracked') cls += ' cracked';
        if (die.state === 'broken') cls += ' broken';
        if (rolling) cls += ' bouncing';

        const faces = [];
        for (let v = 1; v <= 6; v++) {
            faces.push(h('div', { className: `die-face face-${v}` }, renderDieFace(v)));
        }

        let cubeClass = `die-cube show-${die.value}`;
        if (rolling) cubeClass += ' rolling';

        const staggerStyle = rolling ? { animationDelay: `${index * 0.12}s` } : {};

        return h('div', {
            className: cls,
            onClick: die.used ? null : () => onClick(index),
        },
            h('div', { className: cubeClass, style: staggerStyle }, ...faces),
            die.fatigue > 0
                ? h('span', { className: 'die-fatigue' }, String(die.fatigue))
                : null
        );
    }

    // ---- Card type classification ----
    function getCardMeta(card) {
        const desc = (card.description || '').toLowerCase();
        const hasDamage = card.computeDamage && card.computeDamage([3, 3, 3, 3, 3]) > 0;
        const hasHeal = desc.includes('soin');
        const hasArmor = desc.includes('armure');

        if (hasHeal && hasDamage) return { type: 'drain', icon: '\u{1F480}', label: 'Drain' };
        if (hasHeal && hasArmor) return { type: 'fortify', icon: '\u{1F3F0}', label: 'Bastion' };
        if (hasHeal) return { type: 'heal', icon: '\u{1F49A}', label: 'Soin' };
        if (hasArmor && hasDamage) return { type: 'hybrid', icon: '\u{2694}\uFE0F', label: 'Hybride' };
        if (hasArmor) return { type: 'defense', icon: '\u{1F6E1}\uFE0F', label: 'D\u00e9fense' };
        if (hasDamage) return { type: 'attack', icon: '\u{2694}\uFE0F', label: 'Attaque' };
        return { type: 'utility', icon: '\u2728', label: 'Utilitaire' };
    }

    function renderCard(card, index, onClick, isSelected) {
        const meta = getCardMeta(card);
        let cls = `card rarity-${card.rarity} card-type-${meta.type}`;
        if (isSelected) cls += ' selected';

        // Dice requirement icons
        const diceIcons = [];
        for (let i = 0; i < card.diceRequired; i++) {
            diceIcons.push(h('span', { className: 'card-dice-icon' }));
        }

        return h('div', {
            className: cls,
            onClick: () => onClick(index),
        },
            // Header: type badge + rarity
            h('div', { className: 'card-header' },
                h('span', { className: `card-type-badge ${meta.type}` }, meta.label),
                h('span', { className: `rarity-tag ${card.rarity}` }, card.rarity)
            ),
            // Icon
            h('div', { className: 'card-icon' }, meta.icon),
            // Name
            h('div', { className: 'card-name' }, card.name),
            // Description
            h('div', { className: 'card-desc' }, card.description),
            // Dice requirement
            h('div', { className: 'card-dice-req' },
                ...diceIcons,
                h('span', { className: 'card-dice-text' }, ` ${card.diceRequired} d\u00e9(s)`)
            ),
            // Legendary shimmer
            card.rarity === 'legendary'
                ? h('div', { className: 'card-shimmer' })
                : null
        );
    }

    function renderLog(log) {
        const el = h('div', { className: 'combat-log' },
            ...log.map(msg => h('div', {}, msg))
        );
        setTimeout(() => el.scrollTop = el.scrollHeight, 0);
        return el;
    }

    return { h, clear, render, hpBar, renderTopBar, renderEnemyPanel, renderDie, renderCard, renderLog, getCardMeta };
})();
