import { Component, JSX } from 'solid-js';
import type { AgentType } from '../types';

// Minimalist vector animal heads, one per agent. Drawn on a 64x64 grid and
// scaled to fill the card art area. Natural-ish colors keep them readable.
const ICONS: Record<AgentType, () => JSX.Element> = {
  // Renard (fox)
  agentDouble: () => (
    <>
      <polygon points="12,14 26,30 14,34" fill="#e07a32" />
      <polygon points="52,14 38,30 50,34" fill="#e07a32" />
      <polygon points="16,18 24,29 18,30" fill="#fbe3cf" />
      <polygon points="48,18 40,29 46,30" fill="#fbe3cf" />
      <path d="M32 22 L50 30 Q42 50 32 54 Q22 50 14 30 Z" fill="#e8843a" />
      <path d="M32 38 L42 36 Q38 50 32 54 Q26 50 22 36 Z" fill="#fbe3cf" />
      <circle cx="25" cy="34" r="2.6" fill="#2a2118" />
      <circle cx="39" cy="34" r="2.6" fill="#2a2118" />
      <path d="M32 44 l-3 -3 h6 z" fill="#2a2118" />
    </>
  ),
  // Blaireau (badger): white face with black eye-stripes
  saboteur: () => (
    <>
      <ellipse cx="32" cy="34" rx="18" ry="20" fill="#f2f0ea" />
      <circle cx="18" cy="18" r="5" fill="#2b2b2b" />
      <circle cx="46" cy="18" r="5" fill="#2b2b2b" />
      <path d="M22 14 Q26 40 24 52 L18 52 Q16 34 18 14 Z" fill="#2b2b2b" />
      <path d="M42 14 Q38 40 40 52 L46 52 Q48 34 46 14 Z" fill="#2b2b2b" />
      <circle cx="24" cy="32" r="2.4" fill="#fff" />
      <circle cx="40" cy="32" r="2.4" fill="#fff" />
      <ellipse cx="32" cy="46" rx="4" ry="3" fill="#2b2b2b" />
    </>
  ),
  // Écureuil (squirrel): head with a big curled bushy tail
  mercenaire: () => (
    <>
      <path d="M46 54 Q64 44 54 22 Q48 8 36 12 Q50 16 50 30 Q50 44 38 50 Z" fill="#a9703c" />
      <circle cx="26" cy="32" r="16" fill="#bb8049" />
      <ellipse cx="18" cy="18" rx="6" ry="7" fill="#bb8049" />
      <ellipse cx="18" cy="19" rx="3" ry="4" fill="#e3c39a" />
      <circle cx="22" cy="30" r="2.8" fill="#2a2118" />
      <circle cx="14" cy="36" r="2.4" fill="#2a2118" />
      <path d="M16 40 l-3 2 m3 -2 l-1 3" stroke="#2a2118" stroke-width="1" />
      <rect x="20" y="40" width="3" height="5" rx="1.5" fill="#f4f1e6" />
    </>
  ),
  // Loup (wolf)
  risqueTout: () => (
    <>
      <polygon points="14,12 24,30 12,32" fill="#8a93a0" />
      <polygon points="50,12 40,30 52,32" fill="#8a93a0" />
      <polygon points="17,17 23,29 16,29" fill="#cfd6dd" />
      <polygon points="47,17 41,29 48,29" fill="#cfd6dd" />
      <path d="M32 20 L48 30 Q44 46 32 56 Q20 46 16 30 Z" fill="#9aa3b0" />
      <path d="M32 40 L40 38 Q37 50 32 56 Q27 50 24 38 Z" fill="#e7ebef" />
      <circle cx="25" cy="33" r="2.6" fill="#1f2630" />
      <circle cx="39" cy="33" r="2.6" fill="#1f2630" />
      <path d="M32 46 l-3 -3 h6 z" fill="#1f2630" />
    </>
  ),
  // Chouette (owl)
  cryptologue: () => (
    <>
      <polygon points="14,12 22,22 12,24" fill="#7a5a36" />
      <polygon points="50,12 42,22 52,24" fill="#7a5a36" />
      <ellipse cx="32" cy="36" rx="19" ry="20" fill="#8a6a40" />
      <circle cx="24" cy="30" r="9" fill="#f3ead4" />
      <circle cx="40" cy="30" r="9" fill="#f3ead4" />
      <circle cx="24" cy="30" r="4.5" fill="#caa15a" />
      <circle cx="40" cy="30" r="4.5" fill="#caa15a" />
      <circle cx="24" cy="30" r="2.2" fill="#1c150c" />
      <circle cx="40" cy="30" r="2.2" fill="#1c150c" />
      <polygon points="32,34 28,40 36,40" fill="#d9a441" />
      <path d="M20 50 q12 8 24 0" stroke="#6f5230" stroke-width="2" fill="none" />
    </>
  ),
  // Pigeon (sentinelle)
  sentinelle: () => (
    <>
      <ellipse cx="34" cy="40" rx="18" ry="14" fill="#9bb0c4" />
      <path d="M30 40 Q44 34 50 44 Q40 48 30 44 Z" fill="#7e95ab" />
      <circle cx="22" cy="24" r="11" fill="#aebfce" />
      <circle cx="19" cy="22" r="2.4" fill="#1f2630" />
      <polygon points="10,24 18,22 18,27" fill="#d9a441" />
      <ellipse cx="22" cy="17" rx="4" ry="3" fill="#5fc3c9" opacity="0.85" />
      <path d="M30 53 l-3 5 m9 -5 l3 5" stroke="#d9a441" stroke-width="2" />
    </>
  ),
  // Chien (dog / acolyte)
  acolyte: () => (
    <>
      <path d="M14 22 Q8 40 18 50 Q22 38 24 30 Z" fill="#9a6b3f" />
      <path d="M50 22 Q56 40 46 50 Q42 38 40 30 Z" fill="#9a6b3f" />
      <ellipse cx="32" cy="34" rx="17" ry="17" fill="#c08a52" />
      <ellipse cx="32" cy="46" rx="9" ry="8" fill="#e4cba6" />
      <circle cx="25" cy="31" r="2.8" fill="#2a2118" />
      <circle cx="39" cy="31" r="2.8" fill="#2a2118" />
      <ellipse cx="32" cy="42" rx="3.5" ry="2.8" fill="#2a2118" />
      <path d="M32 45 q-4 6 -7 7 m7 -7 q4 6 7 7" stroke="#7a5230" stroke-width="1.4" fill="none" />
    </>
  ),
  // Taupe (mole)
  taupe: () => (
    <>
      <ellipse cx="32" cy="34" rx="18" ry="18" fill="#4a4550" />
      <ellipse cx="32" cy="44" rx="9" ry="7" fill="#d98a9a" />
      <circle cx="32" cy="42" r="3" fill="#7a4350" />
      <circle cx="26" cy="32" r="1.8" fill="#1c1a20" />
      <circle cx="38" cy="32" r="1.8" fill="#1c1a20" />
      <path d="M10 40 l8 4 m-8 0 l8 0 m-7 -6 l7 3" stroke="#d98a9a" stroke-width="2.4" stroke-linecap="round" />
      <path d="M54 40 l-8 4 m8 0 l-8 0 m7 -6 l-7 3" stroke="#d98a9a" stroke-width="2.4" stroke-linecap="round" />
    </>
  ),
};

interface AgentIconProps {
  type: AgentType;
  class?: string;
}

const AgentIcon: Component<AgentIconProps> = (props) => {
  return (
    <svg viewBox="0 0 64 64" class={props.class} aria-hidden="true">
      {ICONS[props.type]()}
    </svg>
  );
};

export default AgentIcon;
