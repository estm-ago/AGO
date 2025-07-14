import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Car, Database, Wifi, ArrowRight } from 'lucide-react';
import { WEBSOCKET_CONFIG } from '../config/websocket';

const HomePage: FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Wifi className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ESP32 車輛控制系統
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            一個完整的物聯網車輛控制解決方案，支援即時控制和數據監控
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Car className="w-8 h-8 text-blue-600" />
                車輛控制
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                透過 WebSocket 即時控制 ESP32 車輛的移動方向、速度和馬達操作
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 方向控制（前進、後退、左轉、右轉）</li>
                <li>• 速度調節（0-100%）</li>
                <li>• 單獨馬達控制</li>
                <li>• 即時狀態反饋</li>
              </ul>
              <Link to="/control">
                <Button className="w-full flex items-center justify-center gap-2">
                  開始控制車輛
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Database className="w-8 h-8 text-green-600" />
                數據監控
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                自動接收並解析 ESP32 發送的馬達數據和系統狀態資訊
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 馬達速度即時監控</li>
                <li>• 功率消耗統計</li>
                <li>• 自動數據請求（1秒/次）</li>
                <li>• 詳細日誌記錄</li>
              </ul>
              <Link to="/data">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  查看數據監控
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* System Info */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>系統資訊</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">WebSocket 連線</p>
                  <p className="text-gray-600">{WEBSOCKET_CONFIG.url}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">通訊協議</p>
                  <p className="text-gray-600">二進制 + 16進制</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">重連機制</p>
                  <p className="text-gray-600">自動重連，間隔3秒</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">數據頻率</p>
                  <p className="text-gray-600">1 Hz（每秒1次）</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 