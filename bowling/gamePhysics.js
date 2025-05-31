import {
    BALL_RADIUS, PIN_RADIUS, LANE_LEFT_EDGE, LANE_RIGHT_EDGE, GUTTER_WIDTH,
    GUTTER_ROLL_SPEED, PIN_FRICTION, PIN_PUSH_FORCE_ON_HIT, PIN_REPULSION_FORCE,
    LANE_BOTTOM_Y
} from './constants.js';

/**
 * Updates the position and velocity of the ball and pins based on physics.
 * Handles ball-pin collisions and pin-pin collisions.
 * @param {object} ball - The ball object with its current state.
 * @param {Pin[]} pins - An array of Pin objects.
 */
export function updateBallAndPinsPhysics(ball, pins) {
    // --- Ball Physics Update ---
    if (ball.moving) {
        ball.x += ball.velocity_x;
        ball.y += ball.velocity_y;

        // Apply air friction if not in gutter
        if (!ball.in_gutter) {
            ball.velocity_y *= 0.98;
            ball.velocity_x *= 0.98;
        }

        // Gutter check: Determine if the ball has entered a gutter
        if (!ball.in_gutter) {
            if (ball.x - BALL_RADIUS < LANE_LEFT_EDGE) {
                ball.in_gutter = true;
                // Position ball in the center of the left gutter
                ball.x = LANE_LEFT_EDGE - GUTTER_WIDTH / 2;
                ball.velocity_x = 0; // Stop horizontal movement
                ball.velocity_y = GUTTER_ROLL_SPEED; // Set to gutter roll speed
            } else if (ball.x + BALL_RADIUS > LANE_RIGHT_EDGE) {
                ball.in_gutter = true;
                // Position ball in the center of the right gutter
                ball.x = LANE_RIGHT_EDGE + GUTTER_WIDTH / 2;
                ball.velocity_x = 0; // Stop horizontal movement
                ball.velocity_y = GUTTER_ROLL_SPEED; // Set to gutter roll speed
            }
        }
                
        // --- Ball-Pin Collision ---
        if (!ball.in_gutter) {
            pins.forEach(pin => {
                if (!pin.knocked_down) {
                    // Calculate distance between ball and pin centers
                    const dx = pin.center_x - ball.x;
                    const dy = pin.center_y - ball.y;
                    let distance = Math.hypot(dx, dy);

                    // If distance is zero (shouldn't happen with proper movement, but for safety)
                    if (distance === 0) {
                        distance = 0.001; // Avoid division by zero
                    }

                    // Check for collision (overlap)
                    if (distance < (BALL_RADIUS + PIN_RADIUS)) {
                        const norm_x = dx / distance; // Normalized vector components
                        const norm_y = dy / distance;

                        // Apply force to the pin
                        pin.vel_x += norm_x * PIN_PUSH_FORCE_ON_HIT;
                        pin.vel_y += norm_y * PIN_PUSH_FORCE_ON_HIT;
                        pin.has_moved_from_initial_pos = true; // Mark pin as moved

                        // Apply some deceleration to the ball upon impact
                        const ballDecelerationFactor = 0.8;
                        ball.velocity_x *= ballDecelerationFactor;
                        ball.velocity_y *= ballDecelerationFactor;

                        // Resolve overlap: Push ball and pin apart to prevent sticking
                        const overlap = (BALL_RADIUS + PIN_RADIUS) - distance;
                        ball.x -= norm_x * overlap * 0.5;
                        ball.y -= norm_y * overlap * 0.5;
                        pin.center_x += norm_x * overlap * 0.5;
                        pin.center_y += norm_y * overlap * 0.5;
                    }
                }
            });
        }
    }

    // --- Pin Physics Update and Pin-Pin Collisions ---
    pins.forEach((pin1, i) => {
        if (!pin1.knocked_down) {
            // Apply friction to pin velocity
            pin1.vel_x *= PIN_FRICTION;
            pin1.vel_y *= PIN_FRICTION;

            // Update pin position
            pin1.center_x += pin1.vel_x;
            pin1.center_y += pin1.vel_y;

            // Pin boundary checks (lane edges)
            const pinMinX = LANE_LEFT_EDGE + PIN_RADIUS;
            const pinMaxX = LANE_RIGHT_EDGE - PIN_RADIUS;

            if (pin1.center_x < pinMinX) {
                pin1.center_x = pinMinX;
                pin1.vel_x *= -0.5; // Bounce off left edge
            } else if (pin1.center_x > pinMaxX) {
                pin1.center_x = pinMaxX;
                pin1.vel_x *= -0.5; // Bounce off right edge
            }

            // Pin boundary checks (top/bottom of active lane area)
            const pinMinYExit = -PIN_RADIUS * 2; // If pin goes off-screen top, it's knocked down
            const pinMaxYBounce = LANE_BOTTOM_Y - PIN_RADIUS; // Bottom of pin area (where they can bounce)

            if (pin1.center_y < pinMinYExit) {
                pin1.knocked_down = true; // Pin is out of play
            } else if (pin1.center_y > pinMaxYBounce) {
                pin1.center_y = pinMaxYBounce;
                pin1.vel_y *= -0.5; // Bounce off bottom edge
            }
                
            // Mark pin as moved if it's no longer at its initial position
            if (!pin1.has_moved_from_initial_pos &&
               (Math.abs(pin1.center_x - pin1.initial_pos_x) > 0.01 ||
                Math.abs(pin1.center_y - pin1.initial_pos_y) > 0.01)) {
                pin1.has_moved_from_initial_pos = true;
            }

            // --- Pin-Pin Collision ---
            for (let j = i + 1; j < pins.length; j++) { // Only check each pair once
                const pin2 = pins[j];
                if (!pin2.knocked_down) {
                    const dx_p = pin1.center_x - pin2.center_x;
                    const dy_p = pin1.center_y - pin2.center_y;
                    let pinDistance = Math.hypot(dx_p, dy_p);

                    if (pinDistance === 0) {
                        pinDistance = 0.001;
                    }

                    // Check for overlap between pins
                    if (pinDistance < (PIN_RADIUS * 2)) {
                        const norm_x_p = dx_p / pinDistance;
                        const norm_y_p = dy_p / pinDistance;

                        // Resolve overlap by pushing pins apart
                        const overlap_p = (PIN_RADIUS * 2) - pinDistance;
                        pin1.center_x += norm_x_p * overlap_p * 0.5;
                        pin1.center_y += norm_y_p * overlap_p * 0.5;
                        pin2.center_x -= norm_x_p * overlap_p * 0.5;
                        pin2.center_y -= norm_y_p * overlap_p * 0.5;

                        // Apply repulsion force to simulate bounce
                        pin1.vel_x += norm_x_p * PIN_REPULSION_FORCE;
                        pin1.vel_y += norm_y_p * PIN_REPULSION_FORCE;
                        pin2.vel_x -= norm_x_p * PIN_REPULSION_FORCE;
                        pin2.vel_y -= norm_y_p * PIN_REPULSION_FORCE;

                        pin1.has_moved_from_initial_pos = true;
                        pin2.has_moved_from_initial_pos = true;
                    }
                }
            }
        }
    });
}

