import { query } from '../config/db.config.js';
import { RestrictedAreaService } from '../modules/restricted-areas/restricted-area.service.js';
import { AlertModel } from '../modules/alerts/alert.model.js';
import { logger } from '../config/logger.js';

export const processIntrusionAlerts = async () => {
  try {
    console.log('[Cron] Starting intrusion detection cycle...');
    // 1. Detect intrusions in the last 2 minutes
    const intrusions = await RestrictedAreaService.detectEntries({ minutes: 2 });
    
    console.log(`[Cron] Found ${intrusions.length} intersecting positions in the last 2 mins.`);

    if (!intrusions || intrusions.length === 0) {
      const maxTimeQuery = await query(`SELECT MAX(time_utc) as max_t FROM ais_positions`);
      console.log(`[Cron] MAX(time_utc) in DB is: ${maxTimeQuery[0]?.max_t}`);
      return;
    }

    // 2. For each intrusion, see if an alert is already active
    for (const intrusion of intrusions) {
      let vessel_id = intrusion.vessel_id;
      
      // If we don't have a vessel_id, create the vessel dynamically
      if (!vessel_id) {
        try {
          const vResult = await query(
            `INSERT INTO vessels (mmsi, name, status) VALUES (?, ?, 'active')`, 
            [String(intrusion.mmsi), intrusion.ship_name || 'Unknown Vessel']
          );
          vessel_id = vResult.insertId;
        } catch (e) {
          // If it fails (e.g. unique constraint), try fetching it again
          const vExist = await query(`SELECT vessel_id FROM vessels WHERE mmsi = ?`, [String(intrusion.mmsi)]);
          vessel_id = vExist[0]?.vessel_id;
        }
      }

      if (!vessel_id) {
        console.log(`[Cron] Skipping alert for MMSI ${intrusion.mmsi} because vessel_id could not be resolved.`);
        continue;
      }

      const title = `Restricted Zone Violation: ${intrusion.restricted_zone}`;

      // Check for an existing active alert, or a recently resolved one (within 4 hours)
      // to prevent alert spam for the same continuous intrusion.
      const existingAlerts = await query(
        `SELECT alert_id FROM alerts 
         WHERE vessel_id = ? 
           AND title = ? 
           AND (status IN ('open', 'acknowledged') OR created_at > NOW() - INTERVAL '4 hours')
         LIMIT 1`,
        [vessel_id, title]
      );

      // If no active alert exists, create a new one
      if (existingAlerts.length === 0) {
        logger.info(`Intrusion detected! Creating alert for vessel ${intrusion.mmsi} in zone ${intrusion.restricted_zone}`);
        
        await AlertModel.create({
          vessel_id: vessel_id,
          type: 'geofence',
          severity: 'critical',
          status: 'open',
          title: title,
          description: `Vessel ${intrusion.ship_name || 'Unknown'} (MMSI: ${intrusion.mmsi}) has entered restricted maritime zone '${intrusion.restricted_zone}' without prior authorisation at coordinates ${intrusion.lat}, ${intrusion.lon}.`,
          created_by: 1 // System user
        });
      }
    }
  } catch (error) {
    logger.error({ err: error }, 'Error in processIntrusionAlerts cron job');
  }
};
