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
