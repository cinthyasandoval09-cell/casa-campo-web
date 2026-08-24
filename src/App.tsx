import React, { useState, useEffect } from 'react';
import { auth, db, getDoc, doc, onAuthStateChanged, signOut } from './lib/firebase';
import { Auth } from './components/Auth';
import { AdminApp } from './components/AdminApp';
import { ClienteApp } from './components/ClienteApp';
import { RepartidorApp } from './components/RepartidorApp';
import { UserProfile } from './types';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const docSnap = await getDoc(doc(db, 'usuarios', u.uid));
        if (docSnap.exists()) {
          setUser(docSnap.data() as UserProfile);
        } else {
          // If no profile, create a default one. Legacy anonymous users become admins to preserve their POS access.
          const defaultRol = u.isAnonymous ? 'admin' : 'cliente';
          const defaultNombre = u.isAnonymous ? 'Propietario (Local)' : (u.email || 'Usuario');
          setUser({ uid: u.uid, email: u.email || '', nombre: defaultNombre, rol: defaultRol });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-slate-500">Cargando...</div>;

  if (!user) {
    return <Auth onLogin={() => {}} />;
  }

  if (user.rol === 'admin') {
    return <AdminApp user={user} onLogout={handleLogout} />;
  } else if (user.rol === 'repartidor') {
    return <RepartidorApp user={user} onLogout={handleLogout} />;
  } else {
    return <ClienteApp user={user} onLogout={handleLogout} />;
  }
}
