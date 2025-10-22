import { useEffect, useRef } from 'react';
import { DetectedPose } from '@/utils/poseDetection';

interface ReferenceAvatarRendererProps {
  pose: DetectedPose;
  avatarType: string;
}

const ReferenceAvatarRenderer = ({ pose, avatarType }: ReferenceAvatarRendererProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pose) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { landmarks } = pose;
    if (!landmarks || landmarks.length === 0) return;

    // Draw with semi-transparent style for reference
    ctx.globalAlpha = 0.6;
    
    // Helper function to draw a limb
    const drawLimb = (start: number, end: number, color: string, width: number = 8) => {
      if (start >= landmarks.length || end >= landmarks.length) return;
      
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      
      if (!startPoint || !endPoint) return;
      
      ctx.beginPath();
      ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
      ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    // Helper function to draw a joint
    const drawJoint = (index: number, color: string, radius: number = 10) => {
      if (index >= landmarks.length) return;
      
      const point = landmarks[index];
      if (!point) return;
      
      ctx.beginPath();
      ctx.arc(point.x * canvas.width, point.y * canvas.height, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const primaryColor = '#8b5cf6';
    const secondaryColor = '#6366f1';
    const accentColor = '#ec4899';

    // Draw body structure
    // Torso
    drawLimb(11, 12, primaryColor, 10); // Shoulders
    drawLimb(11, 23, primaryColor, 10); // Left torso
    drawLimb(12, 24, primaryColor, 10); // Right torso
    drawLimb(23, 24, primaryColor, 10); // Hips

    // Arms
    drawLimb(11, 13, secondaryColor, 8); // Left upper arm
    drawLimb(13, 15, secondaryColor, 8); // Left forearm
    drawLimb(12, 14, secondaryColor, 8); // Right upper arm
    drawLimb(14, 16, secondaryColor, 8); // Right forearm

    // Legs
    drawLimb(23, 25, accentColor, 10); // Left thigh
    drawLimb(25, 27, accentColor, 10); // Left shin
    drawLimb(24, 26, accentColor, 10); // Right thigh
    drawLimb(26, 28, accentColor, 10); // Right shin

    // Draw joints
    [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach(i => {
      drawJoint(i, '#fff', 8);
    });

    ctx.globalAlpha = 1.0;
  }, [pose, avatarType]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      className="w-full h-full"
    />
  );
};

export default ReferenceAvatarRenderer;
