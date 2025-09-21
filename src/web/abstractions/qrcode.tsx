import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
}

/**
 * QRCode component for web using the qrcode library with canvas rendering.
 * Compatible with react-native-qrcode-svg API for cross-platform usage.
 */
export function QRCodeCanvas({ value, size = 200, backgroundColor = 'white', color = 'black' }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: color === 'black' ? '#000000' : color,
          light: backgroundColor === 'white' ? '#FFFFFF' : backgroundColor,
        },
      }).catch((err) => {
        console.error('QR Code generation error:', err);
      });
    }
  }, [value, size, backgroundColor, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        maxWidth: '100%',
        height: 'auto',
      }}
    />
  );
}

// Export with the same name as the mobile version for compatibility
export { QRCodeCanvas as default };