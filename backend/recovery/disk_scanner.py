import os
import shutil
import ctypes
import sys
from typing import Dict, List, Any

class DiskScanner:
    """
    Forensic Disk and Partition Scanner.
    Interrogates system drives, maps partition bounds, and generates logical
    sector block maps for forensic visualization.
    """

    @staticmethod
    def get_system_drives() -> List[Dict[str, Any]]:
        """
        Detects and lists local drives/partitions with capacity details.
        """
        drives = []
        if sys.platform == "win32":
            # Windows drive detection using ctypes
            bitmask = ctypes.windll.kernel32.GetLogicalDrives()
            for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
                if bitmask & 1:
                    drive_path = f"{letter}:\\"
                    try:
                        usage = shutil.disk_usage(drive_path)
                        # Detect filesystem type using GetVolumeInformationW
                        volume_name = ctypes.create_unicode_buffer(1024)
                        fs_name = ctypes.create_unicode_buffer(1024)
                        ctypes.windll.kernel32.GetVolumeInformationW(
                            drive_path, volume_name, 1024, None, None, None, fs_name, 1024
                        )
                        drives.append({
                            "path": drive_path,
                            "name": f"{volume_name.value or 'Local Disk'} ({letter}:)",
                            "type": fs_name.value or "NTFS",
                            "total": usage.total,
                            "used": usage.used,
                            "free": usage.free,
                            "status": "Mounted"
                        })
                    except Exception:
                        # Drive might be offline or unformatted (e.g. CD-ROM)
                        drives.append({
                            "path": drive_path,
                            "name": f"Logical Drive ({letter}:)",
                            "type": "RAW/Unknown",
                            "total": 0,
                            "used": 0,
                            "free": 0,
                            "status": "Unmounted"
                        })
                bitmask >>= 1
        else:
            # Unix-like drives (mount points)
            try:
                # Add default root partition
                usage = shutil.disk_usage("/")
                drives.append({
                    "path": "/",
                    "name": "Root Partition (/) ",
                    "type": "ext4",
                    "total": usage.total,
                    "used": usage.used,
                    "free": usage.free,
                    "status": "Mounted"
                })
            except Exception:
                pass
                
        return drives

    @staticmethod
    def scan_directory_metadata(target_dir: str) -> List[Dict[str, Any]]:
        """
        Traverses a directory to gather file metadata for scanning results.
        """
        metadata_list = []
        if not os.path.exists(target_dir):
            return metadata_list

        try:
            for root, _, files in os.walk(target_dir):
                for filename in files:
                    full_path = os.path.join(root, filename)
                    try:
                        stat_info = os.stat(full_path)
                        # Estimate an arbitrary but deterministic sector offset for display
                        sector_offset = f"0x{hash(full_path) & 0xFFFFFFFF:08X}"
                        
                        # Determine forensic classification type
                        ext = os.path.splitext(filename)[1].lower()
                        file_type = "document"
                        if ext in [".png", ".jpg", ".jpeg", ".gif", ".bmp"]:
                            file_type = "image"
                        elif ext in [".db", ".sqlite", ".sqlite3", ".sql"]:
                            file_type = "database"
                        elif ext in [".tmp", ".bak", ".log", ".sys"]:
                            file_type = "system"

                        metadata_list.append({
                            "name": filename,
                            "path": root,
                            "size_bytes": stat_info.st_size,
                            "size": DiskScanner._format_size(stat_info.st_size),
                            "modified": stat_info.st_mtime,
                            "created": stat_info.st_ctime,
                            "sector_offset": sector_offset,
                            "type": file_type
                        })
                    except Exception:
                        continue
        except Exception:
            pass
            
        return metadata_list

    @staticmethod
    def generate_sector_map(total_sectors: int = 144, progress_percent: int = 100) -> List[str]:
        """
        Generates states for a sector grid map based on scan progress.
        Sector states: 'empty', 'success', 'carved', 'deleted', 'error'
        """
        map_states = []
        filled_count = int((progress_percent / 100) * total_sectors)
        
        for i in range(total_sectors):
            if i >= filled_count:
                map_states.append("empty")
            else:
                # Deterministic layout for mock visual display
                if i % 18 == 0:
                    map_states.append("carved")
                elif i % 12 == 0:
                    map_states.append("deleted")
                elif i % 45 == 0:
                    map_states.append("error")
                else:
                    map_states.append("success")
        return map_states

    @staticmethod
    def _format_size(bytes_size: int) -> str:
        """Utility to format bytes to human readable string."""
        for unit in ['Bytes', 'KB', 'MB', 'GB', 'TB']:
            if bytes_size < 1024.0:
                return f"{bytes_size:.1f} {unit}"
            bytes_size /= 1024.0
        return f"{bytes_size:.1f} PB"
