// === CONFIG ===
const CLAIM_CODE = "L2-201-M2-PLAYER";
const MIN_RATING_FOR_CODE = 1.9;

// === INJURY SEVERITY ===
// Ordered, and it has to stay ordered: a worse injury must cost more. The
// shipped table had MILD at 0.75, MODERATE at 1.00 and SEVERE at 0.90, so a
// mild injury was the worst outcome available and a moderate one cost nothing
// at all. `expectedInjuryMultiplier()` below reads these numbers rather than
// restating them, so the expected value shown to the student is computed from
// the same table that pays them.
const INJURY_SEVERITY = {
    MILD:     { multiplier: 0.90, label: 'Mild Injury' },
    MODERATE: { multiplier: 0.70, label: 'Moderate Injury' },
    SEVERE:   { multiplier: 0.45, label: 'Severe Injury' }
};

// Must match the draw in resolveDecision().
const INJURY_ODDS = { SEVERE: 0.15, MILD: 0.40, MODERATE: 0.45 };

function expectedInjuryMultiplier() {
    return Object.keys(INJURY_ODDS)
        .reduce((sum, k) => sum + INJURY_ODDS[k] * INJURY_SEVERITY[k].multiplier, 0);
}

const LUCKY_RISK_THRESHOLD = 35;

const FEEDBACK_MESSAGES = {
    'Take+Injured': [
        "Smart call — your client got hurt, but the guaranteed $BASE kept them secure. Guarantees exist for exactly this reason.",
        "Prescient move. Injury struck, but you locked in $BASE before the season. This is what great agents do.",
        "The injury came, but your guarantee held. $BASE locked in — that's risk management at its finest.",
        "Dodged a bullet the right way. You had the guarantee signed; injury changed nothing for your client."
    ],
    'Take+Healthy': [
        "Safe and steady — you locked in $BASE. No risk, no bonus, but no stress either. Sometimes protection is the win.",
        "Guarantee secured, season went fine. Left some upside on the table, but your client slept easy all year.",
        "Clean outcome. $BASE guaranteed, healthy season. The question: was there upside you passed up? Only the model knows.",
        "Solid foundation play. Your client stayed healthy — in hindsight you could have bet — but the risk was real."
    ],
    'Bet+Injured': [
        "Tough break — you bet on performance and injury hit. Betting meant giving up the guarantee, so the payout is a fraction of it. Even great models can't predict fate.",
        "The risk materialized. Incentives wiped out, and without a signed guarantee your client absorbs the shortfall too.",
        "Injury struck on a bet. There was no floor under this one — that was the price of the upside. Review the numbers before the next call.",
        "Model said bet, injury said no. The guarantee you passed on is exactly what your client is missing now."
    ],
    'Bet+Healthy': [
        "High-risk, high-reward — your client stayed healthy and cashed the incentives. Timing and conviction paid off.",
        "Performance bet paid out. Healthy season, full incentives earned. That's the upside of backing your player.",
        "Big play, big result. Stayed healthy, earned the full package. This is why agents take calculated risks.",
        "Incentives hit. Healthy season rewarded the bet. Remember: the injury risk was real — this time luck was on your side."
    ],
    'Bet+Healthy+Lucky': [
        "Lucky call — risk was high but no injury. The upside came through, but this decision lives in the risk zone. Review carefully.",
        "Got away with one. High injury risk, healthy season — the model flagged the danger. Don't confuse luck with skill here.",
        "High-risk bet paid off this time. With RISK% injury risk, that's a coin flip range. Great outcome, but it could easily have gone the other way.",
        "Outcome was great, but the odds were against you. Lucky Call noted — revisit how you assess high-risk players."
    ]
};

