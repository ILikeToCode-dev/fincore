import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Calculator } from "lucide-react";
import { motion } from "motion/react";

interface ChatProps {
  contextData: any;
}

interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  id: string;
}

const OPENROUTER_API_KEY = "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";
const MODEL = "google/gemma-4-26b-a4b-it:free"; 

export function ChatTab({ contextData }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "msg-0", role: "assistant", content: "System Online. I am the Fin_Core AI assistant. I have access to your current simulation parameters. How can I help you analyze your purchasing power today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: `msg-${Date.now()}`, role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const systemPrompt = `You are the Fin_Core AI assistant. Keep answers concise.
Current Simulation Context:
Initial Amount: ₹${contextData.initialSavings}
Time Horizon: ${contextData.timeHorizon} years
Selected Asset: ${contextData.assetLabel}
Current Simulation Rate: ${contextData.inflationRate}%

Historical Prices (2014 vs Now):
Gold: 28,000 -> 62,000
Silver: 40,000 -> 75,000
Petrol: 72 -> 95
Chocolate: 40 -> 100

If asked to calculate purchasing power, use the calculatePurchasingPower tool instead of doing math yourself!!! DO NOT try to answer math questions without calling the tool.`;

      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...newMessages.map(m => ({ role: m.role, content: m.content }))
      ];

      const makeRequest = async (msgs: any[]) => {
        return fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "Fin_Core"
          },
          body: JSON.stringify({
            model: MODEL,
            messages: msgs,
            tools: [{
              type: "function",
              function: {
                name: "calculatePurchasingPower",
                description: "Calculates the future purchasing power of money given inflation and time.",
                parameters: {
                  type: "object",
                  properties: {
                    initialAmount: { type: "number" },
                    inflationRatePercent: { type: "number" },
                    years: { type: "number" }
                  },
                  required: ["initialAmount", "inflationRatePercent", "years"]
                }
              }
            }]
          })
        });
      };

      let res = await makeRequest(apiMessages);
      
      if (!res.ok) {
        let errStr = await res.text();
        throw new Error(`API returned ${res.status}: ${errStr}`);
      }

      let data = await res.json();
      let responseMessage = data.choices[0].message;

      // Handle tool call
      if (responseMessage.tool_calls) {
        setMessages(prev => [...prev, { id: `msg-${Date.now()}-temp`, role: "assistant", content: `(Calling Calculator...)` }]);
        
        apiMessages.push(responseMessage); // Add assistant tool call message
        
        const toolCall = responseMessage.tool_calls[0];
        if (toolCall.function.name === "calculatePurchasingPower") {
          const args = JSON.parse(toolCall.function.arguments);
          const futureValue = args.initialAmount / Math.pow((1 + args.inflationRatePercent / 100), args.years);
          const toolResult = `The calculatePurchasingPower tool output: Future Value is ₹${Math.round(futureValue).toLocaleString('en-IN')}`;
          
          apiMessages.push({
            role: "tool",
            content: toolResult,
            tool_call_id: toolCall.id,
            name: toolCall.function.name
          });

          // Second pass
          res = await makeRequest(apiMessages);
          data = await res.json();
          responseMessage = data.choices[0].message;
          
          // replace the temp "(Calling Calculator...)" message
          setMessages(prev => {
            const filtered = prev.filter(p => !p.id.endsWith("-temp"));
            return [...filtered, { id: `msg-${Date.now()}`, role: "assistant", content: responseMessage.content }];
          });
        }
      } else {
        setMessages(prev => [...prev, { id: `msg-${Date.now()}`, role: "assistant", content: responseMessage.content }]);
      }

    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { id: `msg-${Date.now()}`, role: "assistant", content: `[ERROR_ENCOUNTERED]: ${error.message} - Ensure the model name is correct and API key is valid.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] max-h-[800px] border border-white/10 rounded-2xl overflow-hidden bg-surface/50 shadow-2xl backdrop-blur-3xl animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div className="bg-surface/80 border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-ui font-semibold text-white tracking-tight">Fin_Core Assistant</h3>
            <p className="font-data text-[10px] text-primary uppercase tracking-widest mt-0.5" title={MODEL}>
              {MODEL.length > 25 ? MODEL.substring(0,25) + '...' : MODEL}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
           <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/30 border border-white/5 shadow-inner">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
             <span className="font-data text-[10px] uppercase text-text-muted tracking-widest">Sys_Link</span>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((msg) => (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id} 
            className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-surface-high border border-border text-white'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : msg.content.includes('Calling Calculator') ? <Calculator className="w-4 h-4 text-green-500" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`p-4 rounded-xl font-ui text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-surface-high border border-border text-text-main rounded-tl-none whitespace-pre-wrap'}`}>
              {msg.content}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-3 mr-auto max-w-[85%]">
            <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-surface-high border border-border text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-xl rounded-tl-none bg-surface-high border border-border flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-4 border-t border-white/10 bg-surface/50">
        <form 
          className="relative flex items-center"
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask about your simulation..."
            className="w-full bg-surface-high border border-border text-white px-4 py-3 pr-12 rounded-xl focus:outline-none focus:border-primary transition-colors font-ui text-sm placeholder:text-text-muted"
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 text-text-muted hover:text-primary transition-colors disabled:opacity-50 disabled:hover:text-text-muted"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
