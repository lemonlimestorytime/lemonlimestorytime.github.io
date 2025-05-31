import {
    SCREEN_WIDTH, SCREEN_HEIGHT,
    LANE_LEFT_EDGE, LANE_RIGHT_EDGE, LANE_Y_END, LANE_Y_START, LANE_BOTTOM_Y, LANE_WIDTH, GUTTER_WIDTH,
    GUTTER_LEFT_X, GUTTER_RIGHT_X, // <-- Ensure these are imported
    BALL_RADIUS, PIN_RADIUS,
    WHITE, BLACK, GREEN, DARK_GREY, GREY, YELLOW,
    GAME_STATE_TITLE_SCREEN, GAME_STATE_AIMING_POSITION, GAME_STATE_AIMING_POWER, GAME_STATE_SCORE_DISPLAY, GAME_STATE_GAME_OVER,
    FONT_SIZE_SCORE_NORMAL, FONT_SIZE_INSTRUCTION, FONT_SIZE_POWER_TEXT, FONT_SIZE_SCOREBOARD_ROLL, FONT_SIZE_SCOREBOARD_FRAME,
    INITIAL_BALL_Y, THROW_SPEED_FACTOR, THROW_MAX_SPEED_Y, THROW_CURVE_FACTOR, AIM_LINE_LENGTH_SCALE,
    SCOREBOARD_Y_START, SCOREBOARD_HEIGHT, FRAME_BOX_WIDTH, ROLL_BOX_HEIGHT, FRAME_SCORE_BOX_HEIGHT
} from './constants.js';

import { calculateFullGameScoreFromRolls } from './scoreManager.js'; // Needed for game over screen

/**
 * Draws the title screen.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 */
export function drawTitleScreen(ctx) {
    // Background for the title screen
    ctx.fillStyle = 'rgba(0, 50, 0, 1)'; // Dark green background, or any color you prefer
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Title text
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'WHITE';
    ctx.fillText("Bowling Game", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50);

    // Instruction text
    ctx.font = '30px Arial';
    ctx.fillStyle = 'YELLOW';
    ctx.fillText("Click to Start", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 50);

    // Optional: Add more elements like credits, high scores, etc.
    ctx.font = '20px Arial';
    ctx.fillStyle = 'LIGHTGREY';
    ctx.fillText("Created by Lemon & Lime Games", SCREEN_WIDTH / 2, SCREEN_HEIGHT - 50);
}

/**
 * Draws the bowling lane and gutters on the canvas.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 */
export function drawLane(ctx) {
    // Draw left gutter
    ctx.fillStyle = DARK_GREY;
    // GUTTER_LEFT_X is used here:
    ctx.fillRect(GUTTER_LEFT_X, LANE_Y_END, GUTTER_WIDTH, LANE_Y_START - LANE_Y_END + 50);

    // Draw right gutter
    // GUTTER_RIGHT_X is used here:
    ctx.fillRect(LANE_RIGHT_EDGE, LANE_Y_END, GUTTER_WIDTH, LANE_Y_START - LANE_Y_END + 50);

    // Draw the main lane
    ctx.fillStyle = GREEN;
    ctx.fillRect(LANE_LEFT_EDGE, LANE_Y_END, LANE_WIDTH, LANE_Y_START - LANE_Y_END + 50);
}

/**
 * Draws the bowling ball on the canvas.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 * @param {object} ball - The ball object with x, y, and radius properties.
 */
export function drawBall(ctx, ball) {
    ctx.fillStyle = GREY;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw outline
    ctx.strokeStyle = BLACK;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.stroke();
}

/**
 * Draws the pins that are currently standing on the canvas.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 * @param {Pin[]} pins - An array of Pin objects.
 */
