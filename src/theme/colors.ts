import type { ThemeName } from '@/types';

export const palette = {
  paper: '#F6F4F0',
  paperLift: '#FFFFFF',
  ink: '#141414',
  inkMuted: '#6B6660',
  line: '#E2DDD6',
  sea: '#1A3D38',
  seaSoft: '#2F6F68',
  brass: '#8A6B1F',
  brassSoft: '#C4A35A',
  clay: '#B3471D',
  night: '#101412',
  nightLift: '#1A201C',
  fog: '#EDE8DF',
  fogMuted: '#9A9488',
  nightLine: '#2A322E',
  nightSea: '#8FBFB6',
  nightBrass: '#D4B45A',
  nightClay: '#E07A45',
};

export type ThemeColors = {
  background: string;
  surface: string;
  well: string;
  text: string;
  muted: string;
  line: string;
  accent: string;
  accentSoft: string;
  action: string;
  tabBar: string;
  webCanvas: string;
  overlay: string;
};

export const themes: Record<ThemeName, ThemeColors> = {
  light: {
    background: palette.paper,
    surface: palette.paperLift,
    well: '#E8E3DB',
    text: palette.ink,
    muted: palette.inkMuted,
    line: palette.line,
    accent: palette.sea,
    accentSoft: palette.seaSoft,
    action: palette.clay,
    tabBar: '#EFECE7',
    webCanvas: '#0E1614',
    overlay: 'rgba(20, 20, 20, 0.04)',
  },
  dark: {
    background: palette.night,
    surface: palette.nightLift,
    well: '#262E2A',
    text: palette.fog,
    muted: palette.fogMuted,
    line: palette.nightLine,
    accent: palette.nightSea,
    accentSoft: palette.nightBrass,
    action: palette.nightClay,
    tabBar: '#141A18',
    webCanvas: '#070A09',
    overlay: 'rgba(237, 232, 223, 0.06)',
  },
};
