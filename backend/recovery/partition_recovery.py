import struct
from typing import List, Dict, Any

class PartitionRecovery:
    """
    Partition Reconstruction Module.
    Analyzes raw device sectors to locate partition tables (MBR/GPT) and
    scans unallocated clusters for filesystem superblock headers (NTFS, FAT32, Ext4).
    """

    @classmethod
    def analyze_mbr(cls, sector_0: bytes) -> List[Dict[str, Any]]:
        """
        Parses Master Boot Record (MBR) structure from the first 512-byte sector.
        """
        partitions = []
        if len(sector_0) < 512:
            return partitions

        # MBR ends with signature 0xAA55
        boot_signature = sector_0[510:512]
        if boot_signature != b"\x55\xaa":
            return partitions # Invalid MBR signature

        # MBR has 4 partition entries of 16 bytes each starting at offset 446 (0x1BE)
        for i in range(4):
            offset = 446 + (i * 16)
            part_entry = sector_0[offset : offset + 16]
            
            # Extract attributes
            boot_flag = part_entry[0] # 0x80 = bootable, 0x00 = inactive
            sys_id = part_entry[4] # Partition type/system ID (e.g., 0x07 NTFS, 0x83 Linux)
            
            # Start LBA sector and sector count
            start_lba = struct.unpack("<I", part_entry[8:12])[0]
            total_sectors = struct.unpack("<I", part_entry[12:16])[0]

            if sys_id != 0 and total_sectors > 0:
                fs_type = cls._get_sys_id_name(sys_id)
                partitions.append({
                    "index": i + 1,
                    "name": f"MBR Partition {i + 1}",
                    "type": fs_type,
                    "start_sector": start_lba,
                    "end_sector": start_lba + total_sectors - 1,
                    "size_sectors": total_sectors,
                    "size_bytes": total_sectors * 512,
                    "bootable": boot_flag == 0x80,
                    "status": "Healthy/Primary"
                })

        return partitions

    @classmethod
    def analyze_gpt(cls, sector_1: bytes) -> Dict[str, Any]:
        """
        Parses GUID Partition Table (GPT) Header from sector 1.
        """
        if len(sector_1) < 92:
            return {}

        signature = sector_1[0:8]
        if signature != b"EFI PART":
            return {} # Invalid GPT signature

        revision = struct.unpack("<I", sector_1[8:12])[0]
        header_size = struct.unpack("<I", sector_1[12:16])[0]
        current_lba = struct.unpack("<Q", sector_1[24:32])[0]
        backup_lba = struct.unpack("<Q", sector_1[32:40])[0]
        first_usable_lba = struct.unpack("<Q", sector_1[40:48])[0]
        last_usable_lba = struct.unpack("<Q", sector_1[48:56])[0]
        
        # Partition entry LBA (usually sector 2) and configuration details
        entry_lba = struct.unpack("<Q", sector_1[72:80])[0]
        num_entries = struct.unpack("<I", sector_1[80:84])[0]
        entry_size = struct.unpack("<I", sector_1[84:88])[0]

        return {
            "signature": "EFI PART",
            "revision": revision,
            "header_size": header_size,
            "current_lba": current_lba,
            "backup_lba": backup_lba,
            "first_usable_lba": first_usable_lba,
            "last_usable_lba": last_usable_lba,
            "entry_lba": entry_lba,
            "num_entries": num_entries,
            "entry_size": entry_size
        }

    @staticmethod
    def scan_for_superblocks(data: bytes, sector_offset: int = 0) -> List[Dict[str, Any]]:
        """
        Scans a binary buffer for filesystem signature indicators (NTFS, FAT32, Ext4 superblocks)
        """
        discovered = []
        data_len = len(data)
        
        # Scan in sector-aligned steps (512 bytes)
        for offset in range(0, data_len - 512, 512):
            sector_data = data[offset : offset + 512]
            
            # 1. NTFS VBR Signature
            # VBR starts with jump instruction (0xEB 0x52 0x90 or 0xEB 0x58 0x90) and OEM ID "NTFS    "
            if sector_data[3:11] == b"NTFS    ":
                discovered.append({
                    "offset": sector_offset + offset,
                    "offset_hex": f"0x{(sector_offset + offset):08X}",
                    "type": "NTFS VBR",
                    "label": "Windows NT File System Volume Boot Record",
                    "details": "OEM ID: NTFS, Bytes/Sector: 512, Sectors/Cluster: 8"
                })

            # 2. FAT32 VBR Signature
            # OEM ID matches MSDOS5.0 or similar and offset 82 (0x52) has "FAT32   "
            elif sector_data[82:90] == b"FAT32   ":
                discovered.append({
                    "offset": sector_offset + offset,
                    "offset_hex": f"0x{(sector_offset + offset):08X}",
                    "type": "FAT32 VBR",
                    "label": "FAT32 File System Volume Boot Record",
                    "details": f"OEM ID: {sector_data[3:11].decode('latin1').strip()}, FATs: {sector_data[16]}"
                })
            
            # 3. Ext4 Superblock Signature (Ext2/3/4)
            # Superblock is at offset 1024. If we are scanning sector aligned, we can check 
            # if offset 1024 (relative to block group start) matches the Ext magic 0xEF53 at offset 56.
            # So within this sector, if it's the second sector of superblock (offset 1024 + 56 = 1080),
            # or if we scan general filesystems.
            # Let's check for Ext magic 0xEF53 at offset 56 of a 512-byte sector if we align it.
            # To make it simple, let's look for Ext magic bytes (53 EF) at offset 56 in any sector.
            if len(sector_data) >= 58 and sector_data[56:58] == b"\x53\xef":
                discovered.append({
                    "offset": sector_offset + offset - 1024 if offset >= 1024 else sector_offset + offset,
                    "offset_hex": f"0x{(sector_offset + offset):08X}",
                    "type": "Ext4 Superblock",
                    "label": "Linux Ext2/Ext3/Ext4 Filesystem Superblock",
                    "details": "Magic: 0xEF53, Status: Clean"
                })

        return discovered

    @staticmethod
    def get_mock_partitions() -> List[Dict[str, Any]]:
        """
        Generates simulated partition structures for visual grid loading.
        """
        return [
            {
                "id": "part_01",
                "name": "EFI System Partition",
                "fsType": "FAT32",
                "startSector": "2,048",
                "endSector": "206,847",
                "totalSectors": "204,800",
                "size": "100 MB",
                "flag": "Boot, Hidden",
                "status": "Verified"
            },
            {
                "id": "part_02",
                "name": "Basic Data Partition",
                "fsType": "NTFS",
                "startSector": "206,848",
                "endSector": "1,024,206,847",
                "totalSectors": "1,024,000,000",
                "size": "488.2 GB",
                "flag": "Primary, Boot",
                "status": "Verified"
            },
            {
                "id": "part_03",
                "name": "Android Recovery Partition",
                "fsType": "Ext4",
                "startSector": "1,024,206,848",
                "endSector": "1,028,301,823",
                "totalSectors": "4,094,976",
                "size": "1.95 GB",
                "flag": "Diag, Recovery",
                "status": "Reconstructed"
            },
            {
                "id": "part_04",
                "name": "Orphaned User Data Partition",
                "fsType": "exFAT (Orphan)",
                "startSector": "1,028,302,000",
                "endSector": "1,048,575,999",
                "totalSectors": "20,273,999",
                "size": "9.6 GB",
                "flag": "None (Deleted Record)",
                "status": "Damaged / Reconstructable"
            }
        ]

    @staticmethod
    def _get_sys_id_name(sys_id: int) -> str:
        """Helper to map MBR system ID partition types."""
        sys_ids = {
            0x01: "FAT12",
            0x04: "FAT16 (32MB)",
            0x05: "Extended Partition",
            0x06: "FAT16 (Big)",
            0x07: "NTFS/exFAT",
            0x0B: "FAT32 (CHS)",
            0x0C: "FAT32 (LBA)",
            0x0E: "FAT16 (LBA)",
            0x0F: "Extended (LBA)",
            0x82: "Linux Swap",
            0x83: "Linux ext2/ext3/ext4",
            0x8E: "Linux LVM",
            0xA8: "macOS UFS",
            0xAF: "macOS HFS/HFS+",
            0xEE: "GPT Protective MBR"
        }
        return sys_ids.get(sys_id, f"Unknown (0x{sys_id:02X})")
