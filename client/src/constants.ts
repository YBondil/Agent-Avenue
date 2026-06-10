import type { AgentType, BlackMarketType } from './types';

export const AGENT_LABELS: Record<AgentType, string> = {
  agentDouble: 'Agent Double',
  saboteur: 'Saboteur',
  mercenaire: 'Mercenaire',
  risqueTout: 'Risque-tout',
  cryptologue: 'Cryptologue',
  sentinelle: 'Sentinelle',
  acolyte: 'Acolyte',
  taupe: 'Taupe',
};

export const WIN_REASON_LABELS: Record<string, string> = {
  catch: 'Rattrapage du pion adverse',
  '3-crypto': '3 Cryptologues recrutes',
  '3-risque': '3 Risque-tout recrutes (defaite)',
  'hand-empty': 'Pioche epuisee',
  '3-risque-meute': '3 Risque-tout (Cheffe de meute)',
  '7-agents': '7 agents differents (Plan des operations)',
  maison: 'Adversaire sur votre Maison (Systeme de securite)',
};

export const BOARD_CELLS = 14;

// --- Mode Avancé ---
export const MARCHE_NOIR_CELLS = [2, 5, 9, 12];
export const MAISON: Record<'p1' | 'p2', number> = { p1: 0, p2: 7 };

// Image file slugs in /assets/cards/marcherNoir/<slug>.jpeg
export const BLACK_MARKET_SLUG: Record<BlackMarketType, string> = {
  cheffeDeMeute: 'cheffe-de-meute',
  planDesOperations: 'plan-des-operations',
  systemeDeSecurite: 'systeme-de-securite',
  fuiteEnVoiture: 'fuite-en-voiture',
  cabaneObservation: 'cabane-d-observation',
  superordinateur: 'superordinateur',
  dispositifDiversion: 'dispositif-de-diversion',
  jumelleMalefique: 'jumelle-malefique',
  vehiculeSurveillance: 'vehicule-de-surveillance',
  ecranDeFumee: 'ecran-de-fumee',
  avantPoste: 'avant-poste',
  recrueSecrete: 'recrue-secrete',
  coupDouble: 'coup-double',
  petitRepos: 'petit-repos',
  manipulationEsprit: 'manipulation-de-lesprit',
};

export const blackMarketArt = (c: BlackMarketType) =>
  `/assets/cards/marcherNoir/${BLACK_MARKET_SLUG[c]}.jpeg`;
export const BLACK_MARKET_BACK = '/assets/cards/marcherNoir/back.png';

export const BLACK_MARKET_LABELS: Record<BlackMarketType, string> = {
  cheffeDeMeute: 'Cheffe de meute',
  planDesOperations: 'Plan des operations',
  systemeDeSecurite: 'Systeme de securite',
  fuiteEnVoiture: 'Fuite en voiture',
  cabaneObservation: "Cabane d'observation",
  superordinateur: 'Superordinateur',
  dispositifDiversion: 'Dispositif de diversion',
  jumelleMalefique: 'Jumelle malefique',
  vehiculeSurveillance: 'Vehicule de surveillance',
  ecranDeFumee: 'Ecran de fumee',
  avantPoste: 'Avant-poste',
  recrueSecrete: 'Recrue secrete',
  coupDouble: 'Coup double',
  petitRepos: 'Petit repos',
  manipulationEsprit: "Manipulation de l'esprit",
};
