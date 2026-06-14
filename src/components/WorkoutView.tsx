import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, Square, Volume2, VolumeX, AlertCircle, Camera, Check, RefreshCw, X, ShieldAlert,
  Sliders, ArrowLeft, Zap, Clock, ThumbsUp, Medal, Dumbbell, Award, Share2
} from 'lucide-react';
import { TrackerSettings, UserProfile, WorkoutSession } from '../types';
import { loadScript, MEDIAPIPE_SCRIPTS } from '../utils/loadScripts';
import { speak, cancelSpeech, playSuccessChime, playWarningBeep } from '../utils/speech';
import { calculateCalories } from '../utils/calories';

interface WorkoutViewProps {
  settings: TrackerSettings;
  profile: UserProfile;
  onSaveWorkout: (session: WorkoutSession) => void;
  onCancel: () => void;
}

export default function WorkoutView({ settings, profile, onSaveWorkout, onCancel }: WorkoutViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraInstance = useRef<any>(null);
  const poseInstance = useRef<any>(null);
  
  // Tracking States
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // Active metrics
  const [repsCount, setRepsCount] = useState(0);
  const [incorrectReps, setIncorrectReps] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentAngle, setCurrentAngle] = useState(180);
  const [currentHipAngle, setCurrentHipAngle] = useState(180);
  const [formCoachFeedback, setFormCoachFeedback] = useState<string>('Aligning Camera...');
  const [trackedSide, setTrackedSide] = useState<'left' | 'right'>('left');
  
  // Voice preferences inside the active session
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(settings.voiceEnabled);
  const [isCoachingEnabled, setIsCoachingEnabled] = useState(settings.voiceCoachingEnabled);
  
  // Live session statistics
  const [sessionWarnings, setSessionWarnings] = useState<{ [key: string]: number }>({
    'Go Lower': 0,
    'Keep Back Straight': 0
  });

  // State Machine Refs for High Precision Tracking
  const repsCountRef = useRef(0);
  const repStateRef = useRef<'UP' | 'DOWN' | 'BENT'>('UP');
  const lowestAngleInRepRef = useRef(180);
  const backStraightWarnCooldownRef = useRef(0); // timestamp to debounce back cues
  const rangeOfMotionWarnCooldownRef = useRef(0); // timestamp to debounce range cues
  const lastStateChangeTimeRef = useRef(Date.now());

  // Show summary modal when finishing workout
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<WorkoutSession | null>(null);

  // Background timer
  useEffect(() => {
    if (isPaused || loading || showSummary) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, loading, showSummary]);

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, []);

  // Initialize MediaPipe and Camera
  useEffect(() => {
    let active = true;

    async function initMediaPipe() {
      try {
        setLoading(true);
        setLoadingError(null);
        
        // Dynamic load from CDN
        await loadScript(MEDIAPIPE_SCRIPTS[0]); // camera_utils.js
        await loadScript(MEDIAPIPE_SCRIPTS[1]); // pose.js
        
        if (!active) return;

        if (!(window as any).Pose || !(window as any).Camera) {
          throw new Error('MediaPipe script files were parsed incorrectly.');
        }

        initializeModels();
      } catch (err: any) {
        console.error('Pose library load failed:', err);
        setLoadingError('Could not initialize camera tracker. Please check your camera permissions or network connection.');
        setLoading(false);
      }
    }

    initMediaPipe();

    return () => {
      active = false;
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (cameraInstance.current) {
      try {
        cameraInstance.current.stop();
      } catch (e) {
        console.warn('Error stopping camera:', e);
      }
      cameraInstance.current = null;
    }
    poseInstance.current = null;
  };

  const initializeModels = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Reset loading and error states for retry attempts
    setLoading(true);
    setLoadingError(null);

    // Create Pose
    const pose = new (window as any).Pose({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: settings.minConfidence,
      minTrackingConfidence: settings.minConfidence,
    });

    pose.onResults(handlePoseResults);
    poseInstance.current = pose;

    // Create Camera
    const camera = new (window as any).Camera(videoRef.current, {
      onFrame: async () => {
        if (!isPaused && poseInstance.current && videoRef.current) {
          try {
            await poseInstance.current.send({ image: videoRef.current });
          } catch (e) {
            console.error('Frame estimation fail:', e);
          }
        }
      },
      width: 640,
      height: 480,
    });

    camera.start()
      .then(() => {
        setLoading(false);
        setLoadingError(null);
        speak('Coach initialized. Align your side profile with the camera and begin whenever you are ready.', false);
      })
      .catch((err: any) => {
        console.error('WebGL Camera start failed', err);
        setLoadingError('Failed to start camera. Verify camera permissions are enabled in your site settings.');
        setLoading(false);
      });

    cameraInstance.current = camera;
  };

  // Math: Calculate angle between three landmarks
  const calculateAngle = (
    A: { x: number; y: number }, 
    B: { x: number; y: number }, 
    C: { x: number; y: number }, 
    width: number, 
    height: number
  ): number => {
    // Project values to actual aspect ratio coordinates for accurate geometric evaluation
    const pA = { x: A.x * width, y: A.y * height };
    const pB = { x: B.x * width, y: B.y * height };
    const pC = { x: C.x * width, y: C.y * height };

    // Vector AB = A - B
    const vAB = { x: pA.x - pB.x, y: pA.y - pB.y };
    // Vector CB = C - B
    const vCB = { x: pC.x - pB.x, y: pC.y - pB.y };

    const dotProduct = vAB.x * vCB.x + vAB.y * vCB.y;
    const magAB = Math.sqrt(vAB.x * vAB.x + vAB.y * vAB.y);
    const magCB = Math.sqrt(vCB.x * vCB.x + vCB.y * vCB.y);

    if (magAB === 0 || magCB === 0) return 180;

    let cosAngle = dotProduct / (magAB * magCB);
    cosAngle = Math.max(-1, Math.min(1, cosAngle)); // prevent out of range

    const angleRadians = Math.acos(cosAngle);
    return Math.round(angleRadians * (180 / Math.PI));
  };

  // Drawing Utilities on Canvas Overlay
  const handlePoseResults = (results: any) => {
    if (!results || !results.poseLandmarks || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear and draw active frame mirrored
    ctx.clearRect(0, 0, width, height);
    
    // Mirror standard frame drawing
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, width, height);
    ctx.restore();

    const landmarks = results.poseLandmarks;

    // 1. Dynamic side selection if 'auto'
    let activeSide: 'left' | 'right' = 'left';
    if (settings.trackingSide === 'auto') {
      const leftElbowVis = landmarks[13]?.visibility || 0;
      const rightElbowVis = landmarks[14]?.visibility || 0;
      activeSide = leftElbowVis > rightElbowVis ? 'left' : 'right';
    } else {
      activeSide = settings.trackingSide;
    }
    setTrackedSide(activeSide);

    // Get trackable references
    // Indexes: Shoulder (11/12), Elbow (13/14), Wrist (15/16), Hip (23/24), Knee (25/26)
    const shoulderIdx = activeSide === 'left' ? 11 : 12;
    const elbowIdx = activeSide === 'left' ? 13 : 14;
    const wristIdx = activeSide === 'left' ? 15 : 16;
    const hipIdx = activeSide === 'left' ? 23 : 24;
    const kneeIdx = activeSide === 'left' ? 25 : 26;

    const shoulder = landmarks[shoulderIdx];
    const elbow = landmarks[elbowIdx];
    const wrist = landmarks[wristIdx];
    const hip = landmarks[hipIdx];
    const knee = landmarks[kneeIdx];

    // Check visibility confidence
    const minConf = settings.minConfidence;
    const landmarksVisible = 
      shoulder && shoulder.visibility > minConf &&
      elbow && elbow.visibility > minConf &&
      wrist && wrist.visibility > minConf;

    if (landmarksVisible) {
      // Calculate joint angles
      const elbowAngle = calculateAngle(shoulder, elbow, wrist, width, height);
      setCurrentAngle(elbowAngle);

      let hipAngle = 180;
      if (hip && hip.visibility > minConf && knee && knee.visibility > minConf) {
        hipAngle = calculateAngle(shoulder, hip, knee, width, height);
        setCurrentHipAngle(hipAngle);
      }

      // Execute push up state machine
      processPushUpRep(elbowAngle, hipAngle);

      // Render skeletal lines
      drawLiveSkeleton(ctx, landmarks, width, height, activeSide);
    } else {
      setFormCoachFeedback('Aligning Profile...');
    }
  };

  // High Accuracy State Machine Implementation
  const processPushUpRep = (elbowAngle: number, hipAngle: number) => {
    const minDown = settings.minDownAngle; // e.g. 85
    const minUp = settings.minUpAngle; // e.g. 155
    const now = Date.now();

    // 1. Back straight alignment validation
    const hipOffset = Math.abs(180 - hipAngle);
    const backIsSaggy = hipAngle < 140; // Sagging hips
    const backIsPiked = hipAngle > 215;  // Hips hiked too high
    
    if ((backIsSaggy || backIsPiked) && repStateRef.current !== 'UP') {
      setFormCoachFeedback('Keep Back Straight!');
      
      // Debounce voice warnings by 5 seconds
      if (now - backStraightWarnCooldownRef.current > 5000) {
        setSessionWarnings(prev => ({
          ...prev,
          'Keep Back Straight': (prev['Keep Back Straight'] || 0) + 1
        }));
        
        if (isCoachingEnabled) {
          playWarningBeep();
          speak('Keep your back straight!', true);
        }
        backStraightWarnCooldownRef.current = now;
      }
    }

    // 2. Main motion flow state transitions
    if (repStateRef.current === 'UP') {
      // Resting/Lock-out point
      if (elbowAngle < minDown + 25) {
        // Going down
        repStateRef.current = 'BENT';
        lowestAngleInRepRef.current = elbowAngle;
        lastStateChangeTimeRef.current = now;
      }
    } else if (repStateRef.current === 'BENT') {
      // Mid flexion/extension
      lowestAngleInRepRef.current = Math.min(lowestAngleInRepRef.current, elbowAngle);
      
      if (elbowAngle <= minDown) {
        // Registered valid bottom point
        repStateRef.current = 'DOWN';
        setFormCoachFeedback('Nice Dip! Push UP');
        lastStateChangeTimeRef.current = now;
      } else if (elbowAngle >= minUp - 10) {
        // User pushed back up but NEVER dipped low enough!
        // This is an incomplete rep!
        if (lowestAngleInRepRef.current > minDown + 15) {
          setIncorrectReps(p => p + 1);
          setFormCoachFeedback('Go Lower next time');
          
          if (now - rangeOfMotionWarnCooldownRef.current > 5000) {
            setSessionWarnings(prev => ({
              ...prev,
              'Go Lower': (prev['Go Lower'] || 0) + 1
            }));
            
            if (isCoachingEnabled) {
              playWarningBeep();
              speak('Go deeper down!', true);
            }
            rangeOfMotionWarnCooldownRef.current = now;
          }
        }
        repStateRef.current = 'UP';
      }
    } else if (repStateRef.current === 'DOWN') {
      // Complete descent reached
      if (elbowAngle >= minUp) {
        // Returned fully to top -> REGISTER SUCCESSFUL REP!
        const nextRepNumber = repsCountRef.current + 1;
        repsCountRef.current = nextRepNumber;
        setRepsCount(nextRepNumber);
        
        // Form response
        setFormCoachFeedback('Perfect Repetition!');
        playSuccessChime();
        
        if (isVoiceEnabled) {
          speak(nextRepNumber.toString(), true, 1.15);
        }

        // Reset state machine for next rep block
        repStateRef.current = 'UP';
        lowestAngleInRepRef.current = 180;
        lastStateChangeTimeRef.current = now;
      }
    }
  };

  const drawLiveSkeleton = (
    ctx: CanvasRenderingContext2D, 
    landmarks: any[], 
    width: number, 
    height: number, 
    activeSide: 'left' | 'right'
  ) => {
    const drawLine = (p1: any, p2: any, color: string, lineWidth: number) => {
      if (!p1 || !p2 || p1.visibility < 0.4 || p2.visibility < 0.4) return;
      
      // Note: Coordinates are mirrored horizontally
      const x1 = (1 - p1.x) * width;
      const y1 = p1.y * height;
      const x2 = (1 - p2.x) * width;
      const y2 = p2.y * height;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };

    const drawJointNode = (p: any, color: string, outerColor: string, radius: number) => {
      if (!p || p.visibility < 0.4) return;
      const x = (1 - p.x) * width;
      const y = p.y * height;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = outerColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    // Shoulder to Shoulder connect connection line
    drawLine(landmarks[11], landmarks[12], 'rgba(255, 255, 255, 0.25)', 2);

    const leftIsActive = activeSide === 'left';
    const mainColor = '#10b981'; // Emerald 500
    const dimColor = 'rgba(255, 255, 255, 0.15)';

    // Left Side connections
    const lClr = leftIsActive ? mainColor : dimColor;
    const lWdth = leftIsActive ? 4 : 1.5;
    drawLine(landmarks[11], landmarks[13], lClr, lWdth); // Shoulder -> Elbow
    drawLine(landmarks[13], landmarks[15], lClr, lWdth); // Elbow -> Wrist
    drawLine(landmarks[11], landmarks[23], lClr, lWdth); // Shoulder -> Hip
    drawLine(landmarks[23], landmarks[25], lClr, lWdth); // Hip -> Knee
    drawLine(landmarks[25], landmarks[27], lClr, lWdth); // Knee -> Ankle

    // Right Side connections
    const rClr = !leftIsActive ? mainColor : dimColor;
    const rWdth = !leftIsActive ? 4 : 1.5;
    drawLine(landmarks[12], landmarks[14], rClr, rWdth); // Shoulder -> Elbow
    drawLine(landmarks[14], landmarks[16], rClr, rWdth); // Elbow -> Wrist
    drawLine(landmarks[12], landmarks[24], rClr, rWdth); // Shoulder -> Hip
    drawLine(landmarks[24], landmarks[26], rClr, rWdth); // Hip -> Knee
    drawLine(landmarks[26], landmarks[28], rClr, rWdth); // Knee -> Ankle

    // Draw nodes for joints
    const jointsDraw = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    jointsDraw.forEach(idx => {
      const isL = [11, 13, 15, 23, 25, 27].includes(idx);
      const isMainJoint = isL === leftIsActive;
      
      drawJointNode(
        landmarks[idx], 
        isMainJoint ? '#10b981' : '#3f3f46', 
        isMainJoint ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
        isMainJoint ? 6 : 4.5
      );
    });
  };

  // Terminate active workout session inside dashboard
  const handleStopWorkout = () => {
    stopCamera();
    
    // Create Session metrics summarization
    const duration = elapsedSeconds;
    const reps = repsCount;
    const accuracy = reps + incorrectReps > 0 
      ? Math.round((reps / (reps + incorrectReps)) * 100) 
      : 100;
    const pace = duration > 0 ? Math.round((reps / (duration / 60)) * 10) / 10 : 0;
    const calories = calculateCalories(reps, duration, profile);

    const session: WorkoutSession = {
      id: `workout-${Date.now()}`,
      date: new Date().toISOString(),
      reps,
      duration,
      calories,
      avgPace: pace,
      formAccuracy: accuracy,
      incorrectReps,
      warningsCount: { ...sessionWarnings }
    };

    setSummaryData(session);
    setShowSummary(true);
    
    speak(`Workout completed! Excellent performance. You completed ${reps} push ups and burned ${calories} calories.`, true);
  };

  const handleSaveSummary = () => {
    if (summaryData) {
      onSaveWorkout(summaryData);
    }
  };

  const formatTimer = (totSec: number) => {
    const mins = Math.floor(totSec / 60);
    const secs = totSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Upper Navigation Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            stopCamera();
            onCancel();
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-4 py-2 text-xs font-bold border border-zinc-800 cursor-pointer active:scale-98"
        >
          <ArrowLeft size={14} />
          Exit Session
        </button>

        <div className="inline-flex items-center gap-2.5 rounded-full bg-red-500/10 border border-red-500/20 px-3.5 py-1 text-xs font-bold text-red-500 animate-pulse">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Live AI Recording
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Real-time Camera and Landmarks Draw Viewport */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video rounded-3xl bg-zinc-950 overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center">
            {/* Real Webcam Stream (hidden, source for MediaPipe) */}
            <video
              ref={videoRef}
              className="hidden"
              playsInline
              muted
              width="640"
              height="480"
            />
            {/* Mirrored Canvas Render Overlay */}
            <canvas
              ref={canvasRef}
              width="640"
              height="480"
              className="w-full h-full object-cover rounded-3xl"
            />

            {/* Spinner loader/Error screens */}
            {loading && (
              <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center space-y-4 px-6 text-center">
                <RefreshCw size={36} className="text-emerald-500 animate-spin" />
                <div>
                  <h3 className="font-bold text-white text-md">Powering Up AI Vision Engine...</h3>
                  <p className="text-zinc-500 text-xs mt-1">Downloading WebAssembly models and preparing your lens feed.</p>
                </div>
              </div>
            )}

            {loadingError && (
              <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center space-y-4 px-6 text-center">
                <div className="rounded-full bg-red-500/10 p-3 text-red-500">
                  <ShieldAlert size={36} />
                </div>
                <div>
                  <h3 className="font-bold text-red-400 text-md">Camera Access Required</h3>
                  <p className="text-zinc-400 text-xs mt-1.5 max-w-sm leading-relaxed">{loadingError}</p>
                </div>
                <button
                  onClick={() => {
                    stopCamera();
                    initializeModels();
                  }}
                  className="rounded-xl bg-red-500 hover:bg-red-600 px-5 py-2.5 text-xs font-bold text-zinc-950 cursor-pointer active:scale-98"
                >
                  Request Lens Retry
                </button>
              </div>
            )}

            {/* Current form feedback Overlay banner */}
            {!loading && !loadingError && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full px-5 py-2.5 bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 flex items-center gap-2.5">
                <div className={`h-2.5 w-2.5 rounded-full ${
                  formCoachFeedback.includes('Perfect') ? 'bg-emerald-500 animate-ping' :
                  formCoachFeedback.includes('Straight') || formCoachFeedback.includes('Lower') ? 'bg-amber-500 animate-pulse' : 'bg-teal-400'
                }`} />
                <span className="text-xs font-black tracking-wider uppercase text-white">{formCoachFeedback}</span>
              </div>
            )}
          </div>

          {/* Quick Realtime Indicators below Camera viewport */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Elbow Angle</span>
              <p className="text-xl font-black mt-1 text-emerald-400">{currentAngle}°</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Torso posture</span>
              <p className="text-xl font-black mt-1 text-teal-400">{currentHipAngle}°</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Active Side</span>
              <p className="text-xl font-black mt-1 text-white capitalize">{trackedSide}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Workout State Controls & Dynamic Feedback */}
        <div className="space-y-4">
          {/* LED Rep Count Display Module */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 flex flex-col justify-between h-48 backdrop-blur-md">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-bold uppercase tracking-wider">Completed reps</span>
              <Dumbbell size={16} className="text-emerald-500" />
            </div>

            <div className="flex items-center justify-center my-2 select-none">
              <motion.span 
                key={repsCount}
                initial={{ scale: 0.82, opacity: 0.8 }}
                animate={{ scale: 1.0, opacity: 1 }}
                className="text-7xl font-black tracking-tight text-white font-mono"
              >
                {repsCount}
              </motion.span>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-1">Pace: {elapsedSeconds > 0 ? Math.round((repsCount / (elapsedSeconds / 60)) * 10) / 10 : 0} RPM</span>
              <span className="text-rose-500 font-semibold">{incorrectReps} uncounted reps</span>
            </div>
          </div>

          {/* Time & Calorie Track board */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4.5">
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                <Clock size={14} />
                <span>Timer</span>
              </div>
              <p className="text-xl font-black text-white mt-1 font-mono tracking-tight">{formatTimer(elapsedSeconds)}</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4.5">
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                <Zap size={14} className="text-amber-500" />
                <span>Calories</span>
              </div>
              <p className="text-xl font-black text-white mt-1">{calculateCalories(repsCount, elapsedSeconds, profile)} <span className="text-xs font-normal text-zinc-500">kcal</span></p>
            </div>
          </div>

          {/* Audio Controls Module */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Session Audio Adjust</h4>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">Rep counter Voice</span>
              <button
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                id="btn-toggle-rep-voice"
                className={`rounded-lg p-1.5 border transition-all ${
                  isVoiceEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                }`}
              >
                {isVoiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/40">
              <span className="text-zinc-300">Live Coaching Alerts</span>
              <button
                onClick={() => setIsCoachingEnabled(!isCoachingEnabled)}
                id="btn-toggle-coaching-voice"
                className={`rounded-lg p-1.5 border transition-all ${
                  isCoachingEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                }`}
              >
                {isCoachingEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
            </div>
          </div>

          {/* Workout Action Control Panel */}
          <div className="pt-2 grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsPaused(!isPaused)}
              id="btn-toggle-pause-workout"
              className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-bold border transition-all cursor-pointer active:scale-98 ${
                isPaused 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950 border-emerald-500' 
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
              }`}
            >
              {isPaused ? <Play size={15} fill="currentColor" /> : <Pause size={15} />}
              {isPaused ? 'Resume Session' : 'Pause Workout'}
            </button>

            <button
              onClick={handleStopWorkout}
              id="btn-stop-workout"
              className="flex items-center justify-center gap-2 rounded-2xl bg-red-500 hover:bg-red-600 py-3.5 text-xs font-bold text-zinc-950 transition-all cursor-pointer active:scale-98"
            >
              <Square size={14} fill="currentColor" />
              Finish Workout
            </button>
          </div>
        </div>
      </div>

      {/* Summary report overlay Modal window */}
      <AnimatePresence>
        {showSummary && summaryData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-6 text-center my-8"
            >
              <div className="space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <Award size={26} />
                </div>
                <h2 className="text-xl font-black text-white">Workout Accomplished!</h2>
                <p className="text-zinc-400 text-xs leading-relaxed">Splendid work, {profile.name}! Your final tracking metrics have been calculated.</p>
              </div>

              {/* Core metrics badges */}
              <div className="grid grid-cols-3 gap-3 bg-zinc-950 p-4 rounded-2xl">
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Reps</p>
                  <p className="text-lg font-black text-white mt-0.5">{summaryData.reps}</p>
                </div>
                <div className="border-x border-zinc-800/80">
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Form Accuracy</p>
                  <p className="text-lg font-black text-emerald-400 mt-0.5">{summaryData.formAccuracy}%</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Burned</p>
                  <p className="text-lg font-black text-teal-400 mt-0.5">{summaryData.calories} <span className="text-[10px] font-normal text-zinc-500">kcal</span></p>
                </div>
              </div>

              {/* Warnings details */}
              {summaryData.reps > 0 && (
                <div className="text-left space-y-2.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Coaching Stats Overview</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Completed Reps</span>
                      <span className="font-semibold text-emerald-400">{summaryData.reps} valid reps</span>
                    </div>
                    <div className="flex justify-between text-zinc-400 pt-1.5 border-t border-zinc-800/40">
                      <span>Incomplete reps count</span>
                      <span className="font-semibold text-rose-400">{summaryData.incorrectReps} rejected reps</span>
                    </div>
                    {Object.values(summaryData.warningsCount).some(v => (v as any) > 0) && (
                      <div className="pt-2 border-t border-zinc-800/40">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">Common posture flags:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(summaryData.warningsCount).map(([warn, count]) => {
                            if (count === 0) return null;
                            return (
                              <span key={warn} className="rounded-full bg-amber-500/5 border border-amber-500/10 px-2.5 py-0.5 text-[11px] text-amber-400">
                                {warn}: <strong className="font-bold">{count}</strong>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Save/Close Action Controls */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handleSaveSummary}
                  id="btn-save-summary-modal"
                  className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 py-3.5 text-xs font-bold text-zinc-950 transition-all cursor-pointer active:scale-98"
                >
                  Save to workout History
                </button>
                <button
                  onClick={onCancel}
                  id="btn-discard-summary-modal"
                  className="w-full rounded-2xl bg-zinc-800 hover:bg-zinc-700 py-3 text-xs font-bold text-zinc-400 border border-zinc-800 transition-all cursor-pointer active:scale-98"
                >
                  Discard workout session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
