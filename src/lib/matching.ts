import { LostItem, FoundItem } from '@/types/admin';

export function computeMatchScore(
  lost: Partial<LostItem> | Record<string, string | null | undefined>,
  found: Partial<FoundItem> | Record<string, string | null | undefined>
): number {
  let score = 0;
  const maxScore = 100;

  if (lost.brand && found.brand && String(lost.brand).toLowerCase() === String(found.brand).toLowerCase()) {
    score += 40;
  }

  if (lost.item_name && found.item_name) {
    const lostName = String(lost.item_name).toLowerCase();
    const foundName = String(found.item_name).toLowerCase();
    if (lostName === foundName) {
      score += 30;
    } else if (lostName.includes(foundName) || foundName.includes(lostName)) {
      score += 20;
    }
  }

  if (lost.color && found.color && String(lost.color).toLowerCase() === String(found.color).toLowerCase()) {
    score += 20;
  }

  if (lost.location && found.location) {
    const lostLoc = String(lost.location).toLowerCase();
    const foundLoc = String(found.location).toLowerCase();
    if (lostLoc === foundLoc) {
      score += 10;
    } else if (lostLoc.includes(foundLoc) || foundLoc.includes(lostLoc)) {
      score += 5;
    }
  }

  return (score / maxScore) * 100;
}