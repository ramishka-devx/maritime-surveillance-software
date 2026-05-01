import Joi from 'joi';

const coordinateSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lon: Joi.number().min(-180).max(180).required()
});

export const listSchema = Joi.object({
  query: Joi.object({
    type: Joi.string().trim().allow('', null)
  })
});

export const getByIdSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().required()
  })
});

export const createSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().max(255).required(),
    type: Joi.string().trim().max(100).required(),
    coordinates: Joi.array().items(coordinateSchema).min(3).required()
  })
});

export const detectionsSchema = Joi.object({
  query: Joi.object({
    restricted_area_id: Joi.number().integer().allow(null),
    mmsi: Joi.string().pattern(/^[0-9]{6,9}$/).allow('', null),
    limit: Joi.number().integer().min(1).max(1000).default(200)
  })
});
