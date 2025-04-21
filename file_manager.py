import os
from datetime import datetime

def create_output_folder():
    now = datetime.now().strftime("%Y%m%d_%H%M%S")
    folder = os.path.join("output", f"run_{now}")
    os.makedirs(folder, exist_ok=True)
    return folder

def write_file(folder, filename, content):
    path = os.path.join(folder, filename)
    with open(path, "w") as f:
        f.write(content)
