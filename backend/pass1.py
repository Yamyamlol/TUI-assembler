def perform_pass1(source_lines, arch):
    """
    First pass of the assembler - builds symbol table and location counter.
    Returns the intermediate representation and symbol table.
    """
    from opcode_table import SIC_OPCODES, SICXE_OPCODES

    OPCODES = SIC_OPCODES if arch == "SIC" else SICXE_OPCODES

    loc_counter = 0
    symtab = {}
    intermediate = []
    start_address = 0

    for line_num, line in enumerate(source_lines, 1):
        full_line = line.strip()

        # Skip full-line comments or empty lines
        if full_line.startswith('.') or full_line.startswith(';') or not full_line:
            intermediate.append(f"      {full_line}")
            continue

        # Strip inline comments (keep only code before ';')
        code_only = full_line.split(';')[0].strip()

        if not code_only:
            intermediate.append(f"      {full_line}")
            continue

        parts = code_only.split()
        label, opcode, operand = None, None, None

        if len(parts) >= 3:
            label, opcode, operand = parts[0], parts[1], ' '.join(parts[2:])
        elif len(parts) == 2:
            if parts[0].upper() in OPCODES or parts[0].upper() in ["START", "END", "RESW", "RESB", "WORD", "BYTE"]:
                opcode, operand = parts[0], parts[1]
            else:
                label, opcode = parts[0], parts[1]
        elif len(parts) == 1:
            opcode = parts[0]

        # Handle START directive
        if opcode and opcode.upper() == "START":
            try:
                start_address = int(operand, 16) if operand else 0
                loc_counter = start_address
                intermediate.append(f"{loc_counter:04X} {code_only}")
                continue
            except ValueError:
                print(f"Error: Invalid START address on line {line_num}: {operand}")
                continue

        # Add label to symbol table
        if label:
            if label in symtab:
                print(f"Error: Duplicate symbol '{label}' on line {line_num}")
            else:
                symtab[label] = loc_counter

        # Append to intermediate (only instruction portion)
        intermediate.append(f"{loc_counter:04X} {code_only}")

        # Update LOCCTR based on opcode
        if opcode:
            opcode_upper = opcode.upper()

            if arch == "SICXE" and opcode.startswith('+'):
                if opcode_upper[1:] in OPCODES:
                    loc_counter += 4
                else:
                    print(f"Warning: Unknown extended opcode '{opcode}' on line {line_num}")
                    loc_counter += 4

            elif opcode_upper in OPCODES:
                loc_counter += 3

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
                if operand.startswith("C'") and operand.endswith("'"):
                    loc_counter += len(operand) - 3
                elif operand.startswith("X'") and operand.endswith("'"):
                    loc_counter += (len(operand) - 3) // 2
                else:
                    print(f"Warning: Invalid BYTE operand format on line {line_num}: {operand}")
                    loc_counter += 1

            elif opcode_upper == "END":
                break

            else:
                print(f"Warning: Unknown opcode '{opcode}' on line {line_num}")
                loc_counter += 3

    return intermediate, symtab
