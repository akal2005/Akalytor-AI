import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Brain, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { getToken, API_URL } from '../lib/api';

interface Message {
  sender: 'user' | 'moni';
  text: string;
  isStreaming?: boolean;
}

interface AIPageProps {
  triggerNotification: (msg: string) => void;
  onActionExecuted: () => void;
}

export const AI: React.FC<AIPageProps> = ({ triggerNotification, onActionExecuted }) => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'moni', text: 'MONI AI active. State terminal synchronized. How can I assist you today, Operator?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API for voice recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (e: any) => {
        const resultText = e.results[0][0].transcript;
        setInputText(resultText);
        // Automatically send voice messages for hands-free action
        setTimeout(() => sendMessage(resultText), 600);
      };

      rec.onerror = () => {
        setIsListening(false);
        triggerNotification('Voice command capture failed.');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [triggerNotification]);

  // Connect to WebSocket Server
  const connectWebSocket = () => {
    const token = getToken();
    if (!token) return;

    // Convert http(s) URL to ws(s)
    const wsBase = API_URL.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/api/v1/ai/ws/chat?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = event.data;

      // Handle stream completion signal
      if (data === '[DONE]') {
        setIsTyping(false);
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.sender === 'moni') {
            lastMsg.isStreaming = false;
            // Speak the response aloud if TTS is enabled
            if (ttsEnabled) {
              speakText(lastMsg.text);
            }
          }
          return updated;
        });
        
        // Notify parent to fetch new database records (since task/expense may have been injected)
        onActionExecuted();
        return;
      }

      // Check if message is a database action notification (like completed task)
      const isActionNotification = data.startsWith('✅ *Action Executed:') || data.startsWith('⚠️ *Action Failed:');

      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];

        if (lastMsg && lastMsg.sender === 'moni' && lastMsg.isStreaming) {
          // Append to streaming response
          return [
            ...updated.slice(0, -1),
            { ...lastMsg, text: lastMsg.text + (isActionNotification ? `\n\n${data}` : data) }
          ];
        } else {
          // Start a new message
          return [
            ...updated,
            { sender: 'moni', text: data, isStreaming: !isActionNotification }
          ];
        }
      });
    };

    ws.onerror = () => {
      setWsConnected(false);
    };

    ws.onclose = () => {
      setWsConnected(false);
      // Reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    socketRef.current = ws;
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Autoscroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel active synthesis
    window.speechSynthesis.cancel();
    
    // Clean text from commands and markdown stars for cleaner TTS audio
    const cleanText = text
      .replace(/\*+/g, '')
      .replace(/✅/g, 'Success.')
      .replace(/⚠️/g, 'Warning.');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Find a cybernetic-sounding voice if available
    const voices = window.speechSynthesis.getVoices();
    const googleVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Natural'));
    if (googleVoice) utterance.voice = googleVoice;
    
    utterance.pitch = 0.95; // Slightly lower pitch for cooler robotic feel
    utterance.rate = 1.05;  // Slightly faster speech rate
    
    window.speechSynthesis.speak(utterance);
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      triggerNotification('Web Speech API is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Cancel TTS voice output when starting recording
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current.start();
    }
  };

  const sendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    if (!wsConnected || !socketRef.current) {
      triggerNotification('Reconnecting terminal socket...');
      return;
    }

    // Add user message to history
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setIsTyping(true);
    setInputText('');

    // Send through WebSocket
    socketRef.current.send(text);
  };

  return (
    <div className="mono-panel flex flex-col h-[76vh] overflow-hidden select-none">
      {/* AI Header */}
      <div className="bg-[#111113] border-b border-[#1e1e22] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center border border-zinc-700">
            <Brain size={16} />
          </div>
          <div>
            <h2 className="font-heading text-sm font-semibold tracking-wider text-white uppercase">Moni AI Interface</h2>
            <p className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5 mt-0.5">
              <span className={`led-indicator ${wsConnected ? 'online' : 'offline'}`}></span>
              <span>{wsConnected ? 'CONNECTION ESTABLISHED' : 'OFFLINE // RECONNECTING'}</span>
            </p>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-3">
          {/* TTS Audio toggle */}
          <button
            onClick={() => {
              setTtsEnabled(!ttsEnabled);
              if (ttsEnabled && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              triggerNotification(ttsEnabled ? 'Speech feedback deactivated.' : 'Speech feedback active.');
            }}
            className={`p-2 rounded border transition-all ${
              ttsEnabled 
                ? 'bg-white border-white text-black' 
                : 'bg-transparent border-[#1e1e22] text-zinc-400 hover:text-white'
            }`}
            title="Toggle Text-to-Speech Output"
          >
            {ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
          
          <button 
            onClick={() => {
              setMessages([{ sender: 'moni', text: 'MONI AI active. State terminal synchronized.' }]);
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            }}
            className="p-2 rounded border border-[#1e1e22] text-zinc-400 hover:text-white hover:bg-zinc-900/60"
            title="Reset Terminal Logs"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex items-start gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded border flex-shrink-0 flex items-center justify-center font-bold font-mono text-xs ${
              msg.sender === 'user' 
                ? 'bg-zinc-800 border-zinc-700 text-white' 
                : 'bg-white border-white text-black'
            }`}>
              {msg.sender === 'user' ? 'U' : 'M'}
            </div>

            {/* Bubble */}
            <div className={`max-w-[70%] p-4 rounded text-xs leading-relaxed font-mono whitespace-pre-wrap ${
              msg.sender === 'user'
                ? 'bg-[#151518] border border-[#1e1e22] text-white'
                : 'bg-[#0c0c0e] border border-[#1e1e22] text-zinc-300'
            }`}>
              {msg.text}
              {msg.isStreaming && (
                <span className="inline-block w-1.5 h-3 bg-white ml-1 animate-pulse" />
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-zinc-500 font-mono text-[10px] pl-12">
            <Sparkles size={10} className="animate-spin" />
            <span>Moni is processing command stack...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Tray */}
      <div className="p-4 bg-[#111113] border-t border-[#1e1e22]">
        <div className="flex gap-2">
          {/* Micro Button */}
          <button
            onClick={toggleMic}
            className={`p-3 rounded border transition-all cursor-pointer flex-shrink-0 flex items-center justify-center ${
              isListening
                ? 'bg-white border-white text-black animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                : 'bg-transparent border-[#1e1e22] text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
            title="Speech Recognition Command"
          >
            {isListening ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            className="mono-input flex-1 py-3 text-xs font-mono"
            placeholder={isListening ? "Listening for command..." : "Ask MONI to create tasks, log expenses, or save notes..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isListening}
          />

          {/* Send Button */}
          <button
            onClick={() => sendMessage()}
            className="mono-btn px-5 flex-shrink-0"
            disabled={isListening}
          >
            <Send size={14} />
          </button>
        </div>
        <div className="mt-2 text-center">
          <p className="text-[9px] text-zinc-600 font-mono select-none">
            VOICE INPUT CAPABILITIES SUPPORTED // SPEECH FEEDBACK: {ttsEnabled ? 'ON' : 'OFF'}
          </p>
        </div>
      </div>
    </div>
  );
};
