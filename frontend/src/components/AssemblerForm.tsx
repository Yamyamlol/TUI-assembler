import React, { useState } from "react";
import axios from "axios";

interface AssemblerFormProps {
  onAssembleComplete: (data: {
    symbol_table: Record<string, string>;
    intermediate: string[];
    object_code: string[];
    output_folder: string;
  }) => void;
}

const AssemblerForm: React.FC<AssemblerFormProps> = ({
  onAssembleComplete,
}) => {
  const [architecture, setArchitecture] = useState<"SIC" | "SICXE">("SIC");
  const [sourceCode, setSourceCode] = useState<string>(
    `COPY    START   1000
FIRST   STL     RETADR
        LDA     THREE
        STA     LENGTH
CLOOP   JSUB    RDREC
        LDA     LENGTH
        COMP    ZERO
        JEQ     ENDFIL
        JSUB    WRREC
        J       CLOOP
ENDFIL  LDA     EOF
        STA     BUFFER
        LDA     THREE
        STA     LENGTH
        JSUB    WRREC
        J       @RETADR
EOF     BYTE    C'EOF'
THREE   WORD    3
ZERO    WORD    0
RETADR  RESW    1
LENGTH  RESW    1
BUFFER  RESB    4096
        END     FIRST`
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post("http://localhost:5000/assemble", {
        architecture,
        source_code: sourceCode,
      });
      onAssembleComplete(res.data);
    } catch (error) {
      console.error("Assembly error:", error);
      setError("Failed to assemble code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block font-medium text-gray-700 mb-1">
          Architecture
        </label>
        <select
          value={architecture}
          onChange={(e) => setArchitecture(e.target.value as "SIC" | "SICXE")}
          className="w-full border rounded-lg px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="SIC">SIC</option>
          <option value="SICXE">SICXE</option>
        </select>
      </div>

      <div>
        <label className="block font-medium text-gray-700 mb-1">
          Source Code
        </label>
        <textarea
          rows={14}
          value={sourceCode}
          onChange={(e) => setSourceCode(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 font-mono shadow-sm focus:ring-2 focus:ring-blue-500"
          placeholder="Enter SIC or SICXE code..."
          disabled={loading}
        />
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 border border-red-300 p-3 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        className={`w-full py-3 text-lg font-semibold rounded-lg transition ${
          loading
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
        disabled={loading}
      >
        {loading ? "Assembling..." : "Assemble Code"}
      </button>
    </form>
  );
};

export default AssemblerForm;
