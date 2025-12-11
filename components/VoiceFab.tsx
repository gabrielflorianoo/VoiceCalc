import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceFabProps {
  toggleListening: () => void;
  state: 'IDLE' | 'LISTENING' | 'PROCESSING' | 'ERROR';
}

const VoiceFab: React.FC<VoiceFabProps> = ({ toggleListening, state }) => {
  const isListening = state === 'LISTENING';
  const isProcessing = state === 'PROCESSING';
  const isError = state === 'ERROR';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2">
      {/* Status Label Bubble */}
      {(isListening || isProcessing || isError) && (
        <div className={`
          px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg mb-2
          animate-in fade-in slide-in-from-bottom-2 duration-300
          ${isError ? 'bg-red-600' : 'bg-slate-700/90 backdrop-blur'}
        `}>
          {isListening && "Ouvindo..."}
          {isProcessing && "Processando..."}
          {isError && "Não entendi"}
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={toggleListening}
        className={`
          relative w-16 h-16 rounded-full shadow-2xl 
          flex items-center justify-center 
          transition-all duration-300 ease-in-out
          active:scale-95 border-2
          ${isListening 
            ? 'bg-red-500 border-red-300 shadow-red-500/50 scale-110' 
            : isError
              ? 'bg-slate-700 border-red-500'
              : 'bg-emerald-500 border-emerald-400 shadow-emerald-500/50 hover:bg-emerald-400'
          }
        `}
        aria-label="Controle de Voz"
      >
        {/* Ripple Effect for Listening */}
        {isListening && (
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
        )}

        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-white animate-spin relative z-10" />
        ) : isListening ? (
          <Mic className="w-8 h-8 text-white relative z-10 animate-pulse" />
        ) : (
          <MicOff className="w-8 h-8 text-white opacity-80 relative z-10" />
        )}
      </button>
    </div>
  );
};

export default VoiceFab;