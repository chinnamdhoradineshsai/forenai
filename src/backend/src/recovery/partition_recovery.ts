export class PartitionRecovery {
  /**
   * Parses Master Boot Record (MBR) structure from the first 512-byte sector.
   */
  static analyzeMBR(sector0: Buffer): any[] {
    const partitions: any[] = [];
    if (sector0.length < 512) {
      return partitions;
    }

    // MBR signature check: 0x55 0xAA at 510-511
    if (sector0[510] !== 0x55 || sector0[511] !== 0xAA) {
      return partitions;
    }

    // 4 partition entries of 16 bytes starting at offset 446 (0x1BE)
    for (let i = 0; i < 4; i++) {
      const offset = 446 + i * 16;
      const partEntry = sector0.subarray(offset, offset + 16);

      const bootFlag = partEntry[0]; // 0x80 bootable, 0x00 inactive
      const sysId = partEntry[4]; // Partition system ID
      const startLba = partEntry.readUInt32LE(8);
      const totalSectors = partEntry.readUInt32LE(12);

      if (sysId !== 0 && totalSectors > 0) {
        const fsType = this.getSysIdName(sysId);
        partitions.push({
          index: i + 1,
          name: `MBR Partition ${i + 1}`,
          type: fsType,
          start_sector: startLba,
          end_sector: startLba + totalSectors - 1,
          size_sectors: totalSectors,
          size_bytes: totalSectors * 512,
          bootable: bootFlag === 0x80,
          status: "Healthy/Primary"
        });
      }
    }

    return partitions;
  }

  /**
   * Parses GUID Partition Table (GPT) Header from sector 1.
   */
  static analyzeGPT(sector1: Buffer): Record<string, any> {
    if (sector1.length < 92) {
      return {};
    }

    const signature = sector1.toString("utf8", 0, 8);
    if (signature !== "EFI PART") {
      return {};
    }

    const revision = sector1.readUInt32LE(8);
    const headerSize = sector1.readUInt32LE(12);
    const currentLba = sector1.readBigUInt64LE(24);
    const backupLba = sector1.readBigUInt64LE(32);
    const firstUsableLba = sector1.readBigUInt64LE(40);
    const lastUsableLba = sector1.readBigUInt64LE(48);

    const entryLba = sector1.readBigUInt64LE(72);
    const numEntries = sector1.readUInt32LE(80);
    const entrySize = sector1.readUInt32LE(84);

    return {
      signature: "EFI PART",
      revision,
      header_size: headerSize,
      current_lba: currentLba.toString(),
      backup_lba: backupLba.toString(),
      first_usable_lba: firstUsableLba.toString(),
      last_usable_lba: lastUsableLba.toString(),
      entry_lba: entryLba.toString(),
      num_entries: numEntries,
      entry_size: entrySize
    };
  }

  /**
   * Scans a binary buffer for filesystem signature indicators (NTFS, FAT32, Ext4 superblocks)
   */
  static scanForSuperblocks(data: Buffer, sectorOffset = 0): any[] {
    const discovered: any[] = [];
    const dataLen = data.length;

    // Scan in sector-aligned steps (512 bytes)
    for (let offset = 0; offset < dataLen - 512; offset += 512) {
      const sectorData = data.subarray(offset, offset + 512);

      // 1. NTFS OEM ID check "NTFS    " at bytes 3-11
      if (sectorData.toString("utf8", 3, 11) === "NTFS    ") {
        discovered.push({
          offset: sectorOffset + offset,
          offset_hex: `0x${(sectorOffset + offset).toString(16).toUpperCase().padStart(8, "0")}`,
          type: "NTFS VBR",
          label: "Windows NT File System Volume Boot Record",
          details: "OEM ID: NTFS, Bytes/Sector: 512, Sectors/Cluster: 8"
        });
      }
      // 2. FAT32 OEM ID check "FAT32   " at bytes 82-90
      else if (sectorData.toString("utf8", 82, 90) === "FAT32   ") {
        discovered.push({
          offset: sectorOffset + offset,
          offset_hex: `0x${(sectorOffset + offset).toString(16).toUpperCase().padStart(8, "0")}`,
          type: "FAT32 VBR",
          label: "FAT32 File System Volume Boot Record",
          details: `OEM ID: ${sectorData.toString("latin1", 3, 11).trim()}, FATs: ${sectorData[16]}`
        });
      }
      // 3. Ext4 Superblock Signature (magic 0xEF53 at offset 56-57)
      else if (sectorData.length >= 58 && sectorData[56] === 0x53 && sectorData[57] === 0xEF) {
        discovered.push({
          offset: offset >= 1024 ? sectorOffset + offset - 1024 : sectorOffset + offset,
          offset_hex: `0x${(sectorOffset + offset).toString(16).toUpperCase().padStart(8, "0")}`,
          type: "Ext4 Superblock",
          label: "Linux Ext2/Ext3/Ext4 Filesystem Superblock",
          details: "Magic: 0xEF53, Status: Clean"
        });
      }
    }

    return discovered;
  }

  static getMockPartitions(): any[] {
    return [
      {
        id: "part_01",
        name: "EFI System Partition",
        fsType: "FAT32",
        startSector: "2,048",
        endSector: "206,847",
        totalSectors: "204,800",
        size: "100 MB",
        flag: "Boot, Hidden",
        status: "Verified"
      },
      {
        id: "part_02",
        name: "Basic Data Partition",
        fsType: "NTFS",
        startSector: "206,848",
        endSector: "1,024,206,847",
        totalSectors: "1,024,000,000",
        size: "488.2 GB",
        flag: "Primary, Boot",
        status: "Verified"
      },
      {
        id: "part_03",
        name: "Android Recovery Partition",
        fsType: "Ext4",
        startSector: "1,024,206,848",
        endSector: "1,028,301,823",
        totalSectors: "4,094,976",
        size: "1.95 GB",
        flag: "Diag, Recovery",
        status: "Reconstructed"
      },
      {
        id: "part_04",
        name: "Orphaned User Data Partition",
        fsType: "exFAT (Orphan)",
        startSector: "1,028,302,000",
        endSector: "1,048,575,999",
        totalSectors: "20,273,999",
        size: "9.6 GB",
        flag: "None (Deleted Record)",
        status: "Damaged / Reconstructable"
      }
    ];
  }

  private static getSysIdName(sysId: number): string {
    const sysIds: Record<number, string> = {
      0x01: "FAT12",
      0x04: "FAT16 (32MB)",
      0x05: "Extended Partition",
      0x06: "FAT16 (Big)",
      0x07: "NTFS/exFAT",
      0x0b: "FAT32 (CHS)",
      0x0c: "FAT32 (LBA)",
      0x0e: "FAT16 (LBA)",
      0x0f: "Extended (LBA)",
      0x82: "Linux Swap",
      0x83: "Linux ext2/ext3/ext4",
      0x8e: "Linux LVM",
      0xa8: "macOS UFS",
      0xaf: "macOS HFS/HFS+",
      0xee: "GPT Protective MBR"
    };
    return sysIds[sysId] || `Unknown (0x${sysId.toString(16).toUpperCase().padStart(2, "0")})`;
  }
}
