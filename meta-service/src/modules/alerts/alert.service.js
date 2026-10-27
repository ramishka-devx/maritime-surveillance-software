import { badRequest, notFound } from '../../utils/errorHandler.js';
import { AlertModel } from './alert.model.js';
import { VesselModel } from '../vessels/vessel.model.js';
import { UserModel } from '../users/user.model.js';
import { AlertEventModel } from './alert-event.model.js';
import { ALERT_STATUSES } from './alert.validation.js';
import { NotificationService } from '../notifications/notification.service.js';
import { query } from '../../config/db.config.js';
import { logger } from '../../config/logger.js';

const userName = (u) => [u?.first_name, u?.last_name].filter(Boolean).join(' ') || u?.email || `user #${u?.user_id}`;

export const AlertService = {
  async create(payload, created_by) {
    if (payload.vessel_id !== undefined && payload.vessel_id !== null) {
      const vessel = await VesselModel.findById(payload.vessel_id);
      if (!vessel) throw notFound('Vessel not found');
    }

    if (payload.assigned_to !== undefined && payload.assigned_to !== null) {
      const user = await UserModel.findById(payload.assigned_to);
      if (!user) throw notFound('Assignee not found');
    }

    const alert = await AlertModel.create({ ...payload, created_by });
    if (alert) {
      await AlertEventModel.add({
        alert_id: alert.alert_id,
        kind: 'raised',
        text: `reported it: ${payload.description || payload.title}`,
        actor_id: created_by
      });
    }
    return alert;
  },

  async list(params) {
    return AlertModel.list(params);
  },

  async getById(alert_id) {
    const alert = await AlertModel.getById(alert_id);
    if (!alert) throw notFound('Alert not found');
    return alert;
  },

  async update(alert_id, payload) {
    const existing = await AlertModel.getById(alert_id);
    if (!existing) throw notFound('Alert not found');

    if (payload.vessel_id !== undefined && payload.vessel_id !== null) {
      const vessel = await VesselModel.findById(payload.vessel_id);
      if (!vessel) throw notFound('Vessel not found');
    }

    return AlertModel.update(alert_id, payload);
  },

  async updateStatus(alert_id, status, actorId = null) {
    if (!ALERT_STATUSES.includes(status)) throw badRequest('Invalid status');

    const existing = await AlertModel.getById(alert_id);
    if (!existing) throw notFound('Alert not found');

    const alert = await AlertModel.updateStatus(alert_id, status);
    if (existing.status !== status) {
      await AlertEventModel.add({
        alert_id,
        kind: 'status',
        text: `marked it ${status}`,
        actor_id: actorId,
        data: { from: existing.status, to: status }
      });
    }
    return alert;
  },

  async assign(alert_id, assigned_to, actorId = null) {
    const existing = await AlertModel.getById(alert_id);
    if (!existing) throw notFound('Alert not found');

    const user = await UserModel.findById(assigned_to);
    if (!user) throw notFound('Assignee not found');

    const alert = await AlertModel.assign(alert_id, assigned_to);
    if (existing.assigned_to !== assigned_to) {
      await AlertEventModel.add({
        alert_id,
        kind: 'assign',
        text: assigned_to === actorId ? 'took ownership' : `assigned it to ${userName(user)}`,
        actor_id: actorId,
        data: { from: existing.assigned_to, to: assigned_to }
      });
    }
    return alert;
  },

  // Escalate to intercept: status 'escalated', a timeline entry, and a high-priority
  // notification (in-app + email) to every admin.
  async escalate(alert_id, actorId, note) {
    const existing = await AlertModel.getById(alert_id);
    if (!existing) throw notFound('Alert not found');
    if (existing.status === 'escalated') throw badRequest('Alert is already escalated');

    const alert = await AlertModel.updateStatus(alert_id, 'escalated');
    await AlertEventModel.add({
      alert_id,
      kind: 'escalate',
      text: note ? `escalated it to intercept: ${note}` : 'escalated it to intercept',
      actor_id: actorId,
      data: { from: existing.status, note: note || null }
    });

    const admins = await query(
      `SELECT DISTINCT u.user_id
       FROM users u
       JOIN roles r ON r.role_id = u.role_id
          OR r.role_id IN (SELECT ur.role_id FROM user_roles ur WHERE ur.user_id = u.user_id)
       WHERE r.name IN ('admin', 'super_admin')`
    );
    const vessel = existing.vessel_name || (existing.mmsi ? `MMSI ${existing.mmsi}` : 'Unknown vessel');
    // Don't hold the response for the notification emails.
    Promise.allSettled(
      admins.map(({ user_id }) =>
        NotificationService.createNotification(
          user_id,
          'alert',
          `Escalated to intercept: ${vessel}`.slice(0, 255),
          `${existing.title}${note ? ` Note: ${note}` : ''}`,
          'alert',
          alert_id,
          'high'
        )
      )
    ).then((results) => {
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length) logger.warn({ alert_id, failed: failed.length }, 'Some escalation notifications failed');
    });

    return alert;
  },

  async events(alert_id) {
    const existing = await AlertModel.getById(alert_id);
    if (!existing) throw notFound('Alert not found');
    return AlertEventModel.listFor(alert_id);
  }
};
