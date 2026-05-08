import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useTheme } from "./ThemeContext";

interface ChatProps {
  contextData: any;
}

// Visualizer logic (unchanged, but remains part of the file)
function InteractiveSphere({ audioVolume }: { audioVolume: number }) {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerPos = useRef({ x: -1000, y: -1000 });
  const isSpeaking = audioVolume > 0.05;
  const targetScale = isSpeaking ? Math.min(1.5, 1 + audioVolume * 5.0) : 1.0;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const numDots = 800; const dots: any[] = [];
    const cx = canvas.width / 2; const cy = canvas.height / 2;
    const baseRadius = canvas.width * 0.35;
    for (let i = 0; i < numDots; i++) {
       const r = baseRadius * Math.sqrt(Math.random());
       const theta = Math.random() * 2 * Math.PI;
       dots.push({ x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta), baseX: cx + r * Math.cos(theta), baseY: cy + r * Math.sin(theta), vx: 0, vy: 0, size: Math.random() * 1.5 + 0.8, alpha: Math.random() * 0.5 + 0.3, phase: Math.random() * Math.PI * 2, speed: Math.random() * 1.5 + 0.5 });
    }
    let animationId: number;
    const draw = () => {
      const time = Date.now() / 1000; ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach(dot => {
          const targetX = cx + (dot.baseX - cx) * targetScale + Math.sin(time * dot.speed + dot.phase) * 6;
          const targetY = cy + (dot.baseY - cy) * targetScale + Math.cos(time * dot.speed * 0.8 + dot.phase) * 6;
          const dxMouse = dot.x - pointerPos.current.x; const dyMouse = dot.y - pointerPos.current.y;
          const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
          if (distMouse < 120 && distMouse > 0) { const force = (120 - distMouse) / 120; dot.vx += (dxMouse / distMouse) * force * 8.0; dot.vy += (dyMouse / distMouse) * force * 8.0; }
          dot.vx += (targetX - dot.x) * 0.08; dot.vy += (targetY - dot.y) * 0.08; dot.vx *= 0.82; dot.vy *= 0.82; dot.x += dot.vx; dot.y += dot.vy;
          const activeRgb = theme === 'orange' ? [249, 115, 22] : [59, 130, 246];
          const blend = Math.min(1, (targetScale - 1));
          ctx.fillStyle = `rgba(${229 + (activeRgb[0] - 229) * blend}, ${226 + (activeRgb[1] - 226) * blend}, ${225 + (activeRgb[2] - 225) * blend}, ${Math.min(1, dot.alpha + (targetScale - 1) * 0.5)})`;
          ctx.beginPath(); ctx.arc(dot.x, dot.y, dot.size * targetScale, 0, Math.PI * 2); ctx.fill();
      });
      animationId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [audioVolume, theme, targetScale]);

  return (
    <div className="w-full h-full flex items-center justify-center max-h-[400px]">
      <canvas ref={canvasRef} width={800} height={800} className="w-full h-full object-contain cursor-crosshair touch-none" />
    </div>
  );
}

export function ChatTab({ contextData }: ChatProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const recognitionRef = useRef<any>(null);

  // Uses environment variable with a fallback to your current working URL
  const AI_URL = import.meta.env.VITE_AI_URL || "https://unbridle-bootie-vitality.ngrok-free.dev";

  const askAssistant = async (text: string) => {
    setIsConnecting(true);
    setMicError(null);
    try {
      const promptWrapper = `### Instruction:
You are the Fin_Core AI assistant. Keep answers very concise (1-2 sentences). Respond naturally in a helpful tone.
Context: Savings: ₹${contextData.initialSavings}, Time: ${contextData.timeHorizon} years, Asset: ${contextData.assetLabel}.

### User:
${text}

### Assistant:
### Output:`;

      const response = await fetch(`${AI_URL}/generate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420" 
        },
        body: JSON.stringify({ prompt: promptWrapper }),
      });

      if (!response.ok) throw new Error("Could not reach Llama 3.1 on Colab.");

      const data = await response.json();
      
      // --- ROBUST CLEANING LOGIC ---
      let reply = data.response;
      // Remove tokens and metadata
      reply = reply.replace("<|begin_of_text|>", "").replace("<|end_of_text|>", "");
      // Split to find the actual answer after the prompt
      if (reply.includes("### Output:")) {
        reply = reply.split("### Output:")[1];
      } else if (reply.includes("### Assistant:")) {
        reply = reply.split("### Assistant:")[1];
      }
      reply = reply.split("###")[0].trim(); // Cut any trailing prompt hallucinations
      // -----------------------------

      const utterance = new SpeechSynthesisUtterance(reply);
      utterance.onstart = () => {
        const fakePulse = setInterval(() => setAudioVolume(0.1 + Math.random() * 0.3), 100);
        utterance.onend = () => {
          clearInterval(fakePulse);
          setAudioVolume(0);
          if (isConnected) {
            try { recognitionRef.current?.start(); } catch(e) {}
          }
        };
      };
      window.speechSynthesis.speak(utterance);

    } catch (err: any) {
      setMicError("AI Offline. Ensure Colab and Ngrok are active.");
    } finally {
      setIsConnecting(false);
    }
  };

  const toggleConnection = async () => {
    if (isConnected) {
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();
      setIsConnected(false);
      setAudioVolume(0);
      return;
    }

    setIsConnecting(true);
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) throw new Error("Speech not supported.");
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.lang = 'en-IN';
      recognitionRef.current = recognition;
      recognition.onstart = () => { setIsConnected(true); setIsConnecting(false); };
      recognition.onresult = (event: any) => {
        const text = event.results[event.results.length - 1][0].transcript.trim();
        if (event.results[event.results.length - 1].isFinal && text) {
          recognition.stop();
          askAssistant(text);
        } else {
          setAudioVolume(0.15 + Math.random() * 0.1);
        }
      };
      recognition.onerror = () => { setIsConnected(false); setIsConnecting(false); };
      recognition.start();
    } catch (e: any) {
      setMicError(e.message);
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center relative w-full h-[70vh] min-h-[500px]">
      <InteractiveSphere audioVolume={audioVolume} />
      <div className="absolute bottom-10 flex flex-col items-center w-full max-w-md px-6 z-50">
        <button 
          onClick={toggleConnection}
          disabled={isConnecting}
          className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 transition-all duration-300 shadow-xl ${isConnected ? 'bg-red-500/20 border border-red-500/50 text-red-500' : 'bg-white/10 border border-white/20 text-white'}`}
        >
          {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : isConnected ? <MicOff /> : <Mic />}
        </button>
        <form onSubmit={(e) => { e.preventDefault(); if(textInput.trim()) askAssistant(textInput); setTextInput(""); }} className="w-full">
          <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Ask Fin_Core..." className="w-full bg-black/40 border border-white/10 rounded-full px-4 py-2 text-white placeholder-white/40 outline-none focus:border-blue-500 backdrop-blur-md" />
        </form>
        {micError && <p className="text-[10px] text-red-500 mt-4 uppercase tracking-tighter bg-black/80 px-2 py-1 rounded">{micError}</p>}
      </div>
    </div>
  );
}