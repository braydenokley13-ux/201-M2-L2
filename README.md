# MLB Player Economics - Agent Simulator

An interactive HTML game where you act as a sports agent making contract decisions for 8 real MLB players.

## Game Overview

**Objective:** Balance risk and reward as you decide between guaranteed contracts vs. performance-based deals for MLB superstars.

**Gameplay:**
- 8 real MLB players with unique contract scenarios
- Each player has: Base Guaranteed salary, Performance Incentives, and Injury Risk %
- Make decisions: **Take the Guarantee** (safe) or **Bet on Performance** (risky but potentially lucrative)
- Earn ratings (Gold/Silver/Bronze) based on performance vs. model value
- Unlock a claim code by achieving an average rating ≥1.9

## Features

- 🎮 Interactive single-page game
- ⚾ Real MLB players (Judge, Ohtani, Trout, Betts, Acuña Jr., Rodríguez, Cole, Witt Jr.)
- 📊 Live simulation with randomized injury outcomes
- 🏆 Rating system with Gold/Silver/Bronze badges
- 📱 Mobile-responsive design
- 🎨 Smooth animations and transitions
- 💾 No backend required - runs entirely in browser

## How to Play

1. Click "Start Agent Career"
2. Read the tutorial
3. Click on each player to view their contract details
4. Choose: **Take the Guarantee** or **Bet on Performance**
5. See the outcome (injury or healthy season)
6. Repeat for all 8 players
7. View final results and claim code (if earned!)

## Deployment on GitHub Pages

### Option 1: Deploy from Main Branch
1. Push all files to your repository
2. Go to repository Settings → Pages
3. Select branch (main or master) and root folder
4. Save and wait for deployment
5. Access at: `https://[username].github.io/[repo-name]/`

### Option 2: Deploy from Specific Branch
1. Push to your designated branch (e.g., `claude/interactive-html-activity-WDrAT`)
2. Go to Settings → Pages
3. Select your branch and root folder
4. Save and access deployed site

## Files

- `index.html` - Main game structure
- `styles.css` - All styling and animations
- `game.js` - Game logic, player data, and simulation
- `README.md` - This file

## Technical Details

- **No dependencies** - Pure HTML/CSS/JavaScript
- **Client-side only** - No server or backend needed
- **Responsive** - Works on desktop, tablet, and mobile
- **Accessible** - Keyboard navigation supported

## Game Mechanics

### Decision Types
- **Take**: Player receives base guaranteed amount (no risk, no upside)
- **Bet**: Player can earn base + incentives if healthy, but only base if injured

### Rating System
- **Gold**: Earned ≥95% of model value
- **Silver**: Earned 85-95% of model value, OR took guarantee when player got injured
- **Bronze**: Earned <85% of model value

### Claim Code
- Unlocked when average rating ≥1.9
- Code: `L2-201-M2-PLAYER`

## MLB Players Featured

1. **Aaron Judge** - Yankees OF - High risk, high reward
2. **Shohei Ohtani** - Dodgers P/DH - Two-way superstar premium
3. **Mike Trout** - Angels OF - Elite talent with injury concerns
4. **Mookie Betts** - Dodgers OF - Consistent MVP-caliber
5. **Ronald Acuña Jr.** - Braves OF - Speed and power with moderate risk
6. **Julio Rodríguez** - Mariners OF - Young star potential
7. **Gerrit Cole** - Yankees P - Ace with durability questions
8. **Bobby Witt Jr.** - Royals SS - Emerging superstar

## Educational Value

This activity teaches:
- Risk management in professional sports
- Contract structure (guaranteed vs. incentive-based)
- Decision-making under uncertainty
- Evaluating expected value vs. actual outcomes
- Portfolio thinking (multiple decisions creating cumulative results)

## License

Created for educational purposes.

---

**Ready to test your agent skills? Open `index.html` and start playing!**
