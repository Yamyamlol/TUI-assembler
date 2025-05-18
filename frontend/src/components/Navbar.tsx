import React from "react";

const Navbar: React.FC = () => (
  <nav className="bg-blue-700 text-white px-6 py-4 shadow-md sticky top-0 z-50">
    <div className="max-w-6xl mx-auto flex items-center justify-between">
      <div className="text-2xl font-semibold tracking-wide">
        🔧 SIC/SIC-XE Assembler
      </div>
    </div>
  </nav>
);

export default Navbar;
