import { useEffect, useState } from 'react';
import Login from 'pages/login/Login';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RootState } from 'redux/store';
import Home from 'pages/asset/Home.tsx';
import PickingList from 'pages/picking/PickingList';
import PickingMoves from 'pages/picking/PickingMoves';
import MoveLines from 'pages/picking/MoveLines';
import PrivateRoute from 'PrivateRoute';
import { addAuth } from './redux/reducers/authReducer.tsx';
import app from 'axiosConfig.tsx';
import PageLoading from 'widgets/PageLoading.tsx';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { myColor } from 'color';

function App() {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const [fetchingData, setFetchingData] = useState(true);

  const checkAuth = async () => {
    try {
      setFetchingData(true);
      const { data }: any = await app.get('/api/check-auth');
      if (data?.data?.length > 0) {
        dispatch(addAuth(data.data[0]));
      }
    } catch (error: any) {
      // User is not logged in or token expired; will navigate to /login
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: myColor.buttonColor,
          borderRadius: 8,
        },
      }}
    >
      {fetchingData ? (
        <PageLoading />
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={auth ? <Navigate to="/pickings" /> : <Login />} />
            <Route
              path="/pickings"
              element={
                <PrivateRoute>
                  <PickingList />
                </PrivateRoute>
              }
            />
            <Route
              path="/pickings/:pickingId"
              element={
                <PrivateRoute>
                  <PickingMoves />
                </PrivateRoute>
              }
            />
            <Route
              path="/pickings/:pickingId/moves/:moveId"
              element={
                <PrivateRoute>
                  <MoveLines />
                </PrivateRoute>
              }
            />
            {/* Preserving legacy driver home screen */}
            <Route
              path="/driver"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/pickings" replace />} />
            <Route path="*" element={<Navigate to="/pickings" replace />} />
          </Routes>
        </BrowserRouter>
      )}
    </ConfigProvider>
  );
}

export default App;
