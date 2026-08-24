import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Mic, Loader2 } from 'lucide-react';
import { Product, Sale, Expense, Merma } from '../types';

interface Message {
  role: 'elena' | 'user';
  text: string;
}

interface Props {
  productos: Product[];
  ventas: Sale[];
  gastos: Expense[];
  mermas: Merma[];
  setMermaForm: (data: any) => void;
  onAddGasto: (gasto: Omit<Expense, 'id' | 'fecha'>) => void;
  onUpdateStock: (p: Product, delta: number) => void;
  onUpdateProduct: (p: Partial<Product>) => void;
}

export function ElenaAI({ productos, ventas, gastos, mermas, setMermaForm, onAddGasto, onUpdateStock, onUpdateProduct }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'elena', text: '¡Hola! Soy Elena 👩🏻‍🌾 de Casa Campo Escobedo. Pregúntame sobre el inventario, las ganancias, mermas o gastos.' }
  ]);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    // Setup Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-MX';

      recognitionRef.current.onresult = (event: any) => {
        const last = event.results.length - 1;
        const text = event.results[last][0].transcript.toLowerCase();
        
        if (text.includes('elena ayúdame') || text.includes('elena ayudame')) {
          setIsOpen(true);
          const command = text.replace(/elena ayúdame|elena ayudame/g, '').trim();
          if (command) {
            handleProcessCommand(command);
          } else {
            handleProcessCommand('hola');
          }
        } else if (isListening) {
          handleProcessCommand(text);
          setIsListening(false);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      // Start listening in background for hotword
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Could not start background recognition", e);
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [productos, ventas, gastos, mermas]); // Dependencies updated

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleProcessCommand = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context for the prompt
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const ventasHoy = ventas.filter(v => v.fecha >= todayStart);
      const gastosHoy = gastos.filter(g => g.fecha >= todayStart);
      const mermasHoy = mermas.filter(m => m.fecha >= todayStart);

      const context = {
        productos: productos.map(p => ({ 
          nombre: p.nombre, 
          stock: p.stock, 
          costoProv: p.costoProv,
          margen: p.margen,
          precioVenta: p.precioVenta 
        })),
        estadisticas: {
          hoy: {
            ventasTotales: ventasHoy.reduce((acc, v) => acc + v.total, 0),
            gananciaTotal: ventasHoy.reduce((acc, v) => acc + v.ganancia, 0),
            cantidadVentas: ventasHoy.length,
            gastos: gastosHoy.reduce((acc, g) => acc + g.monto, 0),
            mermasKg: mermasHoy.reduce((acc, m) => acc + m.kg, 0)
          },
          historico: {
            totalVentasRegistradas: ventas.length,
            totalGastos: gastos.reduce((acc, g) => acc + g.monto, 0),
            totalMermasKg: mermas.reduce((acc, m) => acc + m.kg, 0)
          }
        }
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          history: messages,
          context
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      let aiText = data.text;

      // Handle function calls
      if (data.functionCall) {
        if (data.functionCall.name === 'registrarGasto') {
          const { concepto, monto } = data.functionCall.args;
          onAddGasto({ concepto, monto });
          aiText += `\n\n✅ He registrado el gasto: ${concepto} por $${monto}.`;
        } else if (data.functionCall.name === 'prepararMerma') {
          const { productoNombre, kg, motivo } = data.functionCall.args;
          const prod = productos.find(p => p.nombre.toLowerCase().includes(productoNombre.toLowerCase()));
          if (prod) {
            setMermaForm({ productoId: prod.id, kg, motivo });
            aiText += `\n\n✅ He preparado el reporte de merma para ${prod.nombre} (${kg}kg). Revísalo en la pestaña Admin.`;
          } else {
            aiText += `\n\n⚠️ Intenté preparar la merma, pero no encontré el producto "${productoNombre}" en el inventario.`;
          }
        } else if (data.functionCall.name === 'actualizarInventario') {
          const { productoNombre, kgAgregados } = data.functionCall.args;
          const prod = productos.find(p => p.nombre.toLowerCase().includes(productoNombre.toLowerCase()));
          if (prod) {
            onUpdateStock(prod, kgAgregados);
            aiText += `\n\n✅ Inventario de ${prod.nombre} actualizado (${kgAgregados > 0 ? '+' : ''}${kgAgregados}kg).`;
          } else {
            aiText += `\n\n⚠️ No encontré el producto "${productoNombre}" para actualizar su inventario.`;
          }
        } else if (data.functionCall.name === 'actualizarPrecioMargen') {
          const { productoNombre, nuevoMargen } = data.functionCall.args;
          const prod = productos.find(p => p.nombre.toLowerCase().includes(productoNombre.toLowerCase()));
          if (prod) {
            onUpdateProduct({ ...prod, margen: nuevoMargen });
            aiText += `\n\n✅ El margen de ${prod.nombre} ha sido actualizado al ${nuevoMargen}%.`;
          } else {
            aiText += `\n\n⚠️ No encontré el producto "${productoNombre}" para actualizar su precio.`;
          }
        }
      }

      setMessages(prev => [...prev, { role: 'elena', text: aiText }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'elena', text: 'Lo siento, tuve un problema al conectarme al sistema. Intenta de nuevo. 👩🏻‍🌾' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {isOpen && (
        <div className="w-[340px] max-w-[88vw] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300">
          <div className="h-14 bg-slate-900 text-white px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-slate-800 text-indigo-400 grid place-items-center font-black">👩🏻‍🌾</span>
              <div>
                <div className="font-bold text-sm leading-none">Elena AI</div>
                <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Casa Campo • Escobedo</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-slate-800 grid place-items-center hover:bg-slate-700 transition">
              <X className="w-4 h-4 text-slate-300" />
            </button>
          </div>
          
          <div className="h-[320px] overflow-auto p-4 space-y-4 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${m.role === 'elena' ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm' : 'bg-indigo-600 text-white rounded-tr-sm shadow-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 text-xs bg-white border border-slate-200 text-slate-800 rounded-tl-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Pensando...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-slate-200 bg-white space-y-3">
            <div className="flex gap-2 flex-wrap">
              {[
                { l: 'Bajo stock', a: () => handleProcessCommand('¿Qué productos tienen bajo stock?') },
                { l: 'Ganancias', a: () => handleProcessCommand('Resumen de ventas y ganancias hoy') },
                { l: 'Gastos', a: () => handleProcessCommand('Ver resumen de gastos') }
              ].map(b => (
                <button key={b.l} onClick={b.a} className="px-3 py-1.5 rounded-md bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition">
                  {b.l}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleListening}
                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition shadow-sm ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <Mic className="w-4 h-4" />
              </button>
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleProcessCommand(input)}
                placeholder='Pregúntale a Elena...'
                className="flex-1 h-10 rounded-full border border-slate-300 px-4 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
              <button disabled={!input.trim() || isLoading} onClick={() => handleProcessCommand(input)} className="w-10 h-10 shrink-0 rounded-full bg-indigo-600 text-white grid place-items-center hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="group h-14 pl-2 pr-5 rounded-full bg-slate-900 text-white shadow-xl flex items-center gap-3 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
      >
        <span className="w-10 h-10 rounded-full bg-indigo-600 grid place-items-center text-xl shadow-sm">👩🏻‍🌾</span>
        <span className="font-bold text-sm">Elena AI</span>
        {!isOpen && <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping" />}
      </button>
    </div>
  );
}
