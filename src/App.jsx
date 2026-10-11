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
import PesquisaModal from "./components/PesquisaModal";
import { supabase, isSupabaseConfigured } from "./lib/supabase";

const defaultSettings = {
  darkMode: true,
  notifTreinos: true,
  notifConquistas: true,
  notifDicas: true,
  fontSize: "Normal",
};

export default function App() {
  const [session, setSession] = useState(null);
  const [isLoaded, setIsLoaded] = useState(!isSupabaseConfigured);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [settingsError, setSettingsError] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [userProfile, setUserProfile] = useState({});
  const [pesquisa, setPesquisa] = useState(null);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [isResearchEditorOpen, setIsResearchEditorOpen] = useState(false);
  const currentUser = session?.user;

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

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

  useEffect(() => {
    if (!currentUser) return;

    let isActive = true;

    const fetchUserData = async () => {
      try {
        const [profileResult, pesquisaResult, settingsResult] = await Promise.all([
          supabase.from('usuarios').select('full_name, email, member_since').eq('id', currentUser.id).maybeSingle(),
          supabase.from('pesquisa').select('*').eq('user_id', currentUser.id).maybeSingle(),
          supabase.from('user_settings').select('*').eq('user_id', currentUser.id).maybeSingle(),
        ]);

        if (!isActive) return;

        setUserProfile({
          full_name: profileResult.data?.full_name || currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuário',
          email: profileResult.data?.email || currentUser.email || '',
          member_since: profileResult.data?.member_since || currentUser.created_at,
        });
        setPesquisa(pesquisaResult.data || null);
        if (settingsResult.data) {
          setSettings({
            darkMode: settingsResult.data.dark_mode,
            fontSize: settingsResult.data.font_size,
            notifTreinos: settingsResult.data.notifications_workouts,
            notifConquistas: settingsResult.data.notifications_goals,
            notifDicas: settingsResult.data.notifications_dicas,
          });
        }
      } catch {
        if (!isActive) return;
        setUserProfile({
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuário',
          email: currentUser.email || '',
          member_since: currentUser.created_at,
        });
        setPesquisa(null);
      }
      setLoadedUserId(currentUser.id);
    };

    fetchUserData();

    return () => {
      isActive = false;
    };
  }, [currentUser]);

  useEffect(() => {
    const theme = settings.darkMode ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
  }, [settings.darkMode]);

  const handleSettingChange = async (key, value) => {
    const columnByKey = {
      darkMode: 'dark_mode',
      fontSize: 'font_size',
      notifTreinos: 'notifications_workouts',
      notifConquistas: 'notifications_goals',
      notifDicas: 'notifications_dicas',
    };
    const column = columnByKey[key];
    if (!column || !currentUser) return;

    const previousValue = settings[key];
    setSettings((previous) => ({ ...previous, [key]: value }));
    setSettingsError('');
    const { error } = await supabase
      .from('user_settings')
      .update({ [column]: value })
      .eq('user_id', currentUser.id);

    if (error) {
      setSettings((previous) => ({ ...previous, [key]: previousValue }));
      setSettingsError('Não foi possível salvar essa configuração. Tente novamente.');
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    setIsSigningOut(true);
    setSignOutError('');
    const { error } = await supabase.auth.signOut();
    setIsSigningOut(false);
    if (error) {
      setSignOutError('Não foi possível sair da conta. Verifique sua conexão e tente novamente.');
      return;
    }
    setIsConfigOpen(false);
    setIsNotifOpen(false);
    setPesquisa(null);
    setUserProfile({});
    setLoadedUserId(null);
  };

  const fontScaleMap = {
    Pequeno: 0.92,
    Normal: 1,
    Grande: 1.08,
  };

  const rootTheme = settings.darkMode
    ? { backgroundColor: '#050508', color: '#ffffff' }
    : { backgroundColor: '#f1f5f9', color: '#0f172a' };
  const isResearchComplete = Boolean(pesquisa?.gender && pesquisa?.age && pesquisa?.height_cm && pesquisa?.weight_kg && pesquisa?.experience_months !== undefined);

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center bg-[#050508] text-white">Carregando...</div>;
  }

  if (!isSupabaseConfigured || !session) {
    return <Login />;
  }

  if (currentUser && loadedUserId !== currentUser.id) {
    return <div className="flex h-screen items-center justify-center bg-[#050508] text-white">Carregando...</div>;
  }

  return (
    <Router>
      <div
        className="app-shell relative flex w-full min-w-0 flex-col overflow-hidden antialiased"
        data-theme={settings.darkMode ? 'dark' : 'light'}
        style={{
          ...rootTheme,
          fontSize: `${fontScaleMap[settings.fontSize] ?? 1}rem`,
          transition: 'all 0.2s ease',
        }}
      >
        <div className="app-scroll h-full w-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Home key={pesquisa?.id || 'new'} userId={session.user.id} pesquisa={pesquisa} onPesquisaChange={setPesquisa} onEditResearch={() => setIsResearchEditorOpen(true)} onOpenNotif={() => setIsNotifOpen(true)} onOpenConfig={() => setIsConfigOpen(true)} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/ia" element={<IA userId={session.user.id} pesquisa={pesquisa} onPesquisaChange={setPesquisa} onOpenNotif={() => setIsNotifOpen(true)} onOpenConfig={() => setIsConfigOpen(true)} />} />
            <Route path="/movimentos" element={<Movimentos userId={session.user.id} onOpenNotif={() => setIsNotifOpen(true)} onOpenConfig={() => setIsConfigOpen(true)} />} />
            <Route path="/planos" element={<Planos userId={session.user.id} onOpenNotif={() => setIsNotifOpen(true)} onOpenConfig={() => setIsConfigOpen(true)} />} />
            <Route path="/perfil" element={<Perfil userProfile={{ ...userProfile, pesquisa }} onEditResearch={() => setIsResearchEditorOpen(true)} onSignOut={handleSignOut} onOpenNotif={() => setIsNotifOpen(true)} onOpenConfig={() => setIsConfigOpen(true)} />} />
          </Routes>
        </div>

        <NotificacoesModal
          isOpen={isNotifOpen}
          onClose={() => setIsNotifOpen(false)}
          notificationSettings={settings}
          userId={session.user.id}
        />
        <ConfiguracoesModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          settings={settings}
          onChangeSetting={handleSettingChange}
          settingsError={settingsError}
          onSignOut={handleSignOut}
          isSigningOut={isSigningOut}
          signOutError={signOutError}
          userId={session.user.id}
          userEmail={session.user.email}
        />
        <PesquisaModal
          key={isResearchEditorOpen ? `edit-${pesquisa?.updated_at || 'profile'}` : `required-${session.user.id}`}
          isOpen={!isResearchComplete || isResearchEditorOpen}
          userId={session.user.id}
          initialValues={pesquisa}
          onComplete={(answers) => {
            setPesquisa(answers);
            setIsResearchEditorOpen(false);
          }}
        />
      </div>
    </Router>
  );
}