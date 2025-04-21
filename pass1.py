from opcode_table import load_optab  # Importing the function to load the opcode table
from symbol_table import build_symtab, insert_symbol

# Import necessary opcode definitions (from opcode_table.py)
from opcode_table import SIC_OPCODES, SICXE_OPCODES

OPCODES = {**SIC_OPCODES, **SICXE_OPCODES}

def perform_pass1(source_lines, arch):
    loc_counter = 0  # Location counter starts at 0 or the value given by START
    symtab = {}      # Symbol table

    intermediate = []  # This will store intermediate code

    for line in source_lines:
        parts = line.split()

        # Skip empty lines or comments
        if not parts or parts[0].startswith(";"):
            continue

        # Check for the START directive
        if parts[0].upper() == "START":
            loc_counter = int(parts[1], 16)  # Set location counter from the operand (START address)
            continue

        # If it's a label, add it to the symbol table with the current location
        label = parts[0] if len(parts) > 1 and parts[0] not in OPCODES else None
        instruction = parts[1] if label is None and len(parts) > 1 else None
        operand = parts[2] if len(parts) > 2 else None

        if label:
            if label not in symtab:
                symtab[label] = loc_counter

        # Skip lines with no valid instructions
        if instruction and instruction.upper() == "END":
            break

        # Handle instructions and operands
        if instruction and instruction.upper() in OPCODES:
            # Move location counter for each instruction (opcode length of 3 bytes)
            loc_counter += 3  # Instructions typically take 3 bytes in SIC architecture
        elif instruction and instruction.upper() in ["WORD", "RESW", "RESB"]:
            # Handle special cases like WORD, RESW, RESB
            if instruction.upper() == "WORD":
                loc_counter += 3  # Word takes 3 bytes
            elif instruction.upper() == "RESW":
                loc_counter += 3 * int(operand)  # Reserved words
            elif instruction.upper() == "RESB":
                loc_counter += int(operand)  # Reserved bytes

        # Add the instruction to intermediate code
        intermediate.append(f"{loc_counter:04X} {line.strip()}")

    return intermediate, symtab

def perform_pass1_from_lines(lines, optab, arch):
    symtab = build_symtab()
    intermediate = []
    locctr = 0

    for line in lines:
        line = line.strip()
        if not line or line.startswith("."):
            intermediate.append(f"{locctr:04X}    {line}")
            continue

        parts = line.split()
        label, opcode, operand = "", "", ""

        if len(parts) == 3:
            label, opcode, operand = parts
        elif len(parts) == 2:
            opcode, operand = parts
        else:
            opcode = parts[0]

        if label:
            insert_symbol(symtab, label, f"{locctr:04X}")

        intermediate.append(f"{locctr:04X}    {line}")

        if opcode.startswith("+"):
            locctr += 4
        elif opcode.upper() in optab:
            locctr += 3
        elif opcode.upper() == "WORD":
            locctr += 3
        elif opcode.upper() == "RESW":
            locctr += 3 * int(operand)
        elif opcode.upper() == "RESB":
            locctr += int(operand)
        elif opcode.upper() == "BYTE":
            locctr += len(operand) - 3
        else:
            locctr += 3

    return symtab, intermediate
