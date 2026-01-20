import { ActivityModel } from './activity.model.js';

export const ActivityService = {
  list: (filters) => ActivityModel.list(filters),

  getById: (id) => ActivityModel.getById(id)
};