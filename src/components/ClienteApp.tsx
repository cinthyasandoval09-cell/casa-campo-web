import React, { useState, useEffect } from 'react';
import { db, onSnapshot, collection, addDoc, query, where, orderBy } from '../lib/firebase';
import { Product, SaleItem, Pedido, UserProfile } from '../types';

export function ClienteApp({ user, onLogout }: { user: UserProfile; onLogout: () => void }) {
  const [productos, setProductos] = useState<Product[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carrito, setCarrito] = useState<SaleItem[]>([]);
  const [direccion, setDireccion] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'productos'), (snap) => {
      const arr: Product[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as Product));
      setProductos(arr);
    });

    const q = query(collection(db, 'pedidos'), where('clienteId', '==', user.uid));
    const u2 = onSnapshot(q, (snap) => {
      const arr: Pedido[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as Pedido));
      setPedidos(arr.sort((a,b) => b.fecha - a.fecha));
    });

    return () => { u1(); u2(); };
  }, [user.uid]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const addToCart = (p: Product) => {
    const kg = parseFloat(prompt(`¿Cuántos kilogramos de ${p.nombre} deseas?`, '1') || '0');
    if (!kg || kg <= 0) return;
    
    setCarrito([...carrito, {
      uid: Date.now().toString(),
      productoId: p.id,
      nombre: p.nombre,
      emoji: p.emoji || '📦',
      gramos: kg * 1000,
      costoProvUnit: p.costoProv || 0,
      precioVentaUnit: p.precioVenta || 0,
      subtotal: (p.precioVenta || 0) * kg,
      costoTotal: (p.costoProv || 0) * kg
    }]);
    showNotification('Agregado al carrito');
  };

  const handlePedir = async () => {
    if (carrito.length === 0) return;
    if (!direccion) {
      showNotification('Ingresa una dirección de entrega');
      return;
    }
    const total = carrito.reduce((sum, i) => sum + i.subtotal, 0);
    const ganancia = carrito.reduce((sum, i) => sum + (i.subtotal - i.costoTotal), 0);
    const totalGramos = carrito.reduce((sum, i) => sum + i.gramos, 0);

    const pedido: Omit<Pedido, 'id'> = {
      clienteId: user.uid,
      clienteNombre: user.nombre,
      clienteTelefono: user.telefono || '',
      fecha: Date.now(),
      items: carrito,
      total,
      ganancia,
      totalGramos,
      estado: 'pendiente',
      direccion
    };

    try {
      await addDoc(collection(db, 'pedidos'), pedido);
      setCarrito([]);
      setDireccion('');
      showNotification('Pedido realizado con éxito');
    } catch (error) {
      showNotification('Error al crear el pedido');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 bg-white shadow-sm px-6 py-4 flex justify-between items-center z-10">
        <div>
          <h1 className="font-black text-xl text-indigo-700 tracking-tight">Casa Campo</h1>
          <p className="text-xs text-slate-500 font-medium">Hola, {user.nombre}</p>
        </div>
        <button onClick={onLogout} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg text-sm hover:bg-slate-200 transition">Salir</button>
      </header>

      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg">
          {notification}
        </div>
      )}

      <main className="max-w-4xl mx-auto p-4 space-y-8 mt-4">
        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Productos Disponibles</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {productos.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                <div className="text-4xl mb-2">{p.emoji || '📦'}</div>
                <h3 className="font-bold text-slate-800 text-center text-sm">{p.nombre}</h3>
                <p className="text-indigo-600 font-black mt-1">${(p.precioVenta || 0).toFixed(2)} /kg</p>
                <button onClick={() => addToCart(p)} className="mt-3 w-full py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-sm hover:bg-indigo-100 transition">Agregar</button>
              </div>
            ))}
          </div>
        </section>

        {carrito.length > 0 && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Tu Pedido</h2>
            <div className="space-y-3 mb-6">
              {carrito.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center pb-3 border-b border-slate-50">
                  <div>
                    <span className="font-bold text-slate-700">{item.emoji} {item.nombre}</span>
                    <span className="text-xs text-slate-500 ml-2">{(item.gramos / 1000).toFixed(2)} kg</span>
                  </div>
                  <span className="font-black text-slate-800">${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-slate-500">Total</span>
                <span className="text-2xl font-black text-indigo-700">${carrito.reduce((a, b) => a + b.subtotal, 0).toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección de entrega</label>
                <input type="text" placeholder="Ej. Calle Primavera 123" value={direccion} onChange={e => setDireccion(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={handlePedir} className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-md">Confirmar Pedido</button>
            </div>
          </section>
        )}

        {pedidos.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Tus Pedidos</h2>
            <div className="space-y-4">
              {pedidos.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        p.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : 
                        p.estado === 'preparando' ? 'bg-blue-100 text-blue-700' :
                        p.estado === 'en camino' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>{p.estado.toUpperCase()}</span>
                      <span className="text-xs text-slate-500">{new Date(p.fecha).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium">Total: <span className="font-black text-slate-800">${p.total.toFixed(2)}</span></p>
                    {p.repartidorNombre && <p className="text-xs text-slate-500 mt-1">Repartidor: {p.repartidorNombre}</p>}
                  </div>
                  <div className="text-xs font-medium text-slate-500 max-w-xs">{p.items.map(i => `${(i.gramos/1000).toFixed(1)}kg ${i.nombre}`).join(', ')}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
