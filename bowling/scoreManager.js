/**
 * Calculates the total bowling score from a flat list of rolls.
 * This function handles strikes, spares, and open frames, including the special rules for the 10th frame.
 * @param {number[]} allRollsList - A flat array of scores for each roll, e.g., [7, 2, 10, 5, 5, 8, 0, 10, 10, 10, 9, 1].
 * @returns {number} The total calculated bowling score.
 */
export function calculateFullGameScoreFromRolls(allRollsList) {
    let score = 0;
    let rollIndex = 0; // Tracks the current position in the allRollsList array
    let frame = 0; // Tracks the current frame being scored (0-indexed for internal loop, 1-indexed for display)

    // This loop processes frames 1 through 9
    while (frame < 9) {
        // If there are no more rolls available, return the current score.
        // This is important for partial games or if bonus rolls aren't yet available.
        if (rollIndex >= allRollsList.length) {
            return score;
        }

        const pinsRoll1 = allRollsList[rollIndex];

        // --- Handle a Strike (10 pins on the first roll of the frame) ---
        if (pinsRoll1 === 10) {
            score += 10; // Add the 10 pins for the strike itself

            // Add bonus for the next two rolls
            // FIX: Ensure '.length' is used for array bounds checking
            if (rollIndex + 1 < allRollsList.length) {
                score += allRollsList[rollIndex + 1];
            }
            // FIX: Ensure '.length' is used for array bounds checking
            if (rollIndex + 2 < allRollsList.length) { // Check if the roll after the next exists
                score += allRollsList[rollIndex + 2];
            }
            rollIndex += 1; // A strike uses only one roll slot for the current frame
        }
        // --- Handle a Spare or Open Frame (requires at least two rolls) ---
        // Ensure there's a second roll available for this frame
        else if (rollIndex + 1 < allRollsList.length) { 
            const pinsRoll2 = allRollsList[rollIndex + 1];
            const frameTotal = pinsRoll1 + pinsRoll2;

            // Spare (10 pins knocked down in two rolls)
            if (frameTotal === 10) {
                score += 10; // Add the 10 pins for the spare itself
                // Add bonus for the next single roll
                // FIX: Ensure '.length' is used for array bounds checking
                if (rollIndex + 2 < allRollsList.length) {
                    score += allRollsList[rollIndex + 2];
                }
            }
            // Open Frame (less than 10 pins knocked down in two rolls)
            else {
                score += frameTotal; // Just add the sum of the two rolls
            }
            
            rollIndex += 2; // A spare or open frame uses two roll slots
        }
        else {
            // This case handles an incomplete frame where only the first roll has been made,
            // and there are no more rolls to process (e.g., game ended prematurely or data is incomplete).
            // Only add the pins from the first roll and then break.
            score += pinsRoll1;
            rollIndex += 1;
            break; // Stop processing, as the current frame is incomplete.
        }

        frame += 1; // Move to the next frame
    }

    // --- Special handling for Frame 10 ---
    // For the 10th frame, any remaining rolls (including bonus rolls for strikes/spares in frame 10)
    // are simply added directly to the score without further bonus calculations.
    // This loop should only execute after the main 9 frames logic is done,
    // and it handles the rolls specifically for the 10th frame.
    while (rollIndex < allRollsList.length) {
        score += allRollsList[rollIndex];
        rollIndex += 1;
    }

    return score;
}