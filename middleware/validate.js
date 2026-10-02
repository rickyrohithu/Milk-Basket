const { z } = require('zod');

// Validates req.body against a Zod schema.
// Pass `partial: true` for update routes (all fields optional).
const validate = (schema, partial = false) => (req, res, next) => {
  const activeSchema = partial ? schema.partial() : schema;
  const result = activeSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({ success: false, errors });
  }

  // Replace req.body with the parsed (sanitised) data
  req.body = result.data;
  next();
};

module.exports = validate;
