import React, { useState, useMemo } from 'react';
import { TriangleAlert, Settings2, CalendarDays } from 'lucide-react';
import { Product, Sale, Expense, Merma } from '../types';

interface Props {
  productos: Product[];
  ventas: Sale[];
  gastos: Expense[];
  mermas: Merma[];
  onAddMerma: (merma: any) => void;
  onAddGasto: (gasto: any) => void;
  mermaFormInitial?: any;
}

export function Admin({ productos, ventas, gastos, mermas, onAddMerma, onAddGasto, mermaFormInitial }: Props) {
  const [tab, setTab] = useState('reportes');
  
  const [mermaForm, setMermaForm] = useState(mermaFormInitial || { productoId: '', kg: 0.5, motivo: 'podrido' });
  const [gastoForm, setGastoForm] = useState({ concepto: '', monto: 100, fecha: new Date().toISOString().slice(0, 10) });
  const [conceptosGasto, setConceptosGasto] = useState(['Gasolina', 'Bolsas', 'Renta', 'Luz', 'Agua', 'Sueldos']);
  const [recordatorio, setRecordatorio] = useState('');

  React.useEffect(() => {
    if (mermaFormInitial) {
      setMermaForm(mermaFormInitial);
      setTab('merma');
    }
  }, [mermaFormInitial]);

  const stats = useMemo(() => {
    const now = Date.now();
    const hoy = ventas.filter(v => now - v.fecha < 86400000);
    const semana = ventas.filter(v => now - v.fecha < 604800000);
    const mes = ventas.filter(v => now - v.fecha < 2592000000);

    const sumTotal = (arr: Sale[]) => arr.reduce((acc, v) => acc + v.total, 0);
    const sumGanancia = (arr: Sale[]) => arr.reduce((acc, v) => acc + v.ganancia, 0);

    const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);
    const totalMermaCosto = mermas.reduce((acc, m) => {
      const p = productos.find(prod => prod.id === m.productoId);
      return acc + (p ? p.costoProv * m.kg : 0);
    }, 0);

    const gananciaNetaMes = sumGanancia(mes) - totalGastos - totalMermaCosto;

    return {
      hoy: { total: sumTotal(hoy), gan: sumGanancia(hoy), count: hoy.length },
      semana: { total: sumTotal(semana), gan: sumGanancia(semana), count: semana.length },
      mes: { total: sumTotal(mes), gan: sumGanancia(mes), count: mes.length },
      totalGastos,
      totalMermaCosto,
      gananciaNetaMes
    };
  }, [ventas, gastos, mermas, productos]);

  const handleMerma = () => {
    if (!mermaForm.productoId) return;
    onAddMerma(mermaForm);
    setMermaForm({ productoId: '', kg: 0.5, motivo: 'podrido' });
  };

  const handleGasto = () => {
    if (!gastoForm.concepto) return;
    if (!conceptosGasto.includes(gastoForm.concepto)) {
      setConceptosGasto(prev => [...prev, gastoForm.concepto]);
    }
    onAddGasto(gastoForm);
    setGastoForm({ concepto: '', monto: 100, fecha: new Date().toISOString().slice(0, 10) });
  };

  const agregarCalendario = () => {
    if(!recordatorio) return;
    const date = new Date(gastoForm.fecha).toISOString().replace(/-|:|\.\d\d\d/g,"");
    const link = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(recordatorio)}&dates=${date}/${date}`;
    window.open(link, '_blank');
    setRecordatorio('');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200 w-fit shadow-inner overflow-x-auto max-w-full">
        {[{ id: 'reportes', label: 'Reportes' }, { id: 'merma', label: 'Merma' }, { id: 'gastos', label: 'Gastos' }, { id: 'calendario', label: 'Calendario' }].map(t => (
          <button 
            key={t.id} 
            onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${tab === t.id ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'reportes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Hoy</div>
              <div className="text-3xl font-black text-slate-900 mt-2">${stats.hoy.total.toFixed(0)}</div>
              <div className="text-sm text-indigo-600 font-bold mt-2">Ganancia ${stats.hoy.gan.toFixed(0)} • {stats.hoy.count} ventas</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Semana</div>
              <div className="text-3xl font-black text-slate-900 mt-2">${stats.semana.total.toFixed(0)}</div>
              <div className="text-sm text-slate-600 font-medium mt-2">{stats.semana.count} ventas • Gan ${stats.semana.gan.toFixed(0)}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Mes</div>
              <div className="text-3xl font-black text-slate-900 mt-2">${stats.mes.total.toFixed(0)}</div>
              <div className="text-sm text-slate-600 font-medium mt-2">{stats.mes.count} ventas</div>
            </div>
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md">
              <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">Ganancia Neta Mes</div>
              <div className="text-3xl font-black mt-2 text-white">${stats.gananciaNetaMes.toFixed(0)}</div>
              <div className="text-xs text-slate-400 mt-2 leading-snug">Ingresos - costo prov - gastos (${stats.totalGastos.toFixed(0)}) - merma (${stats.totalMermaCosto.toFixed(0)})</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-6 text-slate-800">Gráfica ventas últimos 7 días</h3>
            <div className="flex items-end gap-3 h-[160px] pt-4">
              {Array.from({length: 7}).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                const start = new Date(d).setHours(0,0,0,0);
                const end = new Date(d).setHours(23,59,59,999);
                const totalD = ventas.filter(v => v.fecha >= start && v.fecha <= end).reduce((acc, v) => acc + v.total, 0);
                const max = Math.max(...ventas.map(v => v.total), 1);
                const pct = Math.max(8, (totalD / (max * 1.2)) * 100);
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full max-w-[48px] bg-indigo-50 rounded-t-lg relative overflow-hidden h-[120px]">
                      <div className="absolute bottom-0 w-full bg-indigo-500 rounded-t-lg transition-all duration-500" style={{height: `${pct}%`}} />
                    </div>
                    <span className="text-xs font-bold text-slate-600">{d.toLocaleDateString('es-MX', {weekday: 'short'})}</span>
                    <span className="text-[10px] text-slate-400 font-mono">${totalD.toFixed(0)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-6 text-slate-800">Historial de Ventas</h3>
            <div className="space-y-2 max-h-[300px] overflow-auto pr-2">
              {ventas.map(v => (
                <div key={v.id} className="flex items-center justify-between text-sm border-b border-slate-100 py-3">
                  <span className="text-slate-600 font-medium">{new Date(v.fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  <span className="font-mono text-slate-500">{v.totalGramos?.toFixed(0)}g</span>
                  <span className="font-black text-slate-900">${v.total.toFixed(2)}</span>
                  <span className="text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-md">+$ {v.ganancia.toFixed(2)}</span>
                </div>
              ))}
              {ventas.length === 0 && <div className="text-center py-8 text-sm text-slate-400">No hay ventas registradas.</div>}
            </div>
          </div>
        </div>
      )}

      {tab === 'merma' && (
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
              <TriangleAlert className="w-5 h-5 text-amber-500" /> Registrar Merma
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Producto</label>
                <select 
                  value={mermaForm.productoId} 
                  onChange={e => setMermaForm({...mermaForm, productoId: e.target.value})}
                  className="w-full h-11 rounded-lg border border-slate-300 px-3 text-sm bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
                >
                  <option value="">Seleccionar...</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.nombre} ({p.stock.toFixed(1)}kg)</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Cantidad (kg)</label>
                  <input 
                    type="number" step="0.1" 
                    value={mermaForm.kg} 
                    onChange={e => setMermaForm({...mermaForm, kg: parseFloat(e.target.value) || 0})}
                    className="w-full h-11 rounded-lg border border-slate-300 px-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Motivo</label>
                  <select 
                    value={mermaForm.motivo} 
                    onChange={e => setMermaForm({...mermaForm, motivo: e.target.value})}
                    className="w-full h-11 rounded-lg border border-slate-300 px-3 text-sm bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
                  >
                    <option>podrido</option>
                    <option>golpe</option>
                    <option>sobremaduro</option>
                    <option>prueba</option>
                    <option>otro</option>
                  </select>
                </div>
              </div>
              
              <button 
                onClick={handleMerma}
                className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 transition text-white font-bold text-sm mt-4 shadow-sm"
              >
                Registrar y Descontar
              </button>
              <p className="text-xs text-slate-500 leading-snug">Se descontará automáticamente del inventario y afectará la ganancia neta.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-6 text-slate-900 flex items-center justify-between">
              Historial Mermas
              <span className="text-xs text-amber-700 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Costo perdido ${stats.totalMermaCosto.toFixed(0)}
              </span>
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-auto pr-2">
              {mermas.map(m => (
                <div key={m.id} className="flex items-center justify-between text-sm border border-amber-100 rounded-xl px-4 py-3 bg-amber-50/50">
                  <div>
                    <div className="font-bold text-amber-900">{m.nombre}</div>
                    <div className="text-xs text-amber-700/80 mt-0.5">{new Date(m.fecha).toLocaleDateString('es-MX')}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-amber-900">{m.kg}kg</div>
                    <div className="text-xs text-amber-700 font-bold uppercase tracking-wider mt-0.5">{m.motivo}</div>
                  </div>
                </div>
              ))}
              {mermas.length === 0 && <div className="text-center py-8 text-sm text-slate-400">No hay mermas registradas.</div>}
            </div>
          </div>
        </div>
      )}

      {tab === 'gastos' && (
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
              <Settings2 className="w-5 h-5 text-slate-600" /> Registrar Gasto
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Concepto Rápido</label>
                <div className="flex gap-2 flex-wrap mb-4">
                  {conceptosGasto.map(c => (
                    <button 
                      key={c} 
                      onClick={() => setGastoForm({...gastoForm, concepto: c})}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${gastoForm.concepto === c ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <input 
                  value={gastoForm.concepto} 
                  onChange={e => setGastoForm({...gastoForm, concepto: e.target.value})}
                  placeholder="Otro concepto (ej: mantenimiento)"
                  className="w-full h-11 rounded-lg border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Monto ($)</label>
                  <input 
                    type="number" value={gastoForm.monto} 
                    onChange={e => setGastoForm({...gastoForm, monto: parseFloat(e.target.value) || 0})}
                    className="w-full h-11 rounded-lg border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Fecha</label>
                  <input 
                    type="date" value={gastoForm.fecha} 
                    onChange={e => setGastoForm({...gastoForm, fecha: e.target.value})}
                    className="w-full h-11 rounded-lg border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-slate-600 font-medium"
                  />
                </div>
              </div>

              <button 
                onClick={handleGasto}
                className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-900 transition text-white font-bold text-sm mt-4 shadow-sm"
              >
                Guardar Gasto
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-800">Historial Gastos</h3>
              <span className="text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-md text-slate-800 border border-slate-200">
                Total ${stats.totalGastos.toFixed(0)}
              </span>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-auto pr-2">
              {gastos.map(g => (
                <div key={g.id} className="flex items-center justify-between text-sm border border-slate-100 rounded-xl px-4 py-3 hover:bg-slate-50 transition">
                  <div>
                    <div className="font-bold text-slate-900">{g.concepto}</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">{new Date(g.fecha).toLocaleDateString('es-MX')}</div>
                  </div>
                  <div className="font-black text-slate-900">${g.monto.toFixed(0)}</div>
                </div>
              ))}
              {gastos.length === 0 && <div className="text-center py-8 text-sm text-slate-400">No hay gastos registrados.</div>}
            </div>
          </div>
        </div>
      )}

      {tab === 'calendario' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-[500px]">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
            <CalendarDays className="w-5 h-5 text-indigo-600" /> API de Calendario
          </h3>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">Agrega un recordatorio importante (compras a proveedor, mantenimiento, etc.) directo a tu Google Calendar.</p>
          
          <div className="space-y-4">
            <input 
              value={recordatorio} 
              onChange={e => setRecordatorio(e.target.value)}
              placeholder="Ej: Pedir más cajas a la central"
              className="w-full h-11 rounded-lg border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            />
            <button 
              onClick={agregarCalendario}
              disabled={!recordatorio}
              className="w-full h-11 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition text-white font-bold text-sm shadow-sm disabled:opacity-50"
            >
              Sincronizar Recordatorio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

