# server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Add parent directory to path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

@app.route("/assemble", methods=["POST"])
def assemble_endpoint():
    """API endpoint for assembling SIC/SICXE code."""
    data = request.json
    source_code = data.get("source_code", "")
    arch = data.get("architecture", "SIC").upper()

    if not source_code:
        return jsonify({"error": "No source code provided"}), 400

    if arch not in ["SIC", "SICXE"]:
        return jsonify({"error": f"Invalid architecture: {arch}. Must be SIC or SICXE"}), 400

    try:
        # Import here to avoid circular imports
        from assembler_service import assemble
        
        source_lines = source_code.strip().split("\n")
        result = assemble(source_lines, arch)
        
        return jsonify({
            "symbol_table": {k: f"{v:04X}" for k, v in result["symbol_table"].items()},
            "intermediate": result["intermediate"],
            "object_code": result["object_code"],
            "output_folder": result["output_folder"]
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)