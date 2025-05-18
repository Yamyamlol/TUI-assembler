# pass1.py
def perform_pass1(source_lines, arch):
    """
    First pass of the assembler - builds symbol table and location counter.
    Returns the intermediate representation and symbol table.
    """
    from opcode_table import SIC_OPCODES, SICXE_OPCODES
    
    if arch == "SIC":
        OPCODES = SIC_OPCODES
    else:  # SICXE
        OPCODES = SICXE_OPCODES
    
    loc_counter = 0
    symtab = {}
    intermediate = []
    
    # Process each line of the source code
    for line_num, line in enumerate(source_lines, 1):
        line = line.strip()
        
        # Skip empty lines or comments
        if not line or line.startswith(';') or line.startswith('.'):
            intermediate.append(f"      {line}")
            continue
        
        # Parse the line into components
        parts = line.split()
        label, opcode, operand = None, None, None
        
        # Determine the label, opcode, and operand based on number of parts
        if len(parts) >= 3:
            label, opcode, operand = parts[0], parts[1], parts[2]
        elif len(parts) == 2:
            # If there are only two parts, it could be (label, opcode) or (opcode, operand)
            if parts[0].upper() in OPCODES or parts[0].upper() in ["START", "END", "RESW", "RESB", "WORD", "BYTE"]:
                label, opcode, operand = None, parts[0], parts[1]
            else:
                label, opcode, operand = parts[0], parts[1], None
        elif len(parts) == 1:
            # If there's only one part, it must be an opcode with no operand (like RSUB)
            opcode = parts[0]
        
        # Handle special directives
        if opcode and opcode.upper() == "START":
            try:
                loc_counter = int(operand, 16) if operand else 0
                intermediate.append(f"{loc_counter:04X} {line}")
                continue
            except ValueError:
                print(f"Error: Invalid START address on line {line_num}: {operand}")
                continue
        
        # Store symbol in the symbol table if there is a label
        if label:
            if label in symtab:
                print(f"Error: Duplicate symbol '{label}' on line {line_num}")
            else:
                symtab[label] = loc_counter
        
        # Add the current line to the intermediate representation
        intermediate.append(f"{loc_counter:04X} {line}")
        
        # Update location counter based on the instruction
        if opcode:
            opcode_upper = opcode.upper()
            
            # Extended format instruction (SIC/XE only)
            if arch == "SICXE" and opcode.startswith('+'):
                opcode_upper = opcode_upper[1:]  # Remove the '+' prefix
                if opcode_upper in OPCODES:
                    loc_counter += 4  # Extended format is 4 bytes
                else:
                    print(f"Warning: Unknown extended opcode '{opcode}' on line {line_num}")
                    loc_counter += 4  # Assume 4 bytes anyway
            
            # Standard instructions
            elif opcode_upper in OPCODES:
                loc_counter += 3  # Standard format is 3 bytes
            
            # Assembler directives
            elif opcode_upper == "WORD":
                loc_counter += 3
            elif opcode_upper == "RESW":
                try:
                    loc_counter += 3 * int(operand)
                except (ValueError, TypeError):
                    print(f"Error: Invalid RESW operand on line {line_num}: {operand}")
            elif opcode_upper == "RESB":
                try:
                    loc_counter += int(operand)
                except (ValueError, TypeError):
                    print(f"Error: Invalid RESB operand on line {line_num}: {operand}")
            elif opcode_upper == "BYTE":
                if operand and operand.startswith("C'") and operand.endswith("'"):
                    # Character constant
                    loc_counter += len(operand) - 3  # Subtract the C'' characters
                elif operand and operand.startswith("X'") and operand.endswith("'"):
                    # Hexadecimal constant
                    loc_counter += (len(operand) - 3) // 2  # Each byte is 2 hex digits
                else:
                    print(f"Warning: Invalid BYTE operand format on line {line_num}: {operand}")
                    loc_counter += 1  # Assume 1 byte
            elif opcode_upper == "END":
                break  # End of program
            else:
                print(f"Warning: Unknown opcode '{opcode}' on line {line_num}")
                loc_counter += 3  # Assume 3 bytes for unknown instructions
    
    return intermediate, symtab