// === MLB PLAYER DATA ===
const players = [
    {
        id: 1,
        name: "Aaron Judge",
        team: "New York Yankees",
        position: "OF",
        emoji: "⚾",
        baseGuaranteed: 35.0,
        incentives: 15.0,
        riskPercent: 30,
        modelValue: 42.5,
        description: "Power hitter with injury history"
    },
    {
        id: 2,
        name: "Shohei Ohtani",
        team: "Los Angeles Dodgers",
        position: "P/DH",
        emoji: "🌟",
        baseGuaranteed: 40.0,
        incentives: 20.0,
        riskPercent: 25,
        modelValue: 52.0,
        description: "Two-way superstar with premium upside"
    },
    {
        id: 3,
        name: "Mike Trout",
        team: "Los Angeles Angels",
        position: "OF",
        emoji: "🎯",
        baseGuaranteed: 32.0,
        incentives: 12.0,
        riskPercent: 40,
        modelValue: 38.0,
        description: "Elite talent, high injury risk"
    },
    {
        id: 4,
        name: "Mookie Betts",
        team: "Los Angeles Dodgers",
        position: "OF",
        emoji: "💎",
        baseGuaranteed: 30.0,
        incentives: 10.0,
        riskPercent: 15,
        modelValue: 38.5,
        description: "Consistent MVP-caliber player"
    },
    {
        id: 5,
        name: "Ronald Acuña Jr.",
        team: "Atlanta Braves",
        position: "OF",
        emoji: "⚡",
        baseGuaranteed: 28.0,
        incentives: 14.0,
        riskPercent: 35,
        modelValue: 37.5,
        description: "Speed and power, moderate injury risk"
    },
    {
        id: 6,
        name: "Julio Rodríguez",
        team: "Seattle Mariners",
        position: "OF",
        emoji: "🚀",
        baseGuaranteed: 22.0,
        incentives: 16.0,
        riskPercent: 20,
        modelValue: 35.0,
        description: "Young star with massive potential"
    },
    {
        id: 7,
        name: "Gerrit Cole",
        team: "New York Yankees",
        position: "P",
        emoji: "🔥",
        baseGuaranteed: 30.0,
        incentives: 11.0,
        riskPercent: 28,
        modelValue: 37.5,
        description: "Ace pitcher, durability questions"
    },
    {
        id: 8,
        name: "Bobby Witt Jr.",
        team: "Kansas City Royals",
        position: "SS",
        emoji: "💫",
        baseGuaranteed: 20.0,
        incentives: 18.0,
        riskPercent: 22,
        modelValue: 35.5,
        description: "Emerging superstar, high upside bet"
    }
];

// === GAME STATE ===
let gameState = {
    currentPlayer: null,
    decisions: {},
    completedCount: 0,
    runningTotal: 0
};

// === DOM ELEMENTS ===
const screens = {
    landing: document.getElementById('landing-screen'),
    game: document.getElementById('game-screen'),
    decision: document.getElementById('decision-screen'),
    outcome: document.getElementById('outcome-screen'),
    results: document.getElementById('results-screen')
};

const modal = document.getElementById('tutorial-modal');

// === PERSISTENCE ===
const STORAGE_KEYS = {
    bestEarnings:  'mlb_bestEarnings',
    bestAvgRating: 'mlb_bestAvgRating',
    totalPlays:    'mlb_totalPlays'
};

function getPersistStats() {
    return {
        bestEarnings:  parseFloat(localStorage.getItem(STORAGE_KEYS.bestEarnings))  || null,
        bestAvgRating: parseFloat(localStorage.getItem(STORAGE_KEYS.bestAvgRating)) || null,
        totalPlays:    parseInt(localStorage.getItem(STORAGE_KEYS.totalPlays), 10)  || 0
    };
}

