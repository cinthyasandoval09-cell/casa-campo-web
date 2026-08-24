import React, { useState, useEffect } from 'react';
import { Mostrador } from './components/Mostrador';
import { Inventario } from './components/Inventario';
import { Admin } from './components/Admin';
import { ElenaAI } from './components/ElenaAI';
import { Product, SaleItem, Sale, Expense, Merma, BoxType } from './types';
import { getEmoji, initialBoxes } from './utils/helpers';
import { db, onSnapshot, collection, doc, updateDoc, increment, addDoc, setDoc, deleteDoc } from './lib/firebase';

export default function App() {
  const [tab, setTab] = useState<'mostrador' | 'inventario' | 'admin'>('mostrador');
  const [productos, setProductos] = useState<Product[]>([]);
  const [ventas, setVentas] = useState<Sale[]>([]);
  const [gastos, setGastos] = useState<Expense[]>([]);
  const [mermas, setMermas] = useState<Merma[]>([]);
  const [cajas] = useState<BoxType[]>(initialBoxes);
  
  const [carrito, setCarrito] = useState<SaleItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [mermaForm, setMermaForm] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    try {
      const u1 = onSnapshot(collection(db, 'productos'), (snap) => {
        const arr: Product[] = [];
        snap.forEach(d => {
          const data = d.data();
          arr.push({ 
            id: d.id, 
            ...data,
            precioVenta: typeof data.precioVenta === 'number' ? data.precioVenta : ((data.costoProv || 0) * (1 + (data.margen || 0) / 100)),
            costoProv: data.costoProv || 0,
            margen: data.margen || 0,
            stock: data.stock || 0
          } as Product);
        });
        setProductos(arr);
        setIsConnected(true);
      });
      const u2 = onSnapshot(collection(db, 'ventas'), (snap) => {
        const arr: Sale[] = [];
        snap.forEach(d => {
          const data = d.data();
          arr.push({ 
            id: d.id, 
            ...data,
            total: data.total || 0,
            ganancia: data.ganancia || 0,
            totalGramos: data.totalGramos || 0
          } as Sale);
        });
        setVentas(arr.sort((a,b) => b.fecha - a.fecha));
      });
      const u3 = onSnapshot(collection(db, 'gastos'), (snap) => {
        const arr: Expense[] = [];
        snap.forEach(d => {
          const data = d.data();
          arr.push({ 
            id: d.id, 
            ...data,
            monto: data.monto || 0
          } as Expense);
        });
        setGastos(arr.sort((a,b) => b.fecha - a.fecha));
      });
      const u4 = onSnapshot(collection(db, 'mermas'), (snap) => {
        const arr: Merma[] = [];
        snap.forEach(d => {
          const data = d.data();
          arr.push({ 
            id: d.id, 
            ...data,
            kg: data.kg || 0
          } as Merma);
        });
        setMermas(arr.sort((a,b) => b.fecha - a.fecha));
      });
      unsubs = [u1, u2, u3, u4];
    } catch (e) {
      console.log('Error setting up listeners', e);
    }
    return () => unsubs.forEach(u => u());
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCobrar = async (total: number, ganancia: number, totalGramos: number) => {
    if (carrito.length === 0) return;
    const sale: Omit<Sale, 'id'> = {
      fecha: Date.now(),
      items: carrito,
      total,
      ganancia,
      totalGramos
    };

    // Deduct stock and add sale in parallel
    const stockUpdates = new Map<string, number>();
    carrito.forEach(item => {
      stockUpdates.set(item.productoId, (stockUpdates.get(item.productoId) || 0) + (item.gramos / 1000));
    });

    try {
      for (const [pId, kg] of Array.from(stockUpdates.entries())) {
        await updateDoc(doc(db, 'productos', pId), { stock: increment(-kg) });
      }
      await addDoc(collection(db, 'ventas'), sale);
      setCarrito([]);
      showNotification(`¡Cobrado $${total.toFixed(2)}! Ganancia $${ganancia.toFixed(2)}`);
    } catch (e) {
      console.error(e);
      showNotification('Error al cobrar');
    }
  };

  const handleAddOrUpdateProduct = async (p: Partial<Product>) => {
    const nombre = p.nombre!.trim();
    const costo = p.costoProv || 0;
    const margen = p.margen || 0;
    const stock = p.stock || 0;
    const emoji = getEmoji(nombre);
    const precioVenta = costo * (1 + margen / 100);

    if (p.id) {
      // Update
      await updateDoc(doc(db, 'productos', p.id), {
        nombre, costoProv: costo, margen, precioVenta, stock, emoji
      });
      showNotification(`${nombre} actualizado`);
    } else {
      // Add or merge duplicate
      const existing = productos.find(x => x.nombre.toLowerCase().trim() === nombre.toLowerCase());
      if (existing) {
        await updateDoc(doc(db, 'productos', existing.id), {
          stock: increment(stock),
          costoProv: costo, margen, precioVenta, emoji
        });
        showNotification(`${nombre} ya existía, sumados ${stock}kg`);
      } else {
        await addDoc(collection(db, 'productos'), {
          nombre, costoProv: costo, margen, precioVenta, stock, emoji
        });
        showNotification(`${nombre} agregado`);
      }
    }
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteDoc(doc(db, 'productos', id));
    showNotification('Producto eliminado');
  };

  const handleUpdateStock = async (p: Product, delta: number) => {
    const newStock = Math.max(0, p.stock + delta);
    await updateDoc(doc(db, 'productos', p.id), { stock: newStock });
  };

  const handleAddMerma = async (m: any) => {
    const p = productos.find(x => x.id === m.productoId);
    if (!p) return;
    const merma: Omit<Merma, 'id'> = {
      fecha: Date.now(),
      productoId: p.id,
      nombre: p.nombre,
      kg: m.kg,
      motivo: m.motivo
    };
    await updateDoc(doc(db, 'productos', p.id), { stock: increment(-m.kg) });
    await addDoc(collection(db, 'mermas'), merma);
    showNotification(`Merma ${p.nombre} ${m.kg}kg registrada`);
  };

  const handleAddGasto = async (g: any) => {
    const gasto: Omit<Expense, 'id'> = {
      fecha: new Date(g.fecha).getTime(),
      concepto: g.concepto,
      monto: g.monto
    };
    await addDoc(collection(db, 'gastos'), gasto);
    showNotification(`Gasto ${g.concepto} $${g.monto} agregado`);
  };

  const handleVoiceMerma = (data: any) => {
    setMermaForm(data);
    setTab('admin');
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 font-sans flex flex-col selection:bg-indigo-100 pb-24">
      <header className="sticky top-0 z-30 flex-none h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 grid place-items-center text-white font-black text-sm shadow-sm">C</div>
          <div className="flex flex-col justify-center">
            <h1 className="font-bold text-sm tracking-tight text-slate-900 leading-tight">
              Casa Campo
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              Escobedo • {isConnected ? 'Online' : 'Local'}
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          {[
            { id: 'mostrador', label: 'Mostrador' },
            { id: 'inventario', label: 'Inventario' },
            { id: 'admin', label: 'Admin' }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${tab === t.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {notification && (
        <div className="fixed top-[76px] left-1/2 -translate-x-1/2 z-[60] bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2 animate-in slide-in-from-top-4 fade-in duration-300">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> {notification}
        </div>
      )}

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 animate-in fade-in duration-500 overflow-y-auto">
        {tab === 'mostrador' && (
          <Mostrador 
            productos={productos} cajas={cajas} 
            carrito={carrito} setCarrito={setCarrito}
            onCobrar={handleCobrar} showNotification={showNotification} 
          />
        )}
        {tab === 'inventario' && (
          <Inventario 
            productos={productos} 
            onAddOrUpdate={handleAddOrUpdateProduct}
            onDelete={handleDeleteProduct}
            onUpdateStock={handleUpdateStock}
          />
        )}
        {tab === 'admin' && (
          <Admin 
            productos={productos} ventas={ventas} gastos={gastos} mermas={mermas}
            onAddMerma={handleAddMerma} onAddGasto={handleAddGasto}
            mermaFormInitial={mermaForm}
          />
        )}
      </main>

      <ElenaAI 
        productos={productos} ventas={ventas} gastos={gastos} mermas={mermas}
        setMermaForm={handleVoiceMerma}
        onAddGasto={handleAddGasto}
        onUpdateStock={handleUpdateStock}
        onUpdateProduct={handleAddOrUpdateProduct}
      />
    </div>
  );
}
