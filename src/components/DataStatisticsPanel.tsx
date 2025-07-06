import { type FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { BarChart, TrendingUp, AlertTriangle, CheckCircle, RotateCcw, Activity } from 'lucide-react';
import { type DataStatistics } from '../types/vehicle';

interface DataStatisticsPanelProps {
  statistics: DataStatistics;
  overallPerformance: {
    averageSpeed: number;
    averageDuty: number;
    speedBalance: number;
    dutyBalance: number;
    isBalanced: boolean;
  };
  onReset: () => void;
}

export const DataStatisticsPanel: FC<DataStatisticsPanelProps> = ({
  statistics,
  overallPerformance,
  onReset,
}) => {
  const StatCard = ({ title, icon: Icon, value, unit, color = 'blue' }: {
    title: string;
    icon: any;
    value: number | string;
    unit?: string;
    color?: string;
  }) => (
    <div className={`p-4 rounded-lg bg-${color}-50 border border-${color}-200`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 text-${color}-600`} />
        <span className="text-sm font-medium text-gray-700">{title}</span>
      </div>
      <div className={`text-2xl font-bold text-${color}-600`}>
        {value}
        {unit && <span className="text-sm ml-1">{unit}</span>}
      </div>
    </div>
  );

  const MotorStatsCard = ({ title, data, color }: {
    title: string;
    data: DataStatistics['leftSpeed'];
    color: string;
  }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-600">當前:</span>
            <span className={`ml-2 font-bold text-${color}-600`}>
              {data.current.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">平均:</span>
            <span className={`ml-2 font-bold text-${color}-600`}>
              {data.average.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">最小:</span>
            <span className="ml-2 font-medium">{data.min.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600">最大:</span>
            <span className="ml-2 font-medium">{data.max.toFixed(2)}</span>
          </div>
        </div>
        <div className="pt-2 border-t">
          <span className="text-xs text-gray-500">
            樣本數: {data.samples}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* 整體統計概覽 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              數據統計概覽
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="text-orange-600 hover:text-orange-700"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              重置
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="總接收"
              icon={Activity}
              value={statistics.totalReceived}
              unit="筆"
              color="blue"
            />
            <StatCard
              title="成功率"
              icon={statistics.successRate >= 90 ? CheckCircle : AlertTriangle}
              value={statistics.successRate}
              unit="%"
              color={statistics.successRate >= 90 ? "green" : statistics.successRate >= 70 ? "yellow" : "red"}
            />
            <StatCard
              title="成功數據"
              icon={CheckCircle}
              value={statistics.successCount}
              unit="筆"
              color="green"
            />
            <StatCard
              title="錯誤數據"
              icon={AlertTriangle}
              value={statistics.errorCount}
              unit="筆"
              color="red"
            />
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              最後更新: {statistics.lastUpdated}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 馬達數據詳細統計 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            馬達數據統計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MotorStatsCard
              title="左馬達速度"
              data={statistics.leftSpeed}
              color="blue"
            />
            <MotorStatsCard
              title="右馬達速度"
              data={statistics.rightSpeed}
              color="green"
            />
            <MotorStatsCard
              title="左馬達功率"
              data={statistics.leftDuty}
              color="orange"
            />
            <MotorStatsCard
              title="右馬達功率"
              data={statistics.rightDuty}
              color="purple"
            />
          </div>
        </CardContent>
      </Card>

      {/* 整體效能分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            效能分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">平均值分析</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">平均速度:</span>
                  <span className="font-medium">{overallPerformance.averageSpeed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">平均功率:</span>
                  <span className="font-medium">{overallPerformance.averageDuty}%</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">平衡性分析</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">速度差異:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{overallPerformance.speedBalance}</span>
                    <Badge variant={overallPerformance.speedBalance < 10 ? "default" : "destructive"} className="text-xs">
                      {overallPerformance.speedBalance < 10 ? "良好" : "偏差"}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">功率差異:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{overallPerformance.dutyBalance}%</span>
                    <Badge variant={overallPerformance.dutyBalance < 5 ? "default" : "destructive"} className="text-xs">
                      {overallPerformance.dutyBalance < 5 ? "平衡" : "不平衡"}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    {overallPerformance.isBalanced ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    )}
                    <span className="text-sm font-medium">
                      整體狀態: {overallPerformance.isBalanced ? "平衡良好" : "需要調整"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 