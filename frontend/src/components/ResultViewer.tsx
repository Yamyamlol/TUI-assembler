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
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex gap-2">
          <button
            className="text-sm bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            onClick={() => copyToClipboard(content)}
          >
            📋 Copy
          </button>
          <button
            className="text-sm bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
            onClick={() => downloadTextFile(fileName, content)}
          >
            ⬇️ Download
          </button>
        </div>
      </div>
      <pre className="bg-white border p-4 rounded shadow text-sm max-h-60 overflow-auto whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderBlock("📘 Symbol Table", symbolTableText, "symbol_table.txt")}
      {renderBlock(
        "📄 Intermediate Code",
        results.intermediate.join("\n"),
        "intermediate.txt"
      )}
      {renderBlock(
        "🧾 Object Code",
        results.object_code.join("\n"),
        "object_code.txt"
      )}
    </div>
  );
};

export default ResultViewer;
