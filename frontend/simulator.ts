import { chromium, Page } from '@playwright/test';

// Helper function to extract game state from page
async function getGameStatus(page: Page): Promise<{
    players: { name: string; money: string; inJail: boolean }[];
    phase: string;
} | null> {
    try {
        // Get player info from the Players panel
        const playerElements = await page.locator('.bg-gray-800 >> div.flex.items-center.justify-between').all();
        const players: { name: string; money: string; inJail: boolean }[] = [];

        for (const el of playerElements) {
            const nameEl = await el.locator('.font-bold.text-white').first().textContent();
            const moneyEl = await el.locator('.text-green-400.font-mono').textContent();
            const inJail = await el.locator('text=JAIL').isVisible().catch(() => false);

            if (nameEl && moneyEl) {
                players.push({
                    name: nameEl.replace('YOU', '').replace('JAIL', '').trim(),
                    money: moneyEl.trim(),
                    inJail,
                });
            }
        }

        // Get phase
        const phaseEl = await page.locator('text=Phase:').textContent().catch(() => 'Unknown');

        return { players, phase: phaseEl || 'Unknown' };
    } catch {
        return null;
    }
}

function printGameStatus(status: Awaited<ReturnType<typeof getGameStatus>>, turnCount: number) {
    if (!status) return;

    console.log('\n========== GAME STATUS (Turn ' + turnCount + ') ==========');
    console.log('Phase:', status.phase);
    console.log('Players:');
    for (const p of status.players) {
        const jailStatus = p.inJail ? ' [IN JAIL]' : '';
        console.log(`  ${p.name}: ${p.money}${jailStatus}`);
    }
    console.log('='.repeat(45) + '\n');
}

