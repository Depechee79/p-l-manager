import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, Button } from '@/shared/components';
import { X, Camera } from 'lucide-react';

interface ProductScannerProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
    isVisible: boolean;
}

export const ProductScanner: React.FC<ProductScannerProps> = ({ onScan, onClose, isVisible }) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isVisible) {
            // Wait for DOM element to be available
            const timer = setTimeout(() => {
                try {
                    scannerRef.current = new Html5QrcodeScanner(
                        "reader",
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0,
                            showTorchButtonIfSupported: true,
                        },
                        /* verbose= */ false
                    );

                    scannerRef.current.render(
                        (decodedText) => {
                            onScan(decodedText);
                            // Auto close or keep open based on UX
                        },
                        () => {
                            // Suppress frequent errors
                        }
                    );
                } catch (err) {
                    setError("No se pudo iniciar la cámara. Asegúrate de dar permisos.");
                    console.error("Scanner Error:", err);
                }
            }, 100);

            return () => {
                clearTimeout(timer);
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(err => console.error("Failed to clear scanner:", err));
                }
            };
        }
    }, [isVisible, onScan]);

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-md)',
        }}>
            <Card style={{
                width: '100%',
                maxWidth: '500px',
                backgroundColor: 'var(--surface)',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <div style={{
                    padding: 'var(--spacing-md)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <Camera size={20} />
                        Escaneando QR / Código
                    </h3>
                    <Button variant="secondary" size="sm" onClick={onClose}><X size={18} /></Button>
                </div>

                <div style={{ padding: 'var(--spacing-md)' }}>
                    {error && (
                        <div style={{
                            color: 'var(--danger)',
                            marginBottom: 'var(--spacing-md)',
                            fontSize: 'var(--font-size-sm)',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}
                    <div id="reader" style={{ width: '100%' }}></div>
                    <div style={{
                        marginTop: 'var(--spacing-md)',
                        textAlign: 'center',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-secondary)'
                    }}>
                        Coloca el código del producto frente a la cámara
                    </div>
                </div>
            </Card>
        </div>
    );
};
