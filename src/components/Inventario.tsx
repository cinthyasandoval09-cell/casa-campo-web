import React, { useState } from 'react';
import { Plus, Minus, Pen, Trash2, X, TriangleAlert } from 'lucide-react';
import { Product } from '../types';

interface Props {
  productos: Product[];
  onAddOrUpdate: (p: Partial<Product>) => void;
  onDelete: (id: string) => void;
  onUpdateStock: (p: Product, delta: number) => void;
}

export function Inventario({ productos, onAddOrUpdate, onDelete, onUpdateStock }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({ nombre: '', costoProv: 40, margen: 35, stock: 1 });
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalValorCosto = productos.reduce((acc, p) => acc + p.costoProv * p.stock, 0);
  const totalValorVenta = productos.reduce((acc, p) => acc + p.precioVenta * p.stock, 0);

  const handleSubmit = () => {
    if (!form.nombre?.trim()) return;
    onAddOrUpdate({ ...form, id: editingId || undefined });
    setShowForm(false);
    setEditingId(null);
    setForm({ nombre: '', costoProv: 40, margen: 35, stock: 1 });
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({ nombre: p.nombre, costoProv: p.costoProv, margen: p.margen, stock: p.stock });
    setShowForm(true);
  };

  const ventaCalculada = (form.costoProv || 0) * (1 + (form.margen || 0) / 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Total productos', value: productos.length, sub: `${productos.filter(p => p.stock > 0).length} con stock` },
          { label: 'Valor costo', value: `$${totalValorCosto.toFixed(0)}`, sub: 'inventario a costo prov' },
          { label: 'Valor venta', value: `$${totalValorVenta.toFixed(0)}`, sub: 'potencial venta' }
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{s.label}</div>
            <div className="text-2xl font-black mt-2 text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-800">Inventario</h2>
        <button 
          onClick={() => { setEditingId(null); setForm({ nombre: '', costoProv: 40, margen: 35, stock: 1 }); setShowForm(true); }}
          className="h-10 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition text-white font-bold text-sm flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Agregar producto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {productos.map(p => {
          const bajoStock = p.stock < 2;
          return (
            <div key={p.id} className={`bg-white rounded-xl border p-5 transition shadow-sm hover:shadow-md ${bajoStock ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 hover:border-indigo-200'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl leading-none">{p.emoji}</span>
                  <div>
                    <div className="font-bold text-sm leading-tight text-slate-900">{p.nombre}</div>
                    <div className="text-xs text-slate-500 mt-1">${p.costoProv}/kg prov • {p.margen}% margen</div>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-md border ${bajoStock ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                  {p.stock.toFixed(1)}kg
                </span>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-slate-500">Venta</span> <b className="text-slate-900">${p.precioVenta.toFixed(2)}/kg</b>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => onUpdateStock(p, -1)} className="w-8 h-8 rounded-md border border-slate-200 bg-white grid place-items-center hover:bg-slate-50 text-slate-600 transition">
                    <Minus className="w-4 h-4" />
                  </button>
                  <button onClick={() => onUpdateStock(p, 1)} className="w-8 h-8 rounded-md border border-slate-200 bg-white grid place-items-center hover:bg-slate-50 text-slate-600 transition">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEdit(p)} className="w-8 h-8 rounded-md border border-slate-200 bg-white grid place-items-center hover:bg-indigo-50 text-indigo-600 transition ml-2">
                    <Pen className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(p.id)} className="w-8 h-8 rounded-md border border-slate-200 bg-white grid place-items-center hover:bg-red-50 text-red-500 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm grid place-items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[420px] p-6 border border-slate-200 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-slate-900">{editingId ? 'Editar' : 'Agregar'} producto</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition grid place-items-center text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Nombre del producto</label>
                <input 
                  value={form.nombre} 
                  onChange={e => setForm({...form, nombre: e.target.value})}
                  placeholder="Ej: Mango Manila"
                  className="w-full h-11 rounded-lg border border-slate-300 px-3 text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Costo prov ($/kg)</label>
                  <input 
                    type="number" value={form.costoProv} 
                    onChange={e => setForm({...form, costoProv: parseFloat(e.target.value) || 0})}
                    className="w-full h-11 rounded-lg border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Stock inicial (kg)</label>
                  <input 
                    type="number" step="0.1" value={form.stock} 
                    onChange={e => setForm({...form, stock: parseFloat(e.target.value) || 0})}
                    className="w-full h-11 rounded-lg border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mt-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-600">Margen %</label>
                  <span className="text-sm font-black text-indigo-600">{form.margen}% → Venta ${ventaCalculada.toFixed(2)}/kg</span>
                </div>
                <input 
                  type="range" min="10" max="100" 
                  value={form.margen} 
                  onChange={e => setForm({...form, margen: parseInt(e.target.value)})}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-wider">
                  <span>10%</span>
                  <span>35% (Default)</span>
                  <span>100%</span>
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={!form.nombre?.trim()}
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-sm"
              >
                Guardar Producto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
