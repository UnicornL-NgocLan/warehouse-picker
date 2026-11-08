import { myColor } from 'color';
import { useEffect, useState, useCallback } from 'react';
import { FaExchangeAlt, FaCaretDown, FaArrowLeft } from "react-icons/fa";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { GrLogout } from "react-icons/gr";
import { ICompany } from 'interface';
import type { MenuProps } from 'antd';
import { Dropdown, Modal, message, Button } from 'antd';
import DrawerSelection from './Drawer';
import app from 'axiosConfig';
import { getErrorMessage } from 'helpers/getErrorMessage';
import { getCompanies } from '../redux/reducers/companyReducer';

interface HeaderProps {
  handleChangeCompany?: (i: number) => void;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const Header = ({
  handleChangeCompany,
  title,
  showBack = false,
  onBack,
  onRefresh,
  isRefreshing = false,
}: HeaderProps) => {
  const dispatch = useDispatch();
  const [openDrawer, setOpenDrawer] = useState(false);
  const companies = useSelector((state: RootState) => state.companies) as ICompany[];
  const auth = useSelector((state: RootState) => state.auth) as any;

  const [myCurrentCompanyShortName, setMyCurrentCompanyShortName] = useState<string>('');

  const hasMultipleCompanies = (auth?.company_ids && auth.company_ids.length > 1) || (companies && companies.length > 1);

  const getMyCurrentCompanyShortName = useCallback(() => {
    if (companies && companies.length > 0) {
      const currentOne = companies.find((com: ICompany) => com.id === auth?.company_id?.[0]);
      if (!currentOne) {
        setMyCurrentCompanyShortName(auth?.company_id?.[1] || '');
      } else {
        setMyCurrentCompanyShortName(currentOne.short_name || currentOne.name);
      }
    } else if (auth?.company_id) {
      setMyCurrentCompanyShortName(auth?.company_id[1] || '');
    }
  }, [auth, companies]);

  // Ensure companies list is fetched if not present in Redux store
  useEffect(() => {
    if (auth && (!companies || companies.length === 0)) {
      app.get('/api/get-companies')
        .then((res) => {
          if (res?.data?.data) {
            dispatch(getCompanies(res.data.data));
          }
        })
        .catch(() => {});
    }
  }, [auth, companies, dispatch]);

  useEffect(() => {
    getMyCurrentCompanyShortName();
  }, [getMyCurrentCompanyShortName]);

  const handleOpenCompanySelection = () => {
    setOpenDrawer(true);
  };

  const handleClose = () => {
    setOpenDrawer(false);
  };

  const handleLogout = () => {
    Modal.confirm({
      title: 'Xác nhận đăng xuất',
      content: 'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng không?',
      okText: 'Đăng xuất',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await app.delete('/api/logout');
          dispatch({ type: 'logout' });
          message.success('Đã đăng xuất');
        } catch (error) {
          message.error(getErrorMessage(error));
        }
      },
    });
  };

  const menuItems: MenuProps['items'] = [
    ...(hasMultipleCompanies && handleChangeCompany
      ? [
          {
            label: <span style={{ fontSize: 14 }}>Đổi công ty</span>,
            key: '1',
            icon: <FaExchangeAlt style={{ fontSize: 14 }} />,
            onClick: () => handleOpenCompanySelection(),
          },
        ]
      : []),
    {
      label: <span style={{ color: 'red', fontSize: 14 }}>Đăng xuất</span>,
      key: '2',
      icon: <GrLogout style={{ color: 'red', fontSize: 14 }} />,
      onClick: () => handleLogout(),
    },
  ];

  return (
    <>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: myColor.buttonColor,
          width: '100%',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.65rem 0.85rem',
            minHeight: '50px',
          }}
        >
          {/* Left section: Back button + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
            {showBack && (
              <Button
                type="text"
                shape="circle"
                icon={<FaArrowLeft style={{ color: 'white', fontSize: 15 }} />}
                onClick={onBack}
                style={{
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  width: 32,
                  height: 32,
                }}
              />
            )}

            {title && (
              <span
                style={{
                  fontSize: 15,
                  color: 'white',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '160px',
                }}
              >
                {title}
              </span>
            )}
          </div>

          {/* Right section: User with Company Short Name */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  padding: '3px 7px',
                  borderRadius: 6,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                }}
              >
                {/* Short name badge */}
                {myCurrentCompanyShortName && (
                  <span
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.2px',
                    }}
                  >
                    {myCurrentCompanyShortName}
                  </span>
                )}

                {/* User Name */}
                <span
                  style={{
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 600,
                    maxWidth: '90px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {auth?.name || 'Tài khoản'}
                </span>

                <FaCaretDown style={{ fontSize: 12, color: 'white' }} />
              </div>
            </Dropdown>
          </div>
        </div>
      </div>

      {hasMultipleCompanies && handleChangeCompany && (
        <DrawerSelection
          open={openDrawer}
          handleClose={handleClose}
          handleChangeCompany={(id) => {
            handleClose();
            handleChangeCompany(id);
          }}
        />
      )}
    </>
  );
};

export default Header;
