// Marché Noir card data for Mode Avancé. See reports/marche-noir-cards.md.
import type { BlackMarketType } from './types';

export type BMKind = 'immediate' | 'permanent';

export const BLACK_MARKET_KIND: Record<BlackMarketType, BMKind> = {
  // permanents (kept face-up, ongoing effect)
  cheffeDeMeute: 'permanent',
  planDesOperations: 'permanent',
  systemeDeSecurite: 'permanent',
  fuiteEnVoiture: 'permanent',
  cabaneObservation: 'permanent',
  superordinateur: 'permanent',
  dispositifDiversion: 'permanent',
  jumelleMalefique: 'permanent',
  // immediates (resolve once, then discarded)
  vehiculeSurveillance: 'immediate',
  ecranDeFumee: 'immediate',
  avantPoste: 'immediate',
  recrueSecrete: 'immediate',
  coupDouble: 'immediate',
  petitRepos: 'immediate',
  manipulationEsprit: 'immediate',
};

export const BLACK_MARKET_LABELS: Record<BlackMarketType, string> = {
  cheffeDeMeute: 'Cheffe de meute',
  planDesOperations: 'Plan des opérations',
  systemeDeSecurite: 'Système de sécurité',
  fuiteEnVoiture: 'Fuite en voiture',
  cabaneObservation: "Cabane d'observation",
  superordinateur: 'Superordinateur',
  dispositifDiversion: 'Dispositif de diversion',
  jumelleMalefique: 'Jumelle maléfique',
  vehiculeSurveillance: 'Véhicule de surveillance',
  ecranDeFumee: 'Écran de fumée',
  avantPoste: 'Avant-poste',
  recrueSecrete: 'Recrue secrète',
  coupDouble: 'Coup double',
  petitRepos: 'Petit repos',
  manipulationEsprit: "Manipulation de l'esprit",
};

export const ALL_BLACK_MARKET = Object.keys(BLACK_MARKET_KIND) as BlackMarketType[];

export function buildMarketDeck(): BlackMarketType[] {
  return [...ALL_BLACK_MARKET]; // 1 copy of each of the 15 cards
}

export const isPermanent = (c: BlackMarketType) => BLACK_MARKET_KIND[c] === 'permanent';
export const isImmediate = (c: BlackMarketType) => BLACK_MARKET_KIND[c] === 'immediate';

// Immediate cards that need a player choice before they can resolve.
export const INTERACTIVE_IMMEDIATE: BlackMarketType[] = [
  'recrueSecrete',
  'coupDouble',
  'petitRepos',
  'manipulationEsprit',
];
