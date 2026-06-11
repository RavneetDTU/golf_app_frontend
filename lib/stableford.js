/**
 * Calculates the stroke allowance for a specific hole based on playing handicap and the hole's stroke index (SI).
 * 
 * @param {number} handicap Player's handicap (e.g. 18.0)
 * @param {number} strokeIndex Hole's stroke index (from 1 to 18)
 * @returns {number} The number of strokes allowed on this hole
 */
export function getStrokeAllowance(handicap, strokeIndex) {
  const playingHandicap = Math.round(Number(handicap || 0))
  
  // Base strokes given to every hole
  const base = Math.floor(playingHandicap / 18)
  
  // Remainder strokes distributed to holes with SI <= remainder
  const remainder = playingHandicap % 18
  
  return strokeIndex <= remainder ? base + 1 : base
}

/**
 * Calculates the Stableford points for a single hole.
 * 
 * @param {number} grossShots Number of strokes taken on the hole (0 or null means did not complete)
 * @param {number} par The par of the hole (typically 3, 4, or 5)
 * @param {number} strokeAllowance The handicap stroke allowance for the hole
 * @returns {number} Stableford points (0 to 6)
 */
export function calculateHolePoints(grossShots, par, strokeAllowance) {
  const shots = Number(grossShots)
  if (!shots || shots <= 0) {
    return 0 // Did not complete or no score entered yet
  }

  // Net score is gross shots minus the handicap stroke allowance
  const netScore = shots - strokeAllowance
  
  // Stableford points:
  // Net Par = 2 pts, Birdie (1 under net par) = 3 pts, Bogey (1 over net par) = 1 pt, etc.
  const diff = netScore - Number(par)
  const points = 2 - diff
  
  return Math.max(0, points)
}

/**
 * Calculates the total points and enriched hole-by-hole scores for a complete round.
 * 
 * @param {Array} holeScores Array of hole objects: { hole, par, strokeIndex, shots }
 * @param {number} handicap Player's handicap (e.g. 18.0)
 * @returns {Object} { totalPoints, totalShots, enrichedHoles }
 */
export function calculateRoundPoints(holeScores = [], handicap = 0) {
  let totalPoints = 0
  let totalShots = 0
  
  const enrichedHoles = holeScores.map((h) => {
    const shots = h.shots !== undefined && h.shots !== null && h.shots !== '' ? Number(h.shots) : 0
    const strokeAllowance = getStrokeAllowance(handicap, h.strokeIndex)
    const points = shots > 0 ? calculateHolePoints(shots, h.par, strokeAllowance) : 0
    
    totalPoints += points
    totalShots += shots
    
    return {
      ...h,
      shots,
      strokeAllowance,
      points
    }
  })
  
  return {
    totalPoints,
    totalShots,
    enrichedHoles
  }
}
