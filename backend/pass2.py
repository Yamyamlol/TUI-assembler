# pass2.py
def perform_pass2(intermediate, symtab, optab, arch):
    """
    Second pass of the assembler - generates object code.
    Returns the list of object code instructions.
    """
    object_code = []
    program_name = ""
    program_start = 0
    program_length = 0
    text_record = ""
    text_record_start = 0
    text_record_length = 0
    
    # Process each line of the intermediate code
    for line_num, line in enumerate(intermediate, 1):
        if not line.strip():
            continue
            
        # Parse the intermediate line
        parts = line.split(None, 1)  # Split into address and rest of line
        if len(parts) < 2:
            continue
            
        address_str, rest_of_line = parts
        
        try:
            address = int(address_str, 16)
        except ValueError:
            # This line doesn't have an address (comment, etc.)
            continue
            
        # Parse the original instruction parts
        instr_parts = rest_of_line.strip().split()
        if not instr_parts:
            continue
            
        label, opcode, operand = None, None, None
        
        if len(instr_parts) >= 3:
            label, opcode, operand = instr_parts[0], instr_parts[1], instr_parts[2]
        elif len(instr_parts) == 2:
            if instr_parts[0].upper() in optab or instr_parts[0].upper() in ["START", "END", "RESW", "RESB", "WORD", "BYTE"]:
                opcode, operand = instr_parts[0], instr_parts[1]
            else:
                label, opcode = instr_parts[0], instr_parts[1]
        elif len(instr_parts) == 1:
            opcode = instr_parts[0]
            
        # Handle special directives
        if opcode.upper() == "START":
            program_name = label if label else "PROGRAM"
            program_start = address
            # Generate header record (H)
            object_code.append(f"H{program_name:<6}{program_start:06X}??????")  # Length placeholder
            continue
        elif opcode.upper() == "END":
            program_length = address - program_start
            # Complete header record with program length
            if object_code and object_code[0].startswith("H"):
                object_code[0] = object_code[0].replace("??????", f"{program_length:06X}")
            # Generate end record (E)
            object_code.append(f"E{program_start:06X}")
            continue
            
        # Generate object code for instructions
        machine_code = ""
        
        if opcode.upper() in optab:
            op_code_value = optab[opcode.upper()]
            
            # Simple 3-byte format (standard SIC)
            if arch == "SIC" or (arch == "SICXE" and not opcode.startswith('+')):
                if operand:
                    # Get operand address from symbol table if it's a symbol
                    operand_address = 0
                    if operand in symtab:
                        operand_address = symtab[operand]
                    else:
                        try:
                            # Direct addressing
                            operand_address = int(operand)
                        except ValueError:
                            print(f"Error: Undefined symbol '{operand}' on line {line_num}")
                    
                    # Generate machine code (op_code + address)
                    machine_code = f"{op_code_value}{operand_address:04X}"
                else:
                    # Instructions with no operand (like RSUB)
                    machine_code = f"{op_code_value}0000"
            
            # SIC/XE format 4 (+) instruction
            elif arch == "SICXE" and opcode.startswith('+'):
                op_code_value = optab[opcode[1:].upper()]  # Remove the '+' prefix
                if operand:
                    operand_address = 0
                    if operand in symtab:
                        operand_address = symtab[operand]
                    else:
                        try:
                            operand_address = int(operand)
                        except ValueError:
                            print(f"Error: Undefined symbol '{operand}' on line {line_num}")
                    
                    # Generate extended format machine code
                    machine_code = f"{op_code_value}{operand_address:06X}"
                else:
                    machine_code = f"{op_code_value}000000"
            
        elif opcode.upper() == "BYTE":
            if operand.startswith("C'") and operand.endswith("'"):
                # Character constant
                chars = operand[2:-1]
                machine_code = ''.join(f"{ord(c):02X}" for c in chars)
            elif operand.startswith("X'") and operand.endswith("'"):
                # Hexadecimal constant
                machine_code = operand[2:-1]
            else:
                print(f"Warning: Invalid BYTE operand format on line {line_num}: {operand}")
                
        elif opcode.upper() == "WORD":
            try:
                value = int(operand)
                machine_code = f"{value & 0xFFFFFF:06X}"  # Ensure it fits in 3 bytes
            except ValueError:
                print(f"Error: Invalid WORD value on line {line_num}: {operand}")
                machine_code = "000000"  # Default to 0
        
        # Add generated machine code to object code if available
        if machine_code:
            object_code.append(f"T{address:06X}{len(machine_code)//2:02X}{machine_code}")
    
    return object_code