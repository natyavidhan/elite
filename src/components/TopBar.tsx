import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';

export function TopBar() {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 border-b hairline bg-paper-100">
      <Link to="/" className="font-display text-lg text-ink-900">
        Elite
      </Link>
      <Link to="/settings" aria-label="Settings" className="text-ink-700 hover:text-vermilion-600 p-1 -m-1">
        <Settings size={20} strokeWidth={1.75} />
      </Link>
    </header>
  );
}
