import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Modal,
  Input,
  Button,
  Segmented,
  Table,
  Tag,
  Typography,
  Spin,
  Space,
  Empty,
  Card,
  Skeleton,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  ScanOutlined,
  ReloadOutlined,
  BarcodeOutlined,
  EnvironmentOutlined,
  InboxOutlined,
  FileSearchOutlined,
  CloseCircleOutlined,
  DownOutlined,
  UpOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { pickingService } from '../../services/pickingService';
import {
  StorableProduct,
  ProductStockReport,
  StockReportGroup,
  StockReportChild,
} from '../../interface/picking';
import BarcodeScannerModal from './BarcodeScannerModal';
import { myColor } from '../../color';

const { Text } = Typography;

interface StockReportModalProps {
  open: boolean;
  onCancel: () => void;
}

type DrilldownMode = 'lot' | 'location';

interface StockSummaryState {
  totalQuantity: number;
  uom: string;
}

const StockReportModal: React.FC<StockReportModalProps> = ({ open, onCancel }) => {
  const auth = useSelector((state: RootState) => (state as any).auth);
  const companyId = auth?.company_id
    ? Array.isArray(auth.company_id)
      ? auth.company_id[0]
      : auth.company_id
    : undefined;

  // Search & scanner state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<StorableProduct[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  // Selected product & summary state (Giai đoạn 1: Chỉ lấy số tổng)
  const [selectedProduct, setSelectedProduct] = useState<StorableProduct | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<StockSummaryState | null>(null);

  // Details state (Giai đoạn 2: User bấm mới tải và hiển thị chi tiết)
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [detailsData, setDetailsData] = useState<ProductStockReport | null>(null);
  const [drilldownMode, setDrilldownMode] = useState<DrilldownMode>('lot');

  const searchTimerRef = useRef<number | null>(null);
  // Cache RAM ở client để hiển thị tức thì khi người dùng chuyển đổi hoặc xem lại sản phẩm
  const summaryCacheRef = useRef<Map<number, StockSummaryState>>(new Map());
  const detailsCacheRef = useRef<Map<number, ProductStockReport>>(new Map());
  const searchCacheRef = useRef<Map<string, StorableProduct[]>>(new Map());

  // Reset state khi modal đóng
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setSearchResults([]);
      setSelectedProduct(null);
      setSummaryData(null);
      setShowDetails(false);
      setDetailsData(null);
      setDrilldownMode('lot');
    }
  }, [open]);

  // Tìm kiếm sản phẩm storable với debounce ngắn (150ms) + cache kết quả
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }

    const trimmed = value.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const cached = searchCacheRef.current.get(trimmed.toLowerCase());
    if (cached) {
      setSearchResults(cached);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimerRef.current = window.setTimeout(async () => {
      try {
        const results = await pickingService.searchStorableProducts(trimmed, 20);
        const data = results || [];
        searchCacheRef.current.set(trimmed.toLowerCase(), data);
        setSearchResults(data);
      } catch (err: any) {
        message.error(err?.message || 'Lỗi khi tìm kiếm sản phẩm');
      } finally {
        setSearching(false);
      }
    }, 150);
  };

  // BƯỚC 1: Chỉ tải số TỔNG TỒN (cực nhanh qua Odoo read_group)
  const loadStockSummary = useCallback(
    async (product: StorableProduct, forceRefresh: boolean = false) => {
      setSelectedProduct(product);
      setShowDetails(false);
      setDetailsData(null);

      const cached = summaryCacheRef.current.get(product.id);
      if (cached && !forceRefresh) {
        setSummaryData(cached);
        setLoadingSummary(false);
        return;
      }

      setLoadingSummary(true);
      try {
        const res = await pickingService.getProductStockSummary(product.id, companyId);
        const summary: StockSummaryState = {
          totalQuantity: res.totalQuantity || 0,
          uom: res.product?.uom || product.uom || '',
        };
        summaryCacheRef.current.set(product.id, summary);
        setSummaryData(summary);
      } catch (err: any) {
        message.error(err?.message || 'Không thể lấy số tổng tồn kho');
      } finally {
        setLoadingSummary(false);
      }
    },
    [companyId]
  );

  // BƯỚC 2: Khi user chủ động bấm "Xem chi tiết" mới tải dữ liệu phân cấp lô/địa điểm
  const handleLoadDetails = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!selectedProduct) return;
      setShowDetails(true);

      const cached = detailsCacheRef.current.get(selectedProduct.id);
      if (cached && !forceRefresh) {
        setDetailsData(cached);
        setLoadingDetails(false);
        return;
      }

      setLoadingDetails(true);
      try {
        const report = await pickingService.getProductStockReport(selectedProduct.id, companyId);
        detailsCacheRef.current.set(selectedProduct.id, report);
        setDetailsData(report);
      } catch (err: any) {
        message.error(err?.message || 'Không thể tải chi tiết lô và địa điểm');
      } finally {
        setLoadingDetails(false);
      }
    },
    [selectedProduct, companyId]
  );

  // Quét barcode từ camera: trực tiếp tìm và mở số tổng ngay lập tức
  const handleBarcodeScanned = async (barcode: string) => {
    setIsScannerOpen(false);
    if (!barcode) return;
    const trimmed = barcode.trim();
    setSearchTerm(trimmed);
    setSearching(true);

    try {
      const results = await pickingService.searchStorableProducts(trimmed, 20);
      const data = results || [];
      searchCacheRef.current.set(trimmed.toLowerCase(), data);
      setSearchResults(data);

      if (data.length === 1) {
        loadStockSummary(data[0]);
      } else if (data.length > 1) {
        const exactMatch = data.find(
          (p) => p.barcode && p.barcode.toLowerCase() === trimmed.toLowerCase()
        );
        if (exactMatch) {
          loadStockSummary(exactMatch);
        } else {
          message.info(`Tìm thấy ${data.length} sản phẩm, vui lòng chọn`);
        }
      } else {
        message.warning(`Không tìm thấy sản phẩm có barcode "${trimmed}"`);
      }
    } catch (err: any) {
      message.error(err?.message || 'Lỗi khi tìm kiếm theo mã vạch');
    } finally {
      setSearching(false);
    }
  };

  // Cấu hình các cột cho Bảng qua useMemo
  const currentUom = summaryData?.uom || selectedProduct?.uom || '';
  const columns: ColumnsType<StockReportGroup | StockReportChild> = useMemo(() => [
    {
      title: drilldownMode === 'lot' ? 'Lô / Vị trí lưu' : 'Địa điểm / Lô hàng',
      dataIndex: 'name',
      key: 'name',
      render: (_: any, record: any) => {
        const isParent = Array.isArray(record.children);
        if (isParent) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {drilldownMode === 'lot' ? (
                <InboxOutlined style={{ color: myColor.buttonColor, fontSize: 15, flexShrink: 0 }} />
              ) : (
                <EnvironmentOutlined style={{ color: myColor.buttonColor, fontSize: 15, flexShrink: 0 }} />
              )}
              <Text strong style={{ fontSize: 13, wordBreak: 'break-word' }}>
                {record.lotName || record.locationName || record.name}
              </Text>
              <Tag
                color="blue"
                style={{
                  borderRadius: 10,
                  fontSize: 11,
                  padding: '0 6px',
                  margin: 0,
                  lineHeight: '18px',
                }}
              >
                {record.children.length} {drilldownMode === 'lot' ? 'vị trí' : 'lô'}
              </Tag>
            </div>
          );
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 12 }}>
            <span style={{ color: '#bbb', fontSize: 11 }}>└─</span>
            {drilldownMode === 'lot' ? (
              <EnvironmentOutlined style={{ color: '#888', fontSize: 13, flexShrink: 0 }} />
            ) : (
              <InboxOutlined style={{ color: '#888', fontSize: 13, flexShrink: 0 }} />
            )}
            <Text style={{ fontSize: 12, color: '#333', wordBreak: 'break-word' }}>
              {record.locationName || record.lotName || record.name}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Tồn kho',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 110,
      align: 'right',
      render: (val: number, record: any) => {
        const isParent = Array.isArray(record.children);
        const isNegative = val < 0;
        const textColor = isNegative
          ? '#cf1322'
          : isParent
          ? '#0958d9'
          : '#1f2937';

        return (
          <div style={{ textAlign: 'right' }}>
            <Text
              strong={isParent || isNegative}
              style={{
                color: textColor,
                fontSize: isParent ? 14 : 13,
                fontWeight: isNegative || isParent ? 700 : 500,
              }}
            >
              {val.toLocaleString('vi-VN')}
            </Text>
            <span style={{ fontSize: 11, color: isNegative ? '#cf1322' : '#8c8c8c', marginLeft: 3 }}>
              {currentUom}
            </span>
          </div>
        );
      },
    },
  ], [drilldownMode, currentUom]);

  const currentDataSource = useMemo(() => {
    if (!detailsData) return [];
    return drilldownMode === 'lot' ? detailsData.byLot : detailsData.byLocation;
  }, [detailsData, drilldownMode]);

  return (
    <>
      <Modal
        open={open}
        onCancel={onCancel}
        footer={null}
        width="100%"
        style={{ maxWidth: 580, top: 20, margin: '0 auto', padding: '0 8px' }}
        destroyOnClose
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600 }}>
            <FileSearchOutlined style={{ color: myColor.buttonColor, fontSize: 18 }} />
            <span>Tra cứu tồn kho</span>
          </div>
        }
        styles={{
          body: {
            maxHeight: 'calc(85vh - 60px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '8px 4px',
          },
        }}
      >
        {/* THANH TÌM KIẾM SẢN PHẨM HOẶC QUÉT MÃ */}
        <div style={{ marginBottom: 12 }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              size="middle"
              placeholder="Tên SP, barcode, mã SKU..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              allowClear
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onPressEnter={() => {
                if (searchResults.length > 0) {
                  loadStockSummary(searchResults[0]);
                }
              }}
            />
            <Button
              size="middle"
              type="primary"
              icon={<ScanOutlined />}
              onClick={() => setIsScannerOpen(true)}
              style={{
                backgroundColor: myColor.buttonColor,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Quét
            </Button>
          </Space.Compact>
        </div>

        {/* DANH SÁCH GỢI Ý KHI ĐANG TÌM KIẾM */}
        {searching && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <Spin tip="Đang tìm kiếm..." />
          </div>
        )}

        {!selectedProduct && !searching && searchResults.length > 0 && (
          <Card
            size="small"
            title={<span style={{ fontSize: 13, fontWeight: 600 }}>Kết quả ({searchResults.length})</span>}
            style={{ marginBottom: 12, borderColor: '#e6f4ff', borderRadius: 8 }}
            styles={{ body: { padding: '4px 8px' } }}
          >
            <div style={{ maxHeight: 260, overflowY: 'auto', overflowX: 'hidden' }}>
              {searchResults.map((p) => (
                <div
                  key={p.id}
                  onClick={() => loadStockSummary(p)}
                  style={{
                    padding: '8px 6px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    borderRadius: 6,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f6f8ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ fontWeight: 600, color: '#1677ff', fontSize: 13, wordBreak: 'break-word' }}>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 3 }}>
                    {p.default_code && (
                      <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                        {p.default_code}
                      </Tag>
                    )}
                    {p.barcode && (
                      <Tag icon={<BarcodeOutlined />} color="purple" style={{ margin: 0, fontSize: 11 }}>
                        {p.barcode}
                      </Tag>
                    )}
                    {p.uom && (
                      <Tag color="default" style={{ margin: 0, fontSize: 11 }}>
                        {p.uom}
                      </Tag>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!selectedProduct && !searching && searchTerm && searchResults.length === 0 && (
          <Empty
            description={`Không tìm thấy sản phẩm khớp với "${searchTerm}"`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ margin: '24px 0' }}
          />
        )}

        {!selectedProduct && !searchTerm && (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 12px',
              backgroundColor: '#fafafa',
              borderRadius: 8,
              border: '1px dashed #d9d9d9',
            }}
          >
            <ScanOutlined style={{ fontSize: 36, color: myColor.buttonColor, marginBottom: 8 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
              Quét barcode hoặc nhập tên sản phẩm
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              Hệ thống sẽ tra cứu nhanh số tổng tồn kho ngay lập tức
            </div>
          </div>
        )}

        {/* CHI TIẾT BÁO CÁO TỒN KHO CỦA SẢN PHẨM */}
        {selectedProduct && (
          <div>
            {/* THÔNG TIN SẢN PHẨM HIỂN THỊ TỨC THÌ (0ms) */}
            <div
              style={{
                marginBottom: 10,
                padding: '8px 10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', wordBreak: 'break-word' }}>
                  {selectedProduct.name}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
                  {selectedProduct.default_code && (
                    <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                      {selectedProduct.default_code}
                    </Tag>
                  )}
                  {selectedProduct.barcode && (
                    <Tag icon={<BarcodeOutlined />} color="purple" style={{ margin: 0, fontSize: 11 }}>
                      {selectedProduct.barcode}
                    </Tag>
                  )}
                  {(summaryData?.uom || selectedProduct.uom) && (
                    <Tag color="default" style={{ margin: 0, fontSize: 11 }}>
                      ĐVT: {summaryData?.uom || selectedProduct.uom}
                    </Tag>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  loading={loadingSummary || loadingDetails}
                  onClick={() => {
                    loadStockSummary(selectedProduct, true);
                    if (showDetails) {
                      handleLoadDetails(true);
                    }
                  }}
                  title="Tải lại mới nhất"
                />
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => {
                    setSelectedProduct(null);
                    setSummaryData(null);
                    setShowDetails(false);
                    setDetailsData(null);
                  }}
                  title="Đổi sản phẩm"
                >
                  Đổi
                </Button>
              </div>
            </div>

            {/* BƯỚC 1: BANNER TỔNG TỒN HIỆN TẠI (TÔ ĐỎ NẾU TỒN ÂM) */}
            {loadingSummary && !summaryData ? (
              <div style={{ padding: '12px 6px' }}>
                <Skeleton.Button active block style={{ height: 64, borderRadius: 8 }} />
              </div>
            ) : summaryData ? (
              (() => {
                const isTotalNegative = summaryData.totalQuantity < 0;
                return (
                  <div
                    style={{
                      marginBottom: 10,
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: isTotalNegative
                        ? 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)'
                        : 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
                      border: isTotalNegative ? '1px solid #ffa39e' : '1px solid #91caff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: isTotalNegative ? '#cf1322' : '#003eb3',
                          letterSpacing: 0.5,
                        }}
                      >
                        TỔNG TỒN HIỆN TẠI {isTotalNegative && '(TỒN ÂM)'}
                      </div>
                      <div style={{ fontSize: 11, color: isTotalNegative ? '#a8071a' : '#0958d9' }}>
                        Kho nội bộ công ty hiện tại
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: 24,
                          fontWeight: 800,
                          color: isTotalNegative ? '#cf1322' : '#002c8c',
                        }}
                      >
                        {summaryData.totalQuantity.toLocaleString('vi-VN')}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: isTotalNegative ? '#cf1322' : '#0958d9',
                          marginLeft: 4,
                        }}
                      >
                        {summaryData.uom}
                      </span>
                    </div>
                  </div>
                );
              })()
            ) : null}

            {/* BƯỚC 2: NÚT BẤM XEM CHI TIẾT KHI USER CÓ NHU CẦU */}
            {summaryData && !showDetails && (
              <div style={{ textAlign: 'center', margin: '14px 0 6px' }}>
                <Button
                  type="dashed"
                  icon={<BranchesOutlined style={{ color: myColor.buttonColor }} />}
                  onClick={() => handleLoadDetails(false)}
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 13,
                    color: myColor.buttonColor,
                    borderColor: '#91caff',
                    backgroundColor: '#f0f7ff',
                  }}
                >
                  Xem chi tiết theo Lô & Địa điểm <DownOutlined style={{ fontSize: 11, marginLeft: 4 }} />
                </Button>
              </div>
            )}

            {/* PHẦN HIỂN THỊ CHI TIẾT KHI USER ĐÃ BẤM */}
            {showDetails && (
              <div style={{ marginTop: 8 }}>
                {/* THANH ĐIỀU HƯỚNG PHƯƠNG PHÁP DRILLDOWN */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                    gap: 6,
                  }}
                >
                  <Segmented
                    size="small"
                    value={drilldownMode}
                    onChange={(val) => setDrilldownMode(val as DrilldownMode)}
                    options={[
                      {
                        label: 'Lô ➔ Địa điểm',
                        value: 'lot',
                        icon: <InboxOutlined />,
                      },
                      {
                        label: 'Địa điểm ➔ Lô',
                        value: 'location',
                        icon: <EnvironmentOutlined />,
                      },
                    ]}
                    style={{ fontWeight: 600 }}
                  />
                  <Button
                    size="small"
                    type="link"
                    icon={<UpOutlined style={{ fontSize: 10 }} />}
                    onClick={() => setShowDetails(false)}
                    style={{ padding: '0 4px', fontSize: 11, color: '#8c8c8c' }}
                  >
                    Thu gọn chi tiết
                  </Button>
                </div>

                {loadingDetails ? (
                  <div style={{ padding: '20px 0', textAlign: 'center' }}>
                    <Spin tip="Đang tải chi tiết vị trí & lô..." />
                  </div>
                ) : currentDataSource && currentDataSource.length > 0 ? (
                  <Table
                    columns={columns}
                    dataSource={currentDataSource}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    bordered
                    tableLayout="fixed"
                    expandable={{
                      defaultExpandAllRows: false,
                      expandRowByClick: true,
                      rowExpandable: (record: any) =>
                        Array.isArray(record.children) && record.children.length > 0,
                    }}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 8,
                      overflow: 'hidden',
                      width: '100%',
                    }}
                  />
                ) : (
                  <Empty
                    description="Không có tồn kho chi tiết tại các địa điểm nội bộ"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ margin: '16px 0' }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* SCANNER CAMERA MODAL */}
      <BarcodeScannerModal
        open={isScannerOpen}
        onCancel={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
      />
    </>
  );
};

export default StockReportModal;
