import { FC, ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../contexts/AuthContext';

interface AppShellProps {
  children: ReactNode;
  history: { id: string; query: string }[];
  onLoadSession: (s: any) => void;
  onNewChat: () => void;
}

export const AppShell: FC<AppShellProps> = ({
  children,
  history,
  onLoadSession,
  onNewChat,
}) => {
  const navigate = useNavigate();
  const { authSession, handleLogout } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    localStorage.getItem('fainl_sidebar_collapsed') === 'true'
  );

  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('fainl_theme');
    if (stored) return stored === 'dark';
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('fainl_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('fainl_sidebar_collapsed', String(next));
      return next;
    });
  };

  const userEmail = authSession?.user?.email;
  const userName =
    authSession?.user?.user_metadata?.full_name ||
    authSession?.user?.user_metadata?.name ||
    userEmail?.split('@')[0] ||
    undefined;

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(d => !d)}
        history={history}
        onLoadSession={(s) => { onLoadSession(s); navigate('/mission'); }}
        onNewChat={onNewChat}
        userEmail={userEmail}
        userName={userName}
        isLoggedIn={!!authSession}
        onLogout={handleLogout}
      />

      <div className={`main-canvas${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <TopBar />
        {children}
      </div>

      <BottomNav />
    </div>
  );
};
