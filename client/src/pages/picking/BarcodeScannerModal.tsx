import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Modal, Button, Input, Select, Space, Alert, Typography, Tooltip } from 'antd';
import {
  CameraOutlined,
  ThunderboltOutlined,
  SwapOutlined,
  EnterOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import { myColor } from 'color';

const { Text } = Typography;

interface BarcodeScannerModalProps {
  open: boolean;
  onCancel: () => void;
  onScan: (barcode: string) => void;
}

// Hàm phát tiếng beep ngắn thông báo đã quét thành công
const playBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880; // Tần số nốt A5
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore audio errors
  }

  try {
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  } catch {
    // Ignore vibrate errors
  }
};

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ open, onCancel, onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const barcodeDetectorIntervalRef = useRef<number | null>(null);

  const [devices, setDevices] = useState<{ deviceId: string; label: string }[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Dừng camera và dọn dẹp
  const stopScanning = useCallback(() => {
    isScanningRef.current = false;

    if (barcodeDetectorIntervalRef.current) {
      window.clearInterval(barcodeDetectorIntervalRef.current);
      barcodeDetectorIntervalRef.current = null;
    }

    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch {
        // ignore
      }
      controlsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setTorchOn(false);
    setHasTorch(false);
  }, []);

  const handleDetected = useCallback(
    (code: string) => {
      const trimmed = (code || '').trim();
      if (!trimmed) return;

      if (soundEnabled) {
        playBeep();
      }

      stopScanning();
      onScan(trimmed);
    },
    [onScan, soundEnabled, stopScanning]
  );

  // Bắt đầu quét camera
  const startScanning = useCallback(
    async (deviceIdToUse?: string) => {
      stopScanning();
      setCameraError(null);

      if (!videoRef.current) return;

      try {
        // Cấu hình ZXing Hints hỗ trợ đầy đủ các định dạng mã 1D & 2D
        const hints = new Map<DecodeHintType, any>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_93,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.ITF,
          BarcodeFormat.CODABAR,
          BarcodeFormat.QR_CODE,
          BarcodeFormat.DATA_MATRIX,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        // Chuẩn bị MediaStream constraints với độ phân giải cao cho mã 1D
        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          facingMode: deviceIdToUse ? undefined : { ideal: 'environment' },
          deviceId: deviceIdToUse ? { exact: deviceIdToUse } : undefined,
        };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Kiểm tra khả năng bật đèn Flash (Torch) và Focus
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          try {
            const capabilities = (videoTrack.getCapabilities && videoTrack.getCapabilities()) || {};
            if ((capabilities as any).torch) {
              setHasTorch(true);
            }
            if ((capabilities as any).focusMode?.includes('continuous')) {
              await videoTrack.applyConstraints({
                advanced: [{ focusMode: 'continuous' } as any],
              });
            }
          } catch {
            // Ignore capability check errors
          }
        }

        isScanningRef.current = true;

        // Ưu tiên sử dụng native BarcodeDetector của trình duyệt (cực nhanh và chính xác với mã 1D)
        const hasNativeBarcodeDetector = 'BarcodeDetector' in window;
        if (hasNativeBarcodeDetector) {
          try {
            const barcodeDetector = new (window as any).BarcodeDetector({
              formats: [
                'code_128',
                'code_39',
                'code_93',
                'codabar',
                'ean_13',
                'ean_8',
                'itf',
                'upc_a',
                'upc_e',
                'qr_code',
                'data_matrix',
              ],
            });

            barcodeDetectorIntervalRef.current = window.setInterval(async () => {
              if (!isScanningRef.current || !videoRef.current) return;
              try {
                if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                  const barcodes = await barcodeDetector.detect(videoRef.current);
                  if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                    handleDetected(barcodes[0].rawValue);
                  }
                }
              } catch {
                // Ignore detection frame error
              }
            }, 100);
          } catch (e) {
            console.warn('Native BarcodeDetector not initialized, falling back to ZXing', e);
          }
        }

        // Đồng thời khởi chạy ZXing BrowserMultiFormatReader làm engine quét chính/dự phòng
        const codeReader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 80,
          delayBetweenScanSuccess: 500,
        });

        const controls = await codeReader.decodeFromStream(
          stream,
          videoRef.current,
          (result, err) => {
            if (!isScanningRef.current) return;
            if (result) {
              handleDetected(result.getText());
            }
          }
        );

        controlsRef.current = controls;

        // Lấy danh sách camera có sẵn
        try {
          const deviceList = await navigator.mediaDevices.enumerateDevices();
          const videoDevs = deviceList
            .filter((d) => d.kind === 'videoinput')
            .map((d, index) => ({
              deviceId: d.deviceId,
              label: d.label || `Camera ${index + 1}`,
            }));
          setDevices(videoDevs);
          if (videoDevs.length > 0 && !selectedDeviceId) {
            const currentTrack = stream.getVideoTracks()[0];
            const currentId = currentTrack?.getSettings()?.deviceId || videoDevs[0].deviceId;
            setSelectedDeviceId(currentId);
          }
        } catch {
          // Ignore enumerateDevices error
        }
      } catch (err: any) {
        console.error('Lỗi truy cập camera:', err);
        setCameraError(
          err?.name === 'NotAllowedError'
            ? 'Quyền truy cập camera bị từ chối. Vui lòng cấp quyền camera trong cài đặt trình duyệt.'
            : 'Không thể kết nối đến camera. Bạn có thể nhập mã barcode thủ công bên dưới.'
        );
      }
    },
    [stopScanning, handleDetected, selectedDeviceId]
  );

  // Toggle flash torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !torchOn;
      await track.applyConstraints({
        advanced: [{ torch: nextTorch } as any],
      });
      setTorchOn(nextTorch);
    } catch {
      // Ignore torch error
    }
  };

  // Khởi động camera khi modal mở
  useEffect(() => {
    if (open) {
      setManualCode('');
      // Delay nhỏ để Modal mount xong thẻ video
      const t = setTimeout(() => {
        startScanning(selectedDeviceId || undefined);
      }, 200);
      return () => {
        clearTimeout(t);
        stopScanning();
      };
    } else {
      stopScanning();
    }
  }, [open, selectedDeviceId, startScanning, stopScanning]);

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) return;
    handleDetected(code);
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        stopScanning();
        onCancel();
      }}
      footer={null}
      centered
      destroyOnClose
      width={480}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
          <Space>
            <CameraOutlined style={{ color: myColor.buttonColor, fontSize: 18 }} />
            <span style={{ fontWeight: 600 }}>Quét mã barcode sản phẩm</span>
          </Space>
          <Tooltip title={soundEnabled ? 'Tắt âm thanh quét' : 'Bật âm thanh quét'}>
            <Button
              type="text"
              size="small"
              icon={<SoundOutlined style={{ color: soundEnabled ? myColor.buttonColor : '#999' }} />}
              onClick={() => setSoundEnabled((prev) => !prev)}
            />
          </Tooltip>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Device selector và Torch button */}
        {devices.length > 1 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Select
              size="middle"
              style={{ flex: 1 }}
              value={selectedDeviceId}
              onChange={(val) => {
                setSelectedDeviceId(val);
                startScanning(val);
              }}
              options={devices.map((d) => ({
                label: d.label,
                value: d.deviceId,
              }))}
              suffixIcon={<SwapOutlined />}
            />
            {hasTorch && (
              <Button
                icon={<ThunderboltOutlined />}
                type={torchOn ? 'primary' : 'default'}
                onClick={toggleTorch}
                style={{
                  backgroundColor: torchOn ? '#faad14' : undefined,
                  borderColor: torchOn ? '#faad14' : undefined,
                }}
              >
                {torchOn ? 'Tắt Flash' : 'Bật Flash'}
              </Button>
            )}
          </div>
        )}

        {/* Video Scanner Container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 280,
            backgroundColor: '#000',
            borderRadius: 12,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Vùng hướng dẫn ngắm barcode (Overlay Frame) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              height: '55%',
              border: '2px solid rgba(255, 255, 255, 0.85)',
              borderRadius: 8,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* 4 góc viền màu vàng/cam tạo điểm nhấn */}
            <div style={{ position: 'absolute', top: -2, left: -2, width: 16, height: 16, borderTop: '3px solid #52c41a', borderLeft: '3px solid #52c41a' }} />
            <div style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderTop: '3px solid #52c41a', borderRight: '3px solid #52c41a' }} />
            <div style={{ position: 'absolute', bottom: -2, left: -2, width: 16, height: 16, borderBottom: '3px solid #52c41a', borderLeft: '3px solid #52c41a' }} />
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderBottom: '3px solid #52c41a', borderRight: '3px solid #52c41a' }} />

            {/* Đường quét laser màu đỏ chuyển động */}
            <div
              style={{
                width: '95%',
                height: 2,
                backgroundColor: '#ff4d4f',
                boxShadow: '0 0 8px 2px rgba(255, 77, 79, 0.8)',
                animation: 'scanLine 2s infinite ease-in-out',
              }}
            />
          </div>

          <style>
            {`
              @keyframes scanLine {
                0% { transform: translateY(-40px); opacity: 0.3; }
                50% { transform: translateY(40px); opacity: 1; }
                100% { transform: translateY(-40px); opacity: 0.3; }
              }
            `}
          </style>

          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 0,
              right: 0,
              textAlign: 'center',
              color: '#fff',
              fontSize: 12,
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              pointerEvents: 'none',
            }}
          >
            Hướng camera vào mã vạch barcode (Code 128, EAN, UPC...)
          </div>
        </div>

        {cameraError && (
          <Alert message={cameraError} type="warning" showIcon closable style={{ fontSize: 13 }} />
        )}

        {/* Nhập thủ công hoặc máy quét mã vạch cầm tay */}
        <div style={{ marginTop: 4 }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            Hoặc nhập barcode / dùng máy quét cầm tay:
          </Text>
          <Input.Search
            placeholder="Nhập mã barcode sản phẩm..."
            size="large"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onSearch={handleManualSubmit}
            enterButton={
              <Button type="primary" icon={<EnterOutlined />} style={{ backgroundColor: myColor.buttonColor }}>
                Xác nhận
              </Button>
            }
          />
        </div>
      </div>
    </Modal>
  );
};

export default BarcodeScannerModal;

