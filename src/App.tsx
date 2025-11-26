import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ControlPage, DataPage, HomePage, RoboticPage } from './pages';
import useWebSocket from 'react-use-websocket';
import { WEBSOCKET_CONFIG } from './config/websocket';
import SerialConsole from "./components/SerialConsole";
import { useDataReceive, useDataStatistics, type CANPortConfig} from "@/hooks";
import { ReadyState } from 'react-use-websocket';

function App() {
  const control_webSocketHook = useWebSocket(WEBSOCKET_CONFIG.url, WEBSOCKET_CONFIG.options);
  const data_webSocketHook = useWebSocket(WEBSOCKET_CONFIG.url, WEBSOCKET_CONFIG.options);
  const robot_webSocketHook = useWebSocket(WEBSOCKET_CONFIG.url, WEBSOCKET_CONFIG.options);
  const [CANPortConfig, setCANPortConfig] = useState<CANPortConfig>({
    readyState: ReadyState.CLOSED,
    port: null,
    baudRate: 2_000_000,
    log: "",
    readLoopOptions: null,
    reader: null,
  });
  const dataReceive = useDataReceive();
  const dataStatistics = useDataStatistics();

  return (
    <Router>
      <Routes>
        <Route
          path='/'
          element={
            <Layout
              controlReadyState={control_webSocketHook.readyState}
              dataReadyState={data_webSocketHook.readyState}
              robotReadyState={robot_webSocketHook.readyState}
              serialReadyState={CANPortConfig.readyState}
            />
          }
        >
          <Route index element={<HomePage />} />
          <Route
            path='control'
            element={
              <ControlPage
                {...control_webSocketHook}
                CANPortConfig={CANPortConfig}
                setCANPortConfig={setCANPortConfig}
              />
            }
          />
          <Route
            path='data'
            element={<DataPage
              {...data_webSocketHook}
              dataReceive={dataReceive}
              dataStatistics={dataStatistics}
            />}
          />
          <Route
            path='robotic'
            element={
              <RoboticPage
                {...robot_webSocketHook}
                CANPortConfig={CANPortConfig}
                setCANPortConfig={setCANPortConfig}
              />
            }
          />
          <Route
            path='test'
            element={
              <SerialConsole
                CANPortConfig={CANPortConfig}
                setCANPortConfig={setCANPortConfig}
                dataReceive={dataReceive}
                dataStatistics={dataStatistics}
              />
            }
          />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
