import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { prompt, history, context } = req.body;

      const systemInstruction = `Eres Elena, la asistente virtual de "Casa Campo". Eres amigable, profesional y conoces el negocio a la perfección.
      Aquí tienes la información actual del negocio:
      ${JSON.stringify(context, null, 2)}
      
      Debes responder de manera concisa a las dudas del usuario sobre el inventario, ventas, mermas o gastos.
      Si te piden analizar datos, hazlo basándote en la información proporcionada.
      
      Si el usuario quiere registrar un gasto, una merma o actualizar el inventario, usa las herramientas (functions) disponibles para hacerlo y confirma verbalmente que lo hiciste.
      `;

      let contents = [];
      
      // format history
      if (history && Array.isArray(history)) {
          contents = history.map((msg: any) => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.text }]
          }));
      }

      contents.push({
          role: 'user',
          parts: [{ text: prompt }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          tools: [{
            functionDeclarations: [
              {
                name: 'registrarGasto',
                description: 'Registra un nuevo gasto operativo del negocio',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    concepto: { type: Type.STRING, description: 'El motivo del gasto (ej. luz, agua, proveedor)' },
                    monto: { type: Type.NUMBER, description: 'La cantidad de dinero gastada' }
                  },
                  required: ['concepto', 'monto']
                }
              },
              {
                name: 'prepararMerma',
                description: 'Prepara el formulario de merma para un producto. Úsalo cuando el usuario reporta que se echó a perder algo o hay desperdicio.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    productoNombre: { type: Type.STRING, description: 'El nombre del producto (ej. Tomate, Cebolla)' },
                    kg: { type: Type.NUMBER, description: 'La cantidad en kilogramos que se va a mermar' },
                    motivo: { type: Type.STRING, description: 'El motivo de la merma (ej. podrido, golpeado)' }
                  },
                  required: ['productoNombre', 'kg', 'motivo']
                }
              },
              {
                name: 'actualizarInventario',
                description: 'Suma o resta kilogramos al inventario de un producto existente. Úsalo cuando llegue mercancía nueva.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    productoNombre: { type: Type.STRING, description: 'El nombre del producto (ej. Tomate)' },
                    kgAgregados: { type: Type.NUMBER, description: 'La cantidad de kilogramos a sumar (o restar si es negativo)' }
                  },
                  required: ['productoNombre', 'kgAgregados']
                }
              },
              {
                name: 'actualizarPrecioMargen',
                description: 'Actualiza el porcentaje de margen de ganancia de un producto para cambiar su precio de venta.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    productoNombre: { type: Type.STRING, description: 'El nombre del producto' },
                    nuevoMargen: { type: Type.NUMBER, description: 'El nuevo porcentaje de margen (ej. 35 para 35%)' }
                  },
                  required: ['productoNombre', 'nuevoMargen']
                }
              }
            ]
          }]
        },
      });

      let responseText = response.text || '';
      let functionCall = null;
      
      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        functionCall = {
          name: call.name,
          args: call.args
        };
      }

      res.json({ text: responseText, functionCall });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({ error: error.message || 'Error processing request' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