function updatePersistStats(totalEarnings, avgRating) {
    const current = getPersistStats();
    let newBest = false;

    if (current.bestEarnings === null || totalEarnings > current.bestEarnings) {
        localStorage.setItem(STORAGE_KEYS.bestEarnings, totalEarnings.toFixed(1));
        newBest = true;
    }
    if (current.bestAvgRating === null || avgRating > current.bestAvgRating) {
        localStorage.setItem(STORAGE_KEYS.bestAvgRating, avgRating.toFixed(2));
        newBest = true;
    }
    localStorage.setItem(STORAGE_KEYS.totalPlays, current.totalPlays + 1);

    return newBest;
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start-btn').addEventListener('click', showTutorial);
    document.getElementById('tutorial-close').addEventListener('click', startGame);
    // Every route back to the grid re-renders it. Without this the grid kept the
    // DOM built at startGame(), so a player you had already decided still looked
    // undecided and still carried its original click handler — you could open the
    // same player over and over and never notice the other seven.
    document.getElementById('back-btn').addEventListener('click', () => {
        showScreen('game');
        renderPlayers();
    });

    document.getElementById('continue-btn').addEventListener('click', () => {
        if (gameState.completedCount === 8) {
            showResults();
        } else {
            showScreen('game');
            renderPlayers();
        }
    });

    document.getElementById('replay-btn').addEventListener('click', resetGame);
    document.getElementById('btn-take').addEventListener('click', () => makeDecision('Take'));
    document.getElementById('btn-bet').addEventListener('click', () => makeDecision('Bet'));

    // Skip tutorial for returning players
    const skipBtn = document.getElementById('skip-tutorial-btn');
    const stats = getPersistStats();
    if (stats.totalPlays > 0) {
        skipBtn.style.display = 'block';
        skipBtn.textContent = `Skip Tutorial (${stats.totalPlays}x played)`;

        const preview = document.getElementById('best-score-preview');
        if (preview) {
            preview.style.display = 'flex';
            document.getElementById('landing-best-earnings').textContent =
                stats.bestEarnings !== null ? `$${stats.bestEarnings}M` : '--';
            document.getElementById('landing-times-played').textContent = stats.totalPlays;
        }
    }
    skipBtn.addEventListener('click', startGame);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcut);
});

function handleKeyboardShortcut(e) {
    const activeScreen = Object.entries(screens).find(([, el]) => el.classList.contains('active'));
    if (!activeScreen) return;
    const screenName = activeScreen[0];

    if (screenName === 'decision') {
        if (e.key === 'T' || e.key === 't') makeDecision('Take');
        else if (e.key === 'B' || e.key === 'b') makeDecision('Bet');
        else if (e.key === 'Escape') showScreen('game');
    }

    if (e.key === ' ' && screenName === 'outcome') {
        e.preventDefault();
        document.getElementById('continue-btn').click();
    }
}

// === SCREEN MANAGEMENT ===
function showScreen(screenName) {
    const current = Object.values(screens).find(s => s.classList.contains('active'));

    const doSwitch = () => {
        Object.values(screens).forEach(s => s.classList.remove('active', 'screen-exiting'));
        screens[screenName].classList.add('active');
    };

    if (current && current !== screens[screenName]) {
        current.classList.add('screen-exiting');
        setTimeout(doSwitch, 200);
    } else {
        doSwitch();
    }
}

function showTutorial() {
    modal.classList.add('active');
}

function startGame() {
    modal.classList.remove('active');
    showScreen('game');
    renderPlayers();
    updateProgress();
    updateHeaderBestScore();
}

function resetGame() {
    gameState = {
        currentPlayer: null,
        decisions: {},
        completedCount: 0,
        runningTotal: 0
    };
    showScreen('game');
    renderPlayers();
    updateProgress();
    updateRunningTotal();
    updateHeaderBestScore();
}

// === HELPER FUNCTIONS ===
function updateHeaderBestScore() {
    const stats = getPersistStats();
    const el = document.getElementById('header-best-score');
    if (el) {
        el.textContent = stats.bestEarnings !== null ? `$${stats.bestEarnings}M` : '—';
    }
}

function updateRunningTotal() {
    const el = document.getElementById('running-total');
    if (el) el.textContent = `$${gameState.runningTotal.toFixed(1)}M`;
}

