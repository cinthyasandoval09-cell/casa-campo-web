import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, db, setDoc, doc } from '../lib/firebase';

export function Auth({ onLogin }: { onLogin: (role: string, user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<'cliente' | 'repartidor' | 'admin'>('cliente');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Cuenta maestra oculta
    let loginEmail = email.trim();
    if (loginEmail.toLowerCase() === 'casacampo') {
      loginEmail = 'admin@casacampo.com';
    }

    try {
      if (isLogin) {
        try {
          await signInWithEmailAndPassword(auth, loginEmail, password);
        } catch (err: any) {
          // Si intenta entrar con la cuenta maestra y no existe en la base de datos, la crea al vuelo
          if ((err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') && email.toLowerCase() === 'casacampo' && password === 'A1b2c3d4c5') {
            const cred = await createUserWithEmailAndPassword(auth, loginEmail, password);
            await setDoc(doc(db, 'usuarios', cred.user.uid), {
              uid: cred.user.uid,
              email: loginEmail,
              nombre: 'Propietario',
              rol: 'admin'
            });
            return; // Login success because of creation
          }
          throw new Error('Usuario o contraseña incorrectos.');
        }
      } else {
        // Validación de código de invitación por WhatsApp
        if (codigo.trim().toUpperCase() !== 'CASA123') {
          throw new Error('Código de acceso inválido. Solicítalo al administrador por WhatsApp.');
        }

        const cred = await createUserWithEmailAndPassword(auth, loginEmail, password);
        await setDoc(doc(db, 'usuarios', cred.user.uid), {
          uid: cred.user.uid,
          email: loginEmail,
          nombre,
          rol
        });
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleWhatsApp = () => {
    // Número placeholder (debe cambiarlo el dueño por su número real)
    const numeroDestino = "5211234567890";
    const mensaje = encodeURIComponent("Hola Casa Campo, necesito un código de acceso para registrarme en la aplicación.");
    window.open(`https://wa.me/${numeroDestino}?text=${mensaje}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 grid place-items-center text-white font-black text-2xl shadow-sm mx-auto mb-4">C</div>
        <h2 className="text-center text-2xl font-black tracking-tight text-slate-900">
          Casa Campo
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {isLogin ? 'Ingresa a tu cuenta' : 'Crea una cuenta mediante invitación'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nombre completo</label>
                  <div className="mt-1">
                    <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Tipo de cuenta</label>
                  <div className="mt-1">
                    <select value={rol} onChange={e => setRol(e.target.value as any)} className="block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm">
                      <option value="cliente">Cliente</option>
                      <option value="repartidor">Repartidor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-slate-700">Código de Acceso</label>
                    <button type="button" onClick={handleWhatsApp} className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                      Pedir por WhatsApp
                    </button>
                  </div>
                  <div className="mt-1">
                    <input type="text" required value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Ej. CASA123" className="block w-full uppercase appearance-none rounded-lg border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">
                {isLogin ? 'Correo electrónico o Usuario' : 'Correo electrónico'}
              </label>
              <div className="mt-1">
                {/* Cambiado type a 'text' para permitir el usuario 'casacampo' */}
                <input type={isLogin ? "text" : "email"} required value={email} onChange={e => setEmail(e.target.value)} className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Contraseña</label>
              <div className="mt-1">
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm" />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>
            )}

            <div>
              <button type="submit" className="flex w-full justify-center rounded-lg border border-transparent bg-indigo-600 py-3 px-4 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                {isLogin ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button onClick={() => { setIsLogin(!isLogin); setError(''); setCodigo(''); }} className="w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
              {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
