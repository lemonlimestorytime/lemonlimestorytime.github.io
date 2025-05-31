// Import all necessary constants and functions from your modules
import {
    SCREEN_WIDTH, SCREEN_HEIGHT,
    GAME_STATE_TITLE_SCREEN, GAME_STATE_AIMING_POSITION, GAME_STATE_AIMING_POWER, GAME_STATE_THROWN,
    GAME_STATE_SCORE_DISPLAY, GAME_STATE_GAME_OVER,
    INITIAL_BALL_Y, BALL_RADIUS, LANE_LEFT_EDGE, LANE_RIGHT_EDGE,
    THROW_SPEED_FACTOR, THROW_MAX_SPEED_Y, THROW_CURVE_FACTOR
} from './constants.js';

import { createBall, resetPins } from './gameElements.js';
import { updateBallAndPinsPhysics, checkSettled, countStandingPins, markMovedPinsAsDown } from './gamePhysics.js';
import { calculateFullGameScoreFromRolls } from './scoreManager.js';
import {
    drawLane, drawBall, drawPins, drawAimingInstructions,
    drawTitleScreen,
    drawScoreboard, drawScoreOverlay, drawGameOverScreen
} from './drawingUtils.js';


function getMousePos(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

// --- Game Initialization ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;

// --- Game State Variables (equivalent to Python's global variables) ---
let ball;
let pins;
let currentFrame;
let rollsInCurrentFrame;
let gameFrames; // List to store frame scores, e.g., [[7, 2], [10], [5, 5]]
let pinsStandingAtStartOfRoll;

let gameState = GAME_STATE_TITLE_SCREEN;
//let gameState;

// Mouse state for aiming (global to be accessible by event listeners and drawing)
let holdingMouse = false; // This will now primarily be for the *power* drag
let mouseDownY = 0; // This should now store CANVAS Y coordinate
// Global mouse coordinates for aiming line drawing
window.mouseX = 0;
window.mouseY = 0;
// Removed lastMouseX as it's no longer used for ball movement in AIMING_POSITION

// Score display variables
let pinsStandingBeforeThisThrow = 10; 
let pinsKnockedThisThrow = 0;
let displayScoreOverlay = false;

let running = true; // Controls the game loop

/**
 * Resets all game variables to start a new game.
 */
function resetGame() {
    ball = createBall();
    // Ensure initial ball position is reset to center of screen at start Y
    ball.x = SCREEN_WIDTH / 2; // Ball starts centered for a new game
    ball.y = INITIAL_BALL_Y;
    ball.aim_x_start = ball.x; // Reset aiming start

    pins = resetPins();
    currentFrame = 1;
    rollsInCurrentFrame = 0;
    gameFrames = [];
    pinsStandingAtStartOfRoll = 10;
    gameState = GAME_STATE_AIMING_POSITION; // Start in X-position selection
    holdingMouse = false;
    mouseDownY = 0;
    pinsKnockedThisThrow = 0;
    displayScoreOverlay = false;
    running = true; // Ensure game loop continues

    window.mouseX = ball.x; // Cursor starts over the ball
    window.mouseY = INITIAL_BALL_Y; // Cursor starts near the ball

    // Removed lastMouseX initialization as it's no longer directly moving the ball in AIMING_POSITION
    console.log("resetGame called. Initial gameState:", gameState, "ball.moving:", ball.moving);
}

// --- Event Listeners (equivalent to Pygame's event loop) ---

// Mouse Down Event
canvas.addEventListener('mousedown', (event) => {
    console.log("mousedown. Current gameState:", gameState, "holdingMouse:", holdingMouse, "event.button:", event.button);
    // Only left click (event.button === 0)
    if (event.button === 0) {
        if (gameState === GAME_STATE_TITLE_SCREEN) {
            resetGame(); // Start the game when clicking from the title screen
            console.log("Transitioned from title screen to GAME_STATE_AIMING_POSITION.");
            return; // Exit to prevent further processing in this mousedown
        }

        const mouseCanvasCoords = getMousePos(canvas, event); // Get canvas coordinates of click
 
        if (gameState === GAME_STATE_AIMING_POSITION) {
            // Player clicks to set the X position of the ball
            // Get mouse X relative to canvas
            const mouseX = event.clientX - canvas.getBoundingClientRect().left;

            // Clamp the ball's X position to lane boundaries
            ball.x = Math.max(LANE_LEFT_EDGE + BALL_RADIUS,
                              Math.min(LANE_RIGHT_EDGE - BALL_RADIUS, mouseX));
            
            ball.y = INITIAL_BALL_Y; // Ball's Y is fixed at the start
            ball.in_gutter = false;
            ball.velocity_x = 0;
            ball.velocity_y = 0;

            // Now transition to the power/curve aiming phase
            holdingMouse = true; // Now holding to drag for power
            mouseDownY = event.clientY; // Record initial Y for power calculation
            ball.aim_x_start = ball.x; // Store the ball's X position for flick calculation (this will be the 'pivot' for curve)
            gameState = GAME_STATE_AIMING_POWER; // Transition to power/curve aiming
            window.mouseX = mouseCanvasCoords.x; // Use the canvas X from the click
            window.mouseY = mouseCanvasCoords.y; // Use the canvas Y from the click

            console.log("Ball position set to:", ball.x);
            console.log("Transitioned to GAME_STATE_AIMING_POWER. Initial window.mouseX:", window.mouseX); // For debugging
 

        } else if (gameState === GAME_STATE_AIMING_POWER) {
            // This case handles the actual "throw" after the initial X position is set.
            // However, for a *click-to-throw* (not drag), you'd handle it here.
            // Since you're asking to "click a point... then throw it", it implies a drag for power.
            // So, this mousedown in AIMING_POWER sets up the drag for power/curve.
            // The actual throw calculation will happen on mouseup.
            holdingMouse = true;
            mouseDownY = event.clientY;
            ball.aim_x_start = ball.x; // Ensure this is the fixed X position chosen by the first click
            console.log("Started drag for power in GAME_STATE_AIMING_POWER.");


        } else if (gameState === GAME_STATE_SCORE_DISPLAY) {
            // Player clicked to continue after score display
            displayScoreOverlay = false; // Hide the overlay

            let transitionToNewFrame = false;
            let transitionToGameOver = false;
            let resetPinsForBonus = false; // Flag to reset pins for a bonus roll in frame 10

            // Determine if frame/game is complete to decide next step
            if (currentFrame < 10) {
                const prevFrameData = gameFrames[currentFrame - 1];
                if ((prevFrameData.length === 1 && prevFrameData[0] === 10) || // Strike
                    (prevFrameData.length === 2)) { // Spare or Open Frame after 2 rolls
                    transitionToNewFrame = true;
                }
            } else { // currentFrame === 10 (the 10th frame)
                const frame10Data = gameFrames[9] || [];
                const numRollsFrame10 = frame10Data.length;
                const pinsTotalFrame10 = frame10Data.reduce((sum, roll) => sum + roll, 0);
                
                // Check for bonus situation in frame 10 (needs new set of pins)
                if (numRollsFrame10 === 1 && frame10Data[0] === 10) { // Strike on 1st roll (needs 2 bonus)
                    resetPinsForBonus = true;
                } else if (numRollsFrame10 === 2 && pinsTotalFrame10 === 10) { // Spare on 2nd roll (needs 1 bonus)
                    resetPinsForBonus = true;
                }

                // Game over conditions for frame 10
                if (numRollsFrame10 === 3 || // 3 rolls are done
                    (numRollsFrame10 === 2 && pinsTotalFrame10 < 10)) // 2 rolls done, no bonus earned
                {
                    transitionToGameOver = true;
                }
            }
                        
            if (transitionToGameOver) {
                gameState = GAME_STATE_GAME_OVER;
                console.log("Transitioned to GAME_STATE_GAME_OVER.");
                // No need to reset ball/pins here, game is over.
            } else {
                // If not game over, proceed to next roll or next frame
                if (transitionToNewFrame) { // Starting a completely new frame
                    currentFrame++;
                    rollsInCurrentFrame = 0;
                    pins = resetPins(); // Reset all 10 pins for a new frame
                    pinsStandingAtStartOfRoll = 10; // Reset for new frame
                    console.log("Transitioned to new frame. Pins reset.");
                } else if (resetPinsForBonus) { // Only for Frame 10 bonus rolls after strike/spare
                    pins = resetPins(); // Reset all 10 pins for the bonus roll
                    pinsStandingAtStartOfRoll = 10; // Reset for bonus roll
                    console.log("Reset pins for bonus roll in Frame 10.");
                } else { // It's a second roll in an open frame (not strike/spare in previous roll)
                    // Pins remain as they were after the first roll.
                    // pinsStandingAtStartOfRoll already updated by previous logic.
                    console.log("Preparing for second roll in current frame.");
                }

                // Create a new ball object for the next throw
                ball = createBall(); // createBall() by default sets ball.x to SCREEN_WIDTH / 2
                ball.y = INITIAL_BALL_Y;
                // Important: Resetting aim_x_start for the *next* x-position selection
                ball.aim_x_start = ball.x; 
                gameState = GAME_STATE_AIMING_POSITION; // Go back to initial horizontal aiming
 
                window.mouseX = ball.x; // Cursor starts over the ball
                window.mouseY = INITIAL_BALL_Y; // Cursor starts near the ball
 
                console.log("Ball reset for next throw. Transitioned to GAME_STATE_AIMING_POSITION.");
            }
        }
        // No action for MOUSEBUTTONDOWN if in GAME_STATE_GAME_OVER
    }
});

// Mouse Up Event
canvas.addEventListener('mouseup', (event) => {
    if (event.button === 0 && holdingMouse) {
        holdingMouse = false;
        if (gameState === GAME_STATE_AIMING_POWER) {
            const mouseCanvasCoords = getMousePos(canvas, event);

            const rawSpeed = (mouseDownY - mouseCanvasCoords.y); // Vertical drag (canvas Y)
            const rawCurve = (mouseCanvasCoords.x - ball.aim_x_start); // Horizontal drag (canvas X)

            const MIN_DRAG_THRESHOLD_Y = 5;
            const MIN_DRAG_THRESHOLD_X = 5;

            // Check if enough drag occurred to register a throw
            if (Math.abs(rawSpeed) < MIN_DRAG_THRESHOLD_Y && Math.abs(rawCurve) < MIN_DRAG_THRESHOLD_X) {
                console.log("Not enough drag, cancelling throw and returning to aiming position.");
                gameState = GAME_STATE_AIMING_POSITION;
                // Reset window.mouseX/Y when cancelling for consistent visual in AIMING_POSITION
                window.mouseX = ball.x;
                window.mouseY = INITIAL_BALL_Y;
                return; // Exit function, no throw
            }

            // --- CRITICAL: Calculate ball velocities using the new THROW_ constants ---
            ball.velocity_y = -Math.min(rawSpeed * THROW_SPEED_FACTOR, THROW_MAX_SPEED_Y);
            ball.velocity_x = rawCurve * THROW_CURVE_FACTOR;
            // --- END CRITICAL ---

            ball.moving = true;
            gameState = GAME_STATE_THROWN;
        }
    }
});

// Mouse Move Event
canvas.addEventListener('mousemove', (event) => {
    // Update global mouse coordinates for drawing functions
    const mouseCanvasCoords = getMousePos(canvas, event);
    window.mouseX = mouseCanvasCoords.x;
    window.mouseY = mouseCanvasCoords.y;
});

// Keyboard Down Event
window.addEventListener('keydown', (event) => {
    console.log("keydown. Key:", event.key, "Current gameState:", gameState);
    if (event.key === ' ' && gameState === GAME_STATE_GAME_OVER) { // Spacebar
        console.log("Game Over! Resetting entire game with Spacebar.");
        resetGame();
        // The game loop (animate) is already running, no need to call it again.
    }
});

// --- Game Loop (equivalent to Pygame's while running loop) ---
function animate() {
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT); // Always clear the canvas

    if (gameState === GAME_STATE_TITLE_SCREEN) {
        drawTitleScreen(ctx);
    } else if (gameState === GAME_STATE_AIMING_POSITION || gameState === GAME_STATE_AIMING_POWER) {
        // Drawing for states where the ball is static and player is aiming
        drawLane(ctx);
        drawPins(ctx, pins);
        drawBall(ctx, ball); // Ball is visible for aiming
        drawAimingInstructions(ctx, gameState, ball, mouseDownY, ball.aim_x_start);
        drawScoreboard(ctx, gameFrames); // Scoreboard always visible
    } else if (gameState === GAME_STATE_THROWN) {
        // Drawing for when the ball is in motion
        updateBallAndPinsPhysics(ball, pins); // Logic updates for thrown state

        drawLane(ctx);
        drawPins(ctx, pins);
        drawBall(ctx, ball); // Ball is visible while moving
        drawScoreboard(ctx, gameFrames); // Scoreboard always visible

        // Check if settled (this will change gameState to SCORE_DISPLAY)
        if (checkSettled(ball, pins)) {
            // ... (your existing logic for settling, scoring, and transitioning) ...
            ball.moving = false;
            ball.in_gutter = false;
            ball.velocity_x = 0;
            ball.velocity_y = 0;
            const currentPinsStandingAfterRoll = countStandingPins(pins);
            let pinsKnockedDownThisRoll = pinsStandingAtStartOfRoll - currentPinsStandingAfterRoll;
            if (pinsKnockedDownThisRoll < 0) { pinsKnockedDownThisRoll = 0; }
            markMovedPinsAsDown(pins);
            pinsStandingAtStartOfRoll = currentPinsStandingAfterRoll;
            while (gameFrames.length < currentFrame) { gameFrames.push([]); }
            gameFrames[currentFrame - 1].push(pinsKnockedDownThisRoll);
            rollsInCurrentFrame = gameFrames[currentFrame - 1].length;
            pinsKnockedThisThrow = pinsKnockedDownThisRoll;
            gameState = GAME_STATE_SCORE_DISPLAY;
            displayScoreOverlay = true;
            console.log("Ball settled. Transitioned to GAME_STATE_SCORE_DISPLAY.");
        }
    } else if (gameState === GAME_STATE_SCORE_DISPLAY) {
        // Drawing for score display overlay
        drawLane(ctx);
        drawPins(ctx, pins); // Pins are still visible
        drawBall(ctx, ball); // Ball might be drawn at rest
        drawScoreboard(ctx, gameFrames);
        drawScoreOverlay(ctx, pinsKnockedThisThrow, gameState);
    } else if (gameState === GAME_STATE_GAME_OVER) {
        // Drawing for game over screen
        // You might still want to draw the scoreboard for final score
        drawScoreboard(ctx, gameFrames);
        const allRollsFlat = gameFrames.flat();
        const finalGameScore = calculateFullGameScoreFromRolls(allRollsFlat);
        drawGameOverScreen(ctx, finalGameScore);
    }

    if (running) {
        requestAnimationFrame(animate);
    }
}

// Start the game when the window loads
window.onload = function() {
    // No need to call resetGame() here directly, as the initial gameState is TITLE_SCREEN
    animate(); // Start the game loop, which will draw the title screen first
};