// === RENDER PLAYERS ===
function renderPlayers() {
    const grid = document.getElementById('players-grid');
    grid.innerHTML = '';

    players.forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-card';

        const decided = gameState.decisions[player.id];
        if (decided) card.classList.add('decided');

        card.innerHTML = `
            <div class="player-avatar">${player.emoji}</div>
            <div class="player-name">${player.name}</div>
            <div class="player-team">${player.team}</div>
            <div class="player-position">${player.position}</div>
            <div class="player-stats">
                💰 Base: $${player.baseGuaranteed}M<br>
                🎯 Incentives: $${player.incentives}M<br>
                ⚠️ Risk: ${player.riskPercent}%
            </div>
        `;

        if (decided) {
            const decisionLabel = decided.decision === 'Take' ? '🛡️ Took' : '🎲 Bet';
            const ratingEmoji   = decided.rating === 'Gold'   ? '🥇'
                                : decided.rating === 'Silver' ? '🥈' : '🥉';
            const luckyTag = decided.luckyCall
                ? `<span class="lucky-call-badge">Lucky</span>` : '';

            const badge = document.createElement('div');
            badge.className = 'card-decided-badge';
            badge.innerHTML = `
                <div class="badge-decision">${decisionLabel}</div>
                <div class="badge-rating rating-${decided.rating.toLowerCase()}">${ratingEmoji} ${decided.rating}${luckyTag}</div>
            `;
            card.appendChild(badge);
        } else {
            card.addEventListener('click', () => showPlayerDecision(player));
        }

        grid.appendChild(card);
    });
}

// === SHOW PLAYER DECISION SCREEN ===
function showPlayerDecision(player) {
    if (gameState.decisions[player.id]) return;
    gameState.currentPlayer = player;

    document.getElementById('detail-avatar').innerHTML = player.emoji;
    document.getElementById('detail-name').textContent = player.name;
    document.getElementById('detail-team').textContent = player.team;
    document.getElementById('detail-position').textContent = player.position;
    document.getElementById('detail-description').textContent = player.description;
    document.getElementById('detail-base').textContent = `$${player.baseGuaranteed}M`;
    document.getElementById('detail-incentives').textContent = `$${player.incentives}M`;
    document.getElementById('detail-risk').textContent = `${player.riskPercent}%`;
    document.getElementById('detail-model').textContent = `$${player.modelValue}M`;

    document.getElementById('take-amount').textContent = `$${player.baseGuaranteed}M`;
    const maxBet = player.baseGuaranteed + player.incentives;
    document.getElementById('bet-amount').textContent = `$${maxBet.toFixed(1)}M`;

    // Risk meter
    const fill = document.getElementById('risk-fill');
    fill.style.width = `${Math.min(player.riskPercent, 100)}%`;
    fill.style.background = player.riskPercent < 20
        ? 'linear-gradient(90deg, #00c853, #69f0ae)'
        : player.riskPercent < 35
        ? 'linear-gradient(90deg, #ffd600, #ffab00)'
        : 'linear-gradient(90deg, #ff6b6b, #d32f2f)';

    // EV calculations
    const evTake = player.baseGuaranteed;
    const risk   = player.riskPercent / 100;
    // The injured branch pays base * severity, never the full guarantee, so the
    // expected value has to carry that multiplier. Showing an EV the game does
    // not pay is the one mistake this simulation cannot afford to make.
    const evBet  = (1 - risk) * (player.baseGuaranteed + player.incentives)
                 + risk * player.baseGuaranteed * expectedInjuryMultiplier();

    document.getElementById('ev-take').textContent = `$${evTake.toFixed(2)}M`;
    document.getElementById('ev-bet').textContent  = `$${evBet.toFixed(2)}M`;
    document.getElementById('ev-model').textContent = `$${player.modelValue}M`;

    const evRecommendationEl = document.getElementById('ev-recommendation');
    if (evRecommendationEl) {
        const diff = evBet - evTake;
        if (Math.abs(diff) < 0.5) {
            evRecommendationEl.textContent = 'EV nearly equal — both choices are defensible.';
        } else if (diff > 0) {
            evRecommendationEl.textContent = `Betting has +$${diff.toFixed(2)}M EV edge, but carries real injury risk.`;
        } else {
            evRecommendationEl.textContent = `Taking the guarantee is safer and has +$${Math.abs(diff).toFixed(2)}M EV edge here.`;
        }
    }

    showScreen('decision');
}

