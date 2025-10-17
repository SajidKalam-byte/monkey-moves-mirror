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
      monkey: { primary: '#8B4513', secondary: '#DEB887', accent: '#FF69B4' },
      human: { primary: '#FFD1A4', secondary: '#FF9A76', accent: '#4A90E2' },
      cat: { primary: '#FFA500', secondary: '#FFD700', accent: '#228B22' },
      dog: { primary: '#D2691E', secondary: '#F4A460', accent: '#FF6347' },
      bird: { primary: '#00CED1', secondary: '#FFD700', accent: '#FF1493' }
    };

    const colors = avatarConfig[avatarType as keyof typeof avatarConfig] || avatarConfig.monkey;

    // Helper to draw limb
    const drawLimb = (start: number, end: number, thickness: number, color: string) => {
      if (landmarks[start] && landmarks[end]) {
        const startX = landmarks[start].x * w;
        const startY = landmarks[start].y * h;
        const endX = landmarks[end].x * w;
        const endY = landmarks[end].y * h;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    };

    // Helper to draw joint
    const drawJoint = (index: number, radius: number, color: string) => {
      if (landmarks[index]) {
        const x = landmarks[index].x * w;
        const y = landmarks[index].y * h;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      }
    };

    // Draw body structure
    // Torso
    drawLimb(11, 12, 20, colors.primary); // shoulders
    drawLimb(11, 23, 16, colors.primary); // left torso
    drawLimb(12, 24, 16, colors.primary); // right torso
    drawLimb(23, 24, 18, colors.primary); // hips

    // Arms
    drawLimb(11, 13, 14, colors.secondary); // left upper arm
    drawLimb(13, 15, 12, colors.secondary); // left forearm
    drawLimb(12, 14, 14, colors.secondary); // right upper arm
    drawLimb(14, 16, 12, colors.secondary); // right forearm

    // Legs
    drawLimb(23, 25, 16, colors.secondary); // left thigh
    drawLimb(25, 27, 14, colors.secondary); // left shin
    drawLimb(24, 26, 16, colors.secondary); // right thigh
    drawLimb(26, 28, 14, colors.secondary); // right shin

    // Head - special rendering based on avatar type
    if (landmarks[0]) {
      const headX = landmarks[0].x * w;
      const headY = landmarks[0].y * h;
      const headSize = 40;

      if (avatarType === 'monkey') {
        // Monkey face
        ctx.beginPath();
        ctx.arc(headX, headY, headSize, 0, 2 * Math.PI);
        ctx.fillStyle = colors.primary;
        ctx.fill();
        
        // Face area
        ctx.beginPath();
        ctx.arc(headX, headY + 5, headSize * 0.7, 0, 2 * Math.PI);
        ctx.fillStyle = colors.secondary;
        ctx.fill();
        
        // Ears
        ctx.beginPath();
        ctx.arc(headX - headSize, headY, headSize * 0.4, 0, 2 * Math.PI);
        ctx.fillStyle = colors.primary;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX + headSize, headY, headSize * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Eyes
        ctx.beginPath();
        ctx.arc(headX - 12, headY - 5, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX + 12, headY - 5, 6, 0, 2 * Math.PI);
        ctx.fill();
      } else if (avatarType === 'cat') {
        // Cat face
        ctx.beginPath();
        ctx.arc(headX, headY, headSize, 0, 2 * Math.PI);
        ctx.fillStyle = colors.primary;
        ctx.fill();
        
        // Ears (triangular)
        ctx.beginPath();
        ctx.moveTo(headX - headSize * 0.7, headY - headSize * 0.5);
        ctx.lineTo(headX - headSize * 0.3, headY - headSize);
        ctx.lineTo(headX - headSize * 0.5, headY - headSize * 0.3);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(headX + headSize * 0.7, headY - headSize * 0.5);
        ctx.lineTo(headX + headSize * 0.3, headY - headSize);
        ctx.lineTo(headX + headSize * 0.5, headY - headSize * 0.3);
        ctx.closePath();
        ctx.fill();
        
        // Eyes (cat-like)
        ctx.beginPath();
        ctx.ellipse(headX - 12, headY - 5, 8, 12, 0, 0, 2 * Math.PI);
        ctx.fillStyle = colors.accent;
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(headX + 12, headY - 5, 8, 12, 0, 0, 2 * Math.PI);
        ctx.fill();
      } else if (avatarType === 'dog') {
        // Dog face
        ctx.beginPath();
        ctx.arc(headX, headY, headSize, 0, 2 * Math.PI);
        ctx.fillStyle = colors.primary;
        ctx.fill();
        
        // Floppy ears
        ctx.beginPath();
        ctx.ellipse(headX - headSize * 0.8, headY + headSize * 0.3, headSize * 0.4, headSize * 0.6, Math.PI / 6, 0, 2 * Math.PI);
        ctx.fillStyle = colors.secondary;
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(headX + headSize * 0.8, headY + headSize * 0.3, headSize * 0.4, headSize * 0.6, -Math.PI / 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Eyes
        ctx.beginPath();
        ctx.arc(headX - 12, headY - 5, 7, 0, 2 * Math.PI);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX + 12, headY - 5, 7, 0, 2 * Math.PI);
        ctx.fill();
        
        // Nose
        ctx.beginPath();
        ctx.arc(headX, headY + 10, 6, 0, 2 * Math.PI);
        ctx.fill();
      } else if (avatarType === 'bird') {
        // Bird head
        ctx.beginPath();
        ctx.arc(headX, headY, headSize * 0.8, 0, 2 * Math.PI);
        ctx.fillStyle = colors.primary;
        ctx.fill();
        
        // Beak
        ctx.beginPath();
        ctx.moveTo(headX, headY + 5);
        ctx.lineTo(headX + 25, headY);
        ctx.lineTo(headX, headY + 15);
        ctx.closePath();
        ctx.fillStyle = colors.secondary;
        ctx.fill();
        
        // Eye
        ctx.beginPath();
        ctx.arc(headX - 8, headY - 8, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFF';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX - 8, headY - 8, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#000';
        ctx.fill();
        
        // Crest
        ctx.beginPath();
        ctx.moveTo(headX - 10, headY - headSize * 0.8);
        ctx.lineTo(headX, headY - headSize * 1.2);
        ctx.lineTo(headX + 10, headY - headSize * 0.8);
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 4;
        ctx.stroke();
      } else {
        // Human head
        ctx.beginPath();
        ctx.arc(headX, headY, headSize, 0, 2 * Math.PI);
        ctx.fillStyle = colors.primary;
        ctx.fill();
        
        // Hair
        ctx.beginPath();
        ctx.arc(headX, headY - 10, headSize * 1.1, Math.PI, 2 * Math.PI);
        ctx.fillStyle = colors.accent;
        ctx.fill();
        
        // Eyes
        ctx.beginPath();
        ctx.arc(headX - 12, headY - 5, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX + 12, headY - 5, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Smile
        ctx.beginPath();
        ctx.arc(headX, headY + 5, 15, 0, Math.PI);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Draw joints
    const jointIndices = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    jointIndices.forEach(index => {
      drawJoint(index, 8, colors.accent);
    });

    // Hands and feet
    drawJoint(15, 12, colors.accent); // left hand
    drawJoint(16, 12, colors.accent); // right hand
    drawJoint(27, 10, colors.accent); // left foot
    drawJoint(28, 10, colors.accent); // right foot

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
