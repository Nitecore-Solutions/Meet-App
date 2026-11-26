/**
 * PagalPagal design language.
 *
 * Warm coral CTAs, a playful pink accent, deep plum ink and airy lavender
 * surfaces keep the dating experience lively without losing readability.
 */
export const colors = {
  primary: "#FF5A1F",
  primaryDark: "#E2430C",
  primaryDeep: "#B93406",
  primarySoft: "#FFF0E8",
  primaryTint: "#FFF8F4",

  secondary: "#1967F2",
  secondaryDark: "#0E4FC6",
  secondarySoft: "#EAF1FF",

  accent: "#F72472",
  accentDark: "#D80E5B",
  accentSoft: "#FFEAF2",

  violet: "#6C4BFF",
  violetSoft: "#EFEAFF",

  success: "#16A45F",
  successDark: "#0B7D47",
  successSoft: "#E8F8EF",

  danger: "#E5484D",
  dangerDark: "#BE3438",
  dangerSoft: "#FDECEC",

  warning: "#EE9B16",
  warningSoft: "#FFF5E3",

  ink: "#171522",
  body: "#454152",
  muted: "#787384",
  faint: "#A6A0B1",
  line: "#ECE8F0",
  lineSoft: "#F4F1F7",
  canvas: "#FAF9FC",
  surface: "#FFFFFF",
  lavender: "#ECE8F7",
  lavenderDeep: "#E2DDF3",
  disabled: "#CBC6D4",

  overlay: "rgba(17, 13, 27, 0.55)",
  overlaySoft: "rgba(17, 13, 27, 0.10)",
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 26,
  xxxl: 34,
} as const;

export const shadow = {
  card: {
    shadowColor: "#281B3C",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  raised: {
    shadowColor: "#21162F",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  soft: {
    shadowColor: "#281B3C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 1,
  },
} as const;

export const layout = {
  screenPadding: 20,
  tabBarHeight: 62,
  headerHeight: 56,
} as const;

export const type = {
  display: { fontSize: 34, lineHeight: 41, fontWeight: "800" as const },
  h1: { fontSize: 26, lineHeight: 33, fontWeight: "800" as const },
  h2: { fontSize: 21, lineHeight: 27, fontWeight: "800" as const },
  title: { fontSize: 17, lineHeight: 23, fontWeight: "700" as const },
  body: { fontSize: 14, lineHeight: 21, fontWeight: "500" as const },
  small: { fontSize: 12, lineHeight: 17, fontWeight: "500" as const },
  micro: { fontSize: 10.5, lineHeight: 14, fontWeight: "600" as const },
} as const;
