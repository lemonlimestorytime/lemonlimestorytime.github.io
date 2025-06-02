document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const orderList = document.getElementById('current-order-list');
    const ingredientsTray = document.getElementById('ingredients-tray');
    const burgerStack = document.getElementById('burger-stack');
    const serveButton = document.getElementById('serve-button');
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreDisplay = document.getElementById('final-score');
    const restartButton = document.getElementById('restart-button');

    // Screen elements
    const titleScreen = document.getElementById('title-screen');
    const rulesScreen = document.getElementById('rules-screen');
    const gameContainer = document.getElementById('game-container'); // Reference to the main game area wrapper

    // Buttons for navigation
    const showRulesButton = document.getElementById('show-rules-button'); // On title screen (now "Start Game")
    // const skipRulesButton = document.getElementById('skip-rules-button'); // REMOVED: No longer needed
    const startGameButton = document.getElementById('start-game-button'); // On rules screen (now the main "Start Game!")
    const backToTitleButton = document.getElementById('back-to-title-button'); // On rules screen


    let score = 0;
    let timeLeft = 60; // seconds
    let timerInterval;
    let currentOrder = [];
    let assembledBurger = [];

    const allIngredients = [
        "bottom-bun", "patty", "cheese", "lettuce", "tomato", "top-bun",
        "bacon", "onion", "pickles", "ketchup", "mustard", "egg"
    ];

    const recipes = [
        ["bottom-bun", "patty", "cheese", "lettuce", "tomato", "top-bun"],
        ["bottom-bun", "patty", "cheese", "top-bun"],
        ["bottom-bun", "patty", "bacon", "cheese", "lettuce", "top-bun"],
        ["bottom-bun", "lettuce", "tomato", "onion", "pickles", "top-bun"],
        ["bottom-bun", "patty", "cheese", "onion", "pickles", "ketchup", "mustard", "lettuce", "tomato", "top-bun"],
        ["bottom-bun", "patty", "egg", "bacon", "cheese", "top-bun"],
        ["bottom-bun", "patty", "cheese", "patty", "cheese", "top-bun"],
        ["bottom-bun", "patty", "ketchup", "top-bun"],
        ["bottom-bun", "patty", "bacon", "egg", "lettuce", "tomato", "ketchup", "top-bun"]
    ];

    // --- Game Flow Functions ---

    function showScreen(screenElement) {
        // Hide all major screens
        titleScreen.classList.add('hidden');
        rulesScreen.classList.add('hidden');
        gameContainer.classList.add('hidden');
        gameOverScreen.classList.add('hidden');

        // Show the requested screen
        screenElement.classList.remove('hidden');
    }

    function startGame() {
        score = 0;
        timeLeft = 60;
        assembledBurger = [];
        updateScore();
        updateTimer();
        
        showScreen(gameContainer); // Show the main game area (which includes the H1 title)

        burgerStack.innerHTML = ''; // Clear previous burger

        clearInterval(timerInterval); // Clear any existing timer
        timerInterval = setInterval(countdown, 1000);

        generateNewOrder();
        addIngredientListeners();
    }

    function countdown() {
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) {
            endGame();
        }
    }

    function updateScore() {
        scoreDisplay.textContent = score;
    }

    function updateTimer() {
        timerDisplay.textContent = timeLeft;
    }

    function generateNewOrder() {
        const randomIndex = Math.floor(Math.random() * recipes.length);
        currentOrder = recipes[randomIndex];
        displayOrder();
    }

    function displayOrder() {
        orderList.innerHTML = '';
        currentOrder.forEach(ingredient => {
            const li = document.createElement('li');
            li.textContent = ingredient.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            orderList.appendChild(li);
        });
    }

    function addIngredientListeners() {
        document.querySelectorAll('.ingredient-item').forEach(ingredientItemDiv => {
            ingredientItemDiv.onclick = () => {
                if (timeLeft <= 0) return;
                const ingredientType = ingredientItemDiv.querySelector('.ingredient').dataset.ingredient;
                addIngredientToBurger(ingredientType);
            };
        });
    }

    function addIngredientToBurger(ingredientType) {
        assembledBurger.push(ingredientType);
        const assembledDiv = document.createElement('div');
        assembledDiv.classList.add('assembled-ingredient');
        assembledDiv.dataset.ingredient = ingredientType;
        const trayIngredientStyle = getComputedStyle(document.querySelector(`.ingredient[data-ingredient="${ingredientType}"]`));
        assembledDiv.style.backgroundColor = trayIngredientStyle.backgroundColor;
        burgerStack.appendChild(assembledDiv);
        console.log("Assembled:", assembledBurger);
    }

    function serveBurger() {
        if (assembledBurger.length === 0) {
            alert("You haven't made a burger yet!");
            return;
        }

        let isCorrect = true;
        if (assembledBurger.length !== currentOrder.length) {
            isCorrect = false;
        } else {
            for (let i = 0; i < currentOrder.length; i++) {
                if (assembledBurger[i] !== currentOrder[i]) {
                    isCorrect = false;
                    break;
                }
            }
        }

        if (isCorrect) {
            score += 100;
            alert("Delicious! Order correct!");
        } else {
            score -= 50;
            alert("Oops! That's not right. Try again!");
        }

        updateScore();
        assembledBurger = [];
        burgerStack.innerHTML = '';
        generateNewOrder();
    }

    function endGame() {
        clearInterval(timerInterval);
        finalScoreDisplay.textContent = score;
        showScreen(gameOverScreen);
    }

    // --- Event Listeners ---
    serveButton.addEventListener('click', serveBurger);
    restartButton.addEventListener('click', startGame);

    // NEW: Navigation listeners for the new flow
    showRulesButton.addEventListener('click', () => showScreen(rulesScreen)); // "Start Game" on title goes to rules
    // skipRulesButton.addEventListener('click', startGame); // REMOVED: No longer needed
    startGameButton.addEventListener('click', startGame); // "Start Game!" on rules screen starts the game
    backToTitleButton.addEventListener('click', () => showScreen(titleScreen)); // "Back to Title" from rules

    // Initial state: Show the title screen when the page loads
    showScreen(titleScreen);
});