import { useEffect, useRef } from 'react';
import { DetectedPose } from '@/utils/poseDetection';

interface AvatarRendererProps {
  pose: DetectedPose | null;
  avatarType: string;
}

const AvatarRenderer = ({ pose, avatarType }: AvatarRendererProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!pose || !pose.landmarks) return;

    const landmarks = pose.landmarks;
    const w = canvas.width;
    const h = canvas.height;

    // Avatar colors based on type
    const avatarConfig = {
      monkey: { primary: '#8B4513', secondary: '#DEB887', accent: '#FF69B4', skin: '#F4D0A8' },
      human: { primary: '#FFD1A4', secondary: '#FF9A76', accent: '#4A90E2', skin: '#FFE4C4' },
      cat: { primary: '#FFA500', secondary: '#FFD700', accent: '#228B22', skin: '#FFE4B5' },
      dog: { primary: '#D2691E', secondary: '#F4A460', accent: '#FF6347', skin: '#FFDAB9' },
      bird: { primary: '#00CED1', secondary: '#FFD700', accent: '#FF1493', skin: '#87CEEB' }
    };

    const colors = avatarConfig[avatarType as keyof typeof avatarConfig] || avatarConfig.monkey;

    // Helper to draw limb with smooth gradient
    const drawLimb = (start: number, end: number, thickness: number, color: string) => {
      if (landmarks[start] && landmarks[end]) {
        const startX = landmarks[start].x * w;
        const startY = landmarks[start].y * h;
        const endX = landmarks[end].x * w;
        const endY = landmarks[end].y * h;

        const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, colors.secondary);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 5;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };

    // Helper to draw joint with glow
    const drawJoint = (index: number, radius: number, color: string) => {
      if (landmarks[index]) {
        const x = landmarks[index].x * w;
        const y = landmarks[index].y * h;

        // Glow effect
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, 2 * Math.PI);
        ctx.fillStyle = color + '40';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    // Draw cartoon fingers
    const drawHand = (handLandmarks: any, handColor: string) => {
      if (!handLandmarks || !handLandmarks.landmarks) return;

      const hand = handLandmarks.landmarks;
      
      // Finger connections (each finger has 4 segments)
      const fingers = [
        [0, 1, 2, 3, 4],     // Thumb
        [0, 5, 6, 7, 8],     // Index
        [0, 9, 10, 11, 12],  // Middle
        [0, 13, 14, 15, 16], // Ring
        [0, 17, 18, 19, 20]  // Pinky
      ];

      // Draw palm
      ctx.beginPath();
      ctx.moveTo(hand[0].x * w, hand[0].y * h);
      [5, 9, 13, 17].forEach(i => {
        if (hand[i]) ctx.lineTo(hand[i].x * w, hand[i].y * h);
      });
      ctx.closePath();
      ctx.fillStyle = handColor + 'CC';
      ctx.fill();

      // Draw fingers
      fingers.forEach((finger, fingerIndex) => {
        for (let i = 0; i < finger.length - 1; i++) {
          if (hand[finger[i]] && hand[finger[i + 1]]) {
            const startX = hand[finger[i]].x * w;
            const startY = hand[finger[i]].y * h;
            const endX = hand[finger[i + 1]].x * w;
            const endY = hand[finger[i + 1]].y * h;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = handColor;
            ctx.lineWidth = fingerIndex === 0 ? 8 : 6; // Thumb thicker
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        }

        // Draw fingertips
        const tipIndex = finger[finger.length - 1];
        if (hand[tipIndex]) {
          ctx.beginPath();
          ctx.arc(hand[tipIndex].x * w, hand[tipIndex].y * h, fingerIndex === 0 ? 6 : 5, 0, 2 * Math.PI);
          ctx.fillStyle = colors.accent;
          ctx.fill();
        }
      });

      // Draw knuckles
      [1, 5, 9, 13, 17].forEach(i => {
        if (hand[i]) {
          ctx.beginPath();
          ctx.arc(hand[i].x * w, hand[i].y * h, 4, 0, 2 * Math.PI);
          ctx.fillStyle = colors.accent;
          ctx.fill();
        }
      });
    };

    // Draw body structure with gradients
    // Torso
    drawLimb(11, 12, 24, colors.primary);
    drawLimb(11, 23, 20, colors.primary);
    drawLimb(12, 24, 20, colors.primary);
    drawLimb(23, 24, 22, colors.primary);

    // Arms
    drawLimb(11, 13, 16, colors.secondary);
    drawLimb(13, 15, 14, colors.secondary);
    drawLimb(12, 14, 16, colors.secondary);
    drawLimb(14, 16, 14, colors.secondary);

    // Legs
    drawLimb(23, 25, 18, colors.secondary);
    drawLimb(25, 27, 16, colors.secondary);
    drawLimb(24, 26, 18, colors.secondary);
    drawLimb(26, 28, 16, colors.secondary);

    // Head with improved cartoon style
    if (landmarks[0]) {
      const headX = landmarks[0].x * w;
      const headY = landmarks[0].y * h;
      const headSize = 45;

      if (avatarType === 'monkey') {
        // Monkey face with depth
        const gradient = ctx.createRadialGradient(headX, headY, 0, headX, headY, headSize);
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(1, colors.primary + 'CC');
        
        ctx.beginPath();
        ctx.arc(headX, headY, headSize, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Face area
        ctx.beginPath();
        ctx.arc(headX, headY + 8, headSize * 0.7, 0, 2 * Math.PI);
        ctx.fillStyle = colors.skin;
        ctx.fill();
        
        // Ears with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        [-1, 1].forEach(side => {
          ctx.beginPath();
          ctx.arc(headX + (side * headSize), headY, headSize * 0.4, 0, 2 * Math.PI);
          ctx.fillStyle = colors.primary;
          ctx.fill();
        });
        ctx.shadowBlur = 0;
        
        // Eyes with shine
        [-15, 15].forEach(offsetX => {
          // White of eye
          ctx.beginPath();
          ctx.arc(headX + offsetX, headY - 5, 8, 0, 2 * Math.PI);
          ctx.fillStyle = '#FFF';
          ctx.fill();
          
          // Pupil
          ctx.beginPath();
          ctx.arc(headX + offsetX, headY - 5, 5, 0, 2 * Math.PI);
          ctx.fillStyle = '#000';
          ctx.fill();
          
          // Shine
          ctx.beginPath();
          ctx.arc(headX + offsetX - 2, headY - 7, 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#FFF';
          ctx.fill();
        });

        // Nose
        ctx.beginPath();
        ctx.arc(headX, headY + 8, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#000';
        ctx.fill();

        // Smile
        ctx.beginPath();
        ctx.arc(headX, headY + 10, 18, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.stroke();

      } else if (avatarType === 'cat') {
        // Cat face with gradients
        const gradient = ctx.createRadialGradient(headX, headY, 0, headX, headY, headSize);
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(1, colors.primary + 'DD');
        
        ctx.beginPath();
        ctx.arc(headX, headY, headSize, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Triangular ears with gradient
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        [-1, 1].forEach(side => {
          ctx.beginPath();
          ctx.moveTo(headX + (side * headSize * 0.7), headY - headSize * 0.5);
          ctx.lineTo(headX + (side * headSize * 0.3), headY - headSize);
          ctx.lineTo(headX + (side * headSize * 0.5), headY - headSize * 0.3);
          ctx.closePath();
          ctx.fillStyle = colors.primary;
          ctx.fill();
          
          // Inner ear
          ctx.beginPath();
          ctx.moveTo(headX + (side * headSize * 0.6), headY - headSize * 0.45);
          ctx.lineTo(headX + (side * headSize * 0.4), headY - headSize * 0.85);
          ctx.lineTo(headX + (side * headSize * 0.5), headY - headSize * 0.4);
          ctx.closePath();
          ctx.fillStyle = colors.accent + '80';
          ctx.fill();
        });
        ctx.shadowBlur = 0;
        
        // Cat eyes
        [-15, 15].forEach(offsetX => {
          ctx.beginPath();
          ctx.ellipse(headX + offsetX, headY - 5, 10, 14, 0, 0, 2 * Math.PI);
          ctx.fillStyle = colors.accent;
          ctx.fill();
          
          // Slit pupil
          ctx.beginPath();
          ctx.ellipse(headX + offsetX, headY - 5, 2, 10, 0, 0, 2 * Math.PI);
          ctx.fillStyle = '#000';
          ctx.fill();
        });

        // Whiskers
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        [-1, 1].forEach(side => {
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(headX + (side * 15), headY + (i * 8 - 5));
            ctx.lineTo(headX + (side * 50), headY + (i * 10 - 10));
            ctx.stroke();
          }
        });

        // Nose
        ctx.beginPath();
        ctx.moveTo(headX, headY + 5);
        ctx.lineTo(headX - 5, headY + 12);
        ctx.lineTo(headX + 5, headY + 12);
        ctx.closePath();
        ctx.fillStyle = colors.accent;
        ctx.fill();

      } else if (avatarType === 'dog') {
        // Dog face
        const gradient = ctx.createRadialGradient(headX, headY, 0, headX, headY, headSize);
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(1, colors.primary + 'DD');
        
        ctx.beginPath();
        ctx.arc(headX, headY, headSize, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Floppy ears with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 8;
        [-1, 1].forEach(side => {
          ctx.beginPath();
          ctx.ellipse(headX + (side * headSize * 0.8), headY + headSize * 0.3, headSize * 0.4, headSize * 0.6, side * Math.PI / 6, 0, 2 * Math.PI);
          ctx.fillStyle = colors.secondary;
          ctx.fill();
        });
        ctx.shadowBlur = 0;
        
        // Eyes
        [-15, 15].forEach(offsetX => {
          ctx.beginPath();
          ctx.arc(headX + offsetX, headY - 8, 9, 0, 2 * Math.PI);
          ctx.fillStyle = '#FFF';
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(headX + offsetX, headY - 8, 6, 0, 2 * Math.PI);
          ctx.fillStyle = '#000';
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(headX + offsetX - 2, headY - 10, 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#FFF';
          ctx.fill();
        });
        
        // Snout
        ctx.beginPath();
        ctx.ellipse(headX, headY + 15, 20, 15, 0, 0, 2 * Math.PI);
        ctx.fillStyle = colors.skin;
        ctx.fill();

        // Nose
        ctx.beginPath();
        ctx.arc(headX, headY + 12, 7, 0, 2 * Math.PI);
        ctx.fillStyle = '#000';
        ctx.fill();

        // Tongue
        ctx.beginPath();
        ctx.ellipse(headX, headY + 25, 8, 12, 0, 0, 2 * Math.PI);
        ctx.fillStyle = '#FF69B4';
        ctx.fill();

      } else if (avatarType === 'bird') {
        // Bird head
        const gradient = ctx.createRadialGradient(headX, headY, 0, headX, headY, headSize * 0.8);
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(1, colors.primary + 'DD');
        
        ctx.beginPath();
        ctx.arc(headX, headY, headSize * 0.8, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Beak with gradient
        ctx.beginPath();
        ctx.moveTo(headX, headY + 5);
        ctx.lineTo(headX + 30, headY - 2);
        ctx.lineTo(headX + 30, headY + 2);
        ctx.lineTo(headX, headY + 15);
        ctx.closePath();
        ctx.fillStyle = colors.secondary;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Eye
        ctx.beginPath();
        ctx.arc(headX - 10, headY - 8, 10, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFF';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX - 10, headY - 8, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX - 12, headY - 10, 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFF';
        ctx.fill();
        
        // Fancy crest
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(headX - 20 + (i * 10), headY - headSize * 0.8);
          ctx.lineTo(headX - 15 + (i * 10), headY - headSize * 1.3);
          ctx.lineTo(headX - 10 + (i * 10), headY - headSize * 0.8);
          ctx.strokeStyle = colors.accent;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

      } else {
        // Human head with better styling
        const gradient = ctx.createRadialGradient(headX, headY, 0, headX, headY, headSize);
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(1, colors.primary + 'DD');
        
        ctx.beginPath();
        ctx.arc(headX, headY, headSize, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Hair with texture
        ctx.beginPath();
        ctx.arc(headX, headY - 10, headSize * 1.1, Math.PI, 2 * Math.PI);
        ctx.fillStyle = colors.accent;
        ctx.fill();
        
        // Eyes
        [-15, 15].forEach(offsetX => {
          // White of eye
          ctx.beginPath();
          ctx.arc(headX + offsetX, headY - 5, 7, 0, 2 * Math.PI);
          ctx.fillStyle = '#FFF';
          ctx.fill();
          
          // Iris
          ctx.beginPath();
          ctx.arc(headX + offsetX, headY - 5, 5, 0, 2 * Math.PI);
          ctx.fillStyle = colors.accent;
          ctx.fill();
          
          // Pupil
          ctx.beginPath();
          ctx.arc(headX + offsetX, headY - 5, 3, 0, 2 * Math.PI);
          ctx.fillStyle = '#000';
          ctx.fill();
          
          // Shine
          ctx.beginPath();
          ctx.arc(headX + offsetX - 2, headY - 7, 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#FFF';
          ctx.fill();
        });
        
        // Smile
        ctx.beginPath();
        ctx.arc(headX, headY + 8, 18, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }

    // Draw joints with glow
    const jointIndices = [11, 12, 13, 14, 23, 24, 25, 26, 27, 28];
    jointIndices.forEach(index => {
      drawJoint(index, 10, colors.accent);
    });

    // Draw hands with fingers
    if (pose.leftHand) {
      drawHand(pose.leftHand, colors.skin);
    } else if (landmarks[15]) {
      // Fallback to simple hand if no finger tracking
      drawJoint(15, 14, colors.accent);
    }

    if (pose.rightHand) {
      drawHand(pose.rightHand, colors.skin);
    } else if (landmarks[16]) {
      // Fallback to simple hand if no finger tracking
      drawJoint(16, 14, colors.accent);
    }

    // Feet
    drawJoint(27, 12, colors.accent);
    drawJoint(28, 12, colors.accent);

  }, [pose, avatarType]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      className="w-full h-full object-contain"
    />
  );
};

export default AvatarRenderer;
