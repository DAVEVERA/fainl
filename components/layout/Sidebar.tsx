import { FC, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Plus,
  Clock,
  Swords,
  MessageSquare,
  Moon,
  Sun,
  LogOut,
  MoreHorizontal,
  ChevronLeft,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  history: { id: string; query: string }[];
  onLoadSession: (s: any) => void;
  onNewChat: () => void;
  userEmail?: string;
  userName?: string;
  isLoggedIn: boolean;
  onLogout: () => void;
}

export const Sidebar: FC<SidebarProps> = ({
  collapsed,
  onToggle,
  darkMode,
  onToggleTheme,
  history,
  onLoadSession,
  onNewChat,
  userEmail,
  userName,
  isLoggedIn,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  const navLinks = [
    { path: '/mission', label: 'Antwoorden', icon: Clock },
    { path: '/debates', label: 'Beraadslagen', icon: Swords },
  ];

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <button
        className="sidebar-toggle-btn"
        onClick={onToggle}
        title={collapsed ? 'Sidebar uitklappen' : 'Sidebar inklappen'}
        aria-label={collapsed ? 'Sidebar uitklappen' : 'Sidebar inklappen'}
      >
        <ChevronLeft />
      </button>

      {/* Logo */}
      <button className="sidebar-logo" onClick={() => navigate('/')}>
        <span className="sidebar-logo-mark">
          <Shield className="sidebar-logo-icon" />
        </span>
        <span className="sidebar-logo-text">FAINL</span>
      </button>

      {/* New chat */}
      <button className="btn-new-chat" onClick={onNewChat}>
        <Plus />
        <span>Nieuwe chat</span>
      </button>

      {/* Nav links */}
      <nav className="sidebar-nav" style={{ marginTop: 4 }}>
        {navLinks.map(link => (
          <div className="sidebar-tooltip-wrap" key={link.path}>
            <button
              className={`sidebar-link${location.pathname === link.path ? ' active' : ''}`}
              onClick={() => navigate(link.path)}
              title={link.label}
            >
              <link.icon />
              <span>{link.label}</span>
            </button>
          </div>
        ))}
      </nav>

      {/* Chat history */}
      {history.length > 0 && (
        <div className="sidebar-section sidebar-section-scrollable">
          <p className="sidebar-section-label">Recente chats</p>
          {history.slice(0, 12).map(s => (
            <button
              key={s.id}
              className="sidebar-history-item"
              onClick={() => onLoadSession(s)}
              title={s.query}
            >
              <MessageSquare />
              <span className="sidebar-history-label">{s.query || 'Naamloos'}</span>
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Theme toggle */}
        <div className="sidebar-tooltip-wrap">
          <button className="flyout-btn" onClick={onToggleTheme} style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {darkMode ? <Sun style={{ width: 15, height: 15 }} /> : <Moon style={{ width: 15, height: 15 }} />}
              <span>{darkMode ? 'Lichte modus' : 'Donkere modus'}</span>
            </span>
          </button>
        </div>

        {/* User */}
        <div className="flyout-trigger">
          <button className="flyout-btn" onClick={() => setFlyoutOpen(o => !o)} style={{ paddingLeft: 8 }}>
            <span className="user-avatar">
              {userEmail?.charAt(0).toUpperCase() ?? 'G'}
            </span>
            <span className="user-name-wrap">
              <span className="user-display-name">{userName || 'Gast'}</span>
              <span className="user-subtitle">Mijn account</span>
            </span>
            <MoreHorizontal className="flyout-more-icon" />
          </button>

          {flyoutOpen && (
            <>
              <div className="flyout-backdrop" onClick={() => setFlyoutOpen(false)} />
              <div className="flyout-menu">
                <button className="flyout-item" onClick={() => { setFlyoutOpen(false); navigate('/tokens'); }}>
                  Prijzen
                </button>
                <button className="flyout-item" onClick={() => { setFlyoutOpen(false); navigate('/dashboard'); }}>
                  Mijn FAINL's
                </button>
                <button className="flyout-item" onClick={() => { setFlyoutOpen(false); navigate('/cookbook'); }}>
                  Voorbeeldvragen
                </button>
                <div className="flyout-divider" />
                <button className="flyout-item" onClick={() => { setFlyoutOpen(false); navigate('/faq'); }}>
                  FAQ
                </button>
                <button className="flyout-item" onClick={() => { setFlyoutOpen(false); navigate('/contact'); }}>
                  Contact
                </button>
                {isLoggedIn && (
                  <>
                    <div className="flyout-divider" />
                    <button className="flyout-item" onClick={() => { setFlyoutOpen(false); onLogout(); }}>
                      <LogOut />
                      Uitloggen
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
