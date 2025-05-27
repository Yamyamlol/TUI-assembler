import React, { useState } from "react";
import AssemblerForm from "./components/AssemblerForm";
import ResultViewer from "./components/ResultViewer";
import AssemblerVisualizer from "./components/visualizer/AssemblerVisualizer";
import Navbar from "./components/Navbar";

interface AssemblerResult {
  symbol_table: Record<string, string>;
  intermediate: string[];
  object_code: string[];
  output_folder: string;
}

const App: React.FC = () => {
  const [results, setResults] = useState<AssemblerResult | null>(null);
  const [currentView, setCurrentView] = useState<"assembler" | "visualizer">(
    "assembler"
  );
  const [sourceCode, setSourceCode] = useState<string>("");
  const [architecture, setArchitecture] = useState<"SIC" | "SICXE">("SIC");

  // Handle assembly completion - capture source code and architecture
  const handleAssembleComplete = (
    data: AssemblerResult,
    code: string,
    arch: "SIC" | "SICXE"
  ) => {
    setResults(data);
    setSourceCode(code);
    setArchitecture(arch);
  };

  return (
    <div className="font-[Fira_Code] min-h-screen bg-gray-100 text-gray-800">
      <Navbar currentView={currentView} onViewChange={setCurrentView} />

      {currentView === "assembler" ? (
        <div className="flex flex-col md:flex-row gap-6 px-4 py-8 max-w-7xl mx-auto">
          <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow">
            <AssemblerForm
              onAssembleComplete={(data) =>
                handleAssembleComplete(data, sourceCode, architecture)
              }
              onSourceCodeChange={setSourceCode}
              onArchitectureChange={setArchitecture}
            />
          </div>

          <div className="w-full md:w-1/2">
            {results ? (
              <div className="space-y-4">
                <ResultViewer results={results} />
                {sourceCode && (
                  <div className="bg-white p-4 rounded-lg shadow text-center">
                    <button
                      onClick={() => setCurrentView("visualizer")}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                    >
                      Visualize Assembly Process
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow text-center text-gray-400">
                Output will appear here after assembling.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="px-4 py-8">
          {results && sourceCode ? (
            <AssemblerVisualizer
              sourceCode={sourceCode}
              architecture={architecture}
              finalResults={results}
            />
          ) : (
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                No Assembly Data Available
              </h2>
              <p className="text-gray-600 mb-6">
                Please assemble a program first to use the visualizer.
              </p>
              <button
                onClick={() => setCurrentView("assembler")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Go to Assembler
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
