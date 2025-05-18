import React, { useState } from "react";
import AssemblerForm from "./components/AssemblerForm";
import ResultViewer from "./components/ResultViewer";
import Navbar from "./components/Navbar";

interface AssemblerResult {
  symbol_table: Record<string, string>;
  intermediate: string[];
  object_code: string[];
  output_folder: string;
}

const App: React.FC = () => {
  const [results, setResults] = useState<AssemblerResult | null>(null);

  return (
    <div className="font-[Fira_Code] min-h-screen bg-gray-100 text-gray-800">
      <Navbar />
      <div className="flex flex-col md:flex-row gap-6 px-4 py-8 max-w-7xl mx-auto">
        <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow">
          <AssemblerForm onAssembleComplete={setResults} />
        </div>

        <div className="w-full md:w-1/2">
          {results ? (
            <ResultViewer results={results} />
          ) : (
            <div className="bg-white p-6 rounded-lg shadow text-center text-gray-400">
              Output will appear here after assembling.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