/**
 * Checks if the ball has stopped and all pins have settled (stopped moving).
 * @param {object} ball - The ball object.
 * @param {Pin[]} pins - An array of Pin objects.
 * @returns {boolean} True if both ball and all pins are settled, false otherwise.
 */
export function checkSettled(ball, pins) {
    // Ball is considered stopped if it's off-screen (top) or its velocity is very low
    const ballStopped = ball.y < -BALL_RADIUS ||
                       (!ball.in_gutter && Math.abs(ball.velocity_y) < 0.1 && Math.abs(ball.velocity_x) < 0.1);
    
    let allPinsSettled = true;
    // Check if any standing pin is still moving significantly
    for (const pin of pins) {
        if (!pin.knocked_down && (Math.abs(pin.vel_x) > 0.1 || Math.abs(pin.vel_y) > 0.1)) {
            allPinsSettled = false;
            break;
        }
    }
    
    return ballStopped && allPinsSettled;
}

/**
 * Counts the number of pins still standing based on their 'knocked_down' state and proximity to initial position.
 * @param {Pin[]} pins - An array of Pin objects.
 * @returns {number} The count of standing pins.
 */
export function countStandingPins(pins) {
    let currentPinsStanding = 0;
    for (const pin of pins) {
        // A pin is considered standing if it's not 'knocked_down' AND it hasn't moved significantly from its initial spot.
        if (!pin.knocked_down &&
           Math.abs(pin.center_x - pin.initial_pos_x) < 5 &&
           Math.abs(pin.center_y - pin.initial_pos_y) < 5) {    
            currentPinsStanding += 1;
        }
    }
    return currentPinsStanding;
}

/**
 * Marks any pin that has moved from its initial position as 'knocked_down'.
 * This is crucial for determining which pins are counted as knocked down after a roll.
 * @param {Pin[]} pins - An array of Pin objects.
 */
export function markMovedPinsAsDown(pins) {
    pins.forEach(pin => {
        if (pin.has_moved_from_initial_pos) {
            pin.knocked_down = true;
        }
    });
}