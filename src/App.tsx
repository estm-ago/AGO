import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ControlPage, DataPage, HomePage, RoboticPage, Test } from './pages';
import useWebSocket from 'react-use-websocket';
import { WEBSOCKET_CONFIG } from './config/websocket';

function App() {
  const data_webSocketHook = useWebSocket(WEBSOCKET_CONFIG.url, WEBSOCKET_CONFIG.options);
  const control_webSocketHook = useWebSocket(WEBSOCKET_CONFIG.url, WEBSOCKET_CONFIG.options);
  const robot_webSocketHook = useWebSocket(WEBSOCKET_CONFIG.url, WEBSOCKET_CONFIG.options);

  return (
    <Router>
      <Routes>
        <Route
          path='/'
          element={
            <Layout
              dataReadyState={data_webSocketHook.readyState}
              controlReadyState={control_webSocketHook.readyState}
              robotReadyState={robot_webSocketHook.readyState}
            />
          }
        >
          <Route index element={<HomePage />} />
          <Route path='control' element={<ControlPage {...control_webSocketHook} />} />
          <Route path='data' element={<DataPage {...data_webSocketHook} />} />
          <Route path='robotic' element={<RoboticPage {...robot_webSocketHook} />} />
          <Route path='test' element={<Test />} />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
