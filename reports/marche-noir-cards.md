# Marché Noir cards (Mode Avancé)

Catalog of the 15 Marché Noir cards, transcribed from the sprites in
`client/public/assets/cards/marcherNoir/`. Each card is unique (1 copy).

Two capability types:
- **immediate** (lightning): resolve once on acquisition, then discard.
- **permanent** (infinity): kept face-up in the player's Marché Noir row; effect
  active for the rest of the game.

Acquired by stopping a pawn **exactly** on a Marché Noir corner case (also when
retreating). Crossing without stopping grants nothing. On acquisition you choose
1 of the 3 face-up market cards; it is immediately replaced from the pile.

| slug | name | type | effect |
|---|---|---|---|
| `cheffe-de-meute` | Cheffe de meute | permanent | At end of turn, if you have 3 Risque-tout in play, you WIN instead of losing. |
| `plan-des-operations` | Plan des opérations | permanent | At end of turn, if you have 7 different agents in play, you win. |
| `systeme-de-securite` | Système de sécurité | permanent | At end of turn, if the opponent is on your Maison case (your start cell), you win. |
| `fuite-en-voiture` | Fuite en voiture | permanent | When your pawn stops exactly on a Maison case, advance 3 more. |
| `cabane-d-observation` | Cabane d'observation | permanent | When you recruit a Mercenaire, advance 2 extra. |
| `superordinateur` | Superordinateur | permanent | When you recruit a Cryptologue, advance 3. |
| `dispositif-de-diversion` | Dispositif de diversion | permanent | When you recruit a Saboteur, advance instead of retreat (negate its move). |
| `jumelle-malefique` | Jumelle maléfique | permanent | When you recruit an Agent Double, move twice as far (forward or backward). |
| `vehicule-de-surveillance` | Véhicule de surveillance | immediate | Advance 1 case. |
| `ecran-de-fumee` | Écran de fumée | immediate | Recruit the top card of the Agent pile. |
| `avant-poste` | Avant-poste | immediate | Recruit a Sentinelle from your hand. |
| `recrue-secrete` | Recrue secrète | immediate | Recruit 1 agent from your hand different from those already in play. |
| `coup-double` | Coup double | immediate | Reveal 2 identical agents from hand, recruit 1, keep the other. |
| `petit-repos` | Petit repos | immediate | Take 1 agent from your play zone back to hand (no pawn move); you may recruit it immediately. |
| `manipulation-de-lesprit` | Manipulation de l'esprit | immediate | Take 1 agent the opponent has in play into your hand (no pawn move). Can strip a 3rd Cryptologue. |

## Implementation notes (rulebook pages 10-13)

- Board Mode Avancé face has Marché Noir cases in its 4 corners. On our 14-cell
  ring (houses at cell 0 = p1, cell 7 = p2), the 4 corner cases are chosen
  symmetrically and defined as `MARCHE_NOIR_CELLS` in the engine.
- Permanent capabilities do NOT apply to the Agent card recruited on the same
  acquisition; they apply from then on.
- "Recruit"-trigger permanents (cabane, superordinateur, diversion, jumelle)
  fire on any recruit of that agent, including via another card's capacity.
- Resolve a capacity fully before anything else. An immediate recruit can land
  on another Marché Noir case and chain a new acquisition.
- Win conditions: the 3 permanent win cards add to the 3 base conditions; ties
  always go to the active player.
- Movement-modifier order on a recruit: base delta -> diversion negate (saboteur)
  -> jumelle double (agentDouble) -> cabane +2 (mercenaire) / superordinateur set
  +3 (cryptologue). Then if the pawn lands on a Maison case, Fuite en voiture
  adds +3.
- If a capacity cannot resolve (e.g. no matching card in hand), it is ignored.
</content>
