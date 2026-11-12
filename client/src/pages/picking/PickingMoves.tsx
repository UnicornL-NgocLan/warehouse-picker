import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Progress, Tag, Typography, Button, Empty, Skeleton, message, Alert, Modal } from 'antd';
import { BarcodeOutlined } from '@ant-design/icons';
import Header from 'widgets/Header';
import { pickingService } from 'services/pickingService';
import { Move, Picking } from 'interface/picking';
import { formatQty } from 'helpers/formatNumber';
import { getErrorMessage } from 'helpers/getErrorMessage';
import { myColor } from 'color';
import BarcodeScannerModal from './BarcodeScannerModal';

const { Text } = Typography;

// In-memory cache for moves per pickingId (SWR pattern for instant UI display)
const movesCache: Record<string, Move[]> = {};

export const clearMovesCache = (targetPickingId?: string) => {
  if (targetPickingId) {
    delete movesCache[targetPickingId];
  } else {
    Object.keys(movesCache).forEach((k) => delete movesCache[k]);
  }
};

const PickingMoves: React.FC = () => {
  const { pickingId } = useParams<{ pickingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const cachedMoves = pickingId ? movesCache[pickingId] : undefined;
  const [moves, setMoves] = useState<Move[]>(cachedMoves || []);
  const [loading, setLoading] = useState<boolean>(!cachedMoves);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);

  const passedPicking = (location.state as any)?.picking as Picking | undefined;
  const pickingTitle = passedPicking?.name || `Phiếu #${pickingId}`;

  const loadMoves = useCallback(
    async (showLoadingSpinner: boolean = true) => {
      if (!pickingId) return;
      try {
        if (showLoadingSpinner && !movesCache[pickingId]) {
          setLoading(true);
        }
        setErrorMsg(null);
        const data = await pickingService.getPickingMoves(parseInt(pickingId, 10));
        const freshMoves = data || [];
        movesCache[pickingId] = freshMoves;
        setMoves(freshMoves);
      } catch (err) {
        const msg = getErrorMessage(err);
        setErrorMsg(msg);
        message.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [pickingId]
  );

  useEffect(() => {
    // Luôn tải lại dữ liệu mới nhất khi mở lại màn hình
    loadMoves(!movesCache[pickingId || '']);
  }, [loadMoves, pickingId]);

  const handleScanBarcode = useCallback(
    (rawCode: string) => {
      const code = rawCode ? rawCode.trim() : '';
      setScannerOpen(false);
      if (!code) return;

      const matchedMove = moves.find(
        (m) => m.product?.barcode && m.product.barcode.trim().toLowerCase() === code.toLowerCase()
      );

      if (!matchedMove) {
        Modal.warning({
          title: 'Không tìm thấy sản phẩm',
          content: `Không tìm thấy sản phẩm có barcode "${code}" trong phiếu.`,
          okText: 'Đóng',
          centered: true,
        });
        return;
      }

      navigate(`/pickings/${pickingId}/moves/${matchedMove.id}`, {
        state: {
          move: matchedMove,
          pickingTitle,
          pickingState: passedPicking?.state || matchedMove.state,
          autoCreateIfEmpty: true,
        },
      });
    },
    [moves, navigate, pickingId, pickingTitle, passedPicking?.state]
  );

  const getProgressStatus = (ordered: number, picked: number) => {
    if (picked === 0) {
      return { percent: 0, strokeColor: '#bfbfbf', status: 'normal' as const };
    }
    if (ordered <= 0) {
      return { percent: 100, strokeColor: '#1890ff', status: 'normal' as const };
    }
    const percent = Math.min(100, Math.round((picked / ordered) * 100));
    if (picked < ordered) {
      return { percent, strokeColor: '#faad14', status: 'normal' as const };
    }
    if (picked === ordered) {
      return { percent: 100, strokeColor: '#52c41a', status: 'success' as const };
    }
    // picked > ordered
    return { percent: 100, strokeColor: '#1890ff', status: 'normal' as const };
  };

  return (
    <div
      style={{
        backgroundColor: myColor.backgroundColor,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        overflowX: 'hidden',
      }}
    >
      <Header
        title={pickingTitle}
        showBack
        onBack={() => navigate(-1)}
        onRefresh={() => loadMoves(true)}
        isRefreshing={loading}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 480,
          margin: '0 auto',
          padding: '10px 10px 24px 10px',
          boxSizing: 'border-box',
          flex: 1,
        }}
      >
        <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
            Danh sách sản phẩm cần soạn ({moves.length})
          </span>
          <Button
            type="primary"
            icon={<BarcodeOutlined />}
            onClick={() => setScannerOpen(true)}
            disabled={loading && moves.length === 0}
            style={{
              backgroundColor: myColor.buttonColor,
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Quét barcode
          </Button>
        </div>

        {errorMsg && (
          <Alert
            type="error"
            message={errorMsg}
            showIcon
            action={
              <Button size="small" type="primary" onClick={() => loadMoves(true)}>
                Thử lại
              </Button>
            }
            style={{ marginBottom: 10 }}
          />
        )}

        {loading && moves.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Card style={{ borderRadius: 10 }}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
            <Card style={{ borderRadius: 10 }}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
            <Card style={{ borderRadius: 10 }}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          </div>
        ) : moves.length === 0 ? (
          <div style={{ marginTop: 60, textAlign: 'center' }}>
            <Empty description="Không có sản phẩm nào trong phiếu kho" />
            <Button
              type="primary"
              style={{ marginTop: 16, backgroundColor: myColor.buttonColor }}
              onClick={() => loadMoves(true)}
            >
              Tải lại
            </Button>
          </div>
        ) : (
          moves.map((move) => {
            const { percent, strokeColor } = getProgressStatus(move.orderedQty, move.pickedQty);
            const isExceeded = move.orderedQty > 0 && move.pickedQty > move.orderedQty;
            const exceedQty = move.pickedQty - move.orderedQty;

            return (
              <Card
                key={move.id}
                hoverable
                onClick={() =>
                  navigate(`/pickings/${pickingId}/moves/${move.id}`, {
                    state: { move, pickingTitle, pickingState: passedPicking?.state || move.state },
                  })
                }
                style={{
                  marginBottom: 10,
                  borderRadius: 10,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  width: '100%',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
                bodyStyle={{ padding: '12px 14px' }}
              >
                <div style={{ marginBottom: 10 }}>
                  <Text
                    strong
                    style={{
                      fontSize: 16,
                      color: '#1a1a1a',
                      display: 'block',
                      wordBreak: 'break-word',
                      whiteSpace: 'normal',
                      lineHeight: '22px',
                    }}
                  >
                    {move.product.name}
                  </Text>
                  {move.packaging && (
                    <Tag color="cyan" style={{ marginTop: 4, fontSize: 12, borderRadius: 4 }}>
                      Đóng gói: {move.packaging.name}
                    </Tag>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 10,
                    fontSize: 14,
                  }}
                >
                  <div style={{ wordBreak: 'break-word' }}>
                    <span style={{ color: '#555', fontSize: 14 }}>Số lượng đặt: </span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#222' }}>
                      {formatQty(move.orderedQty)} {move.orderedUom}
                    </span>
                  </div>

                  <div style={{ wordBreak: 'break-word' }}>
                    <span style={{ color: '#555', fontSize: 14 }}>Đã soạn: </span>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        color:
                          move.pickedQty === 0
                            ? '#8c8c8c'
                            : move.pickedQty < move.orderedQty
                            ? '#d48806'
                            : move.pickedQty === move.orderedQty
                            ? '#389e0d'
                            : '#096dd9',
                      }}
                    >
                      {formatQty(move.pickedQty)} {move.pickedUom || move.orderedUom}
                    </span>
                    {isExceeded && (
                      <Tag
                        color="blue"
                        style={{ marginLeft: 6, fontSize: 11, padding: '1px 6px', lineHeight: '18px' }}
                      >
                        +{formatQty(exceedQty)}
                      </Tag>
                    )}
                  </div>
                </div>

                <Progress
                  percent={percent}
                  strokeColor={strokeColor}
                  showInfo={false}
                  size="small"
                  style={{ margin: 0 }}
                />
              </Card>
            );
          })
        )}
      </div>

      <BarcodeScannerModal
        open={scannerOpen}
        onCancel={() => setScannerOpen(false)}
        onScan={handleScanBarcode}
      />
    </div>
  );
};

export default PickingMoves;
