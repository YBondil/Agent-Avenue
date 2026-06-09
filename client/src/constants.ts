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

// Distinct accent color per agent for a playful, easily-scanned look.
export const AGENT_COLORS: Record<AgentType, string> = {
  agentDouble: '#6C5CE7', // indigo
  saboteur: '#FF5C7A',    // coral
  mercenaire: '#FF9F1C',  // amber
  risqueTout: '#EF4444',  // red
  cryptologue: '#10B981', // emerald
  sentinelle: '#00BCD4',  // cyan
  acolyte: '#F59E0B',     // gold
  taupe: '#8B5E3C',       // brown
};

export type EffectEntry = {
  label: string;
  one: string;
  two: string;
  three: string;
  total: number;
};

export const AGENT_EFFECTS: Record<AgentType, EffectEntry> = {
  agentDouble: { label: 'Agent Double',  one: '-1',     two: '+6',      three: '-1',     total: 6 },
  saboteur:    { label: 'Saboteur',       one: '-1',     two: '0',       three: '+2',     total: 6 },
  mercenaire:  { label: 'Mercenaire',     one: '+2',     two: '+1',      three: '+3',     total: 6 },
  risqueTout:  { label: 'Risque-tout',    one: '+3',     two: '+2',      three: 'DEFAITE',total: 6 },
  cryptologue: { label: 'Cryptologue',    one: '0',      two: '0',       three: 'VICTOIRE',total: 6 },
  sentinelle:  { label: 'Sentinelle',     one: '0',      two: '+2',      three: '+6',     total: 6 },
  acolyte:     { label: 'Acolyte',        one: '+4',     two: '-',       three: '-',      total: 1 },
  taupe:       { label: 'Taupe',          one: '-3',     two: '-',       three: '-',      total: 1 },
};

export const WIN_REASON_LABELS: Record<string, string> = {
  catch: 'Rattrapage du pion adverse',
  '3-crypto': '3 Cryptologues recrutes',
  '3-risque': '3 Risque-tout recrutes (defaite)',
  'hand-empty': 'Pioche epuisee',
};

export const BOARD_CELLS = 14;
