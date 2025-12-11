import { AppMode } from '../types';

export const parseVoiceMath = (transcript: string): string => {
  let processed = transcript.toLowerCase();

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

export const detectCommand = (transcript: string): { type: 'NAV' | 'ACTION' | 'MATH' | 'NONE', payload?: any } => {
  const t = transcript.toLowerCase();

  // Navigation
  if (t.includes('científica')) return { type: 'NAV', payload: AppMode.SCIENTIFIC };
  if (t.includes('normal') || t.includes('básica')) return { type: 'NAV', payload: AppMode.NORMAL };
  if (t.includes('financeira') || t.includes('juros') || t.includes('taxas')) return { type: 'NAV', payload: AppMode.FINANCE };
  if (t.includes('conversão') || t.includes('conversor')) return { type: 'NAV', payload: AppMode.CONVERTER };
  if (t.includes('histórico') || t.includes('compras')) return { type: 'NAV', payload: AppMode.HISTORY };

  // Actions
  if (t.includes('salvar') || t.includes('guardar')) return { type: 'ACTION', payload: 'SAVE' };
  if (t.includes('limpar') || t.includes('apagar tudo')) return { type: 'ACTION', payload: 'CLEAR' };
  if (t.includes('voltar') || t.includes('corrigir')) return { type: 'ACTION', payload: 'BACKSPACE' };
  if (t.includes('igual') || t.includes('resultado') || t.includes('calcula')) return { type: 'ACTION', payload: 'EQUALS' };

  // Math fallback
  if (/\d/.test(t)) return { type: 'MATH', payload: parseVoiceMath(t) };

  return { type: 'NONE' };
};