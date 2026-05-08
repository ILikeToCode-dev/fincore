import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Bot, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { useTheme } from "./ThemeContext";

interface ChatProps {
  contextData: any;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function InteractiveSphere({ audioVolume }: { audioVolume: number }) {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerPos = useRef({ x: -1000, y: -1000 });
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Generate particles
    const numDots = 800; // Dense 2d circle
    const dots: { x: number, y: number, baseX: number, baseY: number, vx: number, vy: number, size: number, alpha: number, phase: number, speed: number }[] = [];
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const baseRadius = canvas.width * 0.35;

    for (let i = 0; i < numDots; i++) {
       // Distribute randomly within a circle to make a solid 2d disk/circle shape
       // Using sqrt for uniform distribution
       const r = baseRadius * Math.sqrt(Math.random());
       const theta = Math.random() * 2 * Math.PI;
       
       const x = cx + r * Math.cos(theta);
       const y = cy + r * Math.sin(theta);

       dots.push({ 
         x: x,
         y: y,
         baseX: x,
         baseY: y,
         vx: 0,
         vy: 0,
         size: Math.random() * 1.5 + 0.8,
         alpha: Math.random() * 0.5 + 0.3,
         phase: Math.random() * Math.PI * 2,
         speed: Math.random() * 1.5 + 0.5
       });
    }

    let animationId: number;
    const startTime = Date.now();
    
    // Physics constants
    const friction = 0.82; 
    const springFactor = 0.08; 
    const repulsionRadius = 120; // Radius of mouse influence
    const repulsionForce = 8.0;

    const draw = () => {
      const time = (Date.now() - startTime) / 1000;
      
      // Expand circle slightly with audio volume
      const pulse = 1 + (audioVolume * 0.15); 
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      dots.forEach(dot => {
         // Target position (scaled by pulse)
         const dxCenter = dot.baseX - cx;
         const dyCenter = dot.baseY - cy;
         
         // Organic alive movement (drift)
         const driftX = Math.sin(time * dot.speed + dot.phase) * 6;
         const driftY = Math.cos(time * dot.speed * 0.8 + dot.phase) * 6;
         
         const targetX = cx + dxCenter * pulse + driftX;
         const targetY = cy + dyCenter * pulse + driftY;
         
         // Interaction: Vector from pointer to point
         const dxMouse = dot.x - pointerPos.current.x;
         const dyMouse = dot.y - pointerPos.current.y;
         const distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;
         const distMouse = Math.sqrt(distMouseSq);

         // Apply repulsion force if inside radius
         if (distMouse < repulsionRadius && distMouse > 0) {
            const force = (repulsionRadius - distMouse) / repulsionRadius;
            dot.vx += (dxMouse / distMouse) * force * repulsionForce;
            dot.vy += (dyMouse / distMouse) * force * repulsionForce;
         }

         // Apply spring force pulling back to target base position
         const dxTarget = targetX - dot.x;
         const dyTarget = targetY - dot.y;
         dot.vx += dxTarget * springFactor;
         dot.vy += dyTarget * springFactor;

         // Apply friction to slow down over time
         dot.vx *= friction;
         dot.vy *= friction;

         // Update absolute position
         dot.x += dot.vx;
         dot.y += dot.vy;
         
         // Make points pulse lightly with audio
         const currentSize = dot.size * (1 + audioVolume * 1.0);
         const currentAlpha = Math.min(1, dot.alpha + audioVolume * 0.5);

         // Theme colors
         const activeRgb = theme === 'orange' ? [249, 115, 22] : [59, 130, 246];
         const idleRgb = [229, 226, 225];
         
         const blend = Math.min(1, audioVolume * 4);
         const r = idleRgb[0] + (activeRgb[0] - idleRgb[0]) * blend;
         const g = idleRgb[1] + (activeRgb[1] - idleRgb[1]) * blend;
         const b = idleRgb[2] + (activeRgb[2] - idleRgb[2]) * blend;

         ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${currentAlpha})`;
         ctx.beginPath();
         ctx.arc(dot.x, dot.y, currentSize, 0, Math.PI * 2);
         ctx.fill();
      });
      
      animationId = requestAnimationFrame(draw);
    };
    draw();
    
    // Correctly scale mouse coordinates from screen size to actual canvas internal size
    const scalePointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      pointerPos.current = {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) {
        if (e.touches.length > 0) {
          scalePointer(e.touches[0].clientX, e.touches[0].clientY);
        }
      } else {
        scalePointer((e as MouseEvent).clientX, (e as MouseEvent).clientY);
      }
    };

    const onLeave = () => {
      // Move pointer far away so it stops repelling
      pointerPos.current = { x: -1000, y: -1000 };
    };

    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('touchmove', onPointerMove, { passive: true });
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('touchend', onLeave);
    
    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('mousemove', onPointerMove);
      canvas.removeEventListener('touchmove', onPointerMove);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('touchend', onLeave);
    };
  }, [audioVolume, theme]);

  return (
    <div className="w-full h-full flex items-center justify-center max-h-[400px]">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={800} 
        className="w-full h-full object-contain cursor-crosshair touch-none"
      />
    </div>
  );
}

export function ChatTab({ contextData }: ChatProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  
  const endSessionRef = useRef<() => void>();

  useEffect(() => {
    return () => {
      if (endSessionRef.current) endSessionRef.current();
    };
  }, []);

  const toggleConnection = async () => {
    if (isConnected) {
      if (endSessionRef.current) endSessionRef.current();
      setIsConnected(false);
      return;
    }

    setIsConnecting(true);
    setMicError(null);
    try {
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      source.connect(processor);
      processor.connect(audioContext.destination);

      // 24kHz playback context for Gemini's output
      const playbackContext = new AudioContext({ sampleRate: 24000 });
      let nextPlayTime = playbackContext.currentTime;

      const playAudio = (base64String: string) => {
          const binary = atob(base64String);
          const buffer = new ArrayBuffer(binary.length);
          const view = new Uint8Array(buffer);
          for (let i = 0; i < binary.length; i++) {
              view[i] = binary.charCodeAt(i);
          }
          
          const int16Array = new Int16Array(buffer);
          const float32Array = new Float32Array(int16Array.length);
          for (let i = 0; i < int16Array.length; i++) {
               float32Array[i] = int16Array[i] / 32768.0;
          }

          const audioBuffer = playbackContext.createBuffer(1, float32Array.length, 24000);
          audioBuffer.getChannelData(0).set(float32Array);
          
          const source = playbackContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(playbackContext.destination);
          
          const startTime = Math.max(nextPlayTime, playbackContext.currentTime);
          source.start(startTime);
          nextPlayTime = startTime + audioBuffer.duration;
      };

      const systemPrompt = `You are the Fin_Core AI assistant. Keep answers very concise, usually 1 or 2 sentences max. Respond naturally in voice.
Current Context:
Initial Amount: ₹${contextData.initialSavings}
Time Horizon: ${contextData.timeHorizon} years
Selected Asset: ${contextData.assetLabel}
Current Simulation Rate: ${contextData.inflationRate}%

Historical Prices (2014) vs Now:
Gold: ₹2,800/g -> ₹14,349/g
Silver: ₹40/g -> ₹75/g
Petrol: ₹72 -> ₹95
Chocolate: ₹40 -> ₹100`;

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } }
          },
          systemInstruction: systemPrompt,
        },
        callbacks: {
          onopen: () => {
             setIsConnected(true);
             setIsConnecting(false);
             processor.onaudioprocess = (e) => {
                 const inputData = e.inputBuffer.getChannelData(0);
                 const pcmData = new Int16Array(inputData.length);
                 let sum = 0;
                 for(let i=0; i<inputData.length; i++) {
                     const s = Math.max(-1, Math.min(1, inputData[i]));
                     pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                     sum += Math.abs(inputData[i]);
                 }
                 setAudioVolume(sum / inputData.length);
                 
                 const buffer = new ArrayBuffer(pcmData.length * 2);
                 const view = new Uint8Array(buffer);
                 const temp = new Int16Array(buffer);
                 temp.set(pcmData);
                 let binary = '';
                 for (let i = 0; i < view.length; i++) {
                     binary += String.fromCharCode(view[i]);
                 }
                 const base64Data = btoa(binary);
                 
                 sessionPromise.then(session => {
                     session.sendRealtimeInput({
                         audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                     });
                 });
             };
          },
          onmessage: async (message: LiveServerMessage) => {
             const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
             if (base64Audio) {
                 playAudio(base64Audio);
             }
             if (message.serverContent?.interrupted) {
                 nextPlayTime = playbackContext.currentTime;
             }
          },
          onclose: () => {
             setIsConnected(false);
             processor.disconnect();
             source.disconnect();
             if (audioContext.state !== 'closed') audioContext.close();
             if (playbackContext.state !== 'closed') playbackContext.close();
             stream.getTracks().forEach(t => t.stop());
          }
        }
      });

      endSessionRef.current = () => {
        sessionPromise.then(s => s.close());
      };

    } catch (e: any) {
      console.error(e);
      setMicError(e.message || "Failed to connect to microphone");
      setIsConnecting(false);
      setIsConnected(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center relative w-full h-[70vh] min-h-[500px] animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden relative w-full">
        <InteractiveSphere 
          audioVolume={audioVolume} 
        />
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center z-50">
          <button 
            onClick={toggleConnection}
            disabled={isConnecting}
            className={`w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-300 shadow-xl ${isConnected ? 'bg-danger/20 border border-danger/50 text-danger hover:bg-danger/30' : 'bg-surface/50 border border-border text-primary hover:bg-surface'} ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isConnecting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isConnected ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
          
          {micError && (
            <p className="font-data text-xs mt-4 uppercase tracking-widest text-danger max-w-[200px] text-center bg-surface/80 p-2 rounded backdrop-blur-md">
              {micError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
