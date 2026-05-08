import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useTheme } from "./ThemeContext";

interface ChatProps {
  contextData: any;
}

function InteractiveSphere({ audioVolume }: { audioVolume: number }) {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerPos = useRef({ x: -1000, y: -1000 });
  
  // Calculate a smoothed target scale based on ONLY the microphone speaking volume.
  // We use max target between 1 and a multiplier of volume. 
  // It only changes colors and grows if audioVolume > 0.05.
  const isSpeaking = audioVolume > 0.05;
  const targetScale = isSpeaking ? Math.min(1.5, 1 + audioVolume * 5.0) : 1.0;
  // Let the spring physics interpolate the actual size/color.
  
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
      const pulse = targetScale; 
      
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
         const currentSize = dot.size * pulse;
         const currentAlpha = Math.min(1, dot.alpha + (pulse - 1) * 0.5);

         // Theme colors
         const activeRgb = theme === 'orange' ? [249, 115, 22] : [59, 130, 246];
         const idleRgb = [229, 226, 225];
         
         const blend = Math.min(1, (pulse - 1));
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
  }, [audioVolume, theme, targetScale]);

  return (
    <div className="w-full h-full flex items-center justify-center max-h-[400px]">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={800} 
        className="w-full h-full object-contain cursor-crosshair touch-none transition-transform duration-500"
        style={{ transform: `scale(${targetScale})` }}
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
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
       if (endSessionRef.current) endSessionRef.current();
       if (recognitionRef.current) {
          recognitionRef.current.stop();
       }
    };
  }, []);

  const askAssistant = async (text: string) => {
      setIsConnecting(true);
      try {
          // OpenRouter logic for gemma
          const systemPrompt = `You are the Fin_Core AI assistant. Keep answers very concise, usually 1 or 2 sentences max. Respond naturally.
Current Context:
Initial Amount: ₹${contextData.initialSavings}
Time Horizon: ${contextData.timeHorizon} years
Selected Asset: ${contextData.assetLabel}
Current Simulation Rate: ${contextData.inflationRate}%

Historical Prices (2014) vs Now:
Gold: ₹2,800/1g -> ₹14,349/1g
Silver: ₹40/1g -> ₹75/1g
Petrol: ₹72/Liter -> ₹95/Liter
Chocolate: ₹40/Bar -> ₹100/Bar`;

          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "Authorization": "Bearer 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",
              },
              body: JSON.stringify({
                  model: "google/gemma-2-27b-it", // Correct model name format for OpenRouter
                  messages: [
                      { role: "system", content: systemPrompt },
                      { role: "user", content: text }
                  ]
              })
          });

          if (!response.ok) {
              throw new Error(`OpenRouter API error: ${response.status}`);
          }

          const data = await response.json();
          const reply = data.choices[0].message.content;
          
          // Use Web Speech API for TTS
          const utterance = new SpeechSynthesisUtterance(reply);
          utterance.rate = 1.0;
          
          utterance.onstart = () => {
             // Fake some audio volume while the AI is speaking so it pulses
             const fakePulse = setInterval(() => {
                 setAudioVolume(0.1 + Math.random() * 0.3);
             }, 100);
             utterance.onend = () => {
                 clearInterval(fakePulse);
                 setAudioVolume(0);
                 if (isConnected) {
                     // Restart recognition if we are still connected
                    try {
                       recognitionRef.current?.start();
                    } catch(e) { console.error(e) }
                 }
             };
          };
          window.speechSynthesis.speak(utterance);

      } catch(err: any) {
          console.error(err);
          setMicError(err.message || "Failed to get AI response.");
      } finally {
          setIsConnecting(false);
      }
  };

  const toggleConnection = async () => {
    if (isConnected) {
      if (endSessionRef.current) endSessionRef.current();
      if (recognitionRef.current) {
          recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel(); // Stop talking
      setIsConnected(false);
      setAudioVolume(0);
      return;
    }

    setIsConnecting(true);
    setMicError(null);
    try {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          throw new Error("Speech Recognition API is not supported in this browser.");
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';
      recognitionRef.current = recognition;
      let finalTranscript = '';

      recognition.onstart = () => {
          setIsConnected(true);
          setIsConnecting(false);
      };

      recognition.onaudiostart = () => {
         setAudioVolume(0.1); 
      };
      
      recognition.onsoundstart = () => {
         setAudioVolume(0.2);
      };
      
      recognition.onspeechstart = () => {
         setAudioVolume(0.3);
      };
      
      recognition.onspeechend = () => {
          setAudioVolume(0.0);
      };

      recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                  finalTranscript += event.results[i][0].transcript;
                  
                  // When a sentence is complete, send it
                  const text = event.results[i][0].transcript.trim();
                  if (text) {
                      setAudioVolume(0);
                      recognition.stop(); // Stop listening while processing & talking
                      askAssistant(text);
                  }
              } else {
                  interimTranscript += event.results[i][0].transcript;
                  // Pulse slightly when user is talking
                  setAudioVolume(0.15 + Math.random() * 0.1);
              }
          }
      };

      recognition.onerror = (event: any) => {
          if (event.error === 'no-speech') {
             // Just ignore nothing said
             setAudioVolume(0);
          } else if (event.error === 'aborted') {
             setAudioVolume(0);
          } else {
              setMicError("Mic error: " + event.error);
              setIsConnected(false);
              setIsConnecting(false);
          }
      };

      recognition.onend = () => {
         setAudioVolume(0);
      };

      // Set up volume tracking via Web Audio API 
      // (SpeechRecognition doesn't give us volume levels natively, so we side-channel it for visuals)
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const monitorVolume = () => {
          if (!isConnected) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for(let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Only update volume state if not speaking (to user) or recognized speech
          // Note: using SpeechSynthesis 'speaking' flag isn't always perfectly sync'd, 
          // we use it as a general heuristic here.
          if (!window.speechSynthesis.speaking) {
              setAudioVolume(avg / 255.0); 
          }
          requestAnimationFrame(monitorVolume);
      };

      recognition.start();
      
      endSessionRef.current = () => {
          if (audioContext.state !== 'closed') audioContext.close();
          stream.getTracks().forEach(t => t.stop());
          window.speechSynthesis.cancel();
      };
      
      // Start the separate volume monitor loop
      setTimeout(() => {
          if (isConnected) monitorVolume();
      }, 500);

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
