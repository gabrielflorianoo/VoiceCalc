import { AppMode } from '../types';

const numberMap: Record<string, string> = {
    'zero': '0', 'um': '1', 'dois': '2', 'três': '3', 'quatro': '4',
    'cinco': '5', 'seis': '6', 'sete': '7', 'oito': '8', 'nove': '9',
    'dez': '10', 'cem': '100', 'mil': '1000'
};

const convertSpokenNumbers = (text: string): string => {
    let processed = text.toLowerCase();

    // Substituir vírgula e ponto por ponto decimal (importante para floats)
    processed = processed.replace(/vírgula|ponto/g, '.');

    // Substituir operadores falados por símbolos
    processed = processed.replace(/mais/g, '+');
    processed = processed.replace(/menos/g, '-');
    processed = processed.replace(/vezes|multiplicado por|x/g, '*');
    processed = processed.replace(/dividido por|sobre/g, '/');

    // Substituir "por cento" por "/100"
    processed = processed.replace(/por cento/g, '/100');

    // Substituir "e", "negativo" e "positivo"
    processed = processed.replace(/\be\b/g, ' ');
    processed = processed.replace(/\bnegativo\b/g, '-');
    processed = processed.replace(/\bpositivo\b/g, '');

    // Substituir números por extenso
    for (const word in numberMap) {
        // Usar regex de palavra completa (\b) para evitar substituições parciais
        processed = processed.replace(new RegExp(`\\b${word}\\b`, 'g'), numberMap[word]);
    }

    return processed;
};

export const parseVoiceMath = (transcript: string): string => {
    let processed = convertSpokenNumbers(transcript);

    // Replace spoken words with operators
    processed = processed.replace(/vezes|multiplicado por|x/g, '*');
    processed = processed.replace(/dividido por|sobre/g, '/');
    processed = processed.replace(/mais|adicionado a/g, '+');
    processed = processed.replace(/menos|subtraído de/g, '-');
    processed = processed.replace(/por cento/g, '/100');
    processed = processed.replace(/vírgula/g, '.');
    processed = processed.replace(/ponto/g, '.');

    // Remove non-math characters (keep numbers, operators, parens, dots)
    // We allow spaces for now to help parsing, then strip them
    processed = processed.replace(/[^0-9+\-*/().]/g, '');

    return processed;
};

export const detectCommand = (
    transcript: string,
): { type: 'NAV' | 'ACTION' | 'MATH' | 'NONE'; payload?: any } => {
    const t = transcript.toLowerCase();

    // Navigation
    if (t.includes('científica'))
        return { type: 'NAV', payload: AppMode.SCIENTIFIC };
    if (t.includes('normal') || t.includes('básica'))
        return { type: 'NAV', payload: AppMode.NORMAL };
    if (t.includes('financeira') || t.includes('juros') || t.includes('taxas'))
        return { type: 'NAV', payload: AppMode.FINANCE };
    if (t.includes('conversão') || t.includes('conversor'))
        return { type: 'NAV', payload: AppMode.CONVERTER };
    if (t.includes('histórico') || t.includes('compras'))
        return { type: 'NAV', payload: AppMode.HISTORY };

    // Actions
    if (t.includes('salvar') || t.includes('guardar'))
        return { type: 'ACTION', payload: 'SAVE' };
    if (t.includes('limpar') || t.includes('apagar tudo'))
        return { type: 'ACTION', payload: 'CLEAR' };
    if (t.includes('voltar') || t.includes('corrigir'))
        return { type: 'ACTION', payload: 'BACKSPACE' };
    if (t.includes('igual') || t.includes('resultado') || t.includes('calcula'))
        return { type: 'ACTION', payload: 'EQUALS' };

    // Math fallback
    if (/\d/.test(t)) return { type: 'MATH', payload: parseVoiceMath(t) };

    return { type: 'NONE' };
};
