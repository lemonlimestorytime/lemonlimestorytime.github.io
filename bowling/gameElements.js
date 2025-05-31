import { SCREEN_WIDTH, PIN_RADIUS, PIN_FRONT_ROW_Y, PIN_HORIZONTAL_GAP, PIN_VERTICAL_GAP } from './constants.js';

/**
 * Represents a single bowling pin.
 * Manages its position, velocity, and state (standing, knocked down, moved).
 */
export class Pin {
    /**
     * @param {number} x - The initial X coordinate of the pin's center.
     * @param {number} y - The initial Y coordinate of the pin's center.
     */
    constructor(x, y) {
        this.center_x = x;
        this.center_y = y;
        this.initial_pos_x = x; // Store initial position for resets
        this.initial_pos_y = y;
        this.knocked_down = false; // True if pin should not be drawn (e.g., exited screen or counted)
        this.has_moved_from_initial_pos = false; // True if pin has ever moved from its start spot
        this.vel_x = 0.0; // Current velocity in X direction
        this.vel_y = 0.0; // Current velocity in Y direction
    }

    /**
     * Resets the pin to its initial position and state for a new roll within the same frame.
     * This is typically used for pins that were standing after the first roll of a frame.
     */
    resetForNewRoll() {
        this.center_x = this.initial_pos_x;
        this.center_y = this.initial_pos_y;
        this.knocked_down = false;
        this.has_moved_from_initial_pos = false;
        this.vel_x = 0.0;
        this.vel_y = 0.0;
    }

    /**
     * Returns the current position of the pin.
     * @returns {{x: number, y: number}} An object containing the x and y coordinates.
     */
    getPos() {
        return { x: this.center_x, y: this.center_y };
    }
}

/**
 * Initializes or resets all 10 pins to their standard bowling formation.
 * @returns {Pin[]} An array of Pin objects.
 */
export function resetPins() {
    const pins = [];

    // Row 1 (1 pin - closest to player/ball starting position)
    // Positioned at the horizontal center of the screen
    pins.push(new Pin(SCREEN_WIDTH / 2, PIN_FRONT_ROW_Y));

    // Row 2 (2 pins)
    // Offset vertically from Row 1, and horizontally from the center
    const y2 = PIN_FRONT_ROW_Y - PIN_VERTICAL_GAP;
    const x2_left = SCREEN_WIDTH / 2 - (PIN_HORIZONTAL_GAP / 2);
    const x2_right = SCREEN_WIDTH / 2 + (PIN_HORIZONTAL_GAP / 2);
    pins.push(new Pin(x2_left, y2));
    pins.push(new Pin(x2_right, y2));

    // Row 3 (3 pins)
    // Further offset vertically, and with wider horizontal spacing
    const y3 = PIN_FRONT_ROW_Y - 2 * PIN_VERTICAL_GAP;
    const x3_left = SCREEN_WIDTH / 2 - PIN_HORIZONTAL_GAP;
    const x3_middle = SCREEN_WIDTH / 2;
    const x3_right = SCREEN_WIDTH / 2 + PIN_HORIZONTAL_GAP;
    pins.push(new Pin(x3_left, y3));
    pins.push(new Pin(x3_middle, y3));
    pins.push(new Pin(x3_right, y3));

    // Row 4 (4 pins)
    // The furthest row from the player, with the widest horizontal spread
    const y4 = PIN_FRONT_ROW_Y - 3 * PIN_VERTICAL_GAP;
    const x4_pos = [
        SCREEN_WIDTH / 2 - 1.5 * PIN_HORIZONTAL_GAP, // Leftmost pin
        SCREEN_WIDTH / 2 - 0.5 * PIN_HORIZONTAL_GAP, // Left-center pin
        SCREEN_WIDTH / 2 + 0.5 * PIN_HORIZONTAL_GAP, // Right-center pin
        SCREEN_WIDTH / 2 + 1.5 * PIN_HORIZONTAL_GAP  // Rightmost pin
    ];
    x4_pos.forEach(x_coord => {
        pins.push(new Pin(x_coord, y4));
    });
        
    return pins;
}

/**
 * Initializes the ball's properties.
 * @returns {object} An object containing the ball's properties.
 */
export function createBall() {
    return {
        x: SCREEN_WIDTH / 2, // Initial X position (horizontal center)
        y: PIN_FRONT_ROW_Y + (PIN_VERTICAL_GAP * 3) + 200, // Initial Y position (behind the pins)
        radius: PIN_RADIUS * 1.5, // Using PIN_RADIUS to derive ball radius, adjust as needed
        velocity_x: 0.0, // Current velocity in X direction
        velocity_y: 0.0, // Current velocity in Y direction
        moving: false, // True if the ball is currently in motion
        in_gutter: false, // True if the ball has entered a gutter
        aim_x_start: SCREEN_WIDTH / 2 // Stores the ball's X position when aiming started, for flick calculation
    };
}