export function drawPins(ctx, pins) {
    pins.forEach(pin => {
        if (!pin.knocked_down) {
            ctx.fillStyle = WHITE;
            ctx.beginPath();
            ctx.arc(pin.center_x, pin.center_y, PIN_RADIUS, 0, Math.PI * 2);
            ctx.fill();

            // Draw outline
            ctx.strokeStyle = BLACK;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pin.center_x, pin.center_y, PIN_RADIUS, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
}

/**
 * Draws aiming instructions and a predictive aiming line based on game state.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 * @param {number} gameState - The current state of the game.
 * @param {object} ball - The ball object.
 * @param {number} mouseDownY - The Y coordinate where the mouse was pressed down.
 * @param {number} initialAimX - The X coordinate of the ball when aiming started.
 */
export function drawAimingInstructions(ctx, gameState, ball, mouseDownY, initialAimX) {
    ctx.font = `${FONT_SIZE_POWER_TEXT}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = WHITE;

    if (gameState === GAME_STATE_AIMING_POSITION) {
        const aimText = "Click anywhere on the lane to set ball position.";
        ctx.fillText(aimText, SCREEN_WIDTH/2, SCREEN_HEIGHT/2);

    } else if (gameState === GAME_STATE_AIMING_POWER) {
        const currentMouseX = window.mouseX; // This is now in canvas coordinates (from main.js fix)
        const currentMouseY = window.mouseY; // This is now in canvas coordinates (from main.js fix)

        // We still need rawSpeed and rawCurve to check the drag threshold,
        // even if we draw the line directly to the mouse position.
        const rawSpeed = (mouseDownY - currentMouseY); // Raw vertical drag distance (canvas Y)
        const rawCurve = (currentMouseX - initialAimX); // Raw horizontal drag distance (canvas X)

        const simulatedVelY = -Math.min(rawSpeed * THROW_SPEED_FACTOR, THROW_MAX_SPEED_Y);
        const simulatedVelX = rawCurve * THROW_CURVE_FACTOR;

        const MIN_DRAG_THRESHOLD_Y = 5; // Match main.js
        const MIN_DRAG_THRESHOLD_X = 5; // Match main.js

        // Only draw the line if there's enough drag to indicate an intention to throw
        if (Math.abs(rawSpeed) >= MIN_DRAG_THRESHOLD_Y || Math.abs(rawCurve) >= MIN_DRAG_THRESHOLD_X) {
            //let endLineX = currentMouseX;
            //let endLineY = currentMouseY;
            let endLineX = ball.x + simulatedVelX * AIM_LINE_LENGTH_SCALE;
            let endLineY = ball.y + simulatedVelY * AIM_LINE_LENGTH_SCALE;

            // Clamp endLineX to keep it visually within a reasonable area around the lane
            endLineX = Math.max(LANE_LEFT_EDGE - GUTTER_WIDTH - 20, Math.min(LANE_RIGHT_EDGE + GUTTER_WIDTH + 20, endLineX));
            
            // Clamp endLineY to ensure the line always moves upwards (for power)
            endLineY = Math.min(INITIAL_BALL_Y - 5, endLineY);

            ctx.strokeStyle = YELLOW;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(ball.x, ball.y); // The line starts from the ball's center
            ctx.lineTo(endLineX, endLineY); // The line ends at the (clamped) mouse position
            ctx.stroke();
        }

        const powerText = "Drag up for power, left/right for curve";
        ctx.fillText(powerText, SCREEN_WIDTH/2, SCREEN_HEIGHT/2);
    }
}

/**
 * Calculates the total bowling score from a flat list of rolls,
 * but only up to a given frame (0-indexed).
 * Returns the score if the frame is complete and score can be finalized, else null.
 * This function is specifically for displaying cumulative scores on the scoreboard.
 * @param {number[]} allRollsList - A flat array of scores for each roll.
 * @param {number} targetFrameIndex - The 0-indexed frame number up to which to calculate the score.
 * @returns {number|null} The cumulative score up to the target frame, or null if not enough rolls to finalize.
 */
function calculateFullGameScoreFromRollsUpToFrame(allRollsList, targetFrameIndex) {
    let score = 0;
    let rollIndex = 0;
    
    // Process frames 0 through target_frame_index
    for (let frameNum = 0; frameNum <= targetFrameIndex; frameNum++) {
        if (rollIndex >= allRollsList.length) {
            return null; // Not enough rolls to score this frame yet
        }

        const pinsRoll1 = allRollsList[rollIndex];

        if (pinsRoll1 === 10) { // Strike
            // Need 2 bonus rolls to finalize score for this strike
            // For frames 0-8 (not the 9th frame, which is the 10th frame in bowling)
            if (rollIndex + 2 >= allRollsList.length && frameNum < 9) {
                return null; // Not enough future rolls to score this strike yet
            }
            
            score += 10;
            if (rollIndex + 1 < allRollsList.length) {
                score += allRollsList[rollIndex + 1];
            }
            if (rollIndex + 2 < allRollsList.length) {
                score += allRollsList[rollIndex + 2];
            }
            rollIndex += 1;
        } else if (rollIndex + 1 < allRollsList.length) { // Spare or Open Frame
            const pinsRoll2 = allRollsList[rollIndex + 1];
            const frameTotal = pinsRoll1 + pinsRoll2;
            
            if (frameTotal === 10) { // Spare
                // Need 1 bonus roll to finalize score for this spare
                // For frames 0-8 (not the 9th frame)
                if (rollIndex + 2 >= allRollsList.length && frameNum < 9) {
                    return null; // Not enough future rolls to score this spare yet
                }
                
                score += 10;
                if (rollIndex + 2 < allRollsList.length) {
                    score += allRollsList[rollIndex + 2];
                }
            } else { // Open Frame
                score += frameTotal;
            }
            rollIndex += 2;
        } else { // Only one roll in frame so far, cannot finalize score for this frame
            return null; // Cannot finalize
        }
    }
    
    return score;
}

/**
 * Draws the scoreboard with current frame scores.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 * @param {Array<number[]>} gameFrames - A list of lists, where each inner list represents rolls for a frame.
 */
export function drawScoreboard(ctx, gameFrames) {
    const boardXStart = 20;
    const boardYStart = SCOREBOARD_Y_START;
    
    // Draw background for scoreboard
    ctx.fillStyle = DARK_GREY;
    ctx.fillRect(0, boardYStart - 10, SCREEN_WIDTH, SCOREBOARD_HEIGHT + 10);
    
    // Outer border for scoreboard
    ctx.strokeStyle = BLACK;
    ctx.lineWidth = 2;
    ctx.strokeRect(boardXStart, boardYStart, SCREEN_WIDTH - (2 * boardXStart), SCOREBOARD_HEIGHT);

    const allRollsForCalcCumulative = []; // To calculate cumulative scores for display

    for (let i = 0; i < 10; i++) { // 10 frames
        const frameX = boardXStart + (i * FRAME_BOX_WIDTH);
        
        // Frame number
        ctx.font = `${FONT_SIZE_SCOREBOARD_ROLL}px Arial`;
        ctx.fillStyle = WHITE;
        ctx.textAlign = 'center';
        ctx.fillText(String(i + 1), frameX + FRAME_BOX_WIDTH / 2, boardYStart + 5 + FONT_SIZE_SCOREBOARD_ROLL / 2);

        // Roll boxes
        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 1;
        ctx.strokeRect(frameX, boardYStart + ROLL_BOX_HEIGHT, FRAME_BOX_WIDTH, ROLL_BOX_HEIGHT); // Roll 1/2 box
        ctx.beginPath();
        ctx.moveTo(frameX + FRAME_BOX_WIDTH * 0.5, boardYStart + ROLL_BOX_HEIGHT);
        ctx.lineTo(frameX + FRAME_BOX_WIDTH * 0.5, boardYStart + 2 * ROLL_BOX_HEIGHT);
        ctx.stroke(); // Divider

        // Frame total score box
        ctx.strokeRect(frameX, boardYStart + (2 * ROLL_BOX_HEIGHT), FRAME_BOX_WIDTH, FRAME_SCORE_BOX_HEIGHT);

        // Populate scores
        if (i < gameFrames.length) {
            const frameData = gameFrames[i];
            
            // Roll 1 score
            if (frameData.length > 0) {
                const roll1Pins = frameData[0];
                
                if (roll1Pins === 10 && i < 9) { // Strike in frames 1-9 (X in second box, first empty)
                    ctx.font = `${FONT_SIZE_SCOREBOARD_ROLL}px Arial`;
                    ctx.fillStyle = WHITE;
                    ctx.fillText("X", frameX + (FRAME_BOX_WIDTH * 0.75), boardYStart + ROLL_BOX_HEIGHT + (ROLL_BOX_HEIGHT / 2) + FONT_SIZE_SCOREBOARD_ROLL / 2 - 5);
                } else { // Regular first roll or Frame 10 first roll
                    ctx.font = `${FONT_SIZE_SCOREBOARD_ROLL}px Arial`;
                    ctx.fillStyle = WHITE;
                    ctx.fillText(String(roll1Pins), frameX + (FRAME_BOX_WIDTH * 0.25), boardYStart + ROLL_BOX_HEIGHT + (ROLL_BOX_HEIGHT / 2) + FONT_SIZE_SCOREBOARD_ROLL / 2 - 5);
                }
            }

            // Roll 2 score
            if (frameData.length > 1) {
                const roll2Pins = frameData[1];
                let roll2TextStr = String(roll2Pins);
                
                // Check for spare in frames 1-9
                if (i < 9 && (frameData[0] + frameData[1] === 10) && frameData[0] !== 10) {
                    roll2TextStr = "/";
                } else if (i === 9) { // Frame 10 special cases
                    if (frameData[0] === 10 && roll2Pins === 10) { // Strike on 1st, strike on 2nd
                        roll2TextStr = "X";
                    } else if (frameData[0] !== 10 && (frameData[0] + roll2Pins === 10)) { // Spare
                        roll2TextStr = "/";
                    } else { // Regular
                        roll2TextStr = String(roll2Pins);
                    }
                }

                ctx.font = `${FONT_SIZE_SCOREBOARD_ROLL}px Arial`;
                ctx.fillStyle = WHITE;
                ctx.fillText(roll2TextStr, frameX + (FRAME_BOX_WIDTH * 0.75), boardYStart + ROLL_BOX_HEIGHT + (ROLL_BOX_HEIGHT / 2) + FONT_SIZE_SCOREBOARD_ROLL / 2 - 5);
            }

            // Bonus rolls for frame 10 (3rd roll)
            if (i === 9 && frameData.length > 2) {
                const roll3Pins = frameData[2];
                const roll3TextStr = roll3Pins === 10 ? "X" : String(roll3Pins);
                
                // Drawing for 3rd roll in 10th frame
                const bonusXPos = frameX + FRAME_BOX_WIDTH - (FRAME_BOX_WIDTH * 0.25);    
                ctx.font = `${FONT_SIZE_SCOREBOARD_ROLL}px Arial`;
                ctx.fillStyle = WHITE;
                ctx.fillText(roll3TextStr, bonusXPos, boardYStart + ROLL_BOX_HEIGHT + (ROLL_BOX_HEIGHT / 2) + FONT_SIZE_SCOREBOARD_ROLL / 2 - 5);
            }

            // Calculate and display cumulative score for this frame
            // We need a flat list of rolls to pass to calculateFullGameScoreFromRolls for cumulative score
            // This is a simplified approach, a more robust score manager would calculate and store this.
            allRollsForCalcCumulative.push(...frameData); // Add current frame's rolls to the cumulative list
            
            const cumulativeScore = calculateFullGameScoreFromRollsUpToFrame(allRollsForCalcCumulative, i);
            if (cumulativeScore !== null) {
                ctx.font = `${FONT_SIZE_SCOREBOARD_FRAME}px Arial`;
                ctx.fillStyle = WHITE;
                ctx.fillText(String(cumulativeScore), frameX + FRAME_BOX_WIDTH / 2, boardYStart + (2 * ROLL_BOX_HEIGHT) + FRAME_SCORE_BOX_HEIGHT / 2 + FONT_SIZE_SCOREBOARD_FRAME / 2 - 5);
            }
        }
    }
}

/**
 * Draws a transparent overlay showing pins knocked down and continuation instruction.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 * @param {number} pinsKnockedThisThrow - The number of pins knocked down in the last throw.
 * @param {number} gameState - The current state of the game.
 */
export function drawScoreOverlay(ctx, pinsKnockedThisThrow, gameState) {
    // Draw semi-transparent black overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Black with 50% alpha
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.font = `${FONT_SIZE_INSTRUCTION}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = WHITE;

    const pinsText = `Knocked down: ${pinsKnockedThisThrow}`;
    ctx.fillText(pinsText, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50);

    if (gameState !== GAME_STATE_GAME_OVER) {
        const continueText = "Click to continue";
        ctx.fillText(continueText, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 50);
    }
}

/**
 * Draws the game over screen with the final score and restart instruction.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 * @param {number} finalScore - The total final score of the game.
 */
export function drawGameOverScreen(ctx, finalScore) {
    const overlayRectWidth = SCREEN_WIDTH * 0.7;
    const overlayRectHeight = 200;
    const overlayRectX = (SCREEN_WIDTH - overlayRectWidth) / 2;
    const overlayRectY = (SCREEN_HEIGHT - overlayRectHeight) / 2;

    // Draw semi-transparent black background for the game over box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Black with 70% alpha
    ctx.fillRect(overlayRectX, overlayRectY, overlayRectWidth, overlayRectHeight);

    // Draw white border around the game over box
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 3;
    ctx.strokeRect(overlayRectX, overlayRectY, overlayRectWidth, overlayRectHeight);

    ctx.font = `${FONT_SIZE_INSTRUCTION}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = WHITE;

    const finalScoreText = `Final Score: ${finalScore}`;
    ctx.fillText(finalScoreText, SCREEN_WIDTH / 2, overlayRectY + overlayRectHeight / 2 - 30);

    const restartText = "Press SPACE to play again";
    ctx.fillText(restartText, SCREEN_WIDTH / 2, overlayRectY + overlayRectHeight / 2 + 30);
}