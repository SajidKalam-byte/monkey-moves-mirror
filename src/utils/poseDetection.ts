import { PoseLandmarker, HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface HandLandmarks {
  landmarks: PoseLandmark[];
}

export interface DetectedPose {
  landmarks: PoseLandmark[];
  worldLandmarks: PoseLandmark[];
  leftHand?: HandLandmarks;
  rightHand?: HandLandmarks;
}

let poseLandmarker: PoseLandmarker | null = null;
let handLandmarker: HandLandmarker | null = null;

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

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  
  return poseLandmarker;
}

export function detectPose(video: HTMLVideoElement, timestamp: number): DetectedPose | null {
  if (!poseLandmarker) return null;
  
  const poseResults = poseLandmarker.detectForVideo(video, timestamp);
  
  if (poseResults.landmarks && poseResults.landmarks.length > 0) {
    const pose: DetectedPose = {
      landmarks: poseResults.landmarks[0] as PoseLandmark[],
      worldLandmarks: poseResults.worldLandmarks ? poseResults.worldLandmarks[0] as PoseLandmark[] : []
    };

    // Detect hands
    if (handLandmarker) {
      const handResults = handLandmarker.detectForVideo(video, timestamp);
      
      if (handResults.landmarks && handResults.landmarks.length > 0) {
        // MediaPipe returns hands but we need to determine left/right based on handedness
        handResults.landmarks.forEach((handLandmarks, index) => {
          const handedness = handResults.handednesses?.[index]?.[0];
          const isLeft = handedness?.categoryName === 'Left';
          
          if (isLeft) {
            pose.leftHand = { landmarks: handLandmarks as PoseLandmark[] };
          } else {
            pose.rightHand = { landmarks: handLandmarks as PoseLandmark[] };
          }
        });
      }
    }

    return pose;
  }
  
  return null;
}

export function getPoseLandmarker() {
  return poseLandmarker;
}
