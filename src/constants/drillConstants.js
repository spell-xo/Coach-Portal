/**
 * Drill Constants
 * Constants for drill management including statuses, levels, and types
 */

/**
 * Drill Level Options
 */
export const DRILL_LEVELS = [
  { value: 'level_one', label: 'Level One' },
  { value: 'level_two', label: 'Level Two' },
  { value: 'level_three', label: 'Level Three' },
  { value: 'level_four', label: 'Level Four' },
  { value: 'level_five', label: 'Level Five' },
];

/**
 * Level 1 Drills
 */
export const level1Drills = [
  { label: "THREE_GATE_PASS", value: "THREE_GATE_PASS" },
  { label: "TRIPLE_CONE_DRILL", value: "TRIPLE_CONE_DRILL" },
  { label: "7_CONE_WEAVE", value: "7_CONE_WEAVE" },
  { label: "ZIGZAG_DRILL", value: "ZIGZAG_DRILL" },
  { label: "KEEPY_UPPIES", value: "KEEPY_UPPIES" },
];

/**
 * Level 2 Drills
 */
export const level2Drills = [
  { label: "FIGURE_OF_8_DRILL", value: "FIGURE_OF_8_DRILL" },
  { label: "DIAMOND_DRIBBLING", value: "DIAMOND_DRIBBLING" },
  { label: "DRIBBLE_PASS_DRIBBLE", value: "DRIBBLE_PASS_DRIBBLE" },
  { label: "FIVE_CONE_DRILL", value: "FIVE_CONE_DRILL" },
  { label: "KEEPY_UPPIES_SECOND", value: "KEEPY_UPPIES_SECOND" },
];

/**
 * Level 3 Drills
 */
export const level3Drills = [
  { label: "DRIBBLE_ZIGZAG_DRIBBLE", value: "DRIBBLE_ZIGZAG_DRIBBLE" },
  { label: "CHEST_CONTROL_DRIBBLE", value: "CHEST_CONTROL_DRIBBLE" },
  { label: "CHEST_CONTROL_WEAVE", value: "CHEST_CONTROL_WEAVE" },
  { label: "THREE_GATE_PASS_DRIBBLE", value: "THREE_GATE_PASS_DRIBBLE" },
  { label: "KEEPY_UPPIES_THIRD", value: "KEEPY_UPPIES_THIRD" },
];

/**
 * Level 4 Drills
 */
export const level4Drills = [
  { label: "PASSING_RECEIVING_TURNING", value: "PASSING_RECEIVING_TURNING" },
  { label: "7_CONE_WEAVE_SECOND", value: "7_CONE_WEAVE_SECOND" },
  { label: "DIAMOND_DRIBBLING_SECOND", value: "DIAMOND_DRIBBLING_SECOND" },
  { label: "PASSING_RECEIVING_TURNING_SHUTTLE", value: "PASSING_RECEIVING_TURNING_SHUTTLE" },
  { label: "KEEPY_UPPIES_FOURTH", value: "KEEPY_UPPIES_FOURTH" },
];

export const level5Drills = [
  { label: "THREE_GATE_PASS_SECOND", value: "THREE_GATE_PASS_SECOND" },
  { label: "PASSING_RECEIVING_TURNING_MIXED_COMBO", value: "PASSING_RECEIVING_TURNING_MIXED_COMBO" },
  { label: "PASSING_RECEIVING_TURNING_WEAVE", value: "PASSING_RECEIVING_TURNING_WEAVE" },
  { label: "DIAMOND_SHUTTLE_DRILL", value: "DIAMOND_SHUTTLE_DRILL" },
  { label: "KEEPY_UPPIES_FIFTH", value: "KEEPY_UPPIES_FIFTH" },
];

/**
 * Get drill types by level
 * @param {string} level - Level value (level_one, level_two, level_three, level_four, level_five) or undefined for all drills
 * @returns {Array} Array of drill type objects
 */
export function DRILL_TYPES(level) {
  if (level) {
    switch (level) {
      case "level_one":
        return level1Drills;
      case "level_two":
        return level2Drills;
      case "level_three":
        return level3Drills;
      case "level_four":
        return level4Drills;
      case "level_five":
        return level5Drills;
      default:
        return level1Drills.concat(level2Drills).concat(level3Drills).concat(level4Drills).concat(level5Drills);
    }
  }
  return level1Drills.concat(level2Drills).concat(level3Drills).concat(level4Drills).concat(level5Drills);
}

/**
 * Drill Status Values
 * Based on PRD: Bulk upload Manual annotation
 */
export const DRILL_STATUS = {
  UPLOADED: "UPLOADED", // Video uploaded, awaiting processing
  PROCESSING: "PROCESSING", // Currently being processed
  PROCESSED: "PROCESSED", // Processing complete
  FAILED: "FAILED", // Processing failed
  PENDING_MANUAL_ANNOTATION: "PENDING_MANUAL_ANNOTATION", // Frame extracted, awaiting manual annotation
  REJECTED: "REJECTED", // Video rejected by AI pre-classifier
};

/**
 * Drill Status Labels (for display)
 */
export const DRILL_STATUS_LABELS = {
  [DRILL_STATUS.UPLOADED]: "Uploaded",
  [DRILL_STATUS.PROCESSING]: "Processing",
  [DRILL_STATUS.PROCESSED]: "Processed",
  [DRILL_STATUS.FAILED]: "Failed",
  [DRILL_STATUS.PENDING_MANUAL_ANNOTATION]: "Pending Annotation",
  [DRILL_STATUS.REJECTED]: "Rejected",
};

/**
 * Drill Status Colors (for chips/badges)
 */
export const DRILL_STATUS_COLORS = {
  [DRILL_STATUS.UPLOADED]: "info",
  [DRILL_STATUS.PROCESSING]: "warning",
  [DRILL_STATUS.PROCESSED]: "success",
  [DRILL_STATUS.FAILED]: "error",
  [DRILL_STATUS.PENDING_MANUAL_ANNOTATION]: "secondary",
  [DRILL_STATUS.REJECTED]: "error",
};

/**
 * Status workflow
 * BULK_UPLOAD → PENDING_MANUAL_ANNOTATION (after frame extraction)
 * PENDING_MANUAL_ANNOTATION → UPLOADED (after annotation submission)
 * UPLOADED → PROCESSING → PROCESSED/FAILED
 */
export const STATUS_TRANSITIONS = {
  [DRILL_STATUS.PENDING_MANUAL_ANNOTATION]: [DRILL_STATUS.UPLOADED],
  [DRILL_STATUS.UPLOADED]: [DRILL_STATUS.PROCESSING],
  [DRILL_STATUS.PROCESSING]: [DRILL_STATUS.PROCESSED, DRILL_STATUS.FAILED],
};

export default {
  DRILL_LEVELS,
  DRILL_TYPES,
  level1Drills,
  level2Drills,
  level3Drills,
  level4Drills,
  level5Drills, 
  DRILL_STATUS,
  DRILL_STATUS_LABELS,
  DRILL_STATUS_COLORS,
  STATUS_TRANSITIONS,
};