// === MAKE DECISION ===
function makeDecision(decision) {
    const player = gameState.currentPlayer;

    // Shared injury seed
    const injurySeed = Math.random();
    const risk = player.riskPercent / 100;
    const injured = injurySeed < risk;

    // Injury severity
    let severityKey = null;
    if (injured) {
        const severitySeed = Math.random();
        if (severitySeed < 0.15)      severityKey = 'SEVERE';
        else if (severitySeed < 0.55) severityKey = 'MILD';
        else                          severityKey = 'MODERATE';
    }

    // Compute actual earnings
    let earned;
    if (decision === 'Take') {
        earned = player.baseGuaranteed;
    } else {
        if (injured) {
            earned = player.baseGuaranteed * INJURY_SEVERITY[severityKey].multiplier;
        } else {
            // BUG FIX: clamp to baseGuaranteed floor
            // Centred on zero: the screen promises base + incentives as the
            // healthy expectation, so that has to be the mean, not a floor.
            const variance = (Math.random() - 0.5) * player.incentives;
            earned = Math.max(
                player.baseGuaranteed,
                player.baseGuaranteed + player.incentives + variance
            );
        }
    }

    // What-if earnings using the same injury outcome
    let whatIfEarned;
    if (decision === 'Take') {
        // What if had bet?
        if (injured) {
            whatIfEarned = player.baseGuaranteed * INJURY_SEVERITY[severityKey].multiplier;
        } else {
            // Show full incentive potential (no variance for deterministic comparison)
            whatIfEarned = player.baseGuaranteed + player.incentives;
        }
    } else {
        // What if had taken guarantee?
        whatIfEarned = player.baseGuaranteed;
    }

    // Lucky Call: high-risk bet that paid off
    const luckyCall = (decision === 'Bet') && !injured && (player.riskPercent >= LUCKY_RISK_THRESHOLD);

    // Rating
    const pct = player.modelValue ? earned / player.modelValue : 0;
    let rating;
    if (decision === 'Take' && injured) {
        rating = 'Silver';
    } else if (pct >= 0.95) {
        rating = 'Gold';
    } else if (pct >= 0.85) {
        rating = 'Silver';
    } else {
        rating = 'Bronze';
    }

    // Feedback message
    let feedbackKey;
    if (decision === 'Take' && injured)       feedbackKey = 'Take+Injured';
    else if (decision === 'Take' && !injured)  feedbackKey = 'Take+Healthy';
    else if (decision === 'Bet' && injured)    feedbackKey = 'Bet+Injured';
    else if (luckyCall)                        feedbackKey = 'Bet+Healthy+Lucky';
    else                                       feedbackKey = 'Bet+Healthy';

    const msgPool = FEEDBACK_MESSAGES[feedbackKey];
    let feedback = msgPool[Math.floor(Math.random() * msgPool.length)];
    feedback = feedback
        .replace('$BASE', `$${player.baseGuaranteed}M`)
        .replace('RISK%', `${player.riskPercent}%`);

    const injuryLabel = injured ? INJURY_SEVERITY[severityKey].label : 'Healthy Season';
    const earnedRounded = parseFloat(earned.toFixed(1));

    // Update game state
    gameState.decisions[player.id] = {
        decision,
        injured,
        severityKey,
        earned: earnedRounded,
        whatIfEarned: parseFloat(whatIfEarned.toFixed(1)),
        rating,
        luckyCall,
        feedback
    };

    gameState.completedCount = Object.keys(gameState.decisions).length;
    gameState.runningTotal = Object.values(gameState.decisions)
        .reduce((sum, d) => sum + d.earned, 0);

    updateProgress();

    if (rating === 'Gold') triggerConfetti();

    showOutcome(player, decision, injured, injuryLabel, earnedRounded,
                parseFloat(whatIfEarned.toFixed(1)), rating, luckyCall, feedback);
}

