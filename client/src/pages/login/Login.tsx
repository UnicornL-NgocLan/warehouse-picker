import { useState } from 'react';
import type { FormProps } from 'antd';
import { Button, Form, Input, Image, Alert, message } from 'antd';
import { myColor } from 'color';
import { useDispatch } from 'react-redux';
import logo from 'images/seacorp-logo.png';
import { getErrorMessage } from 'helpers/getErrorMessage';
import { addAuth } from '../../redux/reducers/authReducer.tsx';
import app from 'axiosConfig.tsx';

type FieldType = {
  username?: string;
  password?: string;
};

const Login = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onFinish: FormProps<FieldType>['onFinish'] = async ({ username, password }) => {
    try {
      if (loading) return;
      setLoading(true);
      setErrorMessage(null);

      const { data }: any = await app.post("/api/login", {
        username: username?.trim(),
        password,
      });

      if (data?.data && data.data.length > 0) {
        dispatch(addAuth(data.data[0]));
        message.success(data.msg || "Đăng nhập thành công!");
      } else {
        setErrorMessage("Không nhận được dữ liệu người dùng");
      }
    } catch (error: any) {
      const msg = getErrorMessage(error);
      setErrorMessage(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: myColor.backgroundColor,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: '#fff',
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          padding: '2rem 1.5rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Image src={logo} style={{ maxWidth: 180 }} preview={false} alt="Logo" />
          {/* <h2 style={{ marginTop: '1rem', fontSize: '1.25rem', color: myColor.buttonColor, fontWeight: 700 }}>
            SOẠN HÀNG KHO
          </h2> */}
        </div>

        {errorMessage && (
          <Alert
            message={errorMessage}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMessage(null)}
            style={{ marginBottom: '1.25rem' }}
          />
        )}

        <Form
          name="loginForm"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="on"
          disabled={loading}
        >
          <Form.Item<FieldType>
            label={<span style={{ fontWeight: 600 }}>Tên đăng nhập</span>}
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
          >
            <Input size="large" placeholder="Nhập tên đăng nhập Odoo" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item<FieldType>
            label={<span style={{ fontWeight: 600 }}>Mật khẩu</span>}
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password size="large" placeholder="Nhập mật khẩu" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item style={{ marginTop: '1.5rem', marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              style={{
                backgroundColor: myColor.buttonColor,
                height: 48,
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login;
