import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface DetectedPose {
  landmarks: PoseLandmark[];
  worldLandmarks: PoseLandmark[];
}

let poseLandmarker: PoseLandmarker | null = null;

export async function initializePoseDetection() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  
  return poseLandmarker;
}

export function detectPose(video: HTMLVideoElement, timestamp: number): DetectedPose | null {
  if (!poseLandmarker) return null;
  
  const results = poseLandmarker.detectForVideo(video, timestamp);
  
  if (results.landmarks && results.landmarks.length > 0) {
    return {
      landmarks: results.landmarks[0] as PoseLandmark[],
      worldLandmarks: results.worldLandmarks ? results.worldLandmarks[0] as PoseLandmark[] : []
    };
  }
  
  return null;
}

export function getPoseLandmarker() {
  return poseLandmarker;
}
