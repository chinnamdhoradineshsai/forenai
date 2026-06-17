import hashlib
import os
from typing import Dict, Union, List

class HashVerifier:
    """
    Forensic Hash Verification Module.
    Responsible for calculating MD5, SHA-1, and SHA-256 checksums of files,
    directories, or binary streams to verify integrity and maintain a strict chain of custody.
    """

    @staticmethod
    def calculate_file_hashes(file_path: str, algorithms: List[str] = None) -> Dict[str, str]:
        """
        Calculate cryptographic hashes for a given file.
        """
        if not algorithms:
            algorithms = ["md5", "sha1", "sha256"]
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        hash_objects = {}
        for algo in algorithms:
            algo_lower = algo.lower()
            if algo_lower == "md5":
                hash_objects["md5"] = hashlib.md5()
            elif algo_lower == "sha1":
                hash_objects["sha1"] = hashlib.sha1()
            elif algo_lower == "sha256":
                hash_objects["sha256"] = hashlib.sha256()
            else:
                raise ValueError(f"Unsupported hashing algorithm: {algo}")

        # Read in blocks of 64KB to handle large forensic images efficiently
        block_size = 65536
        with open(file_path, "rb") as f:
            for block in iter(lambda: f.read(block_size), b""):
                for obj in hash_objects.values():
                    obj.update(block)

        return {algo: obj.hexdigest() for algo, obj in hash_objects.items()}

    @staticmethod
    def calculate_bytes_hashes(data: bytes, algorithms: List[str] = None) -> Dict[str, str]:
        """
        Calculate cryptographic hashes for a byte buffer.
        """
        if not algorithms:
            algorithms = ["md5", "sha1", "sha256"]
            
        results = {}
        for algo in algorithms:
            algo_lower = algo.lower()
            if algo_lower == "md5":
                results["md5"] = hashlib.md5(data).hexdigest()
            elif algo_lower == "sha1":
                results["sha1"] = hashlib.sha1(data).hexdigest()
            elif algo_lower == "sha256":
                results["sha256"] = hashlib.sha256(data).hexdigest()
            else:
                raise ValueError(f"Unsupported hashing algorithm: {algo}")
        return results

    @classmethod
    def verify_integrity(cls, file_path: str, expected_hash: str, algorithm: str = "sha256") -> bool:
        """
        Verify if the hash of a file matches the expected hash.
        """
        try:
            hashes = cls.calculate_file_hashes(file_path, [algorithm])
            calculated = hashes.get(algorithm.lower())
            return calculated.lower() == expected_hash.lower()
        except Exception:
            return False
