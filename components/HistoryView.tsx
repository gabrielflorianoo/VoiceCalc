import { FC, useMemo } from 'react';
import { PurchaseRecord, GroupedHistory } from '../types';
import {
    ArrowLeft,
    Trash2,
    ShoppingBag,
    TrendingUp,
    TrendingDown,
    MapPin,
} from 'lucide-react';

interface HistoryViewProps {
    history: PurchaseRecord[];
    onBack: () => void;
    onClear: () => void;
}

const HistoryView: FC<HistoryViewProps> = ({
    history,
    onBack,
    onClear,
}) => {
    const groupedData = useMemo(() => {
        const groups: Record<string, GroupedHistory> = {};

        // Sort by date ascending to track price changes correctly
        const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);

        sorted.forEach((record) => {
            if (!groups[record.location]) {
                groups[record.location] = {
                    location: record.location,
                    lastAmount: 0,
                    totalSpent: 0,
                    count: 0,
                    records: [],
                };
            }
            groups[record.location].lastAmount = record.amount;
            groups[record.location].totalSpent += record.amount;
            groups[record.location].count += 1;
            groups[record.location].records.push(record);
        });

        return Object.values(groups).sort(
            (a, b) =>
                b.records[b.records.length - 1].timestamp -
                a.records[a.records.length - 1].timestamp,
        );
    }, [history]);

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={onBack}
                    className="p-2 bg-slate-800 rounded-full text-slate-300"
                >
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <ShoppingBag size={20} className="text-emerald-400" />{' '}
                    Histórico
                </h2>
                <button
                    onClick={onClear}
                    className="p-2 bg-rose-900/30 text-rose-400 rounded-full"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-24 space-y-4">
                {history.length === 0 ? (
                    <div className="text-center text-slate-500 mt-20">
                        <p className="text-lg">Nenhuma compra salva.</p>
                        <p className="text-sm">
                            Use o comando de voz "Salvar Compra" após um
                            cálculo.
                        </p>
                    </div>
                ) : (
                    groupedData.map((group) => (
                        <div
                            key={group.location}
                            className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                    <MapPin
                                        size={16}
                                        className="text-slate-400"
                                    />{' '}
                                    {group.location}
                                </h3>
                                <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                                    {group.count} compra(s)
                                </span>
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-slate-400">
                                        Último Valor
                                    </p>
                                    <p className="text-2xl font-bold text-emerald-400">
                                        R$ {group.lastAmount.toFixed(2)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400">
                                        Total Gasto
                                    </p>
                                    <p className="text-sm font-medium text-slate-200">
                                        R$ {group.totalSpent.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {group.records.length > 1 && (
                                <div className="mt-3 pt-3 border-t border-slate-700">
                                    <p className="text-xs text-slate-500 mb-1">
                                        Histórico recente neste local:
                                    </p>
                                    <div className="space-y-1">
                                        {group.records
                                            .slice()
                                            .reverse()
                                            .slice(0, 3)
                                            .map((rec) => (
                                                <div
                                                    key={rec.id}
                                                    className="flex justify-between text-xs"
                                                >
                                                    <span className="text-slate-400">
                                                        {new Date(
                                                            rec.timestamp,
                                                        ).toLocaleDateString()}
                                                    </span>
                                                    <span
                                                        className={
                                                            rec.amount >
                                                            group.lastAmount
                                                                ? 'text-green-400'
                                                                : 'text-slate-300'
                                                        }
                                                    >
                                                        R${' '}
                                                        {rec.amount.toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistoryView;
