export type Rewards = {
  stars: number;
  streak: number;
  solved: string[];
  focusCaught: string[];
};

export type CheckpointAward = {
  sceneId: string;
  sceneIndex: number;
  attempts: number;
  hintUsed: boolean;
  reteachUsed: boolean;
};

export function initialRewards(): Rewards {
  return { stars: 0, streak: 0, solved: [], focusCaught: [] };
}

export function isRewardScene(sceneIndex: number): boolean {
  return (sceneIndex + 1) % 3 !== 0;
}

export function checkpointStars(award: CheckpointAward): number {
  if (!isRewardScene(award.sceneIndex)) return 0;
  if (award.reteachUsed || award.attempts > 1) return 1;
  return award.hintUsed ? 2 : 3;
}

export function awardCheckpoint(rewards: Rewards, award: CheckpointAward): Rewards {
  if (rewards.solved.includes(award.sceneId)) return rewards;
  const firstTry = award.attempts === 1 && !award.hintUsed && !award.reteachUsed;
  return {
    ...rewards,
    stars: rewards.stars + checkpointStars(award),
    streak: firstTry ? rewards.streak + 1 : 0,
    solved: [...rewards.solved, award.sceneId],
  };
}

export function awardFocus(rewards: Rewards, sceneId: string, sceneIndex: number): Rewards {
  if (!isRewardScene(sceneIndex) || rewards.focusCaught.includes(sceneId)) return rewards;
  return { ...rewards, stars: rewards.stars + 1, focusCaught: [...rewards.focusCaught, sceneId] };
}
