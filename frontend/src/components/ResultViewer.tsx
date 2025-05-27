import React from "react";

interface ResultViewerProps {
  results: {
    symbol_table: Record<string, string>;
    intermediate: string[];
    object_code: string[];
    output_folder: string;
  };
}

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const copyToClipboard = (content: string) => {
  navigator.clipboard.writeText(content);
};

const ResultViewer: React.FC<ResultViewerProps> = ({ results }) => {
  const symbolTableText = Object.entries(results.symbol_table)
    .map(([label, addr]) => `${label.padEnd(10)}\t${addr}`)
    .join("\n");

  const renderBlock = (title: string, content: string, fileName: string) => (
    <section className="mb-8 rounded-lg border border-gray-300 shadow-md bg-white">
      <header className="flex justify-between items-center px-6 py-4 border-b border-gray-300">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <div className="flex space-x-3">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => copyToClipboard(content)}
            aria-label={`Copy ${title} to clipboard`}
          >
            📋 Copy
          </button>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            onClick={() => downloadTextFile(fileName, content)}
            aria-label={`Download ${title} as file`}
          >
            ⬇ Download
          </button>
        </div>
      </header>
      <pre
        className="p-6 max-h-72 overflow-auto whitespace-pre-wrap font-mono text-sm text-gray-800"
        tabIndex={0}
      >
        {content}
      </pre>
    </section>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4">
      {renderBlock("📘 Symbol Table", symbolTableText, "symbol_table.txt")}
      {renderBlock(
        "Intermediate Code",
        results.intermediate.join("\n"),
        "intermediate.txt"
      )}
      {renderBlock(
        "Object Code",
        results.object_code.join("\n"),
        "object_code.txt"
      )}
    </div>
  );
};

export default ResultViewer;
