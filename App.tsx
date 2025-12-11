import { useState, useEffect, useRef, useCallback, FC } from 'react';
import {
    Calculator,
    FlaskConical,
    Banknote,
    ArrowRightLeft,
    Menu,
    History,
    Delete,
    Check,
    Mic,
} from 'lucide-react';
import { AppMode, IWindow } from './types';
import { useHistoryStorage } from './hooks/useLocalStorage';
import { detectCommand } from './utils/voiceUtils';
import {
    playStartSound,
    playSuccessSound,
    playErrorSound,
} from './utils/soundUtils';
import VoiceFab from './components/VoiceFab';
import HistoryView from './components/HistoryView';
import SaveModal from './components/SaveModal';

const Button = ({
    label,
    onClick,
    className = '',
    secondary = false,
    accent = false,
}: any) => (
    <button
        onClick={onClick}
        className={`
      flex items-center justify-center text-xl font-bold rounded-2xl transition-all active:scale-95
      ${secondary ? 'bg-slate-700 text-slate-200' : 'bg-slate-800 text-white'}
      ${accent ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : ''}
      ${label === 'AC' || label === 'DEL' ? 'bg-rose-900/40 text-rose-400' : ''}
      ${className}
    `}
    >
        {label}
    </button>
);

type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'ERROR';

