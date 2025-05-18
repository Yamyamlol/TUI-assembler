# assembler_service.py
from datetime import datetime
import os

def get_timestamp():
    """Generate a timestamp string for folder naming."""
    return datetime.now().strftime("%Y%m%d_%H%M%S")

def assemble(source_lines, arch):
    """
    Main assembler function - processes source code and returns results.
    
    Args:
        source_lines: List of source code lines
        arch: Architecture (SIC or SICXE)
        
    Returns:
        Dictionary containing results of assembly
    """
    from opcode_table import create_optab
    from pass1 import perform_pass1
    from pass2 import perform_pass2
    
    if arch not in ["SIC", "SICXE"]:
        raise ValueError(f"Invalid architecture: {arch}. Must be SIC or SICXE")

    # Create output folder
    folder = os.path.join("output", get_timestamp())
    os.makedirs(folder, exist_ok=True)

    # Create opcode table
    optab = create_optab(arch, folder)

    # Perform assembly passes
    print(f"Performing Pass 1 for {arch} architecture...")
    intermediate, symtab = perform_pass1(source_lines, arch)
    
    print(f"Performing Pass 2 for {arch} architecture...")
    object_code = perform_pass2(intermediate, symtab, optab, arch)

    # Save results to files
    save_symbol_table(symtab, folder)
    save_intermediate_code(intermediate, folder)
    save_object_code(object_code, folder)

    print(f"Assembly completed. Output saved to {folder}")
    
    return {
        "symbol_table": symtab,
        "intermediate": intermediate,
        "object_code": object_code,
        "output_folder": folder
    }

def save_symbol_table(symtab, folder):
    """Save the symbol table to a file."""
    path = os.path.join(folder, "symtab.txt")
    with open(path, "w") as f:
        for label, address in sorted(symtab.items()):
            f.write(f"{label}\t{address:04X}\n")
    print(f"Symbol table saved to {path}")

def save_intermediate_code(intermediate, folder):
    """Save the intermediate code to a file."""
    path = os.path.join(folder, "intermediate.txt")
    with open(path, "w") as f:
        for line in intermediate:
            f.write(f"{line}\n")
    print(f"Intermediate code saved to {path}")

def save_object_code(object_code, folder):
    """Save the object code to a file."""
    path = os.path.join(folder, "object_code.obj")
    with open(path, "w") as f:
        for line in object_code:
            f.write(f"{line}\n")
    print(f"Object code saved to {path}")
