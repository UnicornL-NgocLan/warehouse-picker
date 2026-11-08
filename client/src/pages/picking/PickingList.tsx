import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Empty, message, Alert, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useDispatch, useSelector } from 'react-redux';
import Header from 'widgets/Header';
import { pickingService } from 'services/pickingService';
import { Picking } from 'interface/picking';
import { getErrorMessage } from 'helpers/getErrorMessage';
import { myColor } from 'color';
import { RootState } from '../../redux/store';
import { addAuth } from '../../redux/reducers/authReducer';
import { getCompanies } from '../../redux/reducers/companyReducer';
import {
  setPickingSearchResults,
  appendPickingSearchResults,
  clearPickingSearchResults,
} from '../../redux/reducers/pickingSearchReducer';
import app from 'axiosConfig';

const { Search } = Input;
const PAGE_SIZE = 30;

const PickingList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const pickingSearch = useSelector((state: RootState) => (state as any).pickingSearch);

  const [searchTerm, setSearchTerm] = useState<string>(pickingSearch?.searchTerm || '');
  const [pickings, setPickings] = useState<Picking[]>(pickingSearch?.pickings || []);
  const [hasMore, setHasMore] = useState<boolean>(pickingSearch?.hasMore || false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await app.get('/api/get-companies');
      if (response?.data?.data) {
        dispatch(getCompanies(response.data.data));
      }
    } catch {
      // Non-critical
    }
  }, [dispatch]);

  const loadPickings = useCallback(
    async (offset: number = 0, isRefresh: boolean = false, query: string = searchTerm) => {
      const trimmedQuery = query ? query.trim() : '';
      if (!trimmedQuery) {
        setPickings([]);
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        dispatch(clearPickingSearchResults());
        return;
      }

      try {
        if (offset === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setErrorMsg(null);

        const data = await pickingService.getPickings(offset, PAGE_SIZE, trimmedQuery);
        if (isRefresh || offset === 0) {
          const newItems = data.items || [];
          setPickings(newItems);
          setHasMore(data.hasMore);
          dispatch(
            setPickingSearchResults({
              searchTerm: trimmedQuery,
              pickings: newItems,
              hasMore: data.hasMore,
            })
          );
        } else {
          const appended = data.items || [];
          setPickings((prev) => [...prev, ...appended]);
          setHasMore(data.hasMore);
          dispatch(
            appendPickingSearchResults({
              pickings: appended,
              hasMore: data.hasMore,
            })
          );
        }
      } catch (err) {
        const msg = getErrorMessage(err);
        setErrorMsg(msg);
        message.error(msg);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [searchTerm, dispatch]
  );

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleRefresh = () => {
    if (searchTerm.trim()) {
      loadPickings(0, true, searchTerm.trim());
    }
  };

  const handleSearch = (value: string) => {
    const trimmed = value.trim();
    setSearchTerm(trimmed);
    if (trimmed) {
      loadPickings(0, true, trimmed);
    } else {
      setPickings([]);
      setHasMore(false);
      dispatch(clearPickingSearchResults());
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && searchTerm.trim()) {
      loadPickings(pickings.length, false, searchTerm.trim());
    }
  };

  const handleChangeCompany = async (companyId: number) => {
    try {
      setLoading(true);
      const res = await app.patch('/api/change-company', { companyId });
      if (res?.data?.data && res.data.data.length > 0) {
        dispatch(addAuth(res.data.data[0]));
        message.success('Đã chuyển công ty');
        setPickings([]);
        setSearchTerm('');
        setHasMore(false);
        dispatch(clearPickingSearchResults());
      }
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Picking> = [
    {
      title: 'Tên phiếu',
      dataIndex: 'name',
      key: 'name',
      width: '45%',
      render: (text: string, record: Picking) => {
        const isReserved =
          Boolean(record.hasReserved) ||
          record.state === 'assigned' ||
          record.state === 'partially_available';
        return (
          <span
            style={{
              fontWeight: 700,
              color: isReserved ? '#f5222d' : myColor.buttonColor,
              fontSize: 14,
              wordBreak: 'break-word',
              whiteSpace: 'normal',
              display: 'inline-block',
            }}
          >
            {text}
          </span>
        );
      },
    },
    {
      title: 'Đối tác',
      dataIndex: 'partner',
      key: 'partner',
      width: '55%',
      render: (partner: Picking['partner']) => (
        <span
          style={{
            fontSize: 13,
            color: partner ? '#333' : '#aaa',
            wordBreak: 'break-word',
            whiteSpace: 'normal',
            display: 'inline-block',
          }}
        >
          {partner ? partner.name : '-'}
        </span>
      ),
    },
  ];

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
        title="Danh sách phiếu kho"
        handleChangeCompany={handleChangeCompany}
        onRefresh={handleRefresh}
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
        {/* Search Bar */}
        <div style={{ marginBottom: 10 }}>
          <Search
            placeholder="Tìm theo tên/mã phiếu kho..."
            allowClear
            enterButton="Tìm"
            size="middle"
            value={searchTerm}
            onSearch={handleSearch}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value === '') {
                handleSearch('');
              }
            }}
            style={{ borderRadius: 8, width: '100%' }}
          />
        </div>

        {errorMsg && (
          <Alert
            type="error"
            message={errorMsg}
            showIcon
            action={
              <Button size="small" type="primary" onClick={handleRefresh}>
                Thử lại
              </Button>
            }
            style={{ marginBottom: 10 }}
          />
        )}

        {/* Table Container */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            width: '100%',
          }}
        >
          <Table<Picking>
            columns={columns}
            dataSource={pickings}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
            tableLayout="fixed"
            style={{ width: '100%' }}
            locale={{
              emptyText: (
                <Empty
                  description={
                    searchTerm
                      ? `Không có phiếu nào khớp với "${searchTerm}"`
                      : 'Vui lòng nhập tên hoặc mã phiếu kho để tìm kiếm'
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
            onRow={(record) => ({
              onClick: () =>
                navigate(`/pickings/${record.id}`, { state: { picking: record } }),
              style: { cursor: 'pointer' },
            })}
          />
        </div>

        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <Button
              onClick={handleLoadMore}
              loading={loadingMore}
              style={{
                height: 40,
                minWidth: 150,
                borderRadius: 20,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Tải thêm phiếu kho
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PickingList;
