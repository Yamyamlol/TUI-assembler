import os
from file_manager import create_output_folder, write_file
from pass1 import perform_pass1_from_lines, perform_pass1
from pass2 import perform_pass2
from opcode_table import create_optab, load_optab
from config import ARCH_SIC, ARCH_SICXE
from datetime import datetime

def get_timestamp():
    return datetime.now().strftime("%Y%m%d_%H%M%S")

def main():
    print("SIC/SIC-XE Assembler (CLI Input Mode)")
    arch = input("Choose architecture (SIC/SICXE): ").strip().upper()

    if arch not in [ARCH_SIC, ARCH_SICXE]:
        print("Invalid architecture choice! Please choose SIC or SICXE.")
        return

    # Create output folder with timestamp
    folder = f"output/{get_timestamp()}"
    os.makedirs(folder, exist_ok=True)

    # Create and save the opcode table (optab) for the given architecture
    optab = create_optab(arch, folder)

    source_lines = []
    while True:
        line = input(">>> ")
        source_lines.append(line)
        if line.upper().startswith("END"):
            break

    # Pass 1: Perform initial symbol table creation and intermediate code generation
    intermediate, symtab = perform_pass1(source_lines, arch)
    print("Symbol Table:", symtab)

    # Save symbol table to file
    save_symbol_table(symtab, folder)

    # Generate object code using Pass 2
    object_code = perform_pass2(intermediate, symtab, optab, arch)

    # Output generated code
    print("\nGenerated Object Code:")
    for line in object_code:
        print(line)

    # Save object code to a file
    save_object_code(object_code, folder)

    print("✅ Assembly complete. All files saved.")

def save_symbol_table(symtab, folder):
    """Save the symbol table to a file in the given folder"""
    with open(f"{folder}/symtab.txt", "w") as f:
        for label, address in symtab.items():
            f.write(f"{label} {address}\n")
    print(f"Symbol Table saved to {folder}/symtab.txt")

def save_object_code(object_code, folder):
    """Save the object code to a file in the given folder"""
    with open(f"{folder}/object_code.obj", "w") as f:
        for line in object_code:
            f.write(line + "\n")
    print(f"Object Code saved to {folder}/object_code.obj")

if __name__ == "__main__":
    main()
