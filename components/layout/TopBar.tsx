import { FC } from 'react';
import { Settings2 } from 'lucide-react';

interface TopBarProps {
  onMenuOpen?: () => void;
}

export const TopBar: FC<TopBarProps> = ({ onMenuOpen }) => {
  return (
    <div className="mobile-topbar">
      <span className="mobile-topbar-brand">FAINL</span>
      {onMenuOpen && (
        <button onClick={onMenuOpen} className="mobile-topbar-btn" aria-label="Menu">
          <Settings2 style={{ width: 16, height: 16 }} />
        </button>
      )}
    </div>
  );
};
