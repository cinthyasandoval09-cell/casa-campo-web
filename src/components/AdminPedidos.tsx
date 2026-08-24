import React from 'react';
import { Pedido } from '../types';
import { db, doc, updateDoc } from '../lib/firebase';

export function AdminPedidos({ pedidos }: { pedidos: Pedido[] }) {
  const updateEstado = async (id: string, nuevoEstado: string) => {
    await updateDoc(doc(db, 'pedidos', id), { estado: nuevoEstado });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-black text-slate-800">Gestión de Pedidos</h2>
      
      <div className="grid gap-6">
        {pedidos.map(p => (
          <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider ${
                  p.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : 
                  p.estado === 'preparando' ? 'bg-blue-100 text-blue-700' :
                  p.estado === 'en camino' ? 'bg-orange-100 text-orange-700' :
                  'bg-green-100 text-green-700'
                }`}>{p.estado}</span>
                <span className="text-sm text-slate-500 font-medium">{new Date(p.fecha).toLocaleString()}</span>
              </div>
              <h3 className="font-bold text-lg text-slate-800">{p.clienteNombre}</h3>
              <p className="text-slate-600 font-medium mb-3">{p.direccion} {p.clienteTelefono ? `• Tel: ${p.clienteTelefono}` : ''}</p>
              
              <div className="bg-slate-50 p-4 rounded-xl">
                <ul className="space-y-2">
                  {p.items.map((i, idx) => (
                    <li key={idx} className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{i.emoji} {i.nombre} <span className="text-slate-400">x {(i.gramos/1000).toFixed(2)}kg</span></span>
                      <span className="font-bold text-slate-800">${i.subtotal.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-500">Total</span>
                  <span className="text-xl font-black text-indigo-700">${p.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 min-w-[200px] justify-center">
              {p.estado === 'pendiente' && (
                <button onClick={() => updateEstado(p.id, 'preparando')} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Aceptar y Preparar</button>
              )}
              {p.estado === 'preparando' && (
                <div className="text-sm font-medium text-slate-500 text-center p-3 bg-slate-50 rounded-xl border border-slate-100">Esperando a que un repartidor lo tome...</div>
              )}
              {p.repartidorId && (
                <div className="text-sm font-medium text-slate-700 p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <span className="block text-xs text-orange-600 font-bold uppercase mb-1">Repartidor Asignado</span>
                  {p.repartidorNombre}
                </div>
              )}
            </div>
          </div>
        ))}
        {pedidos.length === 0 && (
          <div className="text-center py-12 text-slate-400 font-medium">No hay pedidos registrados</div>
        )}
      </div>
    </div>
  );
}
