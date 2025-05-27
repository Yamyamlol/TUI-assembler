# state.py
class AssemblyState:
    def __init__(self):
        self.source_code = []
        self.intermediate_lines = []
        self.symbol_table = {}
        self.object_code_lines = []
        self.errors = []
        self.start_address = None
        self.program_name = ''
        self.program_length = 0

    def to_dict(self):
        return {
            "intermediate": "\n".join(self.intermediate_lines),
            "symbol_table": "\n".join(
                f"{label} => {addr}" for label, addr in self.symbol_table.items()
            ),
            "object_code": "\n".join(self.object_code_lines),
            "errors": self.errors,
            "program_name": self.program_name,
            "start_address": self.start_address,
            "program_length": self.program_length,
        }
