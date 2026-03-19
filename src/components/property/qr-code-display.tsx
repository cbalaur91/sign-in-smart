"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export function QRCodeDisplay({ url }: { url: string }) {
  const svgRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  function downloadQR() {
    if (!svgRef.current) return;
    const svg = svgRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx!.fillStyle = "#ffffff";
      ctx!.fillRect(0, 0, 512, 512);
      ctx!.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement("a");
      link.download = "signinsmart-qr.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={svgRef} className="rounded-lg bg-white p-4">
        <QRCodeSVG value={url} size={180} level="H" />
      </div>

      <div className="w-full">
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs text-muted-foreground"
          />
          <button
            onClick={copyLink}
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <button
        onClick={downloadQR}
        className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
      >
        Download QR Code
      </button>
    </div>
  );
}
