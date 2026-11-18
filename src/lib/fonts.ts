import { Source_Serif_4, DM_Serif_Display, IBM_Plex_Sans } from 'next/font/google';

export const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif' });
export const display = DM_Serif_Display({ weight: '400', subsets: ['latin'], variable: '--font-display' });
export const sans = IBM_Plex_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-sans',
});
