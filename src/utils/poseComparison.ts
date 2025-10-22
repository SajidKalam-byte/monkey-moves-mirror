import { DetectedPose, PoseLandmark } from './poseDetection';

// Key body joints to compare for accuracy
const KEY_LANDMARKS = [
  11, 12, // Shoulders
  13, 14, // Elbows
  15, 16, // Wrists
  23, 24, // Hips
  25, 26, // Knees
  27, 28, // Ankles
];

/**
 * Calculate cosine similarity between two poses
 * Returns a value between 0 (completely different) and 1 (identical)
 */
export function calculatePoseSimilarity(pose1: DetectedPose | null, pose2: DetectedPose | null): number {
  if (!pose1 || !pose2) return 0;
  
  const landmarks1 = pose1.landmarks;
  const landmarks2 = pose2.landmarks;
  
  if (!landmarks1 || !landmarks2) return 0;
  
  let totalSimilarity = 0;
  let validComparisons = 0;
  
  // Compare key landmarks
  for (const idx of KEY_LANDMARKS) {
    if (idx >= landmarks1.length || idx >= landmarks2.length) continue;
    
    const l1 = landmarks1[idx];
    const l2 = landmarks2[idx];
    
    // Skip if visibility is too low
    if ((l1.visibility || 1) < 0.5 || (l2.visibility || 1) < 0.5) continue;
    
    // Calculate angular similarity
    const similarity = calculateJointSimilarity(l1, l2);
    totalSimilarity += similarity;
    validComparisons++;
  }
  
  if (validComparisons === 0) return 0;
  
  const averageSimilarity = totalSimilarity / validComparisons;
  
  // Convert to percentage (0-100)
  return Math.round(averageSimilarity * 100);
}

/**
 * Calculate similarity between two landmarks using position difference
 */
function calculateJointSimilarity(l1: PoseLandmark, l2: PoseLandmark): number {
  // Calculate Euclidean distance in normalized space
  const dx = l1.x - l2.x;
  const dy = l1.y - l2.y;
  const dz = (l1.z || 0) - (l2.z || 0);
  
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz * 0.3); // Z less important
  
  // Convert distance to similarity (closer = more similar)
  // Distances > 0.3 are considered very different
  const similarity = Math.max(0, 1 - (distance / 0.3));
  
  return similarity;
}

/**
 * Get feedback message based on accuracy score
 */
export function getFeedbackMessage(accuracy: number): { message: string; color: string } {
  if (accuracy >= 90) {
    return { message: 'Perfect! 🎯', color: 'text-green-500' };
  } else if (accuracy >= 75) {
    return { message: 'Great! 🌟', color: 'text-blue-500' };
  } else if (accuracy >= 60) {
    return { message: 'Good! 👍', color: 'text-yellow-500' };
  } else if (accuracy >= 40) {
    return { message: 'Keep trying! 💪', color: 'text-orange-500' };
  } else {
    return { message: 'Try again! 🎯', color: 'text-red-500' };
  }
}

/**
 * Check if pose should trigger celebration
 */
export function shouldCelebrate(accuracy: number): boolean {
  return accuracy >= 85;
}

/**
 * Define reference poses for users to match
 */
export interface ReferencePose {
  id: string;
  name: string;
  emoji: string;
  description: string;
  landmarks: PoseLandmark[];
}

// T-Pose reference
export const REFERENCE_POSES: ReferencePose[] = [
  {
    id: 'tpose',
    name: 'T-Pose',
    emoji: '🙆',
    description: 'Stand with arms extended horizontally',
    landmarks: createTPose(),
  },
  {
    id: 'victory',
    name: 'Victory',
    emoji: '✌️',
    description: 'Raise both arms up in a V shape',
    landmarks: createVictoryPose(),
  },
  {
    id: 'warrior',
    name: 'Warrior',
    emoji: '🧘',
    description: 'Warrior yoga pose - one arm up, one down',
    landmarks: createWarriorPose(),
  },
];

