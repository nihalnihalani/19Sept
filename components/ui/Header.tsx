import React from 'react';
import Logo from './Logo';

const Header = () => {
  return (
    <header className="py-4 px-6 flex items-center justify-between border-b border-gray-700/50">
      <div className="flex items-center gap-3">
        <Logo />
        <h1 className="text-xl font-bold text-gray-100">Alchemy Studio</h1>
      </div>
      <nav className="flex items-center gap-4">
        {/* Add nav links here if needed in the future */}
      </nav>
    </header>
  );
};

export default Header;
