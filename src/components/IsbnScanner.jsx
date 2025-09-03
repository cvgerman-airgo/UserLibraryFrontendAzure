import React from "react";
import QrReader from "react-qr-scanner";

export default function IsbnScanner({ onDetected, onClose }) {
  const handleScan = (result) => {
    if (result && result.text) {
      // Solo aceptar códigos EAN13 (ISBN-13)
      const code = result.text.replace(/[^0-9]/g, "");
      if (/^97[89][0-9]{10}$/.test(code)) {
        onDetected(code);
      }
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 16, maxWidth: 350, width: '90%', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 12, fontSize: 22, background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>&times;</button>
        <h3 style={{ textAlign: 'center', marginBottom: 8 }}>Escanea el código de barras ISBN</h3>
        <QrReader
          delay={300}
          style={{ width: '100%' }}
          onError={onClose}
          onScan={handleScan}
          constraints={{ facingMode: 'environment' }}
        />
        <div style={{ textAlign: 'center', fontSize: 13, color: '#666', marginTop: 8 }}>
          Apunta la cámara al código de barras del libro
        </div>
      </div>
    </div>
  );
}
