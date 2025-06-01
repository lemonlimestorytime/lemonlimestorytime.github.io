// puzzle_main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const startScreen = document.getElementById('start-screen');
    const rulesScreen = document.getElementById('rules-screen');
    const gameContainer = document.getElementById('game-container'); // Overall game area
    const puzzleContainer = document.getElementById('puzzle-container');
    // Removed: const scrambleButton = document.getElementById('scramble-button'); // This button is removed
    const resetGameButton = document.getElementById('resetGameButton'); // Now effectively "New Game / Reset"
    const giveUpButton = document.getElementById('giveUpButton');
    const messageDisplay = document.getElementById('message-display');

    // Updated: timerDisplay and movesDisplay are now separate spans
    const timerDisplay = document.getElementById('timer-display');
    const movesDisplay = document.getElementById('moves-display'); // For the moves counter

    // Overlays
    const completionOverlay = document.getElementById('completion-overlay');
    const finalTimeDisplay = document.getElementById('final-time');
    const playNewGameButton = document.getElementById('playNewGameButton');
    const giveUpOverlay = document.getElementById('give-up-overlay');
    const giveUpMessage = document.getElementById('give-up-message');
    const tryAgainButton = document.getElementById('tryAgainButton');

    // --- Game State Variables ---
    const gridSize = 3; // e.g., 3x3 grid
    let tiles = []; // Represents the actual values of the tiles in their current positions
    let emptyTileIndex; // The index of the missing tile (the "empty space")
    let puzzleTileElements = []; // Stores references to the actual HTML div elements

    let timerInterval;
    let startTime;
    let elapsedTime = 0;
    let gameActive = false; // To control game interactions

    let slideCount = 0; // To track the number of slides

    // --- Game State Transitions ---

    function showScreen(screenToShow) {
        // Hide all main screens
        startScreen.classList.add('hidden');
        rulesScreen.classList.add('hidden');
        gameContainer.classList.add('hidden');

        // Hide overlays by removing their 'active' class (CSS handles default hidden state)
        completionOverlay.classList.remove('active');
        giveUpOverlay.classList.remove('active');

        // Show the requested screen
        screenToShow.classList.remove('hidden');
    }

    function showStartScreen() {
        showScreen(startScreen);
        messageDisplay.textContent = ''; // Clear any previous messages
    }

    function showRulesScreen() {
        showScreen(rulesScreen);
    }

    function showGameScreen() {
        showScreen(gameContainer);
    }

    function showCompletionOverlay() {
        gameActive = false; // Stop game interactions
        completionOverlay.classList.add('active'); // Activate the overlay
        finalTimeDisplay.textContent = `Time: ${formatTime(elapsedTime)} | Moves: ${slideCount}`; // Include moves in final display
    }

    function showGiveUpOverlay() {
        gameActive = false; // Stop game interactions
        stopTimer();
        giveUpOverlay.classList.add('active'); // Activate the overlay
        giveUpMessage.textContent = "Sorry, but try again later.";
    }

    // --- Timer Functions ---

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval); // Clear any existing timer
        startTime = Date.now();
        timerInterval = setInterval(updateTimerDisplay, 1000); // Update every second
        console.log("Timer started.");
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        console.log("Timer stopped.");
    }

    function resetTimer() {
        stopTimer();
        elapsedTime = 0;
        timerDisplay.textContent = "Time: 00:00";
        console.log("Timer reset.");
    }

    function updateTimerDisplay() {
        elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        timerDisplay.textContent = "Time: " + formatTime(elapsedTime);
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');
        return `${formattedMinutes}:${formattedSeconds}`;
    }

    // --- Moves Counter Functions ---
    function resetSlideCount() {
        slideCount = 0;
        movesDisplay.textContent = "Moves: 0";
        console.log("Slide counter reset.");
    }

    function incrementSlideCount() {
        slideCount++;
        movesDisplay.textContent = "Moves: " + slideCount;
    }

    // --- Game Initialization ---

    function initializeGame() {
        console.log("initializeGame: Starting new game setup.");
        puzzleContainer.innerHTML = ''; // Clear any existing tiles
        puzzleTileElements = []; // Clear references to old HTML elements
        resetTimer(); // Reset timer for new game
        resetSlideCount(); // Reset slide count for new game
        messageDisplay.textContent = ''; // Clear messages

        // Initialize the 'tiles' array with values 0 to (N*N - 1) in solved order
        tiles = [];
        for (let i = 0; i < gridSize * gridSize; i++) {
            tiles.push(i);
        }
        emptyTileIndex = tiles.length - 1; // The last tile value is considered the empty space

        createPuzzleTiles(); // Creates the HTML elements and appends them
        scramblePuzzle();    // Scrambles the internal array and updates the display
        showGameScreen();    // Show the game screen
        gameActive = true;   // Enable game interactions
        startTimer();        // Start the timer
        console.log("initializeGame: Finished setup.");
    }

    function createPuzzleTiles() {
        console.log("createPuzzleTiles: Creating HTML elements.");
        for (let i = 0; i < tiles.length; i++) {
            const tile = document.createElement('div');
            tile.classList.add('puzzle-tile');
            // Store its original value (0 to N*N-1) for checking solution later
            tile.dataset.value = tiles[i];

            // Set initial text content (1 to N*N, or empty for the last tile)
            if (tiles[i] === tiles.length - 1) {
                tile.classList.add('empty-tile');
                tile.textContent = '';
            } else {
                tile.textContent = tiles[i] + 1;
            }

            // Crucial: Set the initial order based on its original position (0 to N*N-1)
            // This ensures the tiles are laid out correctly in the grid initially.
            tile.style.order = i; // The initial order is based on its creation index

            tile.addEventListener('click', handleTileClick);
            puzzleContainer.appendChild(tile);
            puzzleTileElements.push(tile); // Store reference to the created HTML element
        }
    }

    // --- Game Logic ---

    function handleTileClick(event) {
        if (!gameActive) return; // Prevent clicks if game is not active

        const clickedTile = event.target;
        // Find the index of the clicked tile in the current visual arrangement
        // We need to find its 'order' value, which corresponds to its 'tiles' array value
        const clickedValue = parseInt(clickedTile.dataset.value); // Get its original value
        let clickedIndexInTilesArray = -1;
        for(let i = 0; i < tiles.length; i++) {
            if (tiles[i] === clickedValue) {
                clickedIndexInTilesArray = i;
                break;
            }
        }

        if (clickedIndexInTilesArray === -1) {
            console.error("Clicked tile value not found in internal tiles array.");
            return;
        }

        if (isMovable(clickedIndexInTilesArray)) {
            swapTiles(clickedIndexInTilesArray, emptyTileIndex);
            incrementSlideCount(); // Increment slide count on valid move
            renderPuzzle(); // Update graphics after a valid move
            checkWinCondition();
        } else {
            showMessage("That tile cannot be moved.");
        }
    }

    function isMovable(clickedIndex) {
        const rowClicked = Math.floor(clickedIndex / gridSize);
        const colClicked = clickedIndex % gridSize;
        const rowEmpty = Math.floor(emptyTileIndex / gridSize);
        const colEmpty = emptyTileIndex % gridSize;

        // Check if adjacent (horizontally or vertically)
        const isHorizontalMove = rowClicked === rowEmpty && Math.abs(colClicked - colEmpty) === 1;
        const isVerticalMove = colClicked === colEmpty && Math.abs(rowEmpty - rowClicked) === 1;

        return isHorizontalMove || isVerticalMove;
    }

    function swapTiles(index1, index2) {
        // Swap values in the internal `tiles` array
        [tiles[index1], tiles[index2]] = [tiles[index2], tiles[index1]];

        // Update the `emptyTileIndex` to the new position of the empty space
        emptyTileIndex = index1; // The previously clicked tile's position is now the empty space
    }

    function renderPuzzle() {
        if (puzzleTileElements.length === 0) {
            console.error("  ERROR: renderPuzzle: No stored .puzzle-tile elements! Cannot proceed with render.");
            return;
        }
        if (puzzleTileElements.length !== tiles.length) {
            console.warn("  WARNING: renderPuzzle: Mismatch! HTML elements count (" + puzzleTileElements.length + ") doesn't match internal array size (" + tiles.length + ").");
        }

        for (let i = 0; i < tiles.length; i++) {
            const tileValue = tiles[i];
            const tileElement = puzzleTileElements.find(el => parseInt(el.dataset.value) === tileValue);

            if (!tileElement) {
                console.error(`    ERROR: HTML element for tile value ${tileValue} not found!`);
                continue;
            }
            tileElement.textContent = (tileValue === tiles.length - 1) ? '' : tileValue + 1;
            tileElement.classList.toggle('empty-tile', tileValue === tiles.length - 1);
            tileElement.style.order = i;
        }
    }

    function scramblePuzzle() {
        console.log("scramblePuzzle: Scrambling internal array.");
        // Perform a series of random valid moves to scramble the puzzle.
        // This ensures the puzzle is always solvable.
        // During scramble, DO NOT increment slideCount
        for (let i = 0; i < 500; i++) { // Perform many random moves
            const movableIndices = [];
            for (let j = 0; j < tiles.length; j++) {
                if (isMovable(j)) {
                    movableIndices.push(j);
                }
            }
            if (movableIndices.length > 0) {
                const randomIndex = Math.floor(Math.random() * movableIndices.length);
                const tileToMoveIndex = movableIndices[randomIndex];
                swapTiles(tileToMoveIndex, emptyTileIndex); // swapTiles updates emptyTileIndex
            }
        }
        // resetSlideCount(); // Already done by initializeGame, so this is redundant here.

        console.log("scramblePuzzle: Internal array after scramble:", tiles);
        renderPuzzle(); // Render the scrambled state
        showMessage("Puzzle scrambled!");
    }

    function checkWinCondition() {
        let isSolved = true;
        for (let i = 0; i < tiles.length; i++) {
            // Check if the value at each position is its correct, ordered index
            if (tiles[i] !== i) {
                isSolved = false;
                break;
            }
        }
        if (isSolved) {
            stopTimer(); // Stop the timer on win
            showMessage("Congratulations! You solved the puzzle!");
            showCompletionOverlay(); // Show completion overlay
            gameActive = false; // Disable clicks after win
        }
    }

    function showMessage(message) {
        messageDisplay.textContent = message;
        // Optionally clear message after a few seconds
        if (messageTimeout) clearTimeout(messageTimeout);
        messageTimeout = setTimeout(() => {
            messageDisplay.textContent = '';
        }, 3000);
    }
    let messageTimeout; // Declare this outside for consistent use

    // --- Event Listeners ---

    // Initial game flow buttons
    document.getElementById('startButton').addEventListener('click', showRulesScreen);
    document.getElementById('playNowButton').addEventListener('click', initializeGame);

    // In-game controls
    // Removed: scrambleButton.addEventListener('click', initializeGame);
    resetGameButton.addEventListener('click', initializeGame); // This now acts as the "New Game / Reset"
    giveUpButton.addEventListener('click', showGiveUpOverlay);

    // Overlay buttons
    playNewGameButton.addEventListener('click', () => {
        completionOverlay.classList.remove('active'); // Hide overlay
        initializeGame(); // Start a new game
    });

    tryAgainButton.addEventListener('click', () => {
        giveUpOverlay.classList.remove('active'); // Hide overlay
        initializeGame(); // Start a new game
    });


    // Initialize the game when the page loads (start at the start screen)
    showStartScreen();
});