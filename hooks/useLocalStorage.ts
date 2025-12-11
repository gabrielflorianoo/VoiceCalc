import { useState, useEffect } from 'react';
import { PurchaseRecord } from '../types';

export const useHistoryStorage = () => {
    const [history, setHistory] = useState<PurchaseRecord[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('vozcalc_history');
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse history', e);
            }
        }
    }, []);

    const addRecord = (amount: number, location: string) => {
        const newRecord: PurchaseRecord = {
            id: crypto.randomUUID(),
            amount,
            location: location.trim() || 'Local Desconhecido',
            timestamp: Date.now(),
        };

        const updated = [newRecord, ...history];
        setHistory(updated);
        localStorage.setItem('vozcalc_history', JSON.stringify(updated));
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('vozcalc_history');
    };

    return { history, addRecord, clearHistory };
};
