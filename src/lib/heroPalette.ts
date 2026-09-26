// Paleta de colores para las frases del hero. Los tokens principales
// corresponden a la paleta del proyecto (tailwind.config.ts). Se puede
// además usar un color personalizado (#hex) desde el editor.

export interface HeroColorOption {
  token: string;   // identificador guardado (p. ej. 'primary-700')
  label: string;   // nombre visible en el editor
  css: string;     // color CSS real para renderizar
}

// Paleta principal (siempre disponible en el editor).
export const HERO_PALETTE: HeroColorOption[] = [
  { token: 'primary-700', label: 'Vino oscuro', css: '#450b3a' },
  { token: 'primary-600', label: 'Vino (marca)', css: '#8B1A3A' },
  { token: 'primary-400', label: 'Rosa medio', css: '#c77ba0' },
  { token: 'primary-200', label: 'Rosa', css: '#D299A0' },
  { token: 'rosaPowder', label: 'Rosa polvo', css: '#F4DCDC' },
  { token: 'gray-700', label: 'Gris', css: '#374151' },
  { token: 'white', label: 'Blanco', css: '#ffffff' },
];

const TOKEN_TO_CSS: Record<string, string> = HERO_PALETTE.reduce(
  (acc, o) => { acc[o.token] = o.css; return acc; },
  {} as Record<string, string>,
);

/**
 * Resuelve un token de color (o color CSS crudo) a un valor CSS usable.
 * - '' o undefined -> color por defecto (gris de párrafo).
 * - token de paleta -> su css.
 * - cualquier otra cosa (p. ej. '#8B1A3A' o 'rgb(...)') -> se usa tal cual.
 */
export function resolveHeroColor(color: string | undefined, fallback = '#6b7280'): string {
  if (!color) return fallback;
  if (TOKEN_TO_CSS[color]) return TOKEN_TO_CSS[color];
  return color; // color CSS personalizado
}