// === SHOW OUTCOME ===
function showOutcome(player, decision, injured, injuryLabel, earned, whatIfEarned, rating, luckyCall, feedback) {
    document.getElementById('outcome-title').textContent = injured ? '❌ Injury Alert!' : '✅ Season Success!';
    document.getElementById('outcome-avatar').innerHTML = player.emoji;
    document.getElementById('outcome-name').textContent = player.name;

    // Injury label badge
    const injuryLabelEl = document.getElementById('outcome-injury-label');
    if (injured) {
        injuryLabelEl.textContent = injuryLabel;
        injuryLabelEl.classList.add('visible');
    } else {
        injuryLabelEl.classList.remove('visible');
    }

    // Outcome header color class
    const outcomeHeader = document.getElementById('outcome-header');
    outcomeHeader.className = 'outcome-header ' + (injured ? 'injury-header' : 'healthy-header');

    // Outcome container border color
    const container = document.getElementById('outcome-container');
    container.classList.remove('outcome-healthy', 'outcome-injury');
    container.classList.add(injured ? 'outcome-injury' : 'outcome-healthy');

    document.getElementById('outcome-decision').textContent =
        decision === 'Take' ? '🛡️ Took Guarantee' : '🎲 Bet on Performance';
    document.getElementById('outcome-result').textContent = injuryLabel;

    // Rating
    const ratingEl = document.getElementById('outcome-rating');
    ratingEl.className = `outcome-value rating-${rating.toLowerCase()}`;
    let ratingHTML = rating;
    if (luckyCall) ratingHTML += ' <span class="lucky-call-badge">Lucky Call</span>';
    ratingEl.innerHTML = ratingHTML;

    // Animated earnings counter
    const earningsEl = document.getElementById('outcome-earnings');
    earningsEl.innerHTML = '';
    const counterSpan = document.createElement('span');
    counterSpan.className = 'earnings-value';
    earningsEl.appendChild(counterSpan);
    animateCounter(counterSpan, earned);

    // What-if box
    const diff = earned - whatIfEarned;
    const altDecision = decision === 'Take' ? 'Bet on Performance' : 'Take the Guarantee';
    let whatIfHTML;
    if (Math.abs(diff) < 0.1) {
        whatIfHTML = `<span class="what-if-equal">Same outcome</span> — both choices would have earned $${whatIfEarned.toFixed(1)}M.`;
    } else if (diff > 0) {
        whatIfHTML = `If you had chosen <em>${altDecision}</em>, you'd have earned <span class="what-if-worse">$${whatIfEarned.toFixed(1)}M</span> — that's <strong>$${Math.abs(diff).toFixed(1)}M less</strong>. Good call.`;
    } else {
        whatIfHTML = `If you had chosen <em>${altDecision}</em>, you'd have earned <span class="what-if-better">$${whatIfEarned.toFixed(1)}M</span> — that's <strong>$${Math.abs(diff).toFixed(1)}M more</strong>. Something to consider.`;
    }

    const whatIfContent = document.getElementById('what-if-content');
    if (whatIfContent) whatIfContent.innerHTML = whatIfHTML;

    document.getElementById('outcome-feedback').textContent = feedback;

    showScreen('outcome');
}

// === ANIMATE COUNTER ===
function animateCounter(el, targetValue) {
    const duration = 1200;
    const steps    = 40;
    const stepTime = duration / steps;
    let step = 0;

    el.textContent = '$0.0M';

    const interval = setInterval(() => {
        step++;
        // Ease-out: faster early, slower near end
        const progress = 1 - Math.pow(1 - step / steps, 2);
        el.textContent = `$${(targetValue * progress).toFixed(1)}M`;

        if (step >= steps) {
            clearInterval(interval);
            el.textContent = `$${targetValue.toFixed(1)}M`;
        }
    }, stepTime);
}

// === CONFETTI ===
function triggerConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#FFD700', '#64FFDA', '#FF6B6B', '#69F0AE', '#FF8C00', '#FFFFFF'];

    for (let i = 0; i < 60; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left              = `${Math.random() * 100}%`;
        piece.style.background        = colors[Math.floor(Math.random() * colors.length)];
        piece.style.width             = `${6 + Math.random() * 8}px`;
        piece.style.height            = `${6 + Math.random() * 8}px`;
        piece.style.borderRadius      = Math.random() > 0.5 ? '50%' : '2px';
        piece.style.animationDuration = `${1.5 + Math.random() * 2}s`;
        piece.style.animationDelay    = `${Math.random() * 0.5}s`;
        container.appendChild(piece);
    }

    setTimeout(() => { container.innerHTML = ''; }, 4000);
}

// === UPDATE PROGRESS ===
function updateProgress() {
    document.getElementById('progress-text').textContent =
        `Decisions Made: ${gameState.completedCount} / 8`;
    document.getElementById('progress-fill').style.width =
        `${(gameState.completedCount / 8) * 100}%`;
    updateRunningTotal();
}

