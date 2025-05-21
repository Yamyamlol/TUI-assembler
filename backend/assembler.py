# assembler_service.py
from file_manager import create_output_folder, write_file
from pass1 import perform_pass1
from pass2 import perform_pass2
from opcode_table import create_optab
from config import ARCH_SIC, ARCH_SICXE
from datetime import datetime
import os

def get_timestamp():
    return datetime.now().strftime("%Y%m%d_%H%M%S")

def assemble(source_lines, arch):
    if arch not in [ARCH_SIC, ARCH_SICXE]:
        raise ValueError("Invalid architecture")

    folder = f"output/{get_timestamp()}"
    os.makedirs(folder, exist_ok=True)

    optab = create_optab(arch, folder)

    intermediate, symtab = perform_pass1(source_lines, arch)
    object_code = perform_pass2(intermediate, symtab, optab, arch)

    save_symbol_table(symtab, folder)
    save_intermediate_code(intermediate, folder)
    save_object_code(object_code, folder)

    return {
        "symbol_table": symtab,
        "intermediate": intermediate,
        "object_code": object_code,
        "output_folder": folder
    }

def save_symbol_table(symtab, folder):
    path = os.path.join(folder, "symtab.txt")
    with open(path, "w") as f:
        for label, address in symtab.items():
            f.write(f"{label}\t{address}\n")

def save_object_code(object_code, folder):
    path = os.path.join(folder, "object_code.obj")
    with open(path, "w") as f:
        for line in object_code:
            f.write(line + "\n")

def save_intermediate_code(intermediate, folder):
    path = os.path.join(folder, "intermediate.txt")
    with open(path, "w") as f:
        for line in intermediate:
            f.write(line + "\n")

if __name__ == "__main__":
    import sys

    print("=== SIC/SICXE Assembler (TUI Mode) ===")
    arch = input("Select architecture (SIC/SICXE): ").strip().upper()
    if arch not in ["SIC", "SICXE"]:
        print("Invalid architecture. Use 'SIC' or 'SICXE'.")
        sys.exit(1)

    print("Enter source code lines (type 'END' on a new line to finish):")
    source_lines = []
    while True:
        line = input(">>> ")
        if line.strip().upper() == "END":
            break
        source_lines.append(line)

    try:
        result = assemble(source_lines, arch)
        print(f"\nAssembly successful. Output saved in: {result['output_folder']}")
        print("- Symbol Table -")
        for label, addr in result["symbol_table"].items():
            print(f"{label}\t{addr}")
        print("\n- Intermediate Code -")
        for line in result["intermediate"]:
            print(line)
        print("\n- Object Code -")
        for line in result["object_code"]:
            print(line)
    except Exception as e:
        print("Error during assembly:", e)
