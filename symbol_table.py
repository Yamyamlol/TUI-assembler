def build_symtab():
    """Initialize and return an empty symbol table."""
    return {}

def insert_symbol(symtab, label, address):
    """Insert a label and its address into the symbol table."""
    if label not in symtab:
        symtab[label] = address
    else:
        print(f"Warning: Duplicate label {label} found. Address already assigned.")
def lookup_symbol(symtab, label):
    return symtab.get(label)

def print_symtab(symtab):
    for label, address in symtab.items():
        print(f"{label}\t{address}")
