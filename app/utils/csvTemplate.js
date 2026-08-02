const { Parser } = require("json2csv");

function generateProductTemplate(categoryName = "") {
  const fields = [
    "Product Name",
    "Category",
    "Description",
    "Price",
    "Stock",
    "SKU",
    "Brand",
    "Tags",
    "Image1",
    "Image2",
    "Image3",
    "Image4",
    "Image5",
  ];
  const data = [
    {
      "Product Name": "Example Product",
      Category: categoryName,
      Description: "Enter product description",
      Price: 999,
      Stock: 25,
      SKU: "SKU001",
      Brand: "Example Brand",
      Tags: "perfume,long-lasting,men",
      Images: "IMG0001,IMG0002",
    },
    {
      "Product Name": "",
      Category: "",
      Description: "",
      Price: "",
      Stock: "",
      SKU: "",
      Brand: "",
      Tags: "",
      Images: "",
    },
  ];

  return new Parser({ fields }).parse(data);
}

module.exports = generateProductTemplate;
