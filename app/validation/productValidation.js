const Joi = require("joi");

const categoryValidation = Joi.object({
  categoryName: Joi.string().min(3).max(30).required().messages({
    "string.empty": "Required category name",
    "string.min": "Category name minimum 3 characters",
    "string.max": "Category name maximum 30 characters",
    "required.any": "Required category name",
  }),
});

const productValidation = Joi.object({
  categoryId: Joi.string().required().messages({
    "string.empty": "Please select a category",
    "any.required": "Category is required",
  }),

  productName: Joi.string().trim().min(3).max(100).required().messages({
    "string.empty": "Product name is required",
    "string.min": "Product name must be at least 3 characters",
    "string.max": "Product name cannot exceed 100 characters",
    "any.required": "Product name is required",
  }),

  description: Joi.string().trim().allow("").max(1000).messages({
    "string.max": "Description cannot exceed 1000 characters",
  }),

  price: Joi.number().min(0).required().messages({
    "number.base": "Price must be a number",
    "number.min": "Price cannot be negative",
    "any.required": "Price is required",
  }),

  stock: Joi.number().integer().min(0).default(0).messages({
    "number.base": "Stock must be a number",
    "number.integer": "Stock must be an integer",
    "number.min": "Stock cannot be negative",
  }),

  sku: Joi.string().trim().allow("").max(50).messages({
    "string.max": "SKU cannot exceed 50 characters",
  }),

  brand: Joi.string().trim().allow("").max(100).messages({
    "string.max": "Brand cannot exceed 100 characters",
  }),

  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim()),
    Joi.string().allow("")
  ),

  status: Joi.string()
    .valid("draft", "published", "out_of_stock")
    .default("draft")
    .messages({
      "any.only": "Status must be draft, published or out_of_stock",
    }),
});

module.exports = {
  categoryValidation,
  productValidation,
};
