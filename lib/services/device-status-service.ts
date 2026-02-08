import * as Battery from 'expo-battery';
import * as Network from 'expo-network';
import { Platform } from 'react-native';
import { socketService, DeviceStatus } from './socket-service';

export interface DeviceStatusState {
  batteryLevel: number;
  batteryState: string;
  isCharging: boolean;
  networkType: string;
  isOnline: boolean;
  lastUpdate: number;
}

class DeviceStatusService {
  private statusUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private updateIntervalMs = 30000; // تحديث كل 30 ثانية
  private currentStatus: DeviceStatusState = {
    batteryLevel: 0,
    batteryState: 'unknown',
    isCharging: false,
    networkType: 'unknown',
    isOnline: false,
    lastUpdate: 0,
  };

  /**
   * بدء مراقبة حالة الجهاز
   */
  public async startMonitoring(): Promise<void> {
    console.log('بدء مراقبة حالة الجهاز');
    
    // الحصول على الحالة الأولية
    await this.updateDeviceStatus();

    // بدء التحديثات الدورية
    if (Platform.OS !== 'web') {
      this.statusUpdateInterval = setInterval(
        () => this.updateDeviceStatus(),
        this.updateIntervalMs
      );
    }
  }

  /**
   * إيقاف مراقبة حالة الجهاز
   */
  public stopMonitoring(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
      console.log('تم إيقاف مراقبة حالة الجهاز');
    }
  }

  /**
   * تحديث حالة الجهاز
   */
  private async updateDeviceStatus(): Promise<void> {
    try {
      // الحصول على معلومات البطارية
      if (Platform.OS !== 'web') {
        const batteryLevel = await Battery.getBatteryLevelAsync();
        const batteryState = await Battery.getBatteryStateAsync();
        
        this.currentStatus.batteryLevel = batteryLevel;
        this.currentStatus.batteryState = this.getBatteryStateString(batteryState);
        this.currentStatus.isCharging = 
          batteryState === Battery.BatteryState.CHARGING ||
          batteryState === Battery.BatteryState.FULL;
      }

      // الحصول على معلومات الشبكة
      const networkState = await Network.getNetworkStateAsync();
      this.currentStatus.networkType = networkState.type ?? 'unknown';
      this.currentStatus.isOnline = networkState.isInternetReachable ?? false;

      this.currentStatus.lastUpdate = Date.now();

      // إرسال الحالة إلى المنصة إذا كان متصلاً
      if (socketService.isConnected()) {
        socketService.sendDeviceStatus(this.currentStatus as DeviceStatus);
      }

    } catch (error) {
      console.error('خطأ في تحديث حالة الجهاز:', error);
    }
  }

  /**
   * تحويل حالة البطارية إلى نص
   */
  private getBatteryStateString(state: number): string {
    switch (state) {
      case Battery.BatteryState.CHARGING:
        return 'charging';
      case Battery.BatteryState.FULL:
        return 'full';
      case Battery.BatteryState.UNPLUGGED:
        return 'unplugged';
      default:
        return 'unknown';
    }
  }

  /**
   * الحصول على حالة الجهاز الحالية
   */
  public getStatus(): DeviceStatusState {
    return { ...this.currentStatus };
  }

  /**
   * الحصول على مستوى البطارية كنسبة مئوية
   */
  public getBatteryPercentage(): number {
    return Math.round(this.currentStatus.batteryLevel * 100);
  }

  /**
   * التحقق من انخفاض البطارية
   */
  public isLowBattery(): boolean {
    return this.currentStatus.batteryLevel < 0.2; // أقل من 20%
  }

  /**
   * التحقق من الاتصال بالإنترنت
   */
  public isOnline(): boolean {
    return this.currentStatus.isOnline;
  }
}

// تصدير instance واحد من الخدمة
export const deviceStatusService = new DeviceStatusService();
