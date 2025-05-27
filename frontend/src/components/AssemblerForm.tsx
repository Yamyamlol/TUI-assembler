import React, { useState } from "react";
import axios from "axios";

interface AssemblerFormProps {
  onAssembleComplete: (data: {
    symbol_table: Record<string, string>;
    intermediate: string[];
    object_code: string[];
    output_folder: string;
  }) => void;
  onSourceCodeChange?: (code: string) => void;
  onArchitectureChange?: (arch: "SIC" | "SICXE") => void;
}

const AssemblerForm: React.FC<AssemblerFormProps> = ({
  onAssembleComplete,
  onSourceCodeChange,
  onArchitectureChange,
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

  const handleArchitectureChange = (newArch: "SIC" | "SICXE") => {
    setArchitecture(newArch);
    onArchitectureChange?.(newArch);
  };

  const handleSourceCodeChange = (newCode: string) => {
    setSourceCode(newCode);
    onSourceCodeChange?.(newCode);
  };

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

      // Also notify parent of current source code and architecture
      onSourceCodeChange?.(sourceCode);
      onArchitectureChange?.(architecture);
    } catch (error) {
      console.error("Assembly error:", error);
      setError("Failed to assemble code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Sample programs for quick testing
  const samplePrograms = {
    SIC: {
      copy: `COPY    START   1000
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
        END     FIRST`,
      simple: `PROG    START   2000
        LDA     NUM1
        ADD     NUM2
        STA     RESULT
        J       END
NUM1    WORD    10
NUM2    WORD    20
RESULT  RESW    1
        END     PROG`,
    },
    SICXE: {
      copy: `COPY    START   1000
FIRST   STL     RETADR
        LDA     #3
        STA     LENGTH
CLOOP   JSUB    RDREC
        LDA     LENGTH
        COMP    #0
        JEQ     ENDFIL
        JSUB    WRREC
        J       CLOOP
ENDFIL  LDA     =C'EOF'
        STA     BUFFER
        LDA     #3
        STA     LENGTH
        JSUB    WRREC
        J       @RETADR
THREE   WORD    3
ZERO    WORD    0
RETADR  RESW    1
LENGTH  RESW    1
BUFFER  RESB    4096
        END     FIRST`,
      indexed: `PROG    START   3000
        LDX     #0
LOOP    LDA     TABLE,X
        STA     RESULT,X
        TIX     #5
        JLT     LOOP
        RSUB
TABLE   WORD    1,2,3,4,5
RESULT  RESW    5
        END     PROG`,
    },
  };

  const loadSample = (program: string) => {
    handleSourceCodeChange(program);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block font-medium text-gray-700 mb-1">
          Architecture
        </label>
        <select
          value={architecture}
          onChange={(e) =>
            handleArchitectureChange(e.target.value as "SIC" | "SICXE")
          }
          className="w-full border rounded-lg px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="SIC">SIC</option>
          <option value="SICXE">SICXE</option>
        </select>
      </div>

      {/* Sample Programs */}
      <div>
        <label className="block font-medium text-gray-700 mb-2">
          Quick Start - Sample Programs
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(samplePrograms[architecture]).map(([name, code]) => (
            <button
              key={name}
              type="button"
              onClick={() => loadSample(code)}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
              disabled={loading}
            >
              {name.charAt(0).toUpperCase() + name.slice(1)} Program
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-medium text-gray-700 mb-1">
          Source Code
        </label>
        <textarea
          rows={14}
          value={sourceCode}
          onChange={(e) => handleSourceCodeChange(e.target.value)}
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
