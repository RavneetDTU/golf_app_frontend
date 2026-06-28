/**
 * THE BAANIGANS — Official Course Data
 * Source: Physical scorecard, Yellow tees (standard men's tee)
 * Par: 72 (36 out, 36 in)
 * SI values: 1–18, no duplicates
 *
 * This is the single source of truth for course hole data.
 * Do NOT modify these values without a new certified patch.
 * Do NOT make Par or SI editable by users anywhere in the app.
 */
export const COURSE_HOLES = [
  { hole: 1,  par: 4, si: 5  },
  { hole: 2,  par: 4, si: 9  },
  { hole: 3,  par: 3, si: 11 },
  { hole: 4,  par: 5, si: 17 },
  { hole: 5,  par: 4, si: 7  },
  { hole: 6,  par: 3, si: 13 },
  { hole: 7,  par: 4, si: 1  },
  { hole: 8,  par: 5, si: 15 },
  { hole: 9,  par: 4, si: 3  },
  { hole: 10, par: 4, si: 6  },
  { hole: 11, par: 3, si: 18 },
  { hole: 12, par: 5, si: 16 },
  { hole: 13, par: 4, si: 4  },
  { hole: 14, par: 4, si: 12 },
  { hole: 15, par: 4, si: 2  },
  { hole: 16, par: 3, si: 10 },
  { hole: 17, par: 4, si: 8  },
  { hole: 18, par: 5, si: 14 },
];

/**
 * Convenience: total par for the course
 */
export const COURSE_TOTAL_PAR = 72;
export const COURSE_FRONT_PAR = 36;
export const COURSE_BACK_PAR = 36;
