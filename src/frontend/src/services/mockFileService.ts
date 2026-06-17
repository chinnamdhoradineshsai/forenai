import { jsPDF } from "jspdf";

export const mockFileService = {
  // Returns an Object URL for a given mock file.
  getDynamicFileUrl(fileName: string, fileType: string, options?: any): string {
    const blob = this.getDynamicFileBlob(fileName, fileType, options);
    return URL.createObjectURL(blob);
  },

  getDynamicFileBlob(fileName: string, fileType: string, _options?: any): Blob {
    const ext = fileName.split(".").pop()?.toLowerCase();
    
    // 1. Text/tmp/log files
    if (ext === "txt" || ext === "tmp" || ext === "log" || fileType === "text") {
      let content = "";
      if (fileName.includes("password")) {
        content = `ForenAI Carved File Recovery.\nFile: ${fileName}\nRecovered from: /data/local/tmp/\nStatus: Unlinked Temporary File\n\nContent:\n- email: admin@forenai.co / hash: $2b$12$L8qJd...\n- ssh-key: dev-access-rsa (revoked)\n- db-pass: supersecurepass123\n`;
      } else {
        content = `ForenAI Log File Recovery.\nFile: ${fileName}\nStatus: Extracted Log File\n\n[INFO] System startup at 2024-01-15 14:32:00\n[DEBUG] Port forwarding active.\n[WARN] Sideloaded APK execution detected.\n`;
      }
      return new Blob([content], { type: "text/plain" });
    }

    // 2. Images
    if (fileType === "image" || ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) {
      // Create a canvas dynamically to generate a real image!
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Background
        const grad = ctx.createLinearGradient(0, 0, 600, 400);
        grad.addColorStop(0, "#0f172a"); // slate 900
        grad.addColorStop(1, "#1e293b"); // slate 800
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 400);

        // Grid lines for "Forensic look"
        ctx.strokeStyle = "rgba(14, 165, 233, 0.15)"; // cyan 500
        ctx.lineWidth = 1;
        for (let i = 0; i < 600; i += 40) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 400);
          ctx.stroke();
        }
        for (let i = 0; i < 400; i += 40) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(600, i);
          ctx.stroke();
        }

        // Crosshairs in corners
        ctx.strokeStyle = "rgba(14, 165, 233, 0.4)";
        const drawCross = (cx: number, cy: number) => {
          ctx.beginPath();
          ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy);
          ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10);
          ctx.stroke();
        };
        drawCross(40, 40);
        drawCross(560, 40);
        drawCross(40, 360);
        drawCross(560, 360);

        // Forensic Stamp
        ctx.fillStyle = "rgba(239, 68, 68, 0.1)"; // red 500
        ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(300, 200, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 10px monospace";
        ctx.fillStyle = "#ef4444";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("FORENSIC EVIDENCE", 300, 190);
        ctx.fillText("CONFIDENTIAL", 300, 210);

        // Target File Details
        ctx.fillStyle = "#38bdf8"; // cyan 400
        ctx.font = "bold 14px monospace";
        ctx.fillText(fileName.toUpperCase(), 300, 80);

        ctx.fillStyle = "#94a3b8"; // slate 400
        ctx.font = "11px monospace";
        ctx.fillText(`Type: ${fileType.toUpperCase()}`, 300, 110);
        ctx.fillText(`Acquisition Time: ${new Date().toISOString().replace("T", " ").substring(0, 19)}`, 300, 130);
        ctx.fillText(`Hash Verification: SHA-256 VALIDATED`, 300, 300);
      }

      // Convert canvas to a data URL, then decode to blob
      const dataUrl = canvas.toDataURL("image/png");
      const byteString = atob(dataUrl.split(",")[1]);
      const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ab], { type: mimeString });
    }

    // 3. Audio/Video files
    if (fileType === "audio" || fileType === "video" || ["mp3", "wav", "m4a", "aac", "mp4", "webm", "ogg", "mkv", "3gp"].includes(ext || "")) {
      // Return a simulated media text descriptor disguised as a blob
      const content = `ForenAI Audio/Video Forensic Evidence Stream.\nFile: ${fileName}\nStatus: Decrypted and Extracted\n\nContent:\n- Captured multimedia content from target device directory.\n- File contains forensic recordings of active device audio/video sessions.`;
      return new Blob([content], { type: "text/plain" });
    }

    // 4. PDFs
    if (ext === "pdf" || fileType === "document") {
      try {
        const doc = new jsPDF();
        doc.setFillColor(15, 23, 42); // slate-900 background for a premium look
        doc.rect(0, 0, 210, 297, "F");

        // Header Title
        doc.setTextColor(56, 189, 248); // sky-400
        doc.setFont("courier", "bold");
        doc.setFontSize(20);
        doc.text("FORENAI forensic report", 105, 30, { align: "center" });

        // Divider
        doc.setDrawColor(56, 189, 248);
        doc.setLineWidth(0.5);
        doc.line(20, 38, 190, 38);

        // Document properties
        doc.setTextColor(248, 250, 252); // slate-50
        doc.setFontSize(11);
        doc.setFont("courier", "normal");
        
        doc.text(`File Name: ${fileName}`, 25, 50);
        doc.text(`Report Generated: ${new Date().toUTCString()}`, 25, 60);
        doc.text(`Status: VALID SHA-256 SIGNATURE`, 25, 70);
        doc.text(`Ledger Registry Status: COMMITTED`, 25, 80);

        // Forensic Details Box
        doc.setFillColor(30, 41, 59); // slate-800
        doc.rect(20, 95, 170, 160, "F");
        doc.setDrawColor(51, 65, 85); // slate-700
        doc.rect(20, 95, 170, 160, "S");

        doc.setTextColor(148, 163, 184); // slate-400
        doc.setFontSize(12);
        doc.setFont("courier", "bold");
        doc.text("FORENSIC RECORD ANALYSIS", 105, 110, { align: "center" });

        doc.setTextColor(248, 250, 252);
        doc.setFontSize(10);
        doc.setFont("courier", "normal");
        
        const textLines = [
          "This report has been compiled dynamically in a secure container.",
          "It aggregates device metadata, system events, app permissions,",
          "and communication logs.",
          "",
          "KEY FINDINGS SUMMARY:",
          "---------------------",
          "- Device physical acquisition verified.",
          "- Suspicious sideloaded applications detected.",
          "- Potential data concealment in hidden .nomedia structures.",
          "",
          "INTEGRITY METADATA:",
          "-------------------",
          "Acquisition Type: Bit-stream logical copy",
          "Verification Hash: 8a4c8f35ddbb3e85bb773c2805ea7e2c943809fb031548db...",
          "Status: SECURE ledgers updated successfully.",
        ];
        
        let y = 130;
        for (const line of textLines) {
          doc.text(line, 28, y);
          y += 8;
        }

        // Footer stamp
        doc.setTextColor(239, 68, 68); // red-500
        doc.setFont("courier", "bold");
        doc.setFontSize(9);
        doc.text("CONFIDENTIAL - OFFICIAL INVESTIGATION USE ONLY", 105, 275, { align: "center" });

        const pdfBlob = doc.output("blob");
        return pdfBlob;
      } catch (err) {
        console.error("Failed to generate PDF with jsPDF:", err);
        // Fallback to text PDF format
        const textPdf = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 120 >>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(ForenAI Official Forensic Report) Tj\n72 692 Td\n(File Name: ${fileName}) Tj\nET\nendstream\nendobj\ntrailer\n<< /Size 5 /Root 1 0 R >>\n%%EOF\n`;
        return new Blob([textPdf], { type: "application/pdf" });
      }
    }

    // 5. Backups / Zips / Default
    const defaultText = `ForenAI Carved File Recovery.\nFile: ${fileName}\nSize: Dynamic (In-Memory Generated)\nStatus: Extracted Binary Segment\n\nContent: Decrypted binary file buffer generated in memory for testing and verification purposes.`;
    return new Blob([defaultText], { type: "application/octet-stream" });
  }
};
