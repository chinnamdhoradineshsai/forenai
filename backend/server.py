import os
import json
import re
import sys
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Dict, Any, List

# Add current folder to path
sys.path.append(os.path.dirname(__file__))

from recovery.recovery_manager import RecoveryManager
from recovery.hash_verifier import HashVerifier

PORT = int(os.environ.get("PORT", 8000))
manager = RecoveryManager()

class ForensicHTTPServerHandler(BaseHTTPRequestHandler):
    """
    HTTP request handler supporting REST API endpoints and CORS.
    Runs on Python standard library only.
    """

    def end_headers(self):
        # Add CORS headers to all responses
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        # Handle preflight CORS requests
        self.send_response(200, "OK")
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path == "/" or path == "/api/status":
            self.send_json_response({"status": "Online", "engine": "Forensic AI Recovery System", "port": PORT})
        
        elif path == "/api/drives":
            try:
                from recovery.disk_scanner import DiskScanner
                drives = DiskScanner.get_system_drives()
                self.send_json_response(drives)
            except Exception as e:
                self.send_error_response(f"Failed to fetch drives: {str(e)}")

        elif path == "/api/logs":
            try:
                logs = manager.get_audit_logs()
                self.send_json_response(logs)
            except Exception as e:
                self.send_error_response(f"Failed to fetch audit logs: {str(e)}")

        elif path == "/api/recovered-files":
            try:
                files = manager.get_recovered_files()
                self.send_json_response(files)
            except Exception as e:
                self.send_error_response(f"Failed to fetch recovered files: {str(e)}")

        elif path == "/api/recovery-logs":
            try:
                logs = manager.logger.get_recovery_logs()
                self.send_json_response(logs)
            except Exception as e:
                self.send_error_response(f"Failed to fetch recovery logs: {str(e)}")

                
        else:
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode())

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        
        # Get content-length to read body
        content_length = int(self.headers.get("Content-Length", 0))
        content_type = self.headers.get("Content-Type", "")
        
        # Determine body content
        body = b""
        if content_length > 0:
            body = self.rfile.read(content_length)

        if path == "/api/scan":
            try:
                params = json.loads(body.decode("utf-8")) if body else {}
                target = params.get("target_path", "")
                scan_type = params.get("scan_type", "quick")
                
                # Perform real scan
                scan_results = manager.scan_device(target, scan_type)
                self.send_json_response(scan_results)
            except Exception as e:
                self.send_error_response(f"Scan failed: {str(e)}")

        elif path == "/api/hash":
            try:
                # Handle either file uploads (multipart) or JSON raw payload
                if "multipart/form-data" in content_type:
                    file_info = self._parse_multipart(body, content_type)
                    if not file_info:
                        self.send_error_response("No file uploaded or parsing failed.")
                        return
                    
                    filename, file_bytes = file_info
                    # Compute hashes on file bytes
                    hashes = HashVerifier.calculate_bytes_hashes(file_bytes)
                    self.send_json_response({
                        "filename": filename,
                        "size": len(file_bytes),
                        "md5": hashes.get("md5"),
                        "sha1": hashes.get("sha1"),
                        "sha256": hashes.get("sha256"),
                        "status": "Verified"
                    })
                else:
                    # JSON check for local path or text content
                    params = json.loads(body.decode("utf-8")) if body else {}
                    local_path = params.get("file_path", "")
                    text_content = params.get("text", "")
                    
                    if local_path:
                        if not os.path.exists(local_path):
                            self.send_error_response(f"File path does not exist: {local_path}")
                            return
                        hashes = HashVerifier.calculate_file_hashes(local_path)
                        self.send_json_response({
                            "file_path": local_path,
                            "size": os.path.getsize(local_path),
                            "md5": hashes.get("md5"),
                            "sha1": hashes.get("sha1"),
                            "sha256": hashes.get("sha256")
                        })
                    elif text_content:
                        hashes = HashVerifier.calculate_bytes_hashes(text_content.encode("utf-8"))
                        self.send_json_response({
                            "source": "text_string",
                            "md5": hashes.get("md5"),
                            "sha1": hashes.get("sha1"),
                            "sha256": hashes.get("sha256")
                        })
                    else:
                        self.send_error_response("Provide either a file upload, file_path, or text content")
            except Exception as e:
                self.send_error_response(f"Hash calculation failed: {str(e)}")

        elif path == "/api/recover":
            try:
                params = json.loads(body.decode("utf-8")) if body else {}
                selected_files = params.get("selected_files", [])
                destination = params.get("destination", "")
                investigator = params.get("investigator", "Investigator")
                case_id = params.get("case_id", "case_0")
                
                if not selected_files:
                    self.send_error_response("No files selected for recovery")
                    return
                if not destination:
                    self.send_error_response("No destination path specified")
                    return
                
                result = manager.run_recovery(selected_files, destination, investigator, case_id)
                self.send_json_response(result)
            except Exception as e:
                self.send_error_response(f"Recovery failed: {str(e)}")

        elif path == "/api/malware":
            try:
                params = json.loads(body.decode("utf-8")) if body else {}
                yara_rule_text = params.get("rules", "")
                target_dir = params.get("target_path", "")
                
                if not yara_rule_text:
                    self.send_error_response("No rules specified")
                    return
                    
                if not target_dir or not os.path.exists(target_dir):
                    target_dir = manager.upload_dir
                
                # Execute custom YARA simulation/real scan
                malware_results = self._run_yara_scan(yara_rule_text, target_dir)
                self.send_json_response(malware_results)
            except Exception as e:
                self.send_error_response(f"Malware scan failed: {str(e)}")
                
        else:
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode())

    def _parse_multipart(self, body: bytes, content_type: str) -> Any:
        """Simple multipart/form-data parser in vanilla Python."""
        try:
            # Extract boundary
            boundary_match = re.search(r"boundary=(.*)", content_type)
            if not boundary_match:
                return None
            boundary = boundary_match.group(1).encode()
            
            # Split body by boundary
            parts = body.split(b"--" + boundary)
            for part in parts:
                if b"Content-Disposition" in part:
                    # Find headers and content boundaries
                    header_end = part.find(b"\r\n\r\n")
                    if header_end == -1:
                        continue
                    headers = part[:header_end].decode("latin1")
                    part_body = part[header_end + 4 : -2] # strip leading \r\n and trailing \r\n
                    
                    filename_match = re.search(r'filename="([^"]+)"', headers)
                    if filename_match:
                        filename = filename_match.group(1)
                        return filename, part_body
            return None
        except Exception:
            return None

    def _run_yara_scan(self, rule_text: str, target_dir: str) -> Dict[str, Any]:
        """
        Parses a custom rule block and runs searches on local files inside target_dir.
        Supports:
          - Parsing rule headers (rule name)
          - Parsing string declarations (e.g. $s1 = "malicious_string" or $s2 = /regex_pattern/)
          - Scanning text or binary files in target_dir for matches
        """
        matches = []
        logs = []
        threat_score = 0
        
        logs.append(f"[*] Parsing rule text ({len(rule_text)} bytes)...")
        
        # 1. Parse rules from the input text
        rules = []
        rule_blocks = re.findall(r"rule\s+(\w+)\s*\{(.*?)\}", rule_text, re.DOTALL)
        
        for rule_name, rule_body in rule_blocks:
            logs.append(f"[*] Found rule definition: '{rule_name}'")
            # Parse strings section
            strings_block = re.search(r"strings:(.*?)(?:condition:|$)", rule_body, re.DOTALL)
            strings_to_find = []
            if strings_block:
                lines = strings_block.group(1).strip().split("\n")
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    # Match pattern like: $s1 = "pattern" or $s2 = /regex/
                    m = re.match(r"\$(\w+)\s*=\s*(.*)", line)
                    if m:
                        str_name = m.group(1)
                        pattern_val = m.group(2).strip()
                        
                        # Strip quotes or slashes
                        if pattern_val.startswith('"') and pattern_val.endswith('"'):
                            pattern_val = pattern_val[1:-1]
                            is_regex = False
                        elif pattern_val.startswith('/') and pattern_val.endswith('/'):
                            pattern_val = pattern_val[1:-1]
                            is_regex = True
                        else:
                            is_regex = False
                        
                        strings_to_find.append({
                            "name": str_name,
                            "value": pattern_val,
                            "is_regex": is_regex
                        })
                        logs.append(f"  + String variable: ${str_name} = '{pattern_val}' (Regex: {is_regex})")
            
            rules.append({
                "name": rule_name,
                "strings": strings_to_find
            })
            
        logs.append(f"[*] Parsed {len(rules)} compiled rules successfully.")
        
        # If no rules were parsed, try to run a mock scan or report
        if not rules:
            logs.append("[!] No valid YARA rules parsed. Using mock patterns.")
            rules = [{
                "name": "Suspicious_Android_Activity",
                "strings": [
                    {"name": "s1", "value": "su -c", "is_regex": False},
                    {"name": "s2", "value": "chmod 777", "is_regex": False}
                ]
            }]

        # 2. Scan directory
        logs.append(f"[*] Beginning scan of directory: '{target_dir}'...")
        scanned_files_count = 0
        
        try:
            for root, _, files in os.walk(target_dir):
                for file_name in files:
                    if scanned_files_count > 15: # limit scan for efficiency
                        break
                    
                    full_path = os.path.join(root, file_name)
                    try:
                        scanned_files_count += 1
                        # Check size
                        if os.path.getsize(full_path) > 10 * 1024 * 1024:
                            # Skip files > 10MB
                            continue
                            
                        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()
                            
                        # Scan each rule
                        for r in rules:
                            rule_matched = False
                            matched_info = []
                            
                            for s in r["strings"]:
                                if s["is_regex"]:
                                    match_objs = list(re.finditer(s["value"], content))
                                    if match_objs:
                                        rule_matched = True
                                        for m_obj in match_objs[:3]:
                                            matched_info.append({
                                                "string_id": f"${s['name']}",
                                                "match_text": m_obj.group(0),
                                                "offset": m_obj.start()
                                            })
                                else:
                                    # String find
                                    pos = 0
                                    while True:
                                        pos = content.find(s["value"], pos)
                                        if pos == -1:
                                            break
                                        rule_matched = True
                                        matched_info.append({
                                            "string_id": f"${s['name']}",
                                            "match_text": s["value"],
                                            "offset": pos
                                        })
                                        pos += len(s["value"])
                                        if len(matched_info) >= 3: # cap items per file
                                            break
                                            
                            if rule_matched:
                                matches.append({
                                    "file": file_name,
                                    "path": root,
                                    "rule": r["name"],
                                    "details": matched_info,
                                    "severity": "HIGH" if "malware" in r["name"].lower() or "suspicious" in r["name"].lower() else "MEDIUM"
                                })
                                logs.append(f"[ALERT] File '{file_name}' matched YARA rule '{r['name']}'!")
                                
                    except Exception as fe:
                        logs.append(f"[!] Error scanning file {file_name}: {str(fe)}")
        except Exception as de:
            logs.append(f"[!] Target dir scan error: {str(de)}")

        logs.append(f"[*] Scan complete. Checked {scanned_files_count} files.")
        
        # Calculate threat score
        high_matches = sum(1 for m in matches if m["severity"] == "HIGH")
        med_matches = sum(1 for m in matches if m["severity"] == "MEDIUM")
        threat_score = min(100, high_matches * 35 + med_matches * 15)
        
        # Log summary in audit trail
        manager.logger.log_action(
            action_type="YARA Malware Scan",
            investigator="Investigator",
            case_id="case_0",
            details=f"Ran malware signature rules on {target_dir}. Checked {scanned_files_count} files, found {len(matches)} rule alerts. Threat Score: {threat_score}"
        )

        return {
            "threatScore": threat_score,
            "checkedFilesCount": scanned_files_count,
            "matches": matches,
            "logs": logs
        }

    def send_json_response(self, data: Any):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def send_error_response(self, message: str, status_code: int = 400):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode("utf-8"))


def run_server():
    server_address = ("", PORT)
    httpd = HTTPServer(server_address, ForensicHTTPServerHandler)
    print(f"[*] Forensic AI Web API Server starting on port {PORT}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Server stopping...")
        httpd.server_close()
        print("[*] Server stopped.")

if __name__ == "__main__":
    run_server()
