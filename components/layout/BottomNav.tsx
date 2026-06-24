import { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Clock,
  Swords,
  Coins,
  HelpCircle,
} from 'lucide-react';

const items = [
  { path: '/', label: 'Chat', icon: MessageSquare },
  { path: '/mission', label: 'Antwoorden', icon: Clock },
  { path: '/debates', label: 'Beraadslagen', icon: Swords },
  { path: '/tokens', label: 'Prijzen', icon: Coins },
  { path: '/faq', label: 'FAQ', icon: HelpCircle },
];

export const BottomNav: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="mobile-nav">
      {items.map(item => (
        <button
          key={item.path}
          className={`mobile-nav-item${location.pathname === item.path ? ' active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <item.icon />
          {item.label}
        </button>
      ))}
    </nav>
  );
};
