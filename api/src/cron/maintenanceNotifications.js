import { query } from '../config/db.config.js';
import { NotificationService } from '../modules/notifications/notification.service.js';

export const sendDailyMaintenanceNotifications = async () => {
  try {
    console.log('Running daily maintenance notification check...');

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Get maintenance scheduled for today with status 'scheduled'
    const maintenanceQuery = `
      SELECT mm.*, m.title as machine_title, u.first_name, u.last_name
      FROM machine_maintenance mm
      JOIN machines m ON mm.machine_id = m.machine_id
      JOIN users u ON mm.scheduled_by = u.user_id
      WHERE DATE(mm.scheduled_date) = ? AND mm.status = 'scheduled'
    `;

    const maintenance = await query(maintenanceQuery, [today]);

    if (maintenance.length === 0) {
      console.log('No maintenance scheduled for today.');
      return;
    }

    // Get admin users
    const adminUsersQuery = `
      SELECT u.user_id, u.first_name, u.last_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE r.name = 'super.admin' OR r.name = 'engineer'
    `;

    const adminUsers = await query(adminUsersQuery);

    if (adminUsers.length === 0) {
      console.log('No admin users found to notify.');
      return;
    }

    // Send notification to each admin for each maintenance
    for (const maint of maintenance) {
      // If assigned_to exists, notify that user
      if (maint.assigned_to) {
        try {
          await NotificationService.createNotification(
            maint.assigned_to,
            'maintenance_reminder',
            'Maintenance Reminder',
            `Maintenance "${maint.title}" for machine "${maint.machine_title}" is scheduled for today.`,
            'maintenance',
            maint.maintenance_id,
            maint.priority
          );
        } catch (error) {
          console.error(`Failed to send notification to assigned user ${maint.assigned_to}:`, error);
        }
      } else {
        // Notify admins
        for (const admin of adminUsers) {
          try {
            await NotificationService.createNotification(
              admin.user_id,
              'maintenance_reminder',
              'Maintenance Reminder',
              `Maintenance "${maint.title}" for machine "${maint.machine_title}" is scheduled for today.`,
              'maintenance',
              maint.maintenance_id,
              maint.priority
            );
          } catch (error) {
            console.error(`Failed to send notification to admin ${admin.user_id}:`, error);
          }
        }
      }
    }

    console.log(`Sent maintenance notifications for ${maintenance.length} items.`);

  } catch (error) {
    console.error('Error in sendDailyMaintenanceNotifications:', error);
  }
};