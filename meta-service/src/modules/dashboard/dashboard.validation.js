import Joi from 'joi';

export const summarySchema = Joi.object({
  query: Joi.object({
    range: Joi.string().valid('24h', '7d', '30d').default('24h'),
    sector_id: Joi.number().integer().min(1)
  })
});
