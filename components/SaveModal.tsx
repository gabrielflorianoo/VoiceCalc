import React, { useState } from 'react';
import { Save, X } from 'lucide-react';

interface SaveModalProps {
  amount: number;
  onSave: (name: string) => void;
  onCancel: () => void;
}

const SaveModal: React.FC<SaveModalProps> = ({ amount, onSave, onCancel }) => {
  const [locationName, setLocationName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(locationName || 'Compra Geral');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-700 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Salvar Compra</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-6 text-center">
          <p className="text-slate-400 text-sm uppercase tracking-wider">Valor Total</p>
          <p className="text-4xl font-bold text-emerald-400 mt-1">
            R$ {amount.toFixed(2)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Local da Compra</label>
            <input
              type="text"
              autoFocus
              placeholder="Ex: Supermercado Central"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Save size={20} />
            Confirmar
          </button>
        </form>
      </div>
    </div>
  );
};

export default SaveModal;