import { Participant, DrawPair } from './types';
import crypto from 'crypto';

/**
 * Fisher-Yates shuffle array in place
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Solves Secret Santa draw using randomized backtracking to satisfy all constraints:
 * 1. Nobody draws themselves (giver !== receiver).
 * 2. Exclusions respected (e.g. couples, spouses).
 * 3. Exact bijection (every participant gives once and receives once).
 * 4. Avoids 2-person reciprocal loops when possible (if participants >= 4).
 */
export function generateDraw(
  participants: Participant[],
  options?: {
    allowReciprocal?: boolean; // If false, avoids A -> B and B -> A when n >= 4
    maxAttempts?: number;
  }
): DrawPair[] {
  if (participants.length < 3) {
    throw new Error('Au moins 3 participants sont requis pour le tirage au sort.');
  }

  // Check for obvious impossibility:
  // e.g. someone excluded all other participants
  for (const p of participants) {
    const exclusions = new Set(p.exclusions || []);
    exclusions.add(p.id); // Cannot draw self
    const validReceiversCount = participants.filter((candidate) => !exclusions.has(candidate.id)).length;
    if (validReceiversCount === 0) {
      throw new Error(
        `Impossible de réaliser le tirage : "${p.name}" a exclu tous les autres participants ou n'a aucun destinataire possible.`
      );
    }
  }

  const n = participants.length;
  const allowReciprocal = options?.allowReciprocal ?? (n <= 3);

  // Try finding a valid matching with backtracking
  // We run multiple randomized attempts to guarantee fair, uniform randomness
  const maxAttempts = options?.maxAttempts ?? 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const randomizedGivers = shuffle(participants);
    const assignedReceivers = new Map<string, Participant>(); // giverId -> receiver
    const assignedGivers = new Set<string>(); // receiverIds already assigned

    const success = backtrack(0, randomizedGivers, assignedReceivers, assignedGivers, allowReciprocal);

    if (success) {
      // Build DrawPairs
      const pairs: DrawPair[] = participants.map((giver) => {
        const receiver = assignedReceivers.get(giver.id)!;
        const token = crypto.randomUUID();
        return {
          giverId: giver.id,
          giverName: giver.name,
          giverEmail: giver.email,
          receiverId: receiver.id,
          receiverName: receiver.name,
          receiverEmail: receiver.email,
          token,
          revealed: false,
        };
      });

      return pairs;
    }
  }

  // If no solution found without reciprocal, try relaxing the reciprocal constraint if n >= 4
  if (!allowReciprocal) {
    return generateDraw(participants, { allowReciprocal: true, maxAttempts: 500 });
  }

  throw new Error(
    "Impossible de trouver une combinaison valide avec les exclusions actuelles. Veuillez réduire les exclusions et réessayer."
  );
}

function backtrack(
  index: number,
  givers: Participant[],
  assignedReceivers: Map<string, Participant>,
  assignedGivers: Set<string>,
  allowReciprocal: boolean
): boolean {
  if (index === givers.length) {
    return true;
  }

  const currentGiver = givers[index];
  const exclusions = new Set(currentGiver.exclusions || []);

  // Eligible receivers:
  // 1. Not current giver (no self-gift)
  // 2. Not already assigned to someone else
  // 3. Not in exclusions
  const candidates = shuffle(givers).filter((candidate) => {
    if (candidate.id === currentGiver.id) return false;
    if (assignedGivers.has(candidate.id)) return false;
    if (exclusions.has(candidate.id)) return false;

    // Optional reciprocal check (if A gives to B, B shouldn't give to A if n >= 4)
    if (!allowReciprocal && givers.length >= 4) {
      const candidateReceiver = assignedReceivers.get(candidate.id);
      if (candidateReceiver && candidateReceiver.id === currentGiver.id) {
        // This would create a 2-cycle. Only reject if not forced.
        return false;
      }
    }

    return true;
  });

  for (const candidate of candidates) {
    assignedReceivers.set(currentGiver.id, candidate);
    assignedGivers.add(candidate.id);

    if (backtrack(index + 1, givers, assignedReceivers, assignedGivers, allowReciprocal)) {
      return true;
    }

    // Backtrack
    assignedReceivers.delete(currentGiver.id);
    assignedGivers.delete(candidate.id);
  }

  return false;
}
