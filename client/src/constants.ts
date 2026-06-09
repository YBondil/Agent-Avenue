import type { AgentType } from './types';

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
};

export const BOARD_CELLS = 14;
