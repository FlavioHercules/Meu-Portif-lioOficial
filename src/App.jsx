import React, { useEffect, useState } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import IA from "./components/IA";
import Movimentos from "./components/Movimentos";
import Planos from "./components/Planos";
import Perfil from "./components/Perfil";
import NotificacoesModal from "./components/NotificacoesModal";
import ConfiguracoesModal from "./components/ConfiguracoesModal";
import Login from "./components/Login";
import { supabase, isSupabaseConfigured } from "./lib/supabase";

const defaultSettings = {
  darkMode: true,
  notifTreinos: true,
  notifConquistas: true,
  notifDicas: true,
  interfaceTheme: "Neon",
  fontSize: "Normal",
};

export default function App() {
  const [session, setSession] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoaded(true);
      return;
    }

    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setIsLoaded(true);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const fontScaleMap = {
    Pequeno: 0.92,
    Normal: 1,
    Grande: 1.08,
  };

  const rootTheme = settings.darkMode
    ? { backgroundColor: '#050508', color: '#ffffff' }
    : { backgroundColor: '#eef2ff', color: '#0f172a' };

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center bg-[#050508] text-white">Carregando...</div>;
  }

  if (!isSupabaseConfigured || !session) {
    return <Login />;
  }

  return (
    <Router>
      <div
        className="relative flex h-screen w-full flex-col overflow-hidden antialiased"
        style={{
          ...rootTheme,
          fontSize: `${fontScaleMap[settings.fontSize] ?? 1}rem`,
          transition: 'all 0.2s ease',
        }}
      >
        <div className="h-full w-full flex-1 overflow-y-auto overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Home onOpenNotif={() => setIsNotifOpen(true)} onOpenConfig={() => setIsConfigOpen(true)} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/ia" element={<IA onOpenNotif={() => setIsNotifOpen(true)} onOpenConfig={() => setIsConfigOpen(true)} />} />
            <Route path="/movimentos" element={<Movimentos onOpenNotif={() => setIsNotifOpen(true)} onOpenConfig={() => setIsConfigOpen(true)} />} />
            <Route path="/planos" element={<Planos onOpenNotif={() => setIsNotifOpen(true)} onOpenConfig={() => setIsConfigOpen(true)} />} />
            <Route path="/perfil" element={<Perfil onOpenNotif={() => setIsNotifOpen(true)} onOpenConfig={() => setIsConfigOpen(true)} />} />
          </Routes>
        </div>

        <NotificacoesModal
          isOpen={isNotifOpen}
          onClose={() => setIsNotifOpen(false)}
          notificationSettings={settings}
        />
        <ConfiguracoesModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          settings={settings}
          onChangeSetting={handleSettingChange}
        />
      </div>
    </Router>
  );
}