// === SHOW RESULTS ===
function showResults() {
    const resultsGrid = document.getElementById('results-grid');
    resultsGrid.innerHTML = '';

    let totalEarnings = 0;
    let ratings = [];
    let optimalEarnings = 0;

    players.forEach(player => {
        const decision = gameState.decisions[player.id];
        if (!decision) return;

        totalEarnings += decision.earned;
        ratings.push(decision.rating);

        // Optimal EV for this player
        const risk = player.riskPercent / 100;
        const evBet = (1 - risk) * (player.baseGuaranteed + player.incentives) + risk * player.baseGuaranteed;
        optimalEarnings += Math.max(player.baseGuaranteed, evBet);

        const luckyBadge = decision.luckyCall
            ? `<span class="lucky-call-badge">Lucky Call</span>` : '';
        const outcomeLabel = decision.injured
            ? INJURY_SEVERITY[decision.severityKey].label : 'Healthy';

        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <h3>${player.emoji} ${player.name}</h3>
            <p><strong>Decision:</strong> ${decision.decision === 'Take' ? '🛡️ Guarantee' : '🎲 Performance'}</p>
            <p><strong>Outcome:</strong> ${outcomeLabel}</p>
            <p><strong>Earned:</strong> $${decision.earned}M</p>
            <span class="result-rating rating-${decision.rating.toLowerCase()}">${decision.rating}</span>
            ${luckyBadge}
        `;
        resultsGrid.appendChild(card);
    });

    // Calculate average rating score
    let score = 0;
    ratings.forEach(r => {
        if (r === 'Gold') score += 3;
        else if (r === 'Silver') score += 2;
        else score += 1;
    });
    const avgRating = ratings.length ? score / ratings.length : 0;
    const roundedAvg = Math.round(avgRating * 100) / 100;

    // Display summary
    document.getElementById('total-earnings').textContent = `$${totalEarnings.toFixed(1)}M`;
    document.getElementById('avg-rating').textContent = roundedAvg.toFixed(2);
    document.getElementById('optimal-earnings').textContent = `$${optimalEarnings.toFixed(1)}M`;

    // Update persistence
    const newBest = updatePersistStats(totalEarnings, roundedAvg);

    // Update personal bests display
    const persist = getPersistStats();
    const bestEarningsEl = document.getElementById('best-earnings-result');
    const timesPlayedEl  = document.getElementById('times-played-result');
    if (bestEarningsEl) bestEarningsEl.textContent =
        persist.bestEarnings !== null ? `$${persist.bestEarnings}M` : '--';
    if (timesPlayedEl) timesPlayedEl.textContent = persist.totalPlays;

    // Update landing screen stats for next visit
    const landingBest   = document.getElementById('landing-best-earnings');
    const landingPlayed = document.getElementById('landing-times-played');
    if (landingBest) landingBest.textContent =
        persist.bestEarnings !== null ? `$${persist.bestEarnings}M` : '--';
    if (landingPlayed) landingPlayed.textContent = persist.totalPlays;

    // Final message and claim code
    const finalMessage      = document.getElementById('final-message');
    const claimCodeContainer = document.getElementById('claim-code-container');

    if (roundedAvg >= MIN_RATING_FOR_CODE) {
        finalMessage.textContent = "🏆 Excellent round — you balanced risk and reward like a pro!";
        claimCodeContainer.innerHTML = `
            <div>🎉 CLAIM CODE UNLOCKED 🎉</div>
            <div style="margin-top: 15px; font-size: 2rem; letter-spacing: 4px;">${CLAIM_CODE}</div>
            <div style="margin-top: 10px; font-size: 1rem; opacity: 0.9;">Remember: smart agents don't chase money — they create value.</div>
        `;
    } else {
        finalMessage.textContent = "Keep refining your risk strategy to improve your rating and unlock the claim code!";
        claimCodeContainer.innerHTML = `<div style="opacity: 0.6;">— No Claim Code Yet —</div>`;
    }

    // Confetti if new best or claim code earned
    if (newBest || roundedAvg >= MIN_RATING_FOR_CODE) {
        setTimeout(triggerConfetti, 400);
    }

    showScreen('results');
}
