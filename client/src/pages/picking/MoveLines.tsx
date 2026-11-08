import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Typography,
  Empty,
  Skeleton,
  Modal,
  FloatButton,
  Alert,
  Image,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CameraOutlined, PictureOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import Header from 'widgets/Header';
import { pickingService } from 'services/pickingService';
import { Move, MoveLine, Ref } from 'interface/picking';
import { formatQty } from 'helpers/formatNumber';
import { formatLocationName } from 'helpers/formatLocation';
import { fileToBase64, uploadMultipleImagesToDropBox } from 'helpers/dropboxUpload';
import { getErrorMessage } from 'helpers/getErrorMessage';
import { myColor } from 'color';

const { Text } = Typography;

const MoveLines: React.FC = () => {
  const { pickingId, moveId } = useParams<{ pickingId: string; moveId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const passedMove = (location.state as any)?.move as Move | undefined;
  const pickingTitle = (location.state as any)?.pickingTitle as string | undefined;

  const [currentMove, setCurrentMove] = useState<Move | null>(passedMove || null);
  const [moveLines, setMoveLines] = useState<MoveLine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [editingLine, setEditingLine] = useState<MoveLine | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  // Location search state
  const [locationOptions, setLocationOptions] = useState<Ref[]>([]);
  const [fetchingLocations, setFetchingLocations] = useState<boolean>(false);

  // Lot search state
  const [lotOptions, setLotOptions] = useState<Ref[]>([]);
  const [fetchingLots, setFetchingLots] = useState<boolean>(false);

  // Images state for edit drawer
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputCameraRef = useRef<HTMLInputElement>(null);
  const fileInputGalleryRef = useRef<HTMLInputElement>(null);

  const [form] = Form.useForm();
  const listEndRef = useRef<HTMLDivElement>(null);

  // Calculate total picked from lines
  const totalPicked = useMemo(() => {
    return moveLines.reduce((acc, curr) => acc + (Number(curr.qtyDone) || 0), 0);
  }, [moveLines]);

  // Load move lines and refresh move data
  const loadData = useCallback(async () => {
    if (!moveId) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      const numMoveId = parseInt(moveId, 10);
      const lines = await pickingService.getMoveLines(numMoveId);
      setMoveLines(lines || []);

      // Also refresh the parent move data if pickingId exists
      if (pickingId) {
        try {
          const allMoves = await pickingService.getPickingMoves(parseInt(pickingId, 10));
          const found = allMoves.find((m) => m.id === numMoveId);
          if (found) {
            setCurrentMove(found);
          }
        } catch {
          // ignore move refresh error
        }
      }
    } catch (err) {
      const msg = getErrorMessage(err);
      setErrorMsg(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [moveId, pickingId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounced location search
  const searchLocations = useMemo(
    () =>
      debounce(async (searchQuery: string) => {
        setFetchingLocations(true);
        try {
          const locs = await pickingService.getLocations(searchQuery);
          setLocationOptions(locs || []);
        } catch {
          // ignore search error
        } finally {
          setFetchingLocations(false);
        }
      }, 300),
    []
  );

  // Debounced lot search
  const searchLots = useMemo(
    () =>
      debounce(async (productId: number, searchQuery: string) => {
        setFetchingLots(true);
        try {
          const lots = await pickingService.getLots(productId, searchQuery);
          setLotOptions(lots || []);
        } catch {
          // ignore search error
        } finally {
          setFetchingLots(false);
        }
      }, 300),
    []
  );

  // Open Edit Drawer
  const handleOpenEdit = useCallback(
    (line: MoveLine) => {
      form.resetFields();
      setEditingLine(line);
      setDrawerError(null);
      setSelectedImages([]);
      setUploadStatus('');

      // Prepopulate options with current line's location and lot
      const initialLocs: Ref[] = [];
      if (line.location && line.location.id) {
        initialLocs.push(line.location);
      }
      setLocationOptions(initialLocs);
      searchLocations('');

      if (line.tracking !== 'none') {
        const initialLots: Ref[] = [];
        if (line.lot && line.lot.id) {
          initialLots.push(line.lot);
        }
        setLotOptions(initialLots);
        searchLots(line.productId, '');
      }

      form.setFieldsValue({
        locationDest: line.locationDest?.name || 'Không xác định',
        locationId: line.location?.id,
        lotId: line.lot?.id || null,
        qtyDone: line.qtyDone ? String(line.qtyDone) : '0',
      });

      setIsDrawerOpen(true);
    },
    [form, searchLocations, searchLots]
  );

  // Handle image files selection from Camera or Gallery
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const newBase64List: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await fileToBase64(file);
        newBase64List.push(base64);
      }
      setSelectedImages((prev) => [...prev, ...newBase64List]);
    } catch (err) {
      message.error('Không thể đọc hình ảnh đã chọn');
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Handle Create Move Line
  const handleCreate = async () => {
    if (!moveId || creating) return;
    try {
      setCreating(true);
      const newLine = await pickingService.createMoveLine(parseInt(moveId, 10));
      message.success('Đã tạo dòng soạn hàng mới');

      // Append new line and open drawer
      setMoveLines((prev) => [...prev, newLine]);

      // Scroll to bottom
      setTimeout(() => {
        listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // Open drawer for the newly created line
      handleOpenEdit(newLine);

      // Reload to ensure full sync
      loadData();
    } catch (err) {
      const msg = getErrorMessage(err);
      message.error(msg);
    } finally {
      setCreating(false);
    }
  };

  // Handle Save (Submit Drawer)
  const handleSave = async () => {
    if (!editingLine) return;
    try {
      const values = await form.validateFields();
      setDrawerError(null);

      // Normalize qty
      let rawQty = values.qtyDone;
      if (typeof rawQty === 'string') {
        rawQty = rawQty.trim().replace(',', '.');
      }
      const parsedQty = Number(rawQty);

      if (isNaN(parsedQty) || !isFinite(parsedQty) || parsedQty < 0) {
        setDrawerError('Số lượng phải là số hữu hạn lớn hơn hoặc bằng 0');
        return;
      }

      // Check if values actually changed
      const locationChanged = editingLine.location?.id !== values.locationId;
      const lotChanged = (editingLine.lot?.id || null) !== (values.lotId || null);
      const qtyChanged = Number(editingLine.qtyDone) !== parsedQty;
      const hasNewImages = selectedImages.length > 0;

      if (!locationChanged && !lotChanged && !qtyChanged && !hasNewImages) {
        // Nothing changed, close drawer
        setIsDrawerOpen(false);
        setEditingLine(null);
        form.resetFields();
        setSelectedImages([]);
        setUploadStatus('');
        return;
      }

      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        try {
          setUploadingImages(true);
          setUploadStatus(`Đang tải ảnh lên Dropbox (0/${selectedImages.length})...`);
          imageUrls = await uploadMultipleImagesToDropBox(selectedImages, (curr, total) => {
            setUploadStatus(`Đang tải ảnh lên Dropbox (${curr}/${total})...`);
          });
        } catch (uploadErr) {
          const msg = getErrorMessage(uploadErr);
          setDrawerError(msg);
          message.error(msg);
          setUploadingImages(false);
          setUploadStatus('');
          return;
        } finally {
          setUploadingImages(false);
          setUploadStatus('');
        }
      }

      setSubmitting(true);
      const updated = await pickingService.updateMoveLine(editingLine.id, {
        locationId: values.locationId,
        lotId: values.lotId,
        qtyDone: parsedQty,
        imageUrls,
      });

      message.success('Đã cập nhật dòng soạn hàng');
      setIsDrawerOpen(false);
      setEditingLine(null);
      form.resetFields();
      setSelectedImages([]);
      setUploadStatus('');

      // Update state locally & reload
      setMoveLines((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      loadData();
    } catch (err: any) {
      if (err?.errorFields) {
        // Form validation error
        return;
      }
      const msg = getErrorMessage(err);
      setDrawerError(msg);
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Move Line
  const handleDelete = (line: MoveLine) => {
    const lotLabel = line.lot ? `Lô: ${line.lot.name}` : 'Chưa có lô';
    const qtyLabel = `${formatQty(line.qtyDone)} ${line.uom}`;

    Modal.confirm({
      title: 'Xác nhận xóa dòng soạn hàng',
      content: (
        <div>
          <p>Bạn có chắc chắn muốn xóa dòng soạn hàng này không?</p>
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#f5f5f5',
              borderRadius: 6,
              fontSize: 14,
            }}
          >
            <div>
              <strong>Số lượng:</strong> {qtyLabel}
            </div>
            {line.tracking !== 'none' && (
              <div>
                <strong>Số lô:</strong> {lotLabel}
              </div>
            )}
            <div>
              <strong>Địa điểm nguồn:</strong> {formatLocationName(line.location?.name)}
            </div>
          </div>
        </div>
      ),
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await pickingService.deleteMoveLine(line.id);
          message.success('Đã xóa dòng soạn hàng');
          setMoveLines((prev) => prev.filter((l) => l.id !== line.id));
          loadData();
        } catch (err) {
          const msg = getErrorMessage(err);
          message.error(msg);
        }
      },
    });
  };

  const productName = currentMove?.product?.name || 'Chi tiết soạn hàng';
  const orderedQty = currentMove?.orderedQty || 0;
  const orderedUom = currentMove?.orderedUom || (moveLines.length > 0 ? moveLines[0].uom : '');

  return (
    <div
      style={{
        backgroundColor: myColor.backgroundColor,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: 72,
        width: '100%',
        overflowX: 'hidden',
      }}
    >
      <Header
        title={pickingTitle || 'Chi tiết soạn hàng'}
        showBack
        onBack={() => navigate(-1)}
        onRefresh={loadData}
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
        {/* Summary Card */}
        <Card
          style={{
            marginBottom: 12,
            borderRadius: 12,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            backgroundColor: '#fff',
            width: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
          bodyStyle={{ padding: '12px 14px' }}
        >
          <Text
            strong
            style={{
              fontSize: 15,
              color: '#1a1a1a',
              display: 'block',
              marginBottom: 10,
              wordBreak: 'break-word',
              whiteSpace: 'normal',
            }}
          >
            {productName}
          </Text>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f9f9fb',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            <div>
              <div style={{ color: '#888', fontSize: 12 }}>Số lượng đặt</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#333' }}>
                {formatQty(orderedQty)} <span style={{ fontSize: 13, fontWeight: 500 }}>{orderedUom}</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#888', fontSize: 12 }}>Đã soạn</div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  color:
                    totalPicked === 0
                      ? '#8c8c8c'
                      : totalPicked < orderedQty
                      ? '#d48806'
                      : totalPicked === orderedQty
                      ? '#389e0d'
                      : '#096dd9',
                }}
              >
                {formatQty(totalPicked)} <span style={{ fontSize: 13, fontWeight: 500 }}>{orderedUom}</span>
              </div>
            </div>
          </div>
        </Card>

        {errorMsg && (
          <Alert
            type="error"
            message={errorMsg}
            showIcon
            action={
              <Button size="small" type="primary" onClick={loadData}>
                Thử lại
              </Button>
            }
            style={{ marginBottom: 12 }}
          />
        )}

        {loading && moveLines.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Card style={{ borderRadius: 10 }}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
            <Card style={{ borderRadius: 10 }}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          </div>
        ) : moveLines.length === 0 ? (
          <div style={{ marginTop: 40, textAlign: 'center' }}>
            <Empty description="Chưa có dòng soạn hàng. Bấm + để thêm." />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              loading={creating}
              onClick={handleCreate}
              style={{
                marginTop: 16,
                backgroundColor: myColor.buttonColor,
                height: 44,
                borderRadius: 8,
                padding: '0 24px',
              }}
            >
              Thêm dòng soạn hàng
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {moveLines.map((line, index) => {
              return (
                <Card
                  key={line.id}
                  style={{
                    borderRadius: 10,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    width: '100%',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                  }}
                  bodyStyle={{ padding: '12px 14px' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: 8,
                      borderBottom: '1px solid #f0f0f0',
                      paddingBottom: 8,
                      flexWrap: 'wrap',
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 13, color: '#888' }}>Dòng #{index + 1}</span>
                    <div style={{ fontSize: 18, fontWeight: 700, color: myColor.buttonColor }}>
                      {formatQty(line.qtyDone)}{' '}
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#666' }}>{line.uom}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: '#555', display: 'flex', flexDirection: 'column', gap: 4, wordBreak: 'break-word' }}>
                    {line.tracking !== 'none' && (
                      <div>
                        <strong style={{ color: '#333' }}>Số lô: </strong>
                        <span style={{ color: line.lot ? '#1890ff' : '#8c8c8c' }}>
                          {line.lot ? line.lot.name : 'Chưa chọn lô'}
                        </span>
                      </div>
                    )}
                    <div>
                      <strong style={{ color: '#333' }}>Địa điểm nguồn: </strong>
                      <span>{formatLocationName(line.location?.name) || 'Chưa xác định'}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#333' }}>Địa điểm đích: </strong>
                      <span>{formatLocationName(line.locationDest?.name) || 'Chưa xác định'}</span>
                    </div>
                  </div>

                  {/* Actions: Sửa & Xóa with min 48px touch targets */}
                  <div
                    style={{
                      marginTop: 12,
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 12,
                    }}
                  >
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => handleOpenEdit(line)}
                      style={{
                        minHeight: 44,
                        minWidth: 90,
                        borderRadius: 6,
                        fontWeight: 600,
                      }}
                    >
                      Sửa
                    </Button>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(line)}
                      style={{
                        minHeight: 44,
                        minWidth: 90,
                        borderRadius: 6,
                        fontWeight: 600,
                      }}
                    >
                      Xóa
                    </Button>
                  </div>
                </Card>
              );
            })}
            <div ref={listEndRef} />
          </div>
        )}

        {/* Floating Action Button (FAB) for adding move line */}
        <FloatButton
          icon={<PlusOutlined />}
          type="primary"
          style={{
            right: 24,
            bottom: 30,
            width: 56,
            height: 56,
          }}
          tooltip="Thêm dòng soạn hàng"
          onClick={handleCreate}
        />
      </div>

      {/* Drawer: Sửa Move Line (Bottom Sheet) */}
      <Drawer
        title={
          <span style={{ fontSize: 16, fontWeight: 700, color: myColor.buttonColor }}>
            Sửa dòng soạn hàng
          </span>
        }
        placement="bottom"
        open={isDrawerOpen}
        onClose={() => {
          if (!submitting && !uploadingImages) {
            setIsDrawerOpen(false);
            setEditingLine(null);
            form.resetFields();
            setSelectedImages([]);
            setUploadStatus('');
          }
        }}
        height="auto"
        bodyStyle={{
          padding: '16px 20px 24px 20px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {drawerError && (
          <Alert
            type="error"
            message={drawerError}
            showIcon
            closable
            onClose={() => setDrawerError(null)}
            style={{ marginBottom: 14 }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleSave}>
          {/* Read-only Destination Location */}
          <Form.Item
            label={<span style={{ fontWeight: 600 }}>Địa điểm đích (chỉ đọc)</span>}
            name="locationDest"
          >
            <Input disabled size="large" style={{ backgroundColor: '#f5f5f5', color: '#666' }} />
          </Form.Item>

          {/* Source Location */}
          <Form.Item
            label={<span style={{ fontWeight: 600 }}>Địa điểm nguồn</span>}
            name="locationId"
            rules={[{ required: true, message: 'Vui lòng chọn địa điểm nguồn' }]}
          >
            <Select
              showSearch
              size="large"
              placeholder="Tìm kiếm địa điểm nguồn..."
              loading={fetchingLocations}
              filterOption={false}
              onSearch={searchLocations}
              options={locationOptions.map((loc) => ({
                label: formatLocationName(loc.name),
                value: loc.id,
              }))}
            />
          </Form.Item>

          {/* Lot Selection (mandatory when tracking !== 'none') */}
          {editingLine && editingLine.tracking !== 'none' && (
            <Form.Item
              required
              label={<span style={{ fontWeight: 600 }}>Số lô</span>}
              name="lotId"
              rules={[
                {
                  required: true,
                  message:
                    editingLine.tracking === 'serial'
                      ? 'Vui lòng chọn số serial'
                      : 'Vui lòng chọn số lô',
                },
              ]}
            >
              <Select
                showSearch
                size="large"
                placeholder="Tìm kiếm hoặc chọn số lô..."
                loading={fetchingLots}
                filterOption={false}
                onSearch={(val) => searchLots(editingLine.productId, val)}
                options={lotOptions.map((lot) => ({
                  label: lot.name,
                  value: lot.id,
                }))}
              />
            </Form.Item>
          )}

          {/* Quantity Done */}
          <Form.Item
            required
            label={
              <span style={{ fontWeight: 600 }}>
                Số lượng đã soạn ({editingLine?.uom || ''})
              </span>
            }
            name="qtyDone"
            rules={[
              {
                validator: (_, value) => {
                  if (
                    value === undefined ||
                    value === null ||
                    (typeof value === 'string' && value.trim() === '')
                  ) {
                    return Promise.reject(new Error('Vui lòng nhập số lượng'));
                  }
                  const normalized =
                    typeof value === 'string' ? value.trim().replace(',', '.') : value;
                  const num = Number(normalized);
                  if (isNaN(num) || !isFinite(num) || num < 0) {
                    return Promise.reject(new Error('Số lượng phải là số lớn hơn hoặc bằng 0'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              size="large"
              inputMode="decimal"
              placeholder="0.000"
              addonAfter={editingLine?.uom || ''}
              style={{ fontSize: 16 }}
            />
          </Form.Item>

          {/* Image Upload Section */}
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ fontWeight: 600 }}>
                Hình ảnh đính kèm{' '}
                <span style={{ fontWeight: 400, color: '#888', fontSize: 13 }}>
                  (không bắt buộc)
                </span>
              </span>
              {selectedImages.length > 0 && (
                <span style={{ fontSize: 12, color: '#0f4c81', fontWeight: 600 }}>
                  Đã chọn {selectedImages.length} ảnh
                </span>
              )}
            </div>

            {/* Hidden file inputs for Camera and Gallery */}
            <input
              ref={fileInputCameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              style={{ display: 'none' }}
              onChange={handleFilesSelected}
            />
            <input
              ref={fileInputGalleryRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFilesSelected}
            />

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <Button
                icon={<CameraOutlined />}
                onClick={() => fileInputCameraRef.current?.click()}
                disabled={submitting || uploadingImages}
                style={{ flex: 1, height: 42, borderRadius: 6, fontWeight: 500 }}
              >
                Chụp ảnh
              </Button>
              <Button
                icon={<PictureOutlined />}
                onClick={() => fileInputGalleryRef.current?.click()}
                disabled={submitting || uploadingImages}
                style={{ flex: 1, height: 42, borderRadius: 6, fontWeight: 500 }}
              >
                Chọn từ thư viện
              </Button>
            </div>

            {/* Previews Grid */}
            {selectedImages.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  padding: '8px',
                  backgroundColor: '#fafafa',
                  borderRadius: 8,
                  border: '1px dashed #d9d9d9',
                }}
              >
                <Image.PreviewGroup>
                  {selectedImages.map((imgBase64, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        width: 76,
                        height: 76,
                        borderRadius: 6,
                        overflow: 'hidden',
                        border: '1px solid #e8e8e8',
                      }}
                    >
                      <Image
                        src={imgBase64}
                        alt={`Ảnh ${index + 1}`}
                        width={76}
                        height={76}
                        style={{ objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(index);
                        }}
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          background: 'rgba(0, 0, 0, 0.65)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          padding: 0,
                          zIndex: 2,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </Image.PreviewGroup>
              </div>
            )}

            {uploadStatus && (
              <div style={{ marginTop: 8, fontSize: 13, color: '#0f4c81', fontWeight: 500 }}>
                {uploadStatus}
              </div>
            )}
          </div>

          {/* Drawer Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <Button
              size="large"
              block
              onClick={() => {
                setIsDrawerOpen(false);
                setEditingLine(null);
                form.resetFields();
                setSelectedImages([]);
                setUploadStatus('');
              }}
              disabled={submitting || uploadingImages}
              style={{ height: 48, borderRadius: 8 }}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={submitting || uploadingImages}
              style={{
                height: 48,
                borderRadius: 8,
                backgroundColor: myColor.buttonColor,
                fontWeight: 600,
              }}
            >
              {uploadingImages ? 'Đang tải ảnh...' : 'Xác nhận'}
            </Button>
          </div>
        </Form>
      </Drawer>
    </div>
  );
};

export default MoveLines;

