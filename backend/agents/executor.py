import os
import sys
import subprocess
import uuid

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "workspace"))

def _get_venv_paths(workspace: str):
    venv_dir = os.path.join(workspace, ".venv")
    if sys.platform == "win32":
        python_bin = os.path.join(venv_dir, "Scripts", "python.exe")
        pip_bin = os.path.join(venv_dir, "Scripts", "pip.exe")
    else:
        python_bin = os.path.join(venv_dir, "bin", "python")
        pip_bin = os.path.join(venv_dir, "bin", "pip")
    return venv_dir, python_bin, pip_bin

def ensure_workspace(session_id: str):
    ws = os.path.join(WORKSPACE_ROOT, session_id)
    os.makedirs(ws, exist_ok=True)
    venv_dir, python_bin, pip_bin = _get_venv_paths(ws)
    if not os.path.exists(python_bin):
        subprocess.run([sys.executable, "-m", "venv", venv_dir], check=True)
    return ws, python_bin, pip_bin

def install_packages(session_id: str, packages: list[str]):
    ws, _, pip_bin = ensure_workspace(session_id)
    if not packages:
        return {"status": "no packages requested"}
    try:
        result = subprocess.run(
            [pip_bin, "install"] + packages,
            capture_output=True, text=True, cwd=ws, timeout=300
        )
        return {
            "status": "success" if result.returncode == 0 else "error",
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

def run_python_code(session_id: str, code: str):
    ws, python_bin, _ = ensure_workspace(session_id)
    script_name = f"script_{uuid.uuid4().hex}.py"
    script_path = os.path.join(ws, script_name)
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(code)
    try:
        result = subprocess.run(
            [python_bin, script_path],
            capture_output=True, text=True, cwd=ws, timeout=120
        )
        images = []
        for f in os.listdir(ws):
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".svg")):
                images.append(f"/files/{session_id}/{f}")
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
            "images": images
        }
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": "Execution timed out after 120 seconds.", "returncode": -1, "images": []}
    except Exception as e:
        return {"stdout": "", "stderr": str(e), "returncode": -1, "images": []}
