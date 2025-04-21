import os

# Define the opcode values for SIC and SIC/XE instructions
SIC_OPCODES = {
    "ADD": "18",
    "AND": "40",
    "COMP": "28",
    "DIV": "24",
    "J": "3C",
    "JEQ": "30",
    "JGT": "34",
    "JLT": "38",
    "JSUB": "48",
    "LDA": "00",
    "LDCH": "50",
    "LDL": "08",
    "LDX": "04",
    "MUL": "20",
    "OR": "44",
    "RD": "D8",
    "RSUB": "4C",
    "STA": "0C",
    "STCH": "54",
    "STL": "14",
    "STSW": "E8",
    "STX": "10",
    "SUB": "1C",
    "TD": "E0",
    "TIX": "2C",
    "WD": "DC"
}

SICXE_OPCODES = {
    **SIC_OPCODES,  # Copy all SIC opcodes into SIC/XE
    "LDB": "78",
    "LDS": "6C",
    "LDT": "74",
    "MULF": "60",
    "MULI": "68",
    "RSUB": "4C",
    "TIXR": "2C",
    "CLEAR": "B4",
    "SUBF": "64",
}

def load_optab(arch):
    """Load the optab based on the architecture (SIC/SICXE)"""
    if arch == "SIC":
        return SIC_OPCODES
    elif arch == "SICXE":
        return SICXE_OPCODES
    else:
        raise ValueError(f"Unknown architecture {arch}")

def save_optab(optab, folder):
    """Save the generated optab to a file"""
    optab_file = os.path.join(folder, "optab.txt")
    with open(optab_file, "w") as f:
        for instruction, opcode in optab.items():
            f.write(f"{instruction}\t{opcode}\n")
    print(f"Optab saved to {optab_file}")

def create_optab(arch, folder):
    """Create and save the optab for the given architecture"""
    optab = load_optab(arch)
    save_optab(optab, folder)
    return optab
