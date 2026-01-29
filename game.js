// === CONFIG ===
const CLAIM_CODE = "L2-201-M2-PLAYER";
const MIN_RATING_FOR_CODE = 1.9;

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
    completedCount: 0
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

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    // Start button
    document.getElementById('start-btn').addEventListener('click', showTutorial);

    // Tutorial close
    document.getElementById('tutorial-close').addEventListener('click', startGame);

    // Back button
    document.getElementById('back-btn').addEventListener('click', () => showScreen('game'));

    // Continue button
    document.getElementById('continue-btn').addEventListener('click', () => {
        if (gameState.completedCount === 8) {
            showResults();
        } else {
            showScreen('game');
        }
    });

    // Replay button
    document.getElementById('replay-btn').addEventListener('click', resetGame);

    // Decision buttons
    document.getElementById('btn-take').addEventListener('click', () => makeDecision('Take'));
    document.getElementById('btn-bet').addEventListener('click', () => makeDecision('Bet'));
});

// === SCREEN MANAGEMENT ===
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function showTutorial() {
    modal.classList.add('active');
}

function startGame() {
    modal.classList.remove('active');
    showScreen('game');
    renderPlayers();
    updateProgress();
}

function resetGame() {
    gameState = {
        currentPlayer: null,
        decisions: {},
        completedCount: 0
    };
    showScreen('game');
    renderPlayers();
    updateProgress();
}

// === RENDER PLAYERS ===
function renderPlayers() {
    const grid = document.getElementById('players-grid');
    grid.innerHTML = '';

    players.forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-card';

        if (gameState.decisions[player.id]) {
            card.classList.add('decided');
        }

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

        if (!gameState.decisions[player.id]) {
            card.addEventListener('click', () => showPlayerDecision(player));
        }

        grid.appendChild(card);
    });
}

// === SHOW PLAYER DECISION SCREEN ===
function showPlayerDecision(player) {
    gameState.currentPlayer = player;

    document.getElementById('detail-avatar').innerHTML = player.emoji;
    document.getElementById('detail-name').textContent = player.name;
    document.getElementById('detail-team').textContent = player.team;
    document.getElementById('detail-position').textContent = player.position;
    document.getElementById('detail-base').textContent = `$${player.baseGuaranteed}M`;
    document.getElementById('detail-incentives').textContent = `$${player.incentives}M`;
    document.getElementById('detail-risk').textContent = `${player.riskPercent}%`;
    document.getElementById('detail-model').textContent = `$${player.modelValue}M`;

    document.getElementById('take-amount').textContent = `$${player.baseGuaranteed}M`;
    const maxBet = player.baseGuaranteed + player.incentives;
    document.getElementById('bet-amount').textContent = `$${maxBet.toFixed(1)}M`;

    showScreen('decision');
}

// === MAKE DECISION ===
function makeDecision(decision) {
    const player = gameState.currentPlayer;

    // === Simulate outcome (port from Apps Script) ===
    const risk = player.riskPercent / 100;
    const injurySeed = Math.random();
    const injured = injurySeed < risk;

    let earned, feedback, rating;

    if (decision === 'Take') {
        earned = player.baseGuaranteed;
        if (injured) {
            feedback = `Smart call — your client got hurt, but the guaranteed $${earned}M kept them secure. Lesson: Even the right model can't predict injuries — guarantees matter.`;
        } else {
            feedback = `Safe and steady — you locked in $${earned}M. No risk, no bonus, but no stress. Lesson: Betting can pay off, but only when your timing and luck align.`;
        }
    } else if (decision === 'Bet') {
        if (injured) {
            earned = player.baseGuaranteed;
            feedback = `Tough break — you bet on performance, but injury wiped out incentives. You finish with $${earned}M. Lesson: Even the right model can't predict injuries — guarantees matter.`;
        } else {
            const variance = (Math.random() - 0.3) * player.incentives;
            earned = player.baseGuaranteed + player.incentives + variance;
            feedback = `High-risk, high-reward — your client stayed healthy and earned $${earned.toFixed(1)}M. Lesson: Betting can pay off, but only when your timing and luck align.`;
        }
    }

    // === Calculate rating ===
    const pct = player.modelValue ? earned / player.modelValue : 0;

    if (decision === 'Take' && injured) {
        rating = 'Silver';
    } else if (pct >= 0.95) {
        rating = 'Gold';
    } else if (pct >= 0.85) {
        rating = 'Silver';
    } else {
        rating = 'Bronze';
    }

    // === Save decision ===
    gameState.decisions[player.id] = {
        decision,
        injured,
        earned: parseFloat(earned.toFixed(1)),
        rating,
        feedback
    };

    gameState.completedCount++;
    updateProgress();

    // === Show outcome ===
    showOutcome(player, decision, injured, earned, rating, feedback);
}

// === SHOW OUTCOME ===
function showOutcome(player, decision, injured, earned, rating, feedback) {
    const outcomeTitle = injured ? '❌ Injury Alert!' : '✅ Season Success!';
    document.getElementById('outcome-title').textContent = outcomeTitle;
    document.getElementById('outcome-avatar').innerHTML = player.emoji;
    document.getElementById('outcome-name').textContent = player.name;
    document.getElementById('outcome-decision').textContent = decision === 'Take' ? '🛡️ Took Guarantee' : '🎲 Bet on Performance';
    document.getElementById('outcome-result').textContent = injured ? 'Injured' : 'Healthy Season';
    document.getElementById('outcome-earnings').textContent = `$${earned.toFixed(1)}M`;

    const ratingEl = document.getElementById('outcome-rating');
    ratingEl.textContent = rating;
    ratingEl.className = `outcome-value rating-${rating.toLowerCase()}`;

    document.getElementById('outcome-feedback').textContent = feedback;

    showScreen('outcome');
}

// === UPDATE PROGRESS ===
function updateProgress() {
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');

    progressText.textContent = `Decisions Made: ${gameState.completedCount} / 8`;
    progressFill.style.width = `${(gameState.completedCount / 8) * 100}%`;
}

// === SHOW RESULTS ===
function showResults() {
    const resultsGrid = document.getElementById('results-grid');
    resultsGrid.innerHTML = '';

    let totalEarnings = 0;
    let ratings = [];

    players.forEach(player => {
        const decision = gameState.decisions[player.id];
        if (!decision) return;

        totalEarnings += decision.earned;
        ratings.push(decision.rating);

        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <h3>${player.emoji} ${player.name}</h3>
            <p><strong>Decision:</strong> ${decision.decision}</p>
            <p><strong>Outcome:</strong> ${decision.injured ? 'Injured' : 'Healthy'}</p>
            <p><strong>Earned:</strong> $${decision.earned}M</p>
            <span class="result-rating rating-${decision.rating.toLowerCase()}">${decision.rating}</span>
        `;
        resultsGrid.appendChild(card);
    });

    // === Calculate average rating ===
    let score = 0;
    ratings.forEach(r => {
        if (r === 'Gold') score += 3;
        else if (r === 'Silver') score += 2;
        else score += 1;
    });
    const avgRating = ratings.length ? score / ratings.length : 0;
    const roundedAvg = Math.round(avgRating * 100) / 100;

    // === Display summary ===
    document.getElementById('total-earnings').textContent = `$${totalEarnings.toFixed(1)}M`;
    document.getElementById('avg-rating').textContent = roundedAvg.toFixed(2);

    // === Final message and claim code ===
    const finalMessage = document.getElementById('final-message');
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

    showScreen('results');
}
