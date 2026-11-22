const Joi = require('joi');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  const validSchema = {
    ...(schema.params && { params: schema.params }),
    ...(schema.query && { query: schema.query }),
    ...(schema.body && { body: schema.body }),
  };

  const { error } = Joi.object(validSchema)
    .options({ abortEarly: false })
    .validate({ params: req.params, query: req.query, body: req.body });

  if (error) {
    const message = error.details.map((d) => d.message).join(', ');
    return next(new ApiError(httpStatus.UNPROCESSABLE_ENTITY, message));
  }
  next();
};

module.exports = validate;