function createTPose(): PoseLandmark[] {
  // Simplified T-pose landmarks (normalized coordinates)
  const landmarks: PoseLandmark[] = new Array(33).fill(null).map((_, i) => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 1,
  }));
  
  // Shoulders
  landmarks[11] = { x: 0.4, y: 0.35, z: 0, visibility: 1 };
  landmarks[12] = { x: 0.6, y: 0.35, z: 0, visibility: 1 };
  
  // Elbows (extended horizontally)
  landmarks[13] = { x: 0.25, y: 0.35, z: 0, visibility: 1 };
  landmarks[14] = { x: 0.75, y: 0.35, z: 0, visibility: 1 };
  
  // Wrists
  landmarks[15] = { x: 0.1, y: 0.35, z: 0, visibility: 1 };
  landmarks[16] = { x: 0.9, y: 0.35, z: 0, visibility: 1 };
  
  // Hips
  landmarks[23] = { x: 0.45, y: 0.55, z: 0, visibility: 1 };
  landmarks[24] = { x: 0.55, y: 0.55, z: 0, visibility: 1 };
  
  // Knees
  landmarks[25] = { x: 0.45, y: 0.75, z: 0, visibility: 1 };
  landmarks[26] = { x: 0.55, y: 0.75, z: 0, visibility: 1 };
  
  // Ankles
  landmarks[27] = { x: 0.45, y: 0.95, z: 0, visibility: 1 };
  landmarks[28] = { x: 0.55, y: 0.95, z: 0, visibility: 1 };
  
  return landmarks;
}

function createVictoryPose(): PoseLandmark[] {
  const landmarks: PoseLandmark[] = new Array(33).fill(null).map((_, i) => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 1,
  }));
  
  // Shoulders
  landmarks[11] = { x: 0.4, y: 0.35, z: 0, visibility: 1 };
  landmarks[12] = { x: 0.6, y: 0.35, z: 0, visibility: 1 };
  
  // Elbows (raised up)
  landmarks[13] = { x: 0.35, y: 0.2, z: 0, visibility: 1 };
  landmarks[14] = { x: 0.65, y: 0.2, z: 0, visibility: 1 };
  
  // Wrists (above head in V shape)
  landmarks[15] = { x: 0.3, y: 0.1, z: 0, visibility: 1 };
  landmarks[16] = { x: 0.7, y: 0.1, z: 0, visibility: 1 };
  
  // Hips
  landmarks[23] = { x: 0.45, y: 0.55, z: 0, visibility: 1 };
  landmarks[24] = { x: 0.55, y: 0.55, z: 0, visibility: 1 };
  
  // Knees
  landmarks[25] = { x: 0.45, y: 0.75, z: 0, visibility: 1 };
  landmarks[26] = { x: 0.55, y: 0.75, z: 0, visibility: 1 };
  
  // Ankles
  landmarks[27] = { x: 0.45, y: 0.95, z: 0, visibility: 1 };
  landmarks[28] = { x: 0.55, y: 0.95, z: 0, visibility: 1 };
  
  return landmarks;
}

function createWarriorPose(): PoseLandmark[] {
  const landmarks: PoseLandmark[] = new Array(33).fill(null).map((_, i) => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 1,
  }));
  
  // Shoulders
  landmarks[11] = { x: 0.4, y: 0.35, z: 0, visibility: 1 };
  landmarks[12] = { x: 0.6, y: 0.35, z: 0, visibility: 1 };
  
  // Left elbow up
  landmarks[13] = { x: 0.35, y: 0.2, z: 0, visibility: 1 };
  // Right elbow down
  landmarks[14] = { x: 0.65, y: 0.5, z: 0, visibility: 1 };
  
  // Left wrist up
  landmarks[15] = { x: 0.3, y: 0.1, z: 0, visibility: 1 };
  // Right wrist down
  landmarks[16] = { x: 0.7, y: 0.65, z: 0, visibility: 1 };
  
  // Hips
  landmarks[23] = { x: 0.45, y: 0.55, z: 0, visibility: 1 };
  landmarks[24] = { x: 0.55, y: 0.55, z: 0, visibility: 1 };
  
  // Knees
  landmarks[25] = { x: 0.45, y: 0.75, z: 0, visibility: 1 };
  landmarks[26] = { x: 0.55, y: 0.75, z: 0, visibility: 1 };
  
  // Ankles
  landmarks[27] = { x: 0.45, y: 0.95, z: 0, visibility: 1 };
  landmarks[28] = { x: 0.55, y: 0.95, z: 0, visibility: 1 };
  
  return landmarks;
}
