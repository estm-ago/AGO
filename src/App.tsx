import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ControlPage, DataPage, HomePage, RoboticPage, Test } from './pages';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path='control' element={<ControlPage />} />
          <Route path='data' element={<DataPage />} />
          <Route path='robotic' element={<RoboticPage />} />
          <Route path='test' element={<Test />} />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
