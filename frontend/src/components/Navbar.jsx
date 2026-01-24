import React from 'react';
import { Cloud, LogOut, Plus } from 'lucide-react';

const Navbar = ({ onAddApp, onLogout, showAddButton = true }) => {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Cloud className="text-indigo-600" size={32} />
          <span className="text-2xl font-bold text-gray-800">CloudMonitor</span>
        </div>
        <div className="flex items-center space-x-4">
          {showAddButton && (
            <button
              onClick={onAddApp}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus size={20} />
              <span>Add Application</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;