async function runSimulator() {
    console.log('Starting Monopoly Simulator...');
    const browser = await chromium.launch({ headless: true });

    try {
        const context1 = await browser.newContext();
        const page1 = await context1.newPage();
        const context2 = await browser.newContext();
        const page2 = await context2.newPage();

        const gameUrl = 'http://localhost:5173';

        // Track properties bought
        const propertiesBought: { [key: string]: string[] } = {
            'Player 1': [],
            'Player 2': [],
        };

        console.log('Player 1: Navigating to game...');
        page1.on('console', msg => console.log(`P1 Console: ${msg.text()}`));
        page2.on('console', msg => console.log(`P2 Console: ${msg.text()}`));

        await page1.goto(gameUrl);
        console.log('Player 1: Creating room...');

        try {
            await page1.waitForSelector('button:has-text("Create New Room")', { timeout: 5000 });
            console.log('Button found!');
        } catch {
            console.log('Button NOT found within 5s');
            console.log('Body text:', await page1.innerText('body'));
        }

        await page1.fill('input[placeholder="Enter your name..."]', 'Player 1');
        await page1.click('button:has-text("Create New Room")');

        console.log('Player 1: Waiting for room code...');
        await page1.waitForSelector('text=Room Code');
        const roomCodeElement = page1.locator('p.text-3xl.font-mono');
        const roomCode = await roomCodeElement.textContent();

        if (!roomCode) throw new Error('Failed to retrieve room code');
        console.log(`Room Code: ${roomCode}`);

        console.log('Player 2: Navigating to game...');
        await page2.goto(gameUrl);
        console.log('Player 2: Joining room...');
        await page2.fill('input[placeholder="Enter your name..."]', 'Player 2');
        await page2.fill('input[placeholder="ROOM CODE"]', roomCode);
        await page2.click('button:has-text("Join")');

        console.log('Player 1: Starting game...');
        await page1.waitForSelector('text=Player 2');
        await page1.click('button:has-text("Start Game")');

        console.log('Game Started! Entering game loop...\n');

        let gameEnded = false;
        let turnCount = 0;
        const maxTurns = 1000;
        let lastStatusPrint = 0;

        while (!gameEnded && turnCount < maxTurns) {
            turnCount++;

            // Check for Game Over
            const gameOverP1 = await page1.locator('text=Game Over').isVisible().catch(() => false) ||
                await page1.locator('text=Lulus Cumlaude').isVisible().catch(() => false) ||
                await page1.locator('text=Permainan Selesai').isVisible().catch(() => false) ||
                await page1.locator('text=Winner').isVisible().catch(() => false) ||
                await page1.locator('text=Bankrupt').isVisible().catch(() => false);

            const gameOverP2 = await page2.locator('text=Game Over').isVisible().catch(() => false) ||
                await page2.locator('text=Bankrupt').isVisible().catch(() => false);

            if (gameOverP1 || gameOverP2) {
                console.log('\n🎮 GAME OVER DETECTED! 🎮');
                const finalStatus = await getGameStatus(page1);
                if (finalStatus) {
                    console.log('\n========== FINAL GAME STATUS ==========');
                    console.log('Players:');
                    for (const p of finalStatus.players) {
                        const jailStatus = p.inJail ? ' [IN JAIL]' : '';
                        console.log(`  ${p.name}: ${p.money}${jailStatus}`);
                    }
                }

                console.log('\nProperties Bought:');
                for (const [player, props] of Object.entries(propertiesBought)) {
                    console.log(`  ${player}: ${props.length} properties`);
                    if (props.length > 0) console.log(`    - ${props.join(', ')}`);
                }

                const bodyText = await page1.innerText('body').catch(() => '');
                if (bodyText.includes('Winner')) {
                    const winnerMatch = bodyText.match(/Winner[:\s]+(\w+)/i);
                    if (winnerMatch) console.log(`\n🏆 WINNER: ${winnerMatch[1]} 🏆`);
                }

                console.log('\nTotal turns played:', turnCount);
                console.log('='.repeat(45));
                gameEnded = true;
                break;
            }

            // Determine whose turn
            const p1RollEnabled = await page1.locator('button:has-text("Roll Dice"):not([disabled])').isVisible().catch(() => false);
            const p2RollEnabled = await page2.locator('button:has-text("Roll Dice"):not([disabled])').isVisible().catch(() => false);
            const p1InJail = await page1.locator('button:has-text("Pay Fine")').isVisible().catch(() => false);
            const p2InJail = await page2.locator('button:has-text("Pay Fine")').isVisible().catch(() => false);
            const p1EndTurn = await page1.locator('button:has-text("End Turn"):not([disabled])').isVisible().catch(() => false);
            const p2EndTurn = await page2.locator('button:has-text("End Turn"):not([disabled])').isVisible().catch(() => false);

            let activePage: Page | null = null;
            let playerName = '';

            if (p1RollEnabled || p1InJail || p1EndTurn) {
                activePage = page1;
                playerName = 'Player 1';
            } else if (p2RollEnabled || p2InJail || p2EndTurn) {
                activePage = page2;
                playerName = 'Player 2';
            }

            if (activePage) {
                // Print status every 10 turns
                if (turnCount - lastStatusPrint >= 10) {
                    const status = await getGameStatus(activePage);
                    printGameStatus(status, turnCount);
                    lastStatusPrint = turnCount;
                }

                console.log(`Turn ${turnCount}: ${playerName}'s turn`);
                const phase = await activePage.locator('text=Phase:').textContent();
                console.log(`Current Phase: ${phase}`);

                // Close modals first
                const closeBtn = activePage.locator('button:has-text("Close"), button:has-text("Tutup"), button:has-text("OK")');
                while (await closeBtn.first().isVisible({ timeout: 500 }).catch(() => false)) {
                    console.log(`${playerName} closing a modal.`);
                    await closeBtn.first().click();
                    await activePage.waitForTimeout(500);
                }

                // Handle Jail
                const payFineBtn = activePage.locator('button:has-text("Pay Fine")');
                const rollDoublesBtn = activePage.locator('button:has-text("Roll Doubles")');

                if (await payFineBtn.isVisible({ timeout: 500 }).catch(() => false)) {
                    if (await payFineBtn.isEnabled()) {
                        console.log(`${playerName} is in jail, paying fine.`);
                        await payFineBtn.click();
                        await activePage.waitForTimeout(1500);
                        continue;
                    } else if (await rollDoublesBtn.isVisible() && await rollDoublesBtn.isEnabled()) {
                        console.log(`${playerName} is in jail, rolling for doubles.`);
                        await rollDoublesBtn.click();
                        await activePage.waitForTimeout(2000);
                        continue;
                    }
                }

                // Roll Dice
                const rollBtn = activePage.locator('button:has-text("Roll Dice")');
                if (await rollBtn.isVisible() && await rollBtn.isEnabled()) {
                    try {
                        await rollBtn.click({ force: true, timeout: 5000 });
                        console.log(`${playerName} rolled dice.`);
                        await activePage.waitForTimeout(2000);
                    } catch (e) {
                        console.log(`${playerName} failed to click Roll Dice: ${e}`);
                        if (await closeBtn.first().isVisible({ timeout: 500 }).catch(() => false)) {
                            await closeBtn.first().click();
                            await activePage.waitForTimeout(500);
                        }
                        continue;
                    }
                } else {
                    console.log(`${playerName} Roll Dice not visible or not enabled`);
                }

                // Close post-roll modals
                while (await closeBtn.first().isVisible({ timeout: 500 }).catch(() => false)) {
                    console.log(`${playerName} closing a post-roll modal.`);
                    await closeBtn.first().click();
                    await activePage.waitForTimeout(500);
                }

                // Buy Property
                const buyBtn = activePage.locator('button:has-text("Buy")');
                if (await buyBtn.isVisible() && await buyBtn.isEnabled()) {
                    const tileNameEl = await activePage.locator('.bg-white.rounded-lg .font-bold.text-lg').textContent().catch(() => 'Unknown');
                    console.log(`${playerName} is buying property: ${tileNameEl}`);
                    propertiesBought[playerName].push(tileNameEl || 'Unknown');
                    await buyBtn.click();
                    await activePage.waitForTimeout(1000);
                }

                // Pay Rent
                const payBtn = activePage.locator('button:has-text("Pay Rent")');
                if (await payBtn.isVisible() && await payBtn.isEnabled()) {
                    console.log(`${playerName} is paying rent.`);
                    await payBtn.click();
                    await activePage.waitForTimeout(1000);
                }

                // End Turn
                const endTurnBtn = activePage.locator('button:has-text("End Turn")');
                if (await endTurnBtn.isVisible() && await endTurnBtn.isEnabled()) {
                    await endTurnBtn.click();
                    console.log(`${playerName} ended turn.`);
                    await activePage.waitForTimeout(1500);
                } else if (await activePage.isVisible('button:has-text("Roll Dice")')) {
                    console.log(`${playerName} gets to roll again (Doubles).`);
                } else {
                    console.log(`${playerName} is waiting...`);
                    await activePage.waitForTimeout(1000);
                }

            } else {
                await page1.waitForTimeout(1000);
            }
        }

        if (turnCount >= maxTurns) {
            console.log(`\n⚠️ Simulation stopped after ${maxTurns} turns (safety limit)`);
            const finalStatus = await getGameStatus(page1);
            printGameStatus(finalStatus, turnCount);
            console.log('\nProperties Bought:');
            for (const [player, props] of Object.entries(propertiesBought)) {
                console.log(`  ${player}: ${props.length} properties`);
            }
        }

        console.log('\n✅ Simulation completed successfully!');

    } catch (error) {
        console.error('Simulation failed:', error);
    } finally {
        await browser.close();
    }
}

runSimulator();
