document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded. Initializing game.");

    // Get all screen elements
    const titleScreen = document.getElementById('title-screen');
    const rulesScreen = document.getElementById('rules-screen');
    const gameScreen = document.getElementById('game-screen');

    // Get buttons
    const startGameButton = document.getElementById('startGameButton');
    const backToTitleButton = document.getElementById('backToTitleButton');
    const startRaceButton = document.getElementById('startRaceButton');
    // Renamed ID for startNewGameButton
    const startNewGameButton = document.getElementById('startNewGameButton'); // Changed from resetButton

    // Canvas and Context
    const canvas = document.getElementById('mazeCanvas');
    const ctx = canvas.getContext('2d');

    // Game display elements
    const countdownDisplay = document.getElementById('countdown-display');
    const gameStatusDiv = document.getElementById('game-status');
    const gameMessagesDiv = document.getElementById('game-messages');

    // NEW: Overlay elements
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const overlayResult = document.getElementById('overlayResult'); // For "Player Wins!" or "NPC Wins!"
    const overlayMessage = document.getElementById('overlayMessage'); // For secondary message
    const playAgainButton = document.getElementById('playAgainButton');
    const overlayBackToTitleButton = document.getElementById('overlayBackToTitleButton');


    // Game settings
    const cellSize = 20;
    const mazeWidth = canvas.width / cellSize;
    const mazeHeight = canvas.height / cellSize;

    // Game state variables
    let player = { x: 0, y: 0 };
    let npc = { x: mazeWidth - 1, y: mazeHeight - 1 };
    let treasure = {};
    let maze = [];
    let gameWon = false;
    let npcPath = [];
    let npcMoveInterval = null;
    let gameActive = false; // Flag to control player/NPC movement during countdown/game over
    let pathRecalculationAttempts = 0; // To prevent infinite loops during pathfinding if maze is bad

    // NPC specific settings
    const npcMoveSpeed = 500; // milliseconds. Higher number = slower NPC (e.g., 500ms)
    const npcMistakeChance = 0.2; // 20% chance for NPC to make a mistake (0.0 to 1.0)


    // --- Screen Management Functions ---
    function showScreen(screenToShow) {
        console.log(`showScreen called to activate: ${screenToShow.id}`);
        const screens = [titleScreen, rulesScreen, gameScreen, gameOverOverlay]; // Include overlay in screens to manage
        screens.forEach(screen => {
            if (screen === screenToShow) {
                screen.classList.add('active');
            } else {
                screen.classList.remove('active');
            }
        });
    }

    // NEW: Overlay Management Functions
    function showGameOverOverlay(result, message, isPlayerWin) {
        console.log(`showGameOverOverlay called: Result="${result}", Message="${message}", Player Win=${isPlayerWin}`);
        overlayResult.textContent = result;
        overlayMessage.textContent = message;
        overlayResult.style.color = isPlayerWin ? 'green' : 'red'; // Set color based on winner
        showScreen(gameOverOverlay); // Activate the overlay screen
    }

    function hideGameOverOverlay() {
        console.log("hideGameOverOverlay called.");
        gameOverOverlay.classList.remove('active');
    }

    // --- Game Display & Status Functions ---
    function updateGameStatus(message) {
        gameStatusDiv.textContent = message;
    }

    function showGameMessage(message, color = '#d9534f') { // Default to red for error/warning
        gameMessagesDiv.textContent = message;
        gameMessagesDiv.style.color = color;
    }

    function clearGameMessage() {
        gameMessagesDiv.textContent = '';
    }

    // --- Maze Generation (Your corrected version) ---
    function generateMaze() {
        maze = [];
        for (let y = 0; y < mazeHeight; y++) {
            maze[y] = [];
            for (let x = 0; x < mazeWidth; x++) {
                maze[y][x] = { top: true, right: true, bottom: true, left: true, visited: false };
            }
        }

        let stack = [];
        let current = { x: 0, y: 0 };
        maze[current.y][current.x].visited = true;
        stack.push(current);

        while (stack.length > 0) {
            let neighbors = [];
            // Check valid neighbors
            if (current.y > 0 && !maze[current.y - 1][current.x].visited) { neighbors.push({ x: current.x, y: current.y - 1, wall: 'top' }); }
            if (current.x < mazeWidth - 1 && !maze[current.y][current.x + 1].visited) { neighbors.push({ x: current.x + 1, y: current.y, wall: 'right' }); }
            // CORRECTED LINE FOR 'bottom' neighbor:
            if (current.y < mazeHeight - 1 && !maze[current.y + 1][current.x].visited) { neighbors.push({ x: current.x, y: current.y + 1, wall: 'bottom' }); }
            if (current.x > 0 && !maze[current.y][current.x - 1].visited) { neighbors.push({ x: current.x - 1, y: current.y, wall: 'left' }); }

            if (neighbors.length > 0) {
                let next = neighbors[Math.floor(Math.random() * neighbors.length)];
                if (next.wall === 'top') { maze[current.y][current.x].top = false; maze[next.y][next.x].bottom = false; }
                else if (next.wall === 'right') { maze[current.y][current.x].right = false; maze[next.y][next.x].left = false; }
                else if (next.wall === 'bottom') { maze[current.y][current.x].bottom = false; maze[next.y][next.x].top = false; }
                else if (next.wall === 'left') { maze[current.y][current.x].left = false; maze[next.y][next.x].right = false; }
                stack.push(current);
                current = next;
                maze[current.y][current.x].visited = true;
            } else {
                current = stack.pop();
            }
        }
    }

    // --- Drawing Functions (Unchanged) ---
    function drawMaze() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < mazeHeight; y++) {
            for (let x = 0; x < mazeWidth; x++) {
                const cell = maze[y][x];
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                if (cell.top) { ctx.beginPath(); ctx.moveTo(x * cellSize, y * cellSize); ctx.lineTo((x + 1) * cellSize, y * cellSize); ctx.stroke(); }
                if (cell.right) { ctx.beginPath(); ctx.moveTo((x + 1) * cellSize, y * cellSize); ctx.lineTo((x + 1) * cellSize, (y + 1) * cellSize); ctx.stroke(); }
                if (cell.bottom) { ctx.beginPath(); ctx.moveTo((x + 1) * cellSize, (y + 1) * cellSize); ctx.lineTo(x * cellSize, (y + 1) * cellSize); ctx.stroke(); }
                if (cell.left) { ctx.beginPath(); ctx.moveTo(x * cellSize, (y + 1) * cellSize); ctx.lineTo(x * cellSize, y * cellSize); ctx.stroke(); }
            }
        }
    }

    function drawPlayer() {
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(player.x * cellSize + cellSize / 2, player.y * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawNPC() {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(npc.x * cellSize + cellSize / 2, npc.y * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawTreasure() {
        ctx.fillStyle = 'gold';
        ctx.beginPath();
        ctx.arc(treasure.x * cellSize + cellSize / 2, treasure.y * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(treasure.x * cellSize + cellSize / 2, treasure.y * cellSize + cellSize / 2, cellSize / 3 + 3, 0, Math.PI * 2);
        ctx.stroke();
    }

    function drawGame() {
        drawMaze();
        drawTreasure();
        drawPlayer();
        drawNPC();
    }

    // --- Pathfinding (Unchanged) ---
    function findShortestPath(start, end) {
        const queue = [{ x: start.x, y: start.y, path: [] }];
        const visited = new Set();
        visited.add(`${start.x},${start.y}`);

        while (queue.length > 0) {
            const { x, y, path } = queue.shift();

            if (x === end.x && y === end.y) {
                return path;
            }

            const currentCell = maze[y][x];

            const possibleMoves = [
                { dx: 0, dy: -1, wallCheck: 'top' },
                { dx: 0, dy: 1, wallCheck: 'bottom' },
                { dx: -1, dy: 0, wallCheck: 'left' },
                { dx: 1, dy: 0, wallCheck: 'right' }
            ];

            for (const move of possibleMoves) {
                const nextX = x + move.dx;
                const nextY = y + move.dy;
                const nextCoord = `${nextX},${nextY}`;

                // Ensure nextX and nextY are within maze bounds before accessing maze[nextY][nextX]
                if (nextX >= 0 && nextX < mazeWidth && nextY >= 0 && nextY < mazeHeight &&
                    !currentCell[move.wallCheck] &&
                    !visited.has(nextCoord)) {

                    visited.add(nextCoord);
                    queue.push({ x: nextX, y: nextY, path: [...path, { x: nextX, y: nextY }] });
                }
            }
        }
        return null; // No path found
    }

    // --- NPC Movement (Modified for mistakes and speed) ---
    function moveNPC() {
        if (!gameActive || gameWon) {
            clearInterval(npcMoveInterval); // Stop NPC movement if game is inactive or won
            return;
        }

        let nextMove = null;
        let madeMistake = false;

        // Decide if NPC makes a mistake
        if (Math.random() < npcMistakeChance) {
            madeMistake = true;
            // Find all valid adjacent cells for the NPC
            const currentNPCCell = maze[npc.y][npc.x];
            const validAdjacentMoves = [];

            const potentialMoves = [
                { dx: 0, dy: -1, wallCheck: 'top', nextY: npc.y - 1, nextX: npc.x },
                { dx: 0, dy: 1, wallCheck: 'bottom', nextY: npc.y + 1, nextX: npc.x },
                { dx: -1, dy: 0, wallCheck: 'left', nextX: npc.x - 1, nextY: npc.y },
                { dx: 1, dy: 0, wallCheck: 'right', nextX: npc.x + 1, nextY: npc.y }
            ];

            for (const move of potentialMoves) {
                if (move.nextX >= 0 && move.nextX < mazeWidth &&
                    move.nextY >= 0 && move.nextY < mazeHeight &&
                    !currentNPCCell[move.wallCheck]) { // Check if wall exists
                    validAdjacentMoves.push({ x: move.nextX, y: move.nextY });
                }
            }

            if (validAdjacentMoves.length > 0) {
                // Pick a random valid adjacent move
                nextMove = validAdjacentMoves[Math.floor(Math.random() * validAdjacentMoves.length)];
                console.log("NPC made a mistake, moving to:", nextMove);
            } else {
                // No valid random moves (e.g., stuck in a dead end for random moves)
                // Fall back to shortest path if possible.
                madeMistake = false; // No mistake made if no valid random move was possible
            }
        }

        if (!madeMistake) {
            // If no mistake or no valid random move, follow shortest path
            if (npcPath.length > 0) {
                nextMove = npcPath.shift();
            } else {
                // NPC has no path (e.g., just reached treasure, or stuck).
                // Recalculate if it's not at the treasure.
                if (!(npc.x === treasure.x && npc.y === treasure.y)) {
                    npcPath = findShortestPath(npc, treasure);
                    if (npcPath && npcPath.length > 0) {
                        nextMove = npcPath.shift();
                    } else {
                        // Still no path, maybe truly stuck or treasure unreachable
                        console.warn("NPC path recalculation failed or NPC is stuck. Stopping NPC.");
                        clearInterval(npcMoveInterval); // Stop NPC from trying to move
                        return;
                    }
                } else {
                    // NPC is already at treasure, stop moving
                    clearInterval(npcMoveInterval);
                    return;
                }
            }
        }

        if (nextMove) {
            npc.x = nextMove.x;
            npc.y = nextMove.y;
            drawGame();
            // If NPC made a mistake, recalculate path immediately from new position
            // This ensures they get back on track after a random deviation.
            if (madeMistake) {
                npcPath = findShortestPath(npc, treasure);
            }
            checkWin(); // Check for win condition after every move
        }
    }


    // --- Win Condition (Modified to use overlay) ---
    function checkWin() {
        console.log(`checkWin called. Player: (${player.x},${player.y}) Treasure: (${treasure.x},${treasure.y}) NPC: (${npc.x},${npc.y})`);
        if (gameWon) {
            console.log("Game already won/lost, returning.");
            return; // Already won/lost, don't re-trigger
        }

        if (player.x === treasure.x && player.y === treasure.y) {
            console.log("!!! Player Reached Treasure !!! Triggering Game Over.");
            gameWon = true;
            gameActive = false;
            clearInterval(npcMoveInterval);
            document.removeEventListener('keydown', handleKeyPress);
            showGameOverOverlay('Player Wins!', 'You found the treasure first!', true); // Player wins
            return true;
        }
        if (npc.x === treasure.x && npc.y === treasure.y) {
            console.log("!!! NPC Reached Treasure !!! Triggering Game Over.");
            gameWon = true;
            gameActive = false;
            clearInterval(npcMoveInterval);
            document.removeEventListener('keydown', handleKeyPress);
            showGameOverOverlay('NPC Wins!', 'The treasure is lost! Try again.', false); // NPC wins
            return true;
        }
        console.log("No win condition met yet.");
        return false;
    }

    // --- Player Movement ---
    function handleKeyPress(event) {
        if (!gameActive || gameWon) return; // Only allow movement if game is active and not won

        let newX = player.x;
        let newY = player.y;
        const currentCell = maze[player.y][player.x];

        switch (event.key) {
            case 'ArrowUp':
                if (!currentCell.top) { newY--; }
                break;
            case 'ArrowDown':
                if (!currentCell.bottom) { newY++; }
                break;
            case 'ArrowLeft':
                if (!currentCell.left) { newX--; }
                break;
            case 'ArrowRight':
                if (!currentCell.right) { newX++; }
                break;
        }

        // Check if the new position is within bounds
        if (newX >= 0 && newX < mazeWidth && newY >= 0 && newY < mazeHeight) {
            player.x = newX;
            player.y = newY;
            drawGame();
            checkWin(); // Check for win condition after every move
        }
    }

    // --- Game Initialization & Countdown ---
    function setupGame() {
        console.log("setupGame called. Initializing new game state.");
        gameWon = false;
        gameActive = false; // Game is not active until countdown finishes
        clearGameMessage();
        updateGameStatus(''); // Clear general status message
        hideGameOverOverlay(); // Ensure overlay is hidden when setting up a new game

        player = { x: 0, y: 0 };
        npc = { x: mazeWidth - 1, y: mazeHeight - 1 };

        // Ensure treasure is in a cell and not on an edge if mazeWidth/Height are odd
        treasure = {
            x: Math.floor(mazeWidth / 2),
            y: Math.floor(mazeHeight / 2)
        };

        generateMaze(); // Generate a new maze

        // IMPORTANT: Check for valid maze dimensions here before trying to use it
        if (mazeHeight === 0 || mazeWidth === 0 || !maze || maze.length === 0) {
            console.error("Maze dimensions are invalid or maze is empty after generation. Cannot proceed.");
            showGameMessage("Error: Maze generation failed. Please refresh.", "red");
            return;
        }

        // Calculate NPC path, if not found, regenerate maze (with retry logic)
        npcPath = findShortestPath(npc, treasure);
        pathRecalculationAttempts = 0; // Reset attempts counter for a new game
        while (!npcPath && pathRecalculationAttempts < 5) { // Try up to 5 times to generate a solvable maze
            console.warn(`NPC path to treasure not found (Attempt ${pathRecalculationAttempts + 1}), regenerating maze...`);
            generateMaze();
            npcPath = findShortestPath(npc, treasure);
            pathRecalculationAttempts++;
        }
        if (!npcPath) {
            console.error("Failed to generate a solvable maze after multiple attempts. Please check maze generation logic.");
            showGameMessage("Error: Could not generate a solvable maze. Please refresh.", "red");
            // You might want to disable game controls or show an error screen here
            return;
        }
        console.log("Maze and paths ready.");
        drawGame(); // Draw the maze and entities in their starting positions
    }

    function startCountdown() {
        console.log('startCountdown called!');
        showScreen(gameScreen); // Ensure game screen is active
        setupGame(); // Ensure game is set up before countdown starts
        document.removeEventListener('keydown', handleKeyPress); // Disable player input during countdown

        let count = 3; // Reduced countdown for quicker restart
        countdownDisplay.style.display = 'block'; // Show countdown element
        countdownDisplay.textContent = count;

        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownDisplay.textContent = count;
            } else if (count === 0) {
                countdownDisplay.textContent = 'GO!';
            } else {
                clearInterval(countdownInterval);
                countdownDisplay.style.display = 'none'; // Hide countdown element
                startRace(); // Start the actual race
            }
        }, 1000); // Update every 1 second
    }

    function startRace() {
        console.log('Race starting!');
        gameActive = true; // Enable game logic
        updateGameStatus('Race the Red NPC to the Gold Treasure!');
        document.addEventListener('keydown', handleKeyPress); // Re-enable player input
        clearInterval(npcMoveInterval); // Clear any old interval first to prevent multiple intervals
        npcMoveInterval = setInterval(moveNPC, npcMoveSpeed); // Use NPC move speed variable
    }

    // --- Event Listeners ---
    startGameButton.addEventListener('click', () => {
        showScreen(rulesScreen);
    });

    backToTitleButton.addEventListener('click', () => {
        showScreen(titleScreen);
    });

    startRaceButton.addEventListener('click', () => {
        startCountdown(); // This now effectively starts a new game after rules
    });

    // NEW: Function for starting a new game (from game screen or overlay)
    function handleNewGame() {
        console.log("New game requested.");
        clearInterval(npcMoveInterval); // Stop NPC if running
        document.removeEventListener('keydown', handleKeyPress); // Remove player key listener
        hideGameOverOverlay(); // Hide overlay
        clearGameMessage(); // Clear any previous game messages
        updateGameStatus(''); // Clear status
        countdownDisplay.style.display = 'none'; // Ensure countdown is hidden if it was showing

        // Directly start countdown for a new game without going to title/rules
        startCountdown();
    }

    startNewGameButton.addEventListener('click', handleNewGame); // "Start New Game" button on game screen
    playAgainButton.addEventListener('click', handleNewGame); // "Play Again" button on overlay

    overlayBackToTitleButton.addEventListener('click', () => {
        console.log("Back to Title requested from overlay.");
        clearInterval(npcMoveInterval); // Stop NPC if running
        document.removeEventListener('keydown', handleKeyPress); // Remove player key listener
        hideGameOverOverlay(); // Hide overlay
        showScreen(titleScreen); // Go back to title
    });


    // --- Initial setup (show title screen on page load) ---
    showScreen(titleScreen);
}); // End of DOMContentLoaded