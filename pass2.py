from symbol_table import lookup_symbol
def perform_pass2(intermediate, symtab, optab, arch):
    object_code = []

    for line in intermediate:
        parts = line.split()

        # Skip empty lines or lines that are just comments
        if not parts or parts[0].startswith(";"):
            continue

        address = parts[0]
        instruction = parts[1] if len(parts) > 1 else None

        # If the instruction is 'END' or the line doesn't have a valid instruction, skip it
        if instruction is None or instruction.upper() == "END":
            continue

        # Separate opcode and operand
        if len(parts) > 1:
            opcode, operand = parts[1], parts[2] if len(parts) > 2 else ""
        else:
            opcode, operand = parts[1], ""

        # Get the opcode value from the optab
        opcode_val = optab.get(opcode)

        # If opcode is not in optab, log an error
        if opcode_val is None:
            print(f"Error: Unknown opcode '{opcode}'")
            continue

        # Get operand value from the symbol table (if operand is a label)
        if operand.isdigit():
            operand_val = operand  # Direct address
        else:
            # Check if the operand is a label and retrieve the corresponding address
            operand_val = symtab.get(operand)

        # If operand_val is None, it means we didn't find the operand in the symbol table
        if operand_val is None and operand:
            print(f"Error: Symbol '{operand}' not found in the symbol table.")
            continue

        # Convert operand value to a hexadecimal representation
        try:
            # Ensure operand_val is a string and not empty
            operand_val = str(operand_val).strip()
            if operand_val:
                # Convert operand to a 4-digit hexadecimal representation
                code = f"{opcode_val}{int(operand_val, 16):04X}"
                object_code.append(code)
            else:
                print(f"Warning: Empty operand value for {instruction}. Skipping line.")
        except ValueError as e:
            print(f"Error: Invalid operand '{operand_val}' for {instruction}. {str(e)}")
            continue

    return object_code
