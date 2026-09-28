export const fonts = {
  display: 'Roboto_700Bold',
  displayItalic: 'Roboto_500Medium',
  displaySemibold: 'Roboto_500Medium',
  body: 'Roboto_400Regular',
  bodyBold: 'Roboto_500Medium',
  mono: 'Roboto_500Medium',
} as const;

export const type = {
  wordmark: { fontFamily: fonts.display, fontSize: 22, letterSpacing: 0.2, lineHeight: 26 },
  display: { fontFamily: fonts.display, fontSize: 28, letterSpacing: -0.4, lineHeight: 34 },
  course: { fontFamily: fonts.displaySemibold, fontSize: 22, letterSpacing: -0.2, lineHeight: 28 },
  title: { fontFamily: fonts.displaySemibold, fontSize: 18, letterSpacing: -0.2, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22 },
  bodyBold: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: fonts.body, fontSize: 12, letterSpacing: 0.1, lineHeight: 16 },
  overline: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.6,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },
};
