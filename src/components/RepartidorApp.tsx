import React, { useState, useEffect } from 'react';
import { db, onSnapshot, collection, updateDoc, doc, query, where, orderBy } from '../lib/firebase';
import { Pedido, UserProfile } from '../types';

export function RepartidorApp({ user, onLogout }: { user: UserProfile; onLogout: () => void }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    // Escuchar todos los pedidos que no estén entregados o que sean de este repartidor
    const u = onSnapshot(collection(db, 'pedidos'), (snap) => {
      const arr: Pedido[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as Pedido));
      setPedidos(arr.sort((a,b) => b.fecha - a.fecha).filter(p => p.estado !== 'entregado' || p.repartidorId === user.uid));
    });
    return () => u();
  }, [user.uid]);

  const tomarPedido = async (id: string) => {
    await updateDoc(doc(db, 'pedidos', id), {
      repartidorId: user.uid,
      repartidorNombre: user.nombre,
      estado: 'en camino'
    });
  };

  const entregarPedido = async (id: string) => {
    await updateDoc(doc(db, 'pedidos', id), {
      estado: 'entregado'
    });
  };

  const verEnMapa = (direccion: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 bg-white shadow-sm px-6 py-4 flex justify-between items-center z-10">
        <div>
          <h1 className="font-black text-xl text-orange-600 tracking-tight">Repartidor</h1>
          <p className="text-xs text-slate-500 font-medium">{user.nombre}</p>
        </div>
        <button onClick={onLogout} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg text-sm hover:bg-slate-200 transition">Salir</button>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6 mt-4">
        <h2 className="text-xl font-bold text-slate-800">Pedidos Disponibles</h2>
        {pedidos.filter(p => !p.repartidorId).map(p => (
          <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-slate-800">{p.clienteNombre}</h3>
                <p className="text-sm text-slate-600">{p.direccion}</p>
              </div>
              <span className="font-black text-indigo-700">${p.total.toFixed(2)}</span>
            </div>
            <div className="text-xs text-slate-500 mb-4">
              {p.items.map(i => `${(i.gramos/1000).toFixed(1)}kg ${i.nombre}`).join(', ')}
            </div>
            <button onClick={() => tomarPedido(p.id)} className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700">Tomar Pedido</button>
          </div>
        ))}

        <h2 className="text-xl font-bold text-slate-800 pt-6">Mis Viajes Activos</h2>
        {pedidos.filter(p => p.repartidorId === user.uid && p.estado !== 'entregado').map(p => (
          <div key={p.id} className="bg-orange-50 p-5 rounded-2xl shadow-sm border border-orange-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-slate-800">{p.clienteNombre}</h3>
                <p className="text-sm text-slate-600 font-medium">{p.direccion}</p>
                {p.clienteTelefono && <p className="text-sm text-orange-700 font-bold mt-1">Tel: {p.clienteTelefono}</p>}
              </div>
              <span className="font-black text-orange-700">${p.total.toFixed(2)}</span>
            </div>
            <button onClick={() => entregarPedido(p.id)} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700">Marcar como Entregado</button>
          </div>
        ))}
      </main>
    </div>
  );
}
