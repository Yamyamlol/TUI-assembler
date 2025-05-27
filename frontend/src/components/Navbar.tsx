import React from "react";
import { Code, Cpu, Eye } from "lucide-react";

interface NavbarProps {
  currentView?: "assembler" | "visualizer";
  onViewChange?: (view: "assembler" | "visualizer") => void;
}

const Navbar: React.FC<NavbarProps> = ({
  currentView = "assembler",
  onViewChange,
}) => {
  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Cpu className="w-8 h-8 text-blue-400" />
              <h1 className="text-xl font-bold">SIC/SICXE Assembler</h1>
            </div>
          </div>

          {onViewChange && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onViewChange("assembler")}
                className={`flex items-center px-4 py-2 rounded-lg transition ${
                  currentView === "assembler"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Code className="w-4 h-4 mr-2" />
                Assembler
              </button>
              <button
                onClick={() => onViewChange("visualizer")}
                className={`flex items-center px-4 py-2 rounded-lg transition ${
                  currentView === "visualizer"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Eye className="w-4 h-4 mr-2" />
                Visualizer
              </button>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">
              System Programming Tool
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
