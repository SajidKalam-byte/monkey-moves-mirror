import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AvatarRenderer from './AvatarRenderer';
import ReferenceAvatarRenderer from './ReferenceAvatarRenderer';
import { initializePoseDetection, detectPose, DetectedPose } from '@/utils/poseDetection';
import { calculatePoseSimilarity, getFeedbackMessage, shouldCelebrate, REFERENCE_POSES, ReferencePose } from '@/utils/poseComparison';
import { Play, Square, Activity, Moon, Sun, Target, TrendingUp, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const AVATARS = [
  { id: 'monkey', name: '🐵 Monkey', emoji: '🐵' },
  { id: 'human', name: '👤 Human', emoji: '👤' },
  { id: 'cat', name: '🐱 Cat', emoji: '🐱' },
  { id: 'dog', name: '🐕 Dog', emoji: '🐕' },
  { id: 'bird', name: '🐦 Bird', emoji: '🐦' },
];

const PoseTracker = () => {
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPose, setCurrentPose] = useState<DetectedPose | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState('monkey');
  const [fps, setFps] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedReferencePose, setSelectedReferencePose] = useState<ReferencePose>(REFERENCE_POSES[0]);
  const [accuracy, setAccuracy] = useState(0);
  const [isCelebrating, setIsCelebrating] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);
  const fpsCountRef = useRef<number>(0);
  const fpsTimeRef = useRef<number>(0);
  const isTrackingRef = useRef<boolean>(false);

  // Dark mode toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initialize pose detection
  useEffect(() => {
    const initPose = async () => {
      try {
        await initializePoseDetection();
        setIsInitialized(true);
        console.log('Pose detection initialized successfully');
      } catch (error) {
        console.error('Failed to initialize pose detection:', error);
        toast({
          title: 'Initialization Error',
          description: 'Failed to load pose detection model',
          variant: 'destructive',
        });
      }
    };
    initPose();
  }, [toast]);

  const startTracking = async () => {
    if (!isInitialized) {
      toast({
        title: 'Not Ready',
        description: 'Pose detection is still initializing...',
        variant: 'destructive',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsTracking(true);
          isTrackingRef.current = true;
          console.log('Camera started, beginning pose detection');
          detectPoseLoop();
          toast({
            title: 'Tracking Started',
            description: 'Move around and watch your avatar mirror you!',
          });
        };
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      toast({
        title: 'Camera Error',
        description: 'Could not access your webcam',
        variant: 'destructive',
      });
    }
  };

  const stopTracking = () => {
    console.log('Stopping tracking');
    isTrackingRef.current = false;
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setIsTracking(false);
    setCurrentPose(null);
    setFps(0);
  };

  const detectPoseLoop = () => {
    if (!videoRef.current || !isTrackingRef.current) {
      console.log('Pose loop stopped');
      return;
    }

    const video = videoRef.current;
    const now = performance.now();
    
    // Calculate FPS
    fpsCountRef.current++;
    if (now - fpsTimeRef.current >= 1000) {
      setFps(fpsCountRef.current);
      fpsCountRef.current = 0;
      fpsTimeRef.current = now;
    }

    if (video.readyState >= 2) {
      const pose = detectPose(video, now);
      if (pose) {
        setCurrentPose(pose);
        
        // Calculate accuracy against reference pose
        const referencePose: DetectedPose = {
          landmarks: selectedReferencePose.landmarks,
          worldLandmarks: [],
        };
        
        const similarity = calculatePoseSimilarity(pose, referencePose);
        setAccuracy(similarity);
        
        // Trigger celebration if accuracy is high
        if (shouldCelebrate(similarity)) {
          if (!isCelebrating) {
            setIsCelebrating(true);
            setTimeout(() => setIsCelebrating(false), 2000);
          }
        }
        
        console.log('Pose detected - Accuracy:', similarity + '%');
      }
    }

    lastFrameTimeRef.current = now;
    animationFrameRef.current = requestAnimationFrame(detectPoseLoop);
  };

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Dark Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1 space-y-2">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Pose Mirror
            </h1>
            <p className="text-muted-foreground text-lg">
              Move your body and watch your avatar copy every motion in real-time!
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="shrink-0"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        {/* Avatar Selection */}
        <Card className="p-4 shadow-lg border-2">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">Choose Avatar:</span>
            {AVATARS.map((avatar) => (
              <Button
                key={avatar.id}
                variant={selectedAvatar === avatar.id ? 'default' : 'outline'}
                size="lg"
                onClick={() => setSelectedAvatar(avatar.id)}
                className="text-lg transition-all hover:scale-105"
              >
                {avatar.emoji} {avatar.name.split(' ')[1]}
              </Button>
            ))}
          </div>
        </Card>

        {/* Reference Pose Selection */}
        <Card className="p-4 shadow-lg border-2 bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Target Pose:</span>
            </div>
            {REFERENCE_POSES.map((refPose) => (
              <Button
                key={refPose.id}
                variant={selectedReferencePose.id === refPose.id ? 'default' : 'outline'}
                size="lg"
                onClick={() => setSelectedReferencePose(refPose)}
                className="text-lg transition-all hover:scale-105"
              >
                {refPose.emoji} {refPose.name}
              </Button>
            ))}
          </div>
        </Card>

        {/* Accuracy Display */}
        {isTracking && (
          <Card className="p-6 shadow-xl border-2 bg-gradient-to-br from-primary/10 via-background to-accent/10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl font-bold">Pose Accuracy</h3>
                </div>
                <div className={`text-4xl font-bold ${getFeedbackMessage(accuracy).color} transition-all duration-300 ${isCelebrating ? 'scale-125 animate-pulse' : ''}`}>
                  {accuracy}%
                </div>
              </div>
              
              <div className="space-y-2">
                <Progress value={accuracy} className="h-4" />
                <div className="flex justify-between items-center">
                  <p className="text-muted-foreground text-sm">{selectedReferencePose.description}</p>
                  <div className={`flex items-center gap-2 font-bold text-lg ${getFeedbackMessage(accuracy).color} transition-all duration-300`}>
                    {isCelebrating && <Sparkles className="w-5 h-5 animate-spin" />}
                    {getFeedbackMessage(accuracy).message}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reference Pose Display */}
          <Card className="overflow-hidden shadow-xl border-2 hover:shadow-2xl transition-shadow">
            <div className="bg-gradient-to-br from-accent/10 to-secondary/10 p-4">
              <h2 className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                <Target className="w-6 h-6" />
                Target
              </h2>
            </div>
            <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
              <ReferenceAvatarRenderer 
                pose={{
                  landmarks: selectedReferencePose.landmarks,
                  worldLandmarks: [],
                }}
                avatarType="reference"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg border">
                <p className="text-center font-semibold text-lg">{selectedReferencePose.emoji} {selectedReferencePose.name}</p>
                <p className="text-center text-sm text-muted-foreground mt-1">{selectedReferencePose.description}</p>
              </div>
            </div>
          </Card>

          {/* Webcam Feed */}
          <Card className="overflow-hidden shadow-xl border-2 hover:shadow-2xl transition-shadow">
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
              <h2 className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                <Activity className="w-6 h-6" />
                You
              </h2>
            </div>
            <div className="relative aspect-[4/3] bg-muted">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              {!isTracking && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                  <p className="text-muted-foreground text-lg">Camera feed will appear here</p>
                </div>
              )}
              {isTracking && (
                <div className="absolute top-4 right-4 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  {fps} FPS
                </div>
              )}
            </div>
          </Card>

          {/* Avatar Display */}
          <Card className={`overflow-hidden shadow-xl border-2 hover:shadow-2xl transition-all ${isCelebrating ? 'ring-4 ring-primary animate-pulse' : ''}`}>
            <div className="bg-gradient-to-br from-accent/10 to-primary/10 p-4">
              <h2 className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                {AVATARS.find(a => a.id === selectedAvatar)?.emoji} Your Avatar
              </h2>
            </div>
            <div className="relative aspect-[4/3] bg-gradient-to-br from-muted via-background to-muted flex items-center justify-center overflow-hidden">
              {isCelebrating && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute text-4xl animate-ping"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 0.5}s`,
                        animationDuration: '1s',
                      }}
                    >
                      {['✨', '🌟', '⭐', '💫', '🎉'][Math.floor(Math.random() * 5)]}
                    </div>
                  ))}
                </div>
              )}
              {currentPose ? (
                <AvatarRenderer pose={currentPose} avatarType={selectedAvatar} />
              ) : (
                <div className="text-center space-y-2 p-8">
                  <p className="text-6xl">{AVATARS.find(a => a.id === selectedAvatar)?.emoji}</p>
                  <p className="text-muted-foreground">
                    {isTracking ? 'Waiting for pose detection...' : 'Start tracking to see your avatar!'}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!isTracking ? (
            <Button
              size="lg"
              onClick={startTracking}
              disabled={!isInitialized}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
            >
              <Play className="w-5 h-5 mr-2" />
              {isInitialized ? 'Start Tracking' : 'Initializing...'}
            </Button>
          ) : (
            <Button
              size="lg"
              variant="destructive"
              onClick={stopTracking}
              className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop Tracking
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoseTracker;
