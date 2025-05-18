# symbol_table.py
def build_symtab():
    """Initialize and return an empty symbol table."""
    return {}

def insert_symbol(symtab, label, address):
    """Insert a label and its address into the symbol table."""
    if label not in symtab:
        symtab[label] = address
        return True
    else:
        print(f"Warning: Duplicate label '{label}' found. Address already assigned.")
        return False

def lookup_symbol(symtab, label):
    """Look up a symbol in the symbol table."""
    return symtab.get(label)

def print_symtab(symtab):
    """Print the symbol table for debugging purposes."""
    print("Symbol Table:")
    print("Label\tAddress")
    print("-" * 20)
    for label, address in sorted(symtab.items()):
        print(f"{label}\t{address}")
