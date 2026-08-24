import React, { useState, useMemo } from 'react';
import { Search, ShoppingCart, Store, TrendingUp, Boxes, X } from 'lucide-react';
import { Product, SaleItem, BoxType } from '../types';

interface Props {
  productos: Product[];
  cajas: BoxType[];
  carrito: SaleItem[];
  setCarrito: React.Dispatch<React.SetStateAction<SaleItem[]>>;
  onCobrar: (total: number, ganancia: number, gramos: number) => void;
  showNotification: (msg: string) => void;
}

export function Mostrador({ productos, cajas, carrito, setCarrito, onCobrar, showNotification }: Props) {
  const [search, setSearch] = useState('');
  const [gramosManual, setGramosManual] = useState<number | ''>(250);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Product | null>(null);
  const [selectedBox, setSelectedBox] = useState<string>('c2');
  const [espaciosUsados, setEspaciosUsados] = useState(3);
  const [cajaItems, setCajaItems] = useState<{productoId: string|null, mult: number}[]>([
    {productoId: null, mult: 1}, {productoId: null, mult: 1}, {productoId: null, mult: 1}
  ]);

  const cajaActual = useMemo(() => cajas.find(c => c.id === selectedBox)!, [selectedBox, cajas]);
  const productosFiltrados = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return productos;
    return productos.filter(p => p.nombre.toLowerCase().includes(s));
  }, [productos, search]);

  React.useEffect(() => {
    setCajaItems(prev => {
      const arr = [...prev];
      while (arr.length < espaciosUsados) arr.push({productoId: null, mult: 1});
      return arr.slice(0, espaciosUsados);
    });
  }, [espaciosUsados]);

  const statsCaja = useMemo(() => {
    const libres = 100;
    const objetivo = cajaActual.precio - libres;
    const items = cajaItems.filter(i => i.productoId);
    if (items.length === 0) return null;

    const totalParts = items.reduce((acc, i) => acc + i.mult, 0);
    const costoPorParte = objetivo / totalParts;

    const detalles = items.map(item => {
      const p = productos.find(prod => prod.id === item.productoId)!;
      const costoTarget = costoPorParte * item.mult;
      const gramosCalculados = (costoTarget / p.costoProv) * 1000;
      return { prod: p, mult: item.mult, costo: costoTarget, gramos: gramosCalculados };
    });

    const totalGramos = detalles.reduce((acc, d) => acc + d.gramos, 0);
    const totalCostoReal = detalles.reduce((acc, d) => acc + d.costo, 0);
    const ganancia = cajaActual.precio - totalCostoReal;
    const margenCaja = (ganancia / cajaActual.precio) * 100;

    return { objetivo, totalParts, costoPorParte, detalles, totalGramos, totalCostoReal, ganancia, margenCaja };
  }, [cajaItems, cajaActual, productos]);

  const statsCarrito = useMemo(() => {
    const total = carrito.reduce((acc, i) => acc + i.subtotal, 0);
    const costo = carrito.reduce((acc, i) => acc + i.costoTotal, 0);
    const gramos = carrito.reduce((acc, i) => acc + i.gramos, 0);
    return { total, costo, gramos, ganancia: total - costo };
  }, [carrito]);

  const agregarProducto = (p: Product, gramos: number) => {
    if (p.stock * 1000 < gramos && p.stock > 0) {
      showNotification(`Solo queda ${p.stock.toFixed(1)}kg de ${p.nombre}`);
      return;
    }
    if (p.stock <= 0) {
      showNotification(`${p.nombre} sin stock`);
      return;
    }
    
    const subtotal = (p.precioVenta / 1000) * gramos;
    const costoTotal = (p.costoProv / 1000) * gramos;
    
    const item: SaleItem = {
      uid: Math.random().toString(36).slice(2),
      productoId: p.id,
      nombre: p.nombre,
      emoji: p.emoji,
      gramos,
      costoProvUnit: p.costoProv,
      precioVentaUnit: p.precioVenta,
      subtotal,
      costoTotal
    };
    
    setCarrito(prev => [...prev, item]);
    showNotification(`${p.emoji} ${p.nombre} ${gramos}g agregado`);
  };

  const agregarCajaArmada = () => {
    if (!statsCaja) {
      showNotification("Elige productos para la caja");
      return;
    }
    statsCaja.detalles.forEach(d => {
      agregarProducto(d.prod, Math.round(d.gramos));
    });
    showNotification(`Caja ${cajaActual.label} $${cajaActual.precio} agregada (${Math.round(statsCaja.totalGramos)}g)`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr_0.9fr] gap-6 items-start">
      {/* Col 1: Burbujas */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Store className="w-4 h-4" /> Inventario Rápido
          </h2>
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-bold">
            {productosFiltrados.length} productos
          </span>
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-6 min-h-[120px] content-start">
          {productosFiltrados.map(p => {
            const agotado = p.stock <= 0;
            return (
              <button
                key={p.id}
                onClick={() => setProductoSeleccionado(p)}
                disabled={agotado}
                className={`flex flex-col items-center p-3 border-2 rounded-xl transition-colors active:scale-95 ${agotado ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed' : 'bg-slate-50 border-transparent hover:border-slate-200 hover:bg-slate-100'}`}
              >
                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 text-xl">{p.emoji}</div>
                <span className="text-xs font-bold text-slate-800 text-center leading-tight truncate w-full">{p.nombre.split(' ')[0]}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">${p.costoProv}/kg</span>
                <span className={`text-[9px] mt-1 px-1.5 py-0.5 rounded font-mono ${agotado ? 'bg-slate-200 text-slate-500' : 'bg-indigo-100 text-indigo-700 font-bold'}`}>{p.stock.toFixed(1)}kg</span>
              </button>
            )
          })}
          {productosFiltrados.length === 0 && (
            <div className="text-sm text-slate-400 py-8 col-span-full text-center">Sin resultados</div>
          )}
        </div>
      </section>

      {/* Col 2: Armar Cajas */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col lg:sticky lg:top-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-5">
          <Boxes className="w-4 h-4" /> Cajas $100 Libres
        </h2>
        
        <div className="grid grid-cols-2 gap-3 mb-5">
          {cajas.map(c => (
            <button 
              key={c.id} 
              onClick={() => { setSelectedBox(c.id); setEspaciosUsados(Math.min(3, c.espacios)); }}
              className={`rounded-xl border-2 p-3 text-left transition-all ${selectedBox === c.id ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-slate-50 hover:border-indigo-200'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">${c.precio}</span>
                <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded text-slate-500 border border-slate-200">{c.espacios} esp</span>
              </div>
              <div className="text-[11px] font-medium mt-1 text-slate-500">{c.label}</div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Espacios:</span>
          <div className="flex gap-1.5 flex-wrap">
            {Array.from({length: cajaActual.espacios}).map((_, i) => (
              <button 
                key={i} 
                onClick={() => setEspaciosUsados(i+1)}
                className={`w-7 h-7 rounded-md text-xs font-bold border transition ${espaciosUsados === i+1 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300'}`}
              >
                {i+1}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 mb-5 max-h-[260px] overflow-auto pr-1">
          {cajaItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
              <span className="w-6 h-6 shrink-0 rounded-md bg-indigo-50 text-indigo-600 grid place-items-center text-xs font-bold">{idx + 1}</span>
              <select 
                value={item.productoId || ''} 
                onChange={e => {
                  const val = e.target.value || null;
                  setCajaItems(prev => prev.map((p, i) => i === idx ? {...p, productoId: val} : p));
                }}
                className="flex-1 h-8 bg-transparent text-xs font-medium text-slate-700 outline-none"
              >
                <option value="">Elegir producto...</option>
                {productos.filter(p => p.stock > 0).map(p => (
                  <option key={p.id} value={p.id}>{p.emoji} {p.nombre} (${p.costoProv}/kg)</option>
                ))}
              </select>
              <div className="flex gap-1 shrink-0">
                {[1, 2, 3].map(m => (
                  <button 
                    key={m} 
                    onClick={() => setCajaItems(prev => prev.map((p, i) => i === idx ? {...p, mult: m} : p))}
                    className={`w-7 h-7 rounded-md text-[10px] font-bold border transition ${item.mult === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                  >
                    {m}x
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {statsCaja ? (
          <div className="mt-2 rounded-xl border border-indigo-100 bg-indigo-50 p-4 animate-in fade-in zoom-in duration-200">
            <div className="text-xs font-bold text-indigo-700 mb-3 flex justify-between">
              <span>Obj: ${statsCaja.objetivo}</span>
              <span>{statsCaja.totalParts} pt • ${statsCaja.costoPorParte.toFixed(2)}/pt</span>
            </div>
            <div className="space-y-2 mb-4">
              {statsCaja.detalles.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-indigo-100 shadow-sm">
                  <span className="font-bold text-slate-700">{d.prod.emoji} {d.prod.nombre} {d.mult > 1 ? `x${d.mult}` : ''}</span>
                  <span className="font-mono text-slate-600">{Math.round(d.gramos)}g <span className="text-slate-400 mx-1">|</span> ${d.costo.toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="w-full px-1">
              <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                <span className="text-indigo-600">Ganancia ${statsCaja.ganancia.toFixed(0)}</span>
                <span className="text-slate-500">{statsCaja.margenCaja.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-indigo-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all" style={{width: `${Math.min(100, (statsCaja.ganancia/cajaActual.precio)*100 + 60)}%`}} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                <span>Peso: <b>{Math.round(statsCaja.totalGramos)}g</b></span>
                <span>Costo real ${statsCaja.totalCostoReal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            Elige productos arriba para calcular automático cuánto debe llevar cada uno.
          </div>
        )}

        <button 
          onClick={agregarCajaArmada} 
          disabled={!statsCaja}
          className="mt-4 w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <ShoppingCart className="w-4 h-4" /> Agregar caja armada
        </button>
      </section>

      {/* Col 3: Carrito */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden lg:sticky lg:top-6 h-fit max-h-[calc(100vh-80px)]">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-slate-500" /> Carrito
          </h2>
          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">{carrito.length} ITEMS</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
          {carrito.map(item => (
            <div key={item.uid} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm group transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-lg">{item.emoji}</div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{item.nombre}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.gramos}g <span className="mx-1">•</span> ${item.precioVentaUnit.toFixed(0)}/kg</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-mono font-bold text-slate-800">${item.subtotal.toFixed(2)}</span>
                <button 
                  onClick={() => setCarrito(prev => prev.filter(i => i.uid !== item.uid))}
                  className="text-[10px] text-slate-400 hover:text-red-500 font-bold uppercase tracking-wider mt-1 transition-colors opacity-0 group-hover:opacity-100"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
          {carrito.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm font-medium">El carrito está vacío.</div>
          )}
        </div>

        <div className="p-6 bg-slate-900 text-white mt-auto">
          <div className="flex justify-between items-center mb-1 text-slate-400 text-xs">
            <span>Costo / Gramos</span>
            <span className="font-mono">${statsCarrito.costo.toFixed(2)} / {statsCarrito.gramos.toFixed(0)}g</span>
          </div>
          <div className="flex justify-between items-center mb-3 text-slate-400 text-xs">
            <span>Ganancia Estimada</span>
            <span className="font-mono text-green-400">${statsCarrito.ganancia.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-5 text-xl font-bold border-t border-slate-700 pt-3">
            <span>Total</span>
            <span className="text-white font-mono">${statsCarrito.total.toFixed(2)}</span>
          </div>
          <button 
            onClick={() => onCobrar(statsCarrito.total, statsCarrito.ganancia, statsCarrito.gramos)}
            disabled={carrito.length === 0}
            className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" /> COBRAR (ENTER)
          </button>
        </div>
      </section>

      {/* Modal Entrada Manual */}
      {productoSeleccionado && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm grid place-items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[400px] p-6 border border-slate-200 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-2xl">
                  {productoSeleccionado.emoji}
                </span>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{productoSeleccionado.nombre}</h3>
                  <p className="text-sm text-slate-500">${productoSeleccionado.precioVenta.toFixed(2)}/kg</p>
                </div>
              </div>
              <button 
                onClick={() => setProductoSeleccionado(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition grid place-items-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Ingresar gramos manualmente</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="1"
                    value={gramosManual} 
                    onChange={e => setGramosManual(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="flex-1 h-12 rounded-xl border border-slate-300 px-4 text-base font-bold text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    placeholder="Ej. 250"
                  />
                  <span className="text-slate-500 font-bold px-2">g</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Selecciones rápidas</label>
                <div className="flex flex-wrap gap-2">
                  {[50, 100, 250, 500, 1000].map(g => (
                    <button 
                      key={g} 
                      onClick={() => setGramosManual(g)}
                      className={`px-3 py-2 rounded-lg text-sm font-bold border transition-colors ${gramosManual === g ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-indigo-300 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {g}g
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => {
                  if (typeof gramosManual === 'number' && gramosManual > 0) {
                    agregarProducto(productoSeleccionado, gramosManual);
                    setProductoSeleccionado(null);
                  } else {
                    showNotification("Ingresa una cantidad válida");
                  }
                }}
                disabled={!gramosManual || gramosManual <= 0}
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition text-white font-bold text-sm disabled:opacity-50 mt-2 shadow-sm"
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
