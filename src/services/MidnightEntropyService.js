/**
 * Arcade-game entropy adapter (local). Arcade entropy adapter.
 * Re-exports Midnight local entropy as the default service singleton.
 * Apache-2.0
 */
export { default, makeLocalEntropyProof, generateEntropyWithFallback } from '@/lib/midnight/localEntropy';
