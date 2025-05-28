import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Code,
  Table,
} from "lucide-react";

interface AssemblerVisualizerProps {
  sourceCode: string;
  architecture: "SIC" | "SICXE";
  finalResults: {
    symbol_table: Record<string, string>;
    intermediate: string[];
    object_code: string[];
    output_folder: string;
  };
}

interface Pass1State {
  step: number;
  currentLine: number;
  locationCounter: string;
  symbolTable: Record<string, string>;
  currentInstruction: string;
  action: string;
  intermediate: string[];
  error?: string;
}

interface Pass2State {
  step: number;
  currentLine: number;
  currentInstruction: string;
  objectCode: string;
  action: string;
  objectProgram: string[];
  textRecord: string;
  error?: string;
}

const AssemblerVisualizer: React.FC<AssemblerVisualizerProps> = ({
  sourceCode,
  architecture,
  finalResults,
}) => {
  const [currentPass, setCurrentPass] = useState<1 | 2>(1);
  const [pass1States, setPass1States] = useState<Pass1State[]>([]);
  const [pass2States, setPass2States] = useState<Pass2State[]>([]);
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);

  // SIC/SICXE instruction formats and opcodes
  const sicOpcodes: Record<string, string> = {
    ADD: "18",
    AND: "40",
    COMP: "28",
    DIV: "24",
    J: "3C",
    JEQ: "30",
    JGT: "34",
    JLT: "38",
    JSUB: "48",
    LDA: "00",
    LDCH: "50",
    LDL: "08",
    LDX: "04",
    MUL: "20",
    OR: "44",
    RD: "D8",
    RSUB: "4C",
    STA: "0C",
    STCH: "54",
    STL: "14",
    STSW: "E8",
    STX: "10",
    SUB: "1C",
    TD: "E0",
    TIX: "2C",
    WD: "DC",
  };

  const sicxeOpcodes: Record<string, string> = {
    ...sicOpcodes,
    ADDF: "58",
    ADDR: "90",
    CLEAR: "B4",
    COMPF: "88",
    COMPR: "A0",
    DIVF: "64",
    DIVR: "9C",
    FIX: "C4",
    FLOAT: "C0",
    HIO: "F4",
    LDB: "68",
    LDBT: "9C",
    LDF: "70",
    LDS: "6C",
    LDT: "74",
    MULF: "60",
    MULR: "98",
    NORM: "C8",
    RMO: "AC",
    SHIFTL: "A4",
    SHIFTR: "A8",
    SIO: "F0",
    SSK: "EC",
    STB: "78",
    STF: "80",
    STI: "D4",
    STS: "7C",
    STT: "84",
    SUBF: "5C",
    SUBR: "94",
    SVC: "B0",
    TIXR: "B8",
  };

  const opcodes = architecture === "SICXE" ? sicxeOpcodes : sicOpcodes;

  // Parse source code into lines
  const sourceLines = (sourceCode || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  // Generate Pass 1 states
  useEffect(() => {
    if (sourceCode) {
      generatePass1States();
    }
  }, [sourceCode, architecture]);

  // Generate Pass 2 states
  useEffect(() => {
    if (pass1States.length > 0) {
      generatePass2States();
    }
  }, [pass1States]);

  const generatePass1States = () => {
    if (!sourceCode) return;

    const states: Pass1State[] = [];
    let locctr = 0;
    let symbolTable: Record<string, string> = {};
    let intermediate: string[] = [];
    let step = 0;

    // Initial state
    states.push({
      step: step++,
      currentLine: -1,
      locationCounter: "0000",
      symbolTable: {},
      currentInstruction: "Initialize Pass 1",
      action: "Start Pass 1 - Initialize location counter to 0",
      intermediate: [],
    });

    sourceLines.forEach((line, lineIndex) => {
      const originalLine = line;

      // Check if line is a standalone comment
      const trimmedLine = line.trim();
      if (
        trimmedLine.startsWith(";") ||
        trimmedLine.startsWith(".") ||
        trimmedLine === ""
      ) {
        // Standalone comment - preserve as-is without location counter
        intermediate.push(`\t${originalLine}`);
        states.push({
          step: step++,
          currentLine: lineIndex,
          locationCounter: locctr.toString(16).toUpperCase().padStart(4, "0"),
          symbolTable: { ...symbolTable },
          currentInstruction: originalLine,
          action: "Comment line - no location counter assigned",
          intermediate: [...intermediate],
        });
        return;
      }

      // Remove inline comments for parsing (but preserve original line for output)
      let lineForParsing = line;
      const commentIndex = line.indexOf(";");
      if (commentIndex !== -1) {
        lineForParsing = line.substring(0, commentIndex).trim();
      }

      // Skip empty lines after comment removal
      if (!lineForParsing.trim()) {
        intermediate.push(`\t${originalLine}`);
        states.push({
          step: step++,
          currentLine: lineIndex,
          locationCounter: locctr.toString(16).toUpperCase().padStart(4, "0"),
          symbolTable: { ...symbolTable },
          currentInstruction: originalLine,
          action: "Empty line or comment only - no location counter assigned",
          intermediate: [...intermediate],
        });
        return;
      }

      const parts = lineForParsing.split(/\s+/);
      let label = "";
      let opcode = "";
      let operand = "";

      // Parse line based on format
      if (
        parts.length >= 3 &&
        !opcodes[parts[0]] &&
        !parts[0].startsWith("+") &&
        parts[0] !== "START" &&
        parts[0] !== "END" &&
        parts[0] !== "BYTE" &&
        parts[0] !== "WORD" &&
        parts[0] !== "RESB" &&
        parts[0] !== "RESW"
      ) {
        label = parts[0];
        opcode = parts[1];
        operand = parts.slice(2).join(" ");
      } else if (parts.length >= 2) {
        opcode = parts[0];
        operand = parts.slice(1).join(" ");
      } else {
        opcode = parts[0] || "";
      }

      // Handle extended format for SICXE (opcode starting with +)
      let isExtendedFormat = false;
      if (opcode.startsWith("+")) {
        isExtendedFormat = true;
        opcode = opcode.substring(1); // Remove + prefix for opcode lookup
      }

      const currentAddr = locctr.toString(16).toUpperCase().padStart(4, "0");

      // Handle START directive
      if (opcode === "START") {
        locctr = parseInt(operand, 16) || 0;
        intermediate.push(`${currentAddr}\t${originalLine}`);
        states.push({
          step: step++,
          currentLine: lineIndex,
          locationCounter: locctr.toString(16).toUpperCase().padStart(4, "0"),
          symbolTable: { ...symbolTable },
          currentInstruction: originalLine,
          action: `START directive - Set location counter to ${operand}`,
          intermediate: [...intermediate],
        });
        return;
      }

      // Handle label
      if (label) {
        if (symbolTable[label]) {
          states.push({
            step: step++,
            currentLine: lineIndex,
            locationCounter: currentAddr,
            symbolTable: { ...symbolTable },
            currentInstruction: originalLine,
            action: `ERROR: Duplicate symbol '${label}'`,
            intermediate: [...intermediate],
            error: `Duplicate symbol: ${label}`,
          });
          return;
        }
        symbolTable[label] = currentAddr;
        states.push({
          step: step++,
          currentLine: lineIndex,
          locationCounter: currentAddr,
          symbolTable: { ...symbolTable },
          currentInstruction: originalLine,
          action: `Add symbol '${label}' to symbol table with address ${currentAddr}`,
          intermediate: [...intermediate],
        });
      }

      // Handle END directive
      if (opcode === "END") {
        intermediate.push(`${currentAddr}\t${originalLine}`);
        states.push({
          step: step++,
          currentLine: lineIndex,
          locationCounter: currentAddr,
          symbolTable: { ...symbolTable },
          currentInstruction: originalLine,
          action: "END directive - Pass 1 complete",
          intermediate: [...intermediate],
        });
        return;
      }

      // Calculate instruction length
      let instructionLength = 0;
      if (opcodes[opcode]) {
        if (architecture === "SICXE" && isExtendedFormat) {
          instructionLength = 4; // Extended format is 4 bytes
        } else {
          instructionLength = 3; // Standard format is 3 bytes
        }
      } else if (opcode === "WORD") {
        instructionLength = 3;
      } else if (opcode === "BYTE") {
        if (operand.startsWith("C'") && operand.endsWith("'")) {
          instructionLength = operand.length - 3; // Remove C' and '
        } else if (operand.startsWith("X'") && operand.endsWith("'")) {
          instructionLength = Math.ceil((operand.length - 3) / 2); // Remove X' and ', hex pairs
        }
      } else if (opcode === "RESW") {
        instructionLength = parseInt(operand) * 3;
      } else if (opcode === "RESB") {
        instructionLength = parseInt(operand);
      }

      // Add to intermediate with original line (including comments)
      intermediate.push(`${currentAddr}\t${originalLine}`);

      const formatInfo = isExtendedFormat ? " (Extended Format)" : "";
      states.push({
        step: step++,
        currentLine: lineIndex,
        locationCounter: currentAddr,
        symbolTable: { ...symbolTable },
        currentInstruction: originalLine,
        action: `Process instruction '${
          isExtendedFormat ? "+" : ""
        }${opcode}' - Length: ${instructionLength} bytes${formatInfo}`,
        intermediate: [...intermediate],
      });

      locctr += instructionLength;
    });

    setPass1States(states);
  };

  const generatePass2States = () => {
    if (pass1States.length === 0) return;

    const states: Pass2State[] = [];
    const finalSymbolTable = pass1States[pass1States.length - 1].symbolTable;
    let step = 0;
    let objectProgram: string[] = [];
    let textRecord = "";
    let textStartAddr = "";

    // Initial state
    states.push({
      step: step++,
      currentLine: -1,
      currentInstruction: "Initialize Pass 2",
      objectCode: "",
      action: "Start Pass 2 - Generate object code using symbol table",
      objectProgram: [],
      textRecord: "",
    });

    sourceLines.forEach((line, lineIndex) => {
      const parts = line.split(/\s+/);
      let label = "";
      let opcode = "";
      let operand = "";

      // Parse line
      if (
        parts.length >= 3 &&
        !opcodes[parts[0]] &&
        parts[0] !== "START" &&
        parts[0] !== "END" &&
        parts[0] !== "BYTE" &&
        parts[0] !== "WORD" &&
        parts[0] !== "RESB" &&
        parts[0] !== "RESW"
      ) {
        label = parts[0];
        opcode = parts[1];
        operand = parts.slice(2).join(" ");
      } else if (parts.length >= 2) {
        opcode = parts[0];
        operand = parts.slice(1).join(" ");
      } else {
        opcode = parts[0] || "";
      }

      let objectCode = "";
      let action = "";

      if (opcode === "START") {
        const progName = label || "PROG";
        const startAddr = (parseInt(operand, 16) || 0)
          .toString(16)
          .toUpperCase()
          .padStart(6, "0");
        const headerRecord = `H${progName.padEnd(6)}${startAddr}${
          finalResults.object_code
            .find((line) => line.startsWith("H"))
            ?.slice(7, 13) || "001000"
        }`;
        objectProgram.push(headerRecord);
        textStartAddr = startAddr;

        states.push({
          step: step++,
          currentLine: lineIndex,
          currentInstruction: line,
          objectCode: headerRecord,
          action: `Generate Header record: Program name=${progName}, Start address=${startAddr}`,
          objectProgram: [...objectProgram],
          textRecord: "",
        });
        return;
      }

      if (opcode === "END") {
        // Finish text record if exists
        if (textRecord) {
          const finalTextRecord = `T${textStartAddr}${(textRecord.length / 2)
            .toString(16)
            .toUpperCase()
            .padStart(2, "0")}${textRecord}`;
          objectProgram.push(finalTextRecord);
        }

        const endRecord = `E${finalSymbolTable[operand] || textStartAddr}`;
        objectProgram.push(endRecord);

        states.push({
          step: step++,
          currentLine: lineIndex,
          currentInstruction: line,
          objectCode: endRecord,
          action: `Generate End record: First executable instruction at ${
            finalSymbolTable[operand] || textStartAddr
          }`,
          objectProgram: [...objectProgram],
          textRecord: textRecord,
        });
        return;
      }

      // Generate object code for instructions
      if (opcodes[opcode]) {
        const opcodeHex = opcodes[opcode];
        let addressPart = "0000";

        if (operand) {
          const cleanOperand = operand.replace(/[@#,X]/g, "");
          if (finalSymbolTable[cleanOperand]) {
            addressPart = finalSymbolTable[cleanOperand];
          }

          // Handle addressing modes
          if (operand.startsWith("#")) {
            // Immediate addressing
            if (architecture === "SICXE") {
              const opcodeInt = parseInt(opcodeHex, 16) | 0x01;
              objectCode =
                opcodeInt.toString(16).toUpperCase().padStart(2, "0") +
                addressPart;
            } else {
              objectCode = opcodeHex + addressPart;
            }
            action = `Immediate addressing: Opcode=${opcodeHex}, Value=${addressPart}`;
          } else if (operand.startsWith("@")) {
            // Indirect addressing
            if (architecture === "SICXE") {
              const opcodeInt = parseInt(opcodeHex, 16) | 0x02;
              objectCode =
                opcodeInt.toString(16).toUpperCase().padStart(2, "0") +
                addressPart;
            } else {
              objectCode = opcodeHex + addressPart;
            }
            action = `Indirect addressing: Opcode=${opcodeHex}, Address=${addressPart}`;
          } else if (operand.includes(",X")) {
            // Indexed addressing
            const baseAddr = parseInt(addressPart, 16);
            const indexedAddr = (baseAddr | 0x8000)
              .toString(16)
              .toUpperCase()
              .padStart(4, "0");
            objectCode = opcodeHex + indexedAddr;
            action = `Indexed addressing: Opcode=${opcodeHex}, Address=${addressPart}+X`;
          } else {
            // Direct addressing
            objectCode = opcodeHex + addressPart;
            action = `Direct addressing: Opcode=${opcodeHex}, Address=${addressPart}`;
          }
        } else {
          objectCode = opcodeHex + "0000";
          action = `No operand: Opcode=${opcodeHex}`;
        }
      } else if (opcode === "WORD") {
        const value = parseInt(operand) || 0;
        objectCode = value.toString(16).toUpperCase().padStart(6, "0");
        action = `WORD directive: Generate ${objectCode} for value ${operand}`;
      } else if (opcode === "BYTE") {
        if (operand.startsWith("C'")) {
          const chars = operand.slice(2, -1);
          objectCode = chars
            .split("")
            .map((c) =>
              c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")
            )
            .join("");
          action = `BYTE directive (character): Generate ASCII codes for "${chars}"`;
        } else if (operand.startsWith("X'")) {
          objectCode = operand.slice(2, -1);
          action = `BYTE directive (hex): Generate ${objectCode}`;
        }
      } else if (opcode === "RESW" || opcode === "RESB") {
        objectCode = "";
        action = `${opcode} directive: Reserve space, no object code generated`;
      }

      if (objectCode) {
        textRecord += objectCode;
      }

      states.push({
        step: step++,
        currentLine: lineIndex,
        currentInstruction: line,
        objectCode: objectCode,
        action: action,
        objectProgram: [...objectProgram],
        textRecord: textRecord,
      });
    });

    setPass2States(states);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStateIndex((prev) => {
          const maxIndex =
            (currentPass === 1 ? pass1States.length : pass2States.length) - 1;
          if (prev >= maxIndex) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed, currentPass, pass1States.length, pass2States.length]);

  const currentStates = currentPass === 1 ? pass1States : pass2States;
  const currentState = currentStates[currentStateIndex];
  const maxIndex = currentStates.length - 1;

  const handleNext = () => {
    if (currentStateIndex < maxIndex) {
      setCurrentStateIndex(currentStateIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStateIndex > 0) {
      setCurrentStateIndex(currentStateIndex - 1);
    }
  };

  const handleReset = () => {
    setCurrentStateIndex(0);
    setIsPlaying(false);
  };

  const switchPass = (pass: 1 | 2) => {
    setCurrentPass(pass);
    setCurrentStateIndex(0);
    setIsPlaying(false);
  };

  if (!currentState) {
    return <div className="p-6 text-center">Loading visualizer...</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {architecture} Assembler Visualizer
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => switchPass(1)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPass === 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <Eye className="w-4 h-4 inline mr-1" />
              Pass 1
            </button>
            <button
              onClick={() => switchPass(2)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPass === 2
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <Code className="w-4 h-4 inline mr-1" />
              Pass 2
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentStateIndex === 0}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded disabled:bg-gray-300 hover:bg-gray-700 transition"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={currentStateIndex >= maxIndex}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded disabled:bg-gray-300 hover:bg-green-700 transition"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 mr-1" />
              ) : (
                <Play className="w-4 h-4 mr-1" />
              )}
              {isPlaying ? "Pause" : "Play"}
            </button>

            <button
              onClick={handleNext}
              disabled={currentStateIndex >= maxIndex}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded disabled:bg-gray-300 hover:bg-gray-700 transition"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={handleReset}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Step {currentState.step} of {maxIndex}
            </span>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Speed:</label>
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value={500}>Fast</option>
                <option value={1000}>Normal</option>
                <option value={2000}>Slow</option>
              </select>
            </div>
          </div>
        </div>

        {/* Current State Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {currentPass === 1 && (
            <>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-2">
                  Location Counter
                </h3>
                <div className="text-2xl font-mono text-blue-600">
                  {(currentState as Pass1State).locationCounter}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-bold text-green-800 mb-2">Current Line</h3>
                <div className="text-sm font-mono text-green-600">
                  {(currentState as Pass1State).currentLine >= 0
                    ? `Line ${(currentState as Pass1State).currentLine + 1}: ${
                        (currentState as Pass1State).currentInstruction
                      }`
                    : (currentState as Pass1State).currentInstruction}
                </div>
              </div>
            </>
          )}

          {currentPass === 2 && (
            <>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-bold text-purple-800 mb-2">Object Code</h3>
                <div className="text-lg font-mono text-purple-600">
                  {(currentState as Pass2State).objectCode || "N/A"}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-bold text-green-800 mb-2">Current Line</h3>
                <div className="text-sm font-mono text-green-600">
                  {(currentState as Pass2State).currentLine >= 0
                    ? `Line ${(currentState as Pass2State).currentLine + 1}: ${
                        (currentState as Pass2State).currentInstruction
                      }`
                    : (currentState as Pass2State).currentInstruction}
                </div>
              </div>
            </>
          )}

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-bold text-yellow-800 mb-2">Action</h3>
            <div className="text-sm text-yellow-700">{currentState.action}</div>
          </div>
        </div>

        {/* Error Display */}
        {currentState.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {currentState.error}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {currentPass === 1 && (
            <>
              {/* Symbol Table */}
              <div className="bg-white border rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-bold text-gray-800 flex items-center">
                    <Table className="w-4 h-4 mr-2" />
                    Symbol Table
                  </h3>
                </div>
                <div className="p-4">
                  <div className="max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Symbol</th>
                          <th className="text-left py-2">Address</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono">
                        {Object.entries(
                          (currentState as Pass1State).symbolTable
                        ).map(([symbol, addr]) => (
                          <tr key={symbol} className="border-b">
                            <td className="py-1">{symbol}</td>
                            <td className="py-1">{addr}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {Object.keys((currentState as Pass1State).symbolTable)
                      .length === 0 && (
                      <div className="text-gray-500 text-center py-4">
                        No symbols yet
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Intermediate Code */}
              <div className="bg-white border rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-bold text-gray-800">Intermediate Code</h3>
                </div>
                <div className="p-4">
                  <pre className="text-sm font-mono max-h-64 overflow-auto whitespace-pre-wrap">
                    {(currentState as Pass1State).intermediate.join("\n") ||
                      "No intermediate code yet"}
                  </pre>
                </div>
              </div>
            </>
          )}

          {currentPass === 2 && (
            <>
              {/* Object Program */}
              <div className="bg-white border rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-bold text-gray-800">Object Program</h3>
                </div>
                <div className="p-4">
                  <pre className="text-sm font-mono max-h-64 overflow-auto whitespace-pre-wrap">
                    {(currentState as Pass2State).objectProgram.join("\n") ||
                      "No object program yet"}
                  </pre>
                </div>
              </div>

              {/* Text Record Progress */}
              <div className="bg-white border rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-bold text-gray-800">
                    Text Record Building
                  </h3>
                </div>
                <div className="p-4">
                  <div className="text-sm font-mono break-all">
                    {(currentState as Pass2State).textRecord ||
                      "No text record data yet"}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Source Code Display */}
        <div className="mt-6 bg-white border rounded-lg">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-bold text-gray-800">Source Code</h3>
          </div>
          <div className="p-4">
            <pre className="text-sm font-mono max-h-48 overflow-auto">
              {sourceLines.map((line, index) => (
                <div
                  key={index}
                  className={`${
                    currentState.currentLine === index
                      ? "bg-yellow-200 font-bold"
                      : ""
                  } py-1 px-2 rounded`}
                >
                  <span className="text-gray-400 mr-4">
                    {(index + 1).toString().padStart(3, "0")}:
                  </span>
                  {line}
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssemblerVisualizer;

export const SampleVisualizerApp: React.FC = () => {
  const sampleSourceCode = `COPY    START   1000
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
        END     FIRST`;

  const sampleResults = {
    symbol_table: {
      FIRST: "1000",
      CLOOP: "1006",
      ENDFIL: "1015",
      EOF: "1024",
      THREE: "1027",
      ZERO: "102A",
      RETADR: "102D",
      LENGTH: "1030",
      BUFFER: "1033",
    },
    intermediate: [
      "1000\tCOPY    START   1000",
      "1000\tFIRST   STL     RETADR",
      "1003\t        LDA     THREE",
      "1006\t        STA     LENGTH",
    ],
    object_code: [
      "HCOPY  001000001033",
      "T0010001E14102D00102715103048000000301015480000003C1006",
      "T00101E0F0C1033481027141030E0102D2C105400001033",
      "E001000",
    ],
    output_folder: "output",
  };

  return (
    <AssemblerVisualizer
      sourceCode={sampleSourceCode}
      architecture="SIC"
      finalResults={sampleResults}
    />
  );
};
