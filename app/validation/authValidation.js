const Joi = require("joi");

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const registerValidation = Joi.object({
  name: Joi.string().trim().min(3).max(50).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name cannot exceed 50 characters",
    "any.required": "Name is required",
  }),

  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.pattern.base": "Please enter a valid phone number",
      "string.empty": "Phone number is required",
      "any.required": "Phone number is required",
    }),

  email: Joi.string().trim().email().required().messages({
    "string.email": "Please enter a valid email",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),

  password: Joi.string().pattern(passwordRegex).required().messages({
    "string.pattern.base":
      "Password must contain uppercase, lowercase, number and special character",
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),

  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
    "any.required": "Confirm password is required",
  }),

  terms: Joi.string().valid("on").required().messages({
    "any.only": "Please accept Terms & Conditions",
    "any.required": "Please accept Terms & Conditions",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    "string.email": "Please enter a valid email",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),

  password: Joi.string().pattern(passwordRegex).required().messages({
    "string.pattern.base":
      "Password must contain uppercase, lowercase, number and special character",
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),

  remember: Joi.string().valid("on").optional(),
});

const verifySchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    "string.email": "Please enter a valid email",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),

  otp: Joi.string().required().messages({
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
});

module.exports = {
  registerValidation,
  loginSchema,
  verifySchema,
};
