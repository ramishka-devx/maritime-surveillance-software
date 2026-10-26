import { RestrictedAreaService } from '../modules/restricted-areas/restricted-area.service.js';
import { logger } from '../config/logger.js';

export const runGeofenceDetector = async () => {
  try {
    const alerts = await RestrictedAreaService.checkAndCreateGeofenceAlerts();
    if (alerts && alerts.length > 0) {
      logger.info(
        { count: alerts.length, alert_ids: alerts.map((a) => a.alert_id) },
        'Streamed Geofence Detector dispatched new alert(s)'
      );
    }
  } catch (err) {
    logger.error({ err }, 'Streamed Geofence Detector encountered an error');
  }
};
