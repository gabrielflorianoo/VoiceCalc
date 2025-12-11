export enum AppMode {
    NORMAL = 'Normal',
    SCIENTIFIC = 'Científica',
    FINANCE = 'Financeira',
    CONVERTER = 'Conversor',
    HISTORY = 'Histórico',
}

export interface PurchaseRecord {
    id: string;
    location: string;
    amount: number;
    timestamp: number;
}

export interface GroupedHistory {
    location: string;
    lastAmount: number;
    totalSpent: number;
    count: number;
    records: PurchaseRecord[];
}

// Web Speech API Types
export interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}
