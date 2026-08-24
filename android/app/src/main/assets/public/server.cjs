var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var ai = new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt, history, context } = req.body;
      const systemInstruction = `Eres Elena, la asistente virtual de "Casa Campo". Eres amigable, profesional y conoces el negocio a la perfecci\xF3n.
      Aqu\xED tienes la informaci\xF3n actual del negocio:
      ${JSON.stringify(context, null, 2)}
      
      Debes responder de manera concisa a las dudas del usuario sobre el inventario, ventas, mermas o gastos.
      Si te piden analizar datos, hazlo bas\xE1ndote en la informaci\xF3n proporcionada.
      
      Si el usuario quiere registrar un gasto, una merma o actualizar el inventario, usa las herramientas (functions) disponibles para hacerlo y confirma verbalmente que lo hiciste.
      `;
      let contents = [];
      if (history && Array.isArray(history)) {
        contents = history.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        }));
      }
      contents.push({
        role: "user",
        parts: [{ text: prompt }]
      });
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          tools: [{
            functionDeclarations: [
              {
                name: "registrarGasto",
                description: "Registra un nuevo gasto operativo del negocio",
                parameters: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    concepto: { type: import_genai.Type.STRING, description: "El motivo del gasto (ej. luz, agua, proveedor)" },
                    monto: { type: import_genai.Type.NUMBER, description: "La cantidad de dinero gastada" }
                  },
                  required: ["concepto", "monto"]
                }
              },
              {
                name: "prepararMerma",
                description: "Prepara el formulario de merma para un producto. \xDAsalo cuando el usuario reporta que se ech\xF3 a perder algo o hay desperdicio.",
                parameters: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    productoNombre: { type: import_genai.Type.STRING, description: "El nombre del producto (ej. Tomate, Cebolla)" },
                    kg: { type: import_genai.Type.NUMBER, description: "La cantidad en kilogramos que se va a mermar" },
                    motivo: { type: import_genai.Type.STRING, description: "El motivo de la merma (ej. podrido, golpeado)" }
                  },
                  required: ["productoNombre", "kg", "motivo"]
                }
              },
              {
                name: "actualizarInventario",
                description: "Suma o resta kilogramos al inventario de un producto existente. \xDAsalo cuando llegue mercanc\xEDa nueva.",
                parameters: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    productoNombre: { type: import_genai.Type.STRING, description: "El nombre del producto (ej. Tomate)" },
                    kgAgregados: { type: import_genai.Type.NUMBER, description: "La cantidad de kilogramos a sumar (o restar si es negativo)" }
                  },
                  required: ["productoNombre", "kgAgregados"]
                }
              },
              {
                name: "actualizarPrecioMargen",
                description: "Actualiza el porcentaje de margen de ganancia de un producto para cambiar su precio de venta.",
                parameters: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    productoNombre: { type: import_genai.Type.STRING, description: "El nombre del producto" },
                    nuevoMargen: { type: import_genai.Type.NUMBER, description: "El nuevo porcentaje de margen (ej. 35 para 35%)" }
                  },
                  required: ["productoNombre", "nuevoMargen"]
                }
              }
            ]
          }]
        }
      });
      let responseText = response.text || "";
      let functionCall = null;
      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        functionCall = {
          name: call.name,
          args: call.args
        };
      }
      res.json({ text: responseText, functionCall });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Error processing request" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
