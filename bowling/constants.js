// --- Game Constants ---
export const SCREEN_WIDTH = 800;
export const SCREEN_HEIGHT = 700;

// Adjusted LANE_Y_START to leave space for scoreboard at the bottom
export const LANE_Y_START = 500; // Approximate Y position where the ball starts (further down the screen)
export const LANE_Y_END = 0; // Lane goes all the way to the top of the screen
export const LANE_BOTTOM_Y = LANE_Y_START + 50; // Explicitly define the bottom edge of the lane graphic
export const BALL_RADIUS = 15;
export const PIN_RADIUS = 10; // Pins are now circles, defined by a radius

// Colors (translated from RGB tuples to CSS-compatible strings)
export const WHITE = 'rgb(255, 255, 255)';
export const BLACK = 'rgb(0, 0, 0)';
export const GREEN = 'rgb(0, 100, 0)'; // For the lane
export const DARK_GREY = 'rgb(50, 50, 50)'; // For the gutters
export const GREY = 'rgb(150, 150, 150)'; // For the ball
export const YELLOW = 'rgb(255, 255, 0)'; // For aiming line

// Lane and Gutter Dimensions
export const LANE_WIDTH = 300;
export const GUTTER_WIDTH = 30; // Width of each gutter

// Calculate lane and gutter X positions
export const LANE_LEFT_EDGE = SCREEN_WIDTH / 2 - LANE_WIDTH / 2;
export const LANE_RIGHT_EDGE = SCREEN_WIDTH / 2 + LANE_WIDTH / 2;
export const GUTTER_LEFT_X = LANE_LEFT_EDGE - GUTTER_WIDTH;
export const GUTTER_RIGHT_X = LANE_RIGHT_EDGE;

// Constant speed for ball rolling in the gutter
export const GUTTER_ROLL_SPEED = -5; // Negative because higher Y values are lower on screen, so -5 moves it up.

// Physics parameters for pins
export const PIN_FRICTION = 0.95; // How much pin velocity decays per frame
export const PIN_PUSH_FORCE_ON_HIT = 10; // How strongly a pin is pushed by the ball
export const PIN_REPULSION_FORCE = 0.5; // How strongly pins repel each other when overlapping

// Scoreboard Dimensions
export const SCOREBOARD_HEIGHT = 150; // Height allocated for the scoreboard at the bottom
export const SCOREBOARD_Y_START = SCREEN_HEIGHT - SCOREBOARD_HEIGHT; // Y position where scoreboard begins
export const FRAME_BOX_WIDTH = (SCREEN_WIDTH - 40) / 10; // 10 frames, with 20px padding on each side
export const ROLL_BOX_HEIGHT = 30; // Height for individual roll boxes
export const FRAME_SCORE_BOX_HEIGHT = SCOREBOARD_HEIGHT - (2 * ROLL_BOX_HEIGHT) - 10; // Adjust for spacing

// --- Font Sizes ---
export const FONT_SIZE_SCORE_NORMAL = 40;
export const FONT_SIZE_INSTRUCTION = 36;
export const FONT_SIZE_POWER_TEXT = 36;
export const FONT_SIZE_SCOREBOARD_ROLL = 28;
export const FONT_SIZE_SCOREBOARD_FRAME = 36;

// --- Game State Enums ---

export const GAME_STATE_TITLE_SCREEN = 0; // Or any unique number
export const GAME_STATE_AIMING_POSITION = 1; // Player is deciding horizontal ball position
export const GAME_STATE_AIMING_POWER = 2; // Player is dragging for power/curve
export const GAME_STATE_THROWN = 3; // Ball is moving, pins are reacting
export const GAME_STATE_SCORE_DISPLAY = 4; // Score is being displayed after throw settles, awaiting click for next throw or spacebar for new game
export const GAME_STATE_GAME_OVER = 5; // New state for when the entire game is complete

// Initial ball position (for reset and aiming)
export const INITIAL_BALL_Y = LANE_Y_START - BALL_RADIUS - 10;

// Pin setup constants
export const PIN_FRONT_ROW_Y = 200;
export const PIN_HORIZONTAL_GAP = PIN_RADIUS * 4.0;
export const PIN_VERTICAL_GAP = PIN_RADIUS * 5.0;

// Physics parameters for ball
export const THROW_SPEED_FACTOR = 0.08;   // Multiplier for vertical drag -> Y velocity
export const THROW_MAX_SPEED_Y = 20;     // Maximum Y velocity (forward speed)
export const THROW_CURVE_FACTOR = 0.5;   // Multiplier for horizontal drag -> X velocity (Adjust this to your desired curve sensitivity)
export const AIM_LINE_LENGTH_SCALE = 3; // How far the aiming line projects visually for the calculated velocity.
                                         // Adjust this value (e.g., 15, 20, 30, 50) to make the line longer/shorter.