const App: FC = () => {
    const [mode, setMode] = useState<AppMode>(AppMode.NORMAL);
    const [input, setInput] = useState('0');
    const [prevVal, setPrevVal] = useState<string | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [voiceFeedback, setVoiceFeedback] = useState('');

    const { history, addRecord, clearHistory } = useHistoryStorage();

    // Voice Recognition Ref
    const recognitionRef = useRef<any>(null);

    // --- Calculator Logic ---

    const handleNumber = (num: string) => {
        setInput((prev) =>
            prev === '0' || prev === 'Error' ? num : prev + num,
        );
    };

    const handleOperator = (op: string) => {
        if (op === '√') {
            try {
                const val = parseFloat(input);
                setInput(Math.sqrt(val).toString());
            } catch {
                setInput('Error');
            }
            return;
        }

        setPrevVal(input);
        setOperator(op);
        setInput('0');
    };

    const calculate = useCallback(() => {
        if (!prevVal || !operator) return;

        const current = parseFloat(input);
        const previous = parseFloat(prevVal);
        let result = 0;

        switch (operator) {
            case '+':
                result = previous + current;
                break;
            case '-':
                result = previous - current;
                break;
            case '*':
                result = previous * current;
                break;
            case '/':
                result = current === 0 ? 0 : previous / current;
                break;
            case '^':
                result = Math.pow(previous, current);
                break;
            default:
                return;
        }

        // Limit decimals to avoid floating point errors
        const resString = parseFloat(result.toFixed(4)).toString();
        setInput(resString);
        setOperator(null);
        setPrevVal(null);
        return resString;
    }, [input, prevVal, operator]);

    const clear = () => {
        setInput('0');
        setPrevVal(null);
        setOperator(null);
    };

    const del = () => {
        setInput((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    };

    const handleSaveInit = () => {
        const val = parseFloat(input);
        if (!isNaN(val) && val > 0) {
            setShowSaveModal(true);
        }
    };

    const handleSaveConfirm = (location: string) => {
        const val = parseFloat(input);
        addRecord(val, location);
        setShowSaveModal(false);
        setVoiceFeedback(`Salvo: R$${val} em ${location}`);
        setTimeout(() => setVoiceFeedback(''), 3000);
    };

    // --- Voice Logic ---

    const processCommand = (transcript: string) => {
        setVoiceState('PROCESSING');
        const command = detectCommand(transcript);
        let success = false;

        if (command.type === 'NAV') {
            setMode(command.payload);
            success = true;
        } else if (command.type === 'ACTION') {
            if (command.payload === 'SAVE') handleSaveInit();
            if (command.payload === 'CLEAR') clear();
            if (command.payload === 'BACKSPACE') del();
            if (command.payload === 'EQUALS') calculate();
            success = true;
        } else if (command.type === 'MATH') {
            try {
                // eslint-disable-next-line no-new-func
                const safeMath = new Function('return ' + command.payload);
                const res = safeMath();
                setInput(res.toString());
                success = true;
            } catch (e) {
                setInput('Error');
            }
        }

        if (success) {
            playSuccessSound();
            setVoiceState('IDLE');
            setTimeout(() => setVoiceFeedback(''), 2000);
        } else {
            playErrorSound();
            setVoiceState('ERROR');
            setVoiceFeedback('Comando não reconhecido');
            setTimeout(() => {
                setVoiceFeedback('');
                setVoiceState('IDLE');
            }, 2000);
        }
    };

    useEffect(() => {
        if (
            !('webkitSpeechRecognition' in window) &&
            !('SpeechRecognition' in window)
        ) {
            return;
        }

        const SpeechRecognition =
            (window as any).webkitSpeechRecognition ||
            (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'pt-BR';
        recognition.interimResults = true; // IMPORTANT: Allows real-time feedback

        recognition.onstart = () => {
            setVoiceState('LISTENING');
            playStartSound();
            setVoiceFeedback('Ouvindo...');
        };

        recognition.onend = () => {
            if (voiceState === 'LISTENING') {
                setVoiceState('IDLE');
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech Error', event.error);
            if (event.error !== 'no-speech') {
                playErrorSound();
                setVoiceState('ERROR');
                setVoiceFeedback('Erro ao ouvir');
                setTimeout(() => setVoiceState('IDLE'), 2000);
            } else {
                setVoiceState('IDLE');
                setVoiceFeedback('');
            }
        };

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (interimTranscript) {
                setVoiceFeedback(interimTranscript);
            }

            if (finalTranscript) {
                setVoiceFeedback(finalTranscript);
                processCommand(finalTranscript);
            }
        };

        recognitionRef.current = recognition;
    }, [calculate, voiceState]);

    const toggleVoice = () => {
        if (voiceState === 'LISTENING' || voiceState === 'PROCESSING') {
            recognitionRef.current?.stop();
            setVoiceState('IDLE');
        } else {
            try {
                setVoiceFeedback('');
                recognitionRef.current?.start();
            } catch (e) {
                console.error('Mic error', e);
            }
        }
    };

    // --- Render Helpers ---

    const renderKeypad = () => {
        type KeyButton = {
            l: string;
            fn: () => any;
            w?: string;
            secondary?: boolean;
            accent?: boolean;
        };

        const basicKeys: KeyButton[] = [
            { l: 'AC', fn: clear },
            { l: 'DEL', fn: del },
            { l: '%', fn: () => handleOperator('/') },
            { l: '÷', fn: () => handleOperator('/') },
            { l: '7', fn: () => handleNumber('7') },
            { l: '8', fn: () => handleNumber('8') },
            { l: '9', fn: () => handleNumber('9') },
            { l: '×', fn: () => handleOperator('*') },
            { l: '4', fn: () => handleNumber('4') },
            { l: '5', fn: () => handleNumber('5') },
            { l: '6', fn: () => handleNumber('6') },
            { l: '-', fn: () => handleOperator('-') },
            { l: '1', fn: () => handleNumber('1') },
            { l: '2', fn: () => handleNumber('2') },
            { l: '3', fn: () => handleNumber('3') },
            { l: '+', fn: () => handleOperator('+') },
            { l: '0', fn: () => handleNumber('0'), w: 'col-span-2' },
            { l: '.', fn: () => handleNumber('.') },
            { l: '=', fn: calculate, accent: true },
        ];

        const scientificKeys: KeyButton[] = [
            { l: 'sin', fn: () => { }, secondary: true },
            { l: 'cos', fn: () => { }, secondary: true },
            { l: 'tan', fn: () => { }, secondary: true },
            { l: '√', fn: () => handleOperator('√') },
            { l: 'log', fn: () => { }, secondary: true },
            { l: 'ln', fn: () => { }, secondary: true },
            { l: '(', fn: () => { }, secondary: true },
            { l: ')', fn: () => { }, secondary: true },
            { l: '^', fn: () => handleOperator('^'), secondary: true },
            { l: 'π', fn: () => handleNumber('3.1415'), secondary: true },
        ];

        const keysToRender =
            mode === AppMode.SCIENTIFIC
                ? [...scientificKeys, ...basicKeys]
                : basicKeys;
        const gridCols =
            mode === AppMode.SCIENTIFIC ? 'grid-cols-4' : 'grid-cols-4';

        return (
            <div
                className={`grid ${gridCols} gap-3 p-4 flex-1 content-end pb-24`}
            >
                {keysToRender.map((k, i) => (
                    <Button
                        key={i}
                        label={k.l}
                        onClick={k.fn}
                        className={`h-16 ${k.w || ''}`}
                        secondary={k.secondary}
                        accent={k.accent}
                    />
                ))}
            </div>
        );
    };

    // --- Main Render ---

    if (mode === AppMode.HISTORY) {
        return (
            <HistoryView
                history={history}
                onBack={() => setMode(AppMode.NORMAL)}
                onClear={clearHistory}
            />
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
            {/* Header/Mode Switcher */}
            <div className="flex items-center justify-between p-4 bg-slate-900 z-10">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {[
                        AppMode.NORMAL,
                        AppMode.SCIENTIFIC,
                        AppMode.FINANCE,
                        AppMode.CONVERTER,
                    ].map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${mode === m
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setMode(AppMode.HISTORY)}
                    className="ml-2 p-2 text-slate-400 hover:text-emerald-400"
                >
                    <History size={20} />
                </button>
            </div>

            {/* Calculator Display */}
            <div className="flex flex-col items-end justify-end p-6 space-y-2 bg-gradient-to-b from-slate-900 to-slate-800 flex-shrink-0 min-h-[180px] relative">
                {/* Voice Feedback Overlay - Appears when feedback exists */}
                {voiceFeedback && (
                    <div
                        className={`
             mb-2 text-lg font-medium animate-pulse transition-colors duration-300
             ${voiceState === 'ERROR' ? 'text-red-400' : 'text-emerald-400'}
          `}
                    >
                        {voiceState === 'LISTENING' && (
                            <span className="inline-block mr-2">
                                <Mic
                                    size={16}
                                    className="inline animate-bounce"
                                />
                            </span>
                        )}
                        "{voiceFeedback}"
                    </div>
                )}

                <div className="text-slate-400 text-lg h-6">
                    {prevVal} {operator}
                </div>
                <div className="text-6xl font-light tracking-tight text-white break-all text-right w-full">
                    {input}
                </div>
            </div>

            {/* Finance/Converter specialized views or Keypad */}
            {mode === AppMode.FINANCE ? (
                <div className="flex-1 p-6 space-y-4">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <h3 className="text-emerald-400 font-bold mb-4">
                            Calculadora de Juros (Simples)
                        </h3>
                        <div className="space-y-3">
                            <input
                                className="w-full bg-slate-900 p-3 rounded text-white"
                                placeholder="Principal (P)"
                                type="number"
                                onChange={(e) => setPrevVal(e.target.value)}
                            />
                            <input
                                className="w-full bg-slate-900 p-3 rounded text-white"
                                placeholder="Taxa % (r)"
                                type="number"
                                onChange={(e) => setOperator(e.target.value)}
                            />
                            <input
                                className="w-full bg-slate-900 p-3 rounded text-white"
                                placeholder="Tempo (t)"
                                type="number"
                                onChange={(e) => {
                                    const t = parseFloat(e.target.value);
                                    const p = parseFloat(prevVal || '0');
                                    const r = parseFloat(operator || '0');
                                    if (t && p && r) {
                                        const total = p * (1 + (r / 100) * t);
                                        setInput(total.toFixed(2));
                                    }
                                }}
                            />
                            <div className="pt-4 text-right">
                                <span className="text-slate-400">Total: </span>
                                <span className="text-2xl font-bold">
                                    {input}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : mode === AppMode.CONVERTER ? (
                <div className="flex-1 p-6 space-y-4">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <h3 className="text-blue-400 font-bold mb-4">
                            Conversor (C° para F°)
                        </h3>
                        <div className="flex gap-2 items-center">
                            <input
                                className="flex-1 bg-slate-900 p-3 rounded text-white"
                                type="number"
                                placeholder="Celsius"
                                onChange={(e) => {
                                    const c = parseFloat(e.target.value);
                                    if (!isNaN(c))
                                        setInput(((c * 9) / 5 + 32).toFixed(1));
                                }}
                            />
                            <ArrowRightLeft className="text-slate-500" />
                            <div className="flex-1 bg-slate-900 p-3 rounded text-white text-center font-bold">
                                {input}°F
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // Standard / Scientific Keypad
                renderKeypad()
            )}

            {/* Save Button (Quick Action for Shopping) */}
            {mode === AppMode.NORMAL && input !== '0' && (
                <button
                    onClick={handleSaveInit}
                    className="absolute bottom-6 left-6 w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center shadow-lg active:scale-95"
                >
                    <Banknote className="text-emerald-400" size={20} />
                </button>
            )}

            {/* Voice FAB */}
            <VoiceFab state={voiceState} toggleListening={toggleVoice} />

            {/* Modals */}
            {showSaveModal && (
                <SaveModal
                    amount={parseFloat(input)}
                    onSave={handleSaveConfirm}
                    onCancel={() => setShowSaveModal(false)}
                />
            )}
        </div>
    );
};

export default App;
