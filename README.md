<div align="center">
<img
  src="./public/assets/poeme-readme-animation.gif"
  alt="POÈME Perfumery"
  width="100%"
/>
</div>

<div align="center">

<svg width="100%" height="220" viewBox="0 0 1200 220" xmlns="http://www.w3.org/2000/svg">

  <defs>
    <!-- Background gradient -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080808"/>
      <stop offset="50%" stop-color="#15100f"/>
      <stop offset="100%" stop-color="#050505"/>
    </linearGradient>
    <!-- Gold gradient -->
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8a6a2f"/>
      <stop offset="35%" stop-color="#f5d58a"/>
      <stop offset="55%" stop-color="#fff2bd"/>
      <stop offset="75%" stop-color="#c9a45c"/>
      <stop offset="100%" stop-color="#806126"/>
    </linearGradient>
    <!-- Glow -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <!-- Soft glow -->
    <filter id="softGlow">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
    <!-- Moving shine -->
    <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="transparent"/>
      <stop offset="45%" stop-color="transparent"/>
      <stop offset="50%" stop-color="#fff8dc"/>
      <stop offset="55%" stop-color="transparent"/>
      <stop offset="100%" stop-color="transparent"/>
      <animateTransform
        attributeName="gradientTransform"
        type="translate"
        from="-1 0"
        to="1 0"
        dur="3.5s"
        repeatCount="indefinite"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="1200" height="220" fill="url(#bg)" rx="18"/>
  <!-- Ambient glow -->
  <ellipse
    cx="600"
    cy="110"
    rx="430"
    ry="75"
    fill="#c9a45c"
    opacity="0.08"
    filter="url(#softGlow)">
    <animate
      attributeName="opacity"
      values="0.04;0.10;0.04"
      dur="4s"
      repeatCount="indefinite"/>
  </ellipse>
  <!-- Floating perfume particles -->
  <g fill="#f4d88f">
    <circle cx="150" cy="55" r="2">
      <animate
        attributeName="cy"
        values="55;35;55"
        dur="3s"
        repeatCount="indefinite"/>
      <animate
        attributeName="opacity"
        values="0.2;1;0.2"
        dur="3s"
        repeatCount="indefinite"/>
    </circle>
    <circle cx="240" cy="150" r="1.5">
      <animate
        attributeName="cy"
        values="150;125;150"
        dur="4s"
        repeatCount="indefinite"/>
      <animate
        attributeName="opacity"
        values="0.1;0.8;0.1"
        dur="4s"
        repeatCount="indefinite"/>
    </circle>
    <circle cx="370" cy="45" r="1.5">
      <animate
        attributeName="cy"
        values="45;25;45"
        dur="3.5s"
        repeatCount="indefinite"/>
      <animate
        attributeName="opacity"
        values="0.1;1;0.1"
        dur="3.5s"
        repeatCount="indefinite"/>
    </circle>
    <circle cx="820" cy="50" r="2">
      <animate
        attributeName="cy"
        values="50;28;50"
        dur="3.8s"
        repeatCount="indefinite"/>
      <animate
        attributeName="opacity"
        values="0.1;0.9;0.1"
        dur="3.8s"
        repeatCount="indefinite"/>
    </circle>
    <circle cx="960" cy="145" r="1.5">
      <animate
        attributeName="cy"
        values="145;120;145"
        dur="4.2s"
        repeatCount="indefinite"/>
      <animate
        attributeName="opacity"
        values="0.1;0.9;0.1"
        dur="4.2s"
        repeatCount="indefinite"/>
    </circle>
    <circle cx="1050" cy="65" r="2">
      <animate
        attributeName="cy"
        values="65;40;65"
        dur="3.2s"
        repeatCount="indefinite"/>
      <animate
        attributeName="opacity"
        values="0.2;1;0.2"
        dur="3.2s"
        repeatCount="indefinite"/>
    </circle>
  </g>
  <!-- Decorative lines -->
  <g stroke="url(#gold)" fill="none" opacity="0.35">
    <path d="M80 110 C180 40 250 180 350 110">
      <animate
        attributeName="stroke-dasharray"
        values="0 500;500 0"
        dur="4s"
        repeatCount="indefinite"/>
    </path>
    <path d="M850 110 C950 40 1020 180 1120 110">
      <animate
        attributeName="stroke-dasharray"
        values="0 500;500 0"
        dur="4s"
        repeatCount="indefinite"/>
    </path>

  </g>
  <!-- Brand -->
  <text
    x="600"
    y="92"
    text-anchor="middle"
    fill="url(#gold)"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="52"
    letter-spacing="8"
    font-weight="600"
    filter="url(#glow)">
    POÈME
    <animate
      attributeName="opacity"
      values="0;1;1;0.92;1"
      dur="3s"
      repeatCount="indefinite"/>

  </text>
  <!-- Subtitle -->
  <text
    x="600"
    y="128"
    text-anchor="middle"
    fill="#e8dcc4"
    font-family="Arial, Helvetica, sans-serif"
    font-size="14"
    letter-spacing="6">
    PERFUMERY
    <animate
      attributeName="letter-spacing"
      values="3px;6px;3px"
      dur="4s"
      repeatCount="indefinite"/>
  </text>
  <!-- Divider -->
  <line
    x1="450"
    y1="150"
    x2="750"
    y2="150"
    stroke="url(#gold)"
    stroke-width="1"
    opacity="0.7">
    <animate
      attributeName="x1"
      values="550;450;550"
      dur="4s"
      repeatCount="indefinite"/>
    <animate
      attributeName="x2"
      values="650;750;650"
      dur="4s"
      repeatCount="indefinite"/>

  </line>
  <!-- Tagline -->
  <text
    x="600"
    y="177"
    text-anchor="middle"
    fill="#a99d8b"
    font-family="Arial, Helvetica, sans-serif"
    font-size="11"
    letter-spacing="3">
    A MULTI-VENDOR FRAGRANCE EXPERIENCE
    <animate
      attributeName="opacity"
      values="0.4;1;0.4"
      dur="4s"
      repeatCount="indefinite"/>
  </text>
  <!-- Animated shine -->
  <rect
    x="250"
    y="55"
    width="700"
    height="110"
    fill="url(#shine)"
    opacity="0.25"/>
  <!-- Bottom border -->
  <rect
    x="1"
    y="1"
    width="1198"
    height="218"
    rx="18"
    fill="none"
    stroke="url(#gold)"
    stroke-width="1"
    opacity="0.35"/>

</svg>

<br>

### ✦ Full-Stack E-Commerce Platform for Luxury Fragrance ✦

</div>

<br>

POÈME Perfumery

A full-stack, multi-role e-commerce platform for a perfume and fragrance
business. The application combines a customer storefront, seller
management workspace, administrator dashboard, REST APIs, Razorpay
payments, Cloudinary media management, CSV-based product import,
real-time communication infrastructure, and an AI-powered POÈME support
chatbot.

Project type: Full-stack e-commerce / final-year project
Application name: POÈME Perfumery
Backend: Node.js + Express
Database: MongoDB + Mongoose
Frontend: EJS + Tailwind CSS
API documentation: Swagger / OpenAPI
Payment gateway: Razorpay
Image storage: Cloudinary
Authentication: JWT + cookies/session support + Passport
AI assistant: Google Gemini / @google/genai

1. Project Overview

POÈME Perfumery is designed as a multi-role online perfume marketplace
rather than a simple product catalogue.

The system has three primary user roles:

Customer: browses approved products, searches and filters
perfumes, manages a cart, enters a delivery address, creates an
order, completes Razorpay payment, and interacts with the POÈME AI
assistant.

Seller: manages categories and products, uploads product images,
maintains an image library, imports products through CSV, manages
stock and product status, views seller-specific orders, and updates
order fulfilment status.

Admin: oversees the marketplace, monitors dashboard statistics,
reviews products submitted by sellers, manages sellers, views
customers who have placed orders, reviews categories and orders, and
controls product approval.

The project also exposes REST APIs alongside the EJS-based web
application. Swagger/OpenAPI documentation is included for API discovery
and testing.

2. Main Objectives

The application is built around the following business objectives:

Provide a complete online perfume shopping experience.

Separate customer, seller, and administrator responsibilities.

Allow sellers to manage their own catalogue without exposing other
sellers' data.

Give administrators marketplace-level visibility and control.

Prevent unapproved seller products from appearing in the public
catalogue.

Support product image management through a dedicated image library.

Make large product catalogue entry easier through CSV bulk upload.

Integrate online payments through Razorpay.

Provide documented REST APIs for application and external-client
integration.

Provide an AI assistant focused specifically on POÈME
Perfumery-related questions.

3. Technology Stack

Backend

Technology Purpose

Node.js JavaScript runtime
Express 5 Web server and routing
Mongoose MongoDB ODM
MongoDB Primary database
EJS Server-side web rendering
JWT Access/refresh token authentication
bcrypt Password hashing and verification
Joi Request/input validation
Passport Authentication integration
Passport Google OAuth 2.0 Google authentication support
express-session Session management
cookie-parser Cookie handling
connect-flash Server-side flash messages

Frontend

Technology Purpose

EJS Server-rendered pages
Tailwind CSS UI styling
PostCSS CSS processing
Autoprefixer CSS browser compatibility
Custom JavaScript Page-level interaction

Media and Files

Technology Purpose

Cloudinary Cloud image storage
Multer Multipart file handling
multer-storage-cloudinary Direct Multer-to-Cloudinary storage
csvtojson CSV parsing
ExcelJS Spreadsheet-related processing
XLSX Spreadsheet processing
json2csv CSV generation
Custom file cleaner Cleanup of uploaded temporary files

Payments

Technology Purpose

Razorpay Node SDK Razorpay order/payment integration
HMAC SHA-256 Razorpay payment signature verification

APIs and Documentation

Technology Purpose

swagger-jsdoc Generate OpenAPI specification from code comments
swagger-ui-express Interactive Swagger UI
CORS Cross-origin API support

Other Services

Technology Purpose

Nodemailer Email delivery
Google GenAI POÈME AI assistant
Socket.IO Real-time communication
node-cron Scheduled/background jobs
concurrently Run development processes together
nodemon Development server restart
Prettier Code formatting

The dependency set and npm scripts are defined in the project's
package.json. fileciteturn45file0L11-L64

4. High-Level Architecture

                           ┌───────────────────────┐
                           │       Browser         │
                           │ Customer / Seller /   │
                           │        Admin          │
                           └───────────┬───────────┘
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │       Express         │
                           │     Application       │
                           └───────────┬───────────┘
                                       │
             ┌─────────────────────────┼─────────────────────────┐
             │                         │                         │
             ▼                         ▼                         ▼
       EJS Page Routes            REST API Routes           Chatbot API
             │                         │                         │
             ▼                         ▼                         ▼
       Page Controllers         API Controllers            Gemini / GenAI
             │                         │
             └───────────────┬─────────┘
                             ▼
                       Authentication
                       / Authorization
                             │
                             ▼
                        Mongoose ODM
                             │
                             ▼
                         MongoDB
                             │
             ┌───────────────┼─────────────────┐
             ▼               ▼                 ▼
         Cloudinary       Razorpay          Email / OAuth
         Image Storage     Payments           Services

The application initializes Express, MongoDB, sessions, Passport,
routes, Swagger, scheduled jobs, and Socket.IO during server startup.
fileciteturn45file1L76-L115 fileciteturn45file1L153-L192

5. Application Structure

The project follows a modular MVC-style structure.

A simplified structure is:

project-root/
│
├── app.js
├── package.json
├── swagger.json
│
├── app/
│ ├── config/
│ │ ├── db.js
│ │ ├── cloudinary.js
│ │ ├── passport.js
│ │ └── razorpay.js
│ │
│ ├── controller/
│ │ ├── authController.js
│ │ ├── userController.js
│ │ ├── sellerController.js
│ │ ├── adminController.js
│ │ └── paymentController.js
│ │
│ ├── model/
│ │ ├── user.js
│ │ ├── role.js
│ │ ├── products.js
│ │ ├── category.js
│ │ ├── order.js
│ │ ├── cart.js
│ │ ├── imageLibrary.js
│ │ └── otp.js
│ │
│ ├── routes/
│ │ ├── index.js
│ │ ├── authRouter.js
│ │ ├── userRouter.js
│ │ ├── sellerRouter.js
│ │ ├── adminRouter.js
│ │ ├── paymentRouter.js
│ │ └── chatbotRouter.js
│ │
│ ├── pageRouter/
│ │ ├── userPage.js
│ │ ├── sellerPage.js
│ │ └── adminPage.js
│ │
│ ├── middleware/
│ │ ├── authMiddleware.js
│ │ ├── optionalAuth.js
│ │ ├── cloudinaryMiddleware.js
│ │ └── csvUpload.js
│ │
│ ├── validation/
│ │ └── authValidation.js
│ │
│ ├── utils/
│ │ ├── token.js
│ │ ├── httpCodes.js
│ │ ├── cookieHelpers.js
│ │ ├── csvTemplate.js
│ │ ├── fileCleaner.js
│ │ ├── sendEmail.js
│ │ └── admin.js
│ │
│ ├── cron/
│ │ └── deleteUser.js
│ │
│ └── socket/
│ └── socket.js
│
├── views/
│ ├── admin/
│ ├── seller/
│ └── user/customer pages
│
└── public/
├── css/
├── js/
└── images/assets

The uploaded project files confirm separate controllers, page routers,
API routers, middleware, configuration modules, utilities, EJS pages,
and supporting services. fileciteturn47file1L7-L17
fileciteturn47file5L31-L35 fileciteturn47file8L49-L53

6. User Roles and Permissions

Customer

Customers can:

Register an account.

Verify their account using OTP.

Log in and log out.

Browse approved products.

Search and filter perfumes.

View product details.

Add products to the cart.

Update cart quantities.

Enter a shipping address during checkout.

Create a Razorpay order.

Complete payment.

Verify Razorpay payment signatures.

View order information.

Use the POÈME AI assistant.

Public product queries only expose products that are approved, active,
and in stock. fileciteturn46file2L383-L445

Seller

Sellers operate their own product catalogue.

Seller capabilities include:

Seller authentication.

Product creation.

Product editing.

Product deletion through soft delete.

Product restoration.

Product detail viewing.

Category management.

Product search and filtering.

Stock management.

Product approval-state visibility.

Image uploading.

Dedicated image library.

Image deletion with product-assignment protection.

CSV bulk product upload.

CSV template download.

Seller-specific order management.

Order status updates.

Seller-level order statistics.

Bulk CSV uploads validate duplicate SKUs/product names, category
ownership, required fields, and image-library references. Uploaded
images can be referenced by image codes such as IMG0001.
fileciteturn46file0L31-L90

Administrator

The administrator has marketplace-level visibility.

Admin functionality includes:

Admin authentication.

Dashboard analytics.

Product monitoring.

Product approval/rejection.

Category monitoring.

Customer monitoring.

Seller monitoring.

Seller soft deletion.

Order monitoring.

Order and payment status filtering.

Revenue statistics.

Top-seller analytics.

Product health indicators.

Seller activity indicators.

Order fulfilment statistics.

The dashboard calculates metrics including revenue, orders, customers,
sellers, products, pending sellers/products/orders, low-stock products,
out-of-stock products, paid orders, delivered orders, cancelled orders,
seller activity, fulfilment and product health.
fileciteturn46file11L1554-L1598

7. Authentication and Authorization

The project uses role-based authentication.

Authentication-related components include:

JWT access tokens.

JWT refresh tokens.

Password hashing with bcrypt.

Role-based middleware.

Cookie support.

Express sessions.

Passport.

Google OAuth 2.0.

OTP-based account verification.

The common authorization middleware is used with role declarations such
as:

Auth(["admin"])
Auth(["seller"])
Auth(["user"])

For example, seller order status updates require seller authorization,
while admin product approval requires admin authorization.
fileciteturn45file3L375-L391 fileciteturn44file6L942-L958

The refresh-token API is available through:

POST /api/v1/new-accessToken

It accepts a refresh token and returns a new access token.
fileciteturn44file8L1209-L1267

8. Customer Shopping Flow

The main customer journey is:

Browse Products
↓
Search / Filter
↓
View Product
↓
Add to Cart
↓
Open Cart
↓
Enter Shipping Address
↓
Create Razorpay Order
↓
Razorpay Checkout
↓
Payment
↓
Verify Payment Signature
↓
Order Marked Paid
↓
Seller Processes Order
↓
Order Delivered

The payment controller calculates subtotal, shipping, tax and total
before creating the database order and Razorpay order. The current
implementation uses a ₹100 shipping charge for a non-empty order and
calculates tax at 18%. fileciteturn44file11L1543-L1616

9. Product Approval Workflow

Products submitted by sellers are not automatically treated as publicly
available inventory.

The admin can assign one of:

pending
approved
rejected

The approval endpoint updates both:

approvalStatus

isApproved

When a product is approved, it becomes eligible for the customer-facing
catalogue, subject to the other product visibility conditions.
fileciteturn44file6L925-L958

The customer-facing product queries require:

approvalStatus = approved
isApproved = true
isActive = true
stock > 0

This provides an important marketplace control layer between seller
product creation and customer visibility.
fileciteturn46file2L387-L437

10. Product and Image Management

Product Management

Products contain business information such as:

Product name

Slug

Description

Price

Stock

SKU

Brand

Tags

Category

Seller

Images

Approval status

Stock status

Active/inactive state

Creation/update timestamps

Seller-side product editing checks category ownership and prevents
another product owned by the same seller from using the same slug or
SKU.

Image Library

The seller has a dedicated image library.

Images are stored in Cloudinary and associated with:

Seller

Image code

Original filename

URL

Cloudinary public ID

File size

Format

Active state

The upload middleware allows JPG, JPEG, PNG and WEBP files and sets a 20
MB per-file limit. fileciteturn45file10L623-L663

Image codes are generated in a sequential format:

IMG0001
IMG0002
IMG0003
...

A product can reference image-library records rather than requiring
sellers to repeatedly upload the same product image.

Images assigned to an active product cannot be deleted from the image
library.

11. CSV Bulk Product Upload

The seller system includes a dedicated CSV product-import workflow.

Typical CSV fields

Product Name
Category
SKU
Description
Brand
Price
Stock
Tags
Image1
Image2
Image3
Image4
Image5

The upload process:

Receives a CSV file.

Parses the CSV.

Validates required product fields.

Detects duplicate SKUs inside the uploaded file.

Detects duplicate product names inside the uploaded file.

Checks existing seller products.

Validates the seller's category.

Generates a product slug.

Validates image codes.

Ensures image codes are unique.

Enforces the five-image limit.

Verifies referenced images exist in the seller's image library.

Creates products as draft/submitted catalogue records.

Produces upload statistics.

Cleans the uploaded CSV using the project's file cleaner.

The API version returns a summary containing successful rows,
duplicates, category failures, validation failures, total failures and
total CSV rows. fileciteturn46file0L92-L153

The CSV upload API uses multipart form data and the project's
csvUpload middleware. fileciteturn46file8L1263-L1304

12. File Cleanup

The project contains a dedicated fileCleaner utility.

The CSV workflow explicitly calls the cleaner after successful
processing and also attempts cleanup in the error path. This prevents
uploaded CSV files from unnecessarily remaining on the server.
fileciteturn46file0L124-L153

13. Orders and Order Fulfilment

Orders contain:

Customer/user reference

Product items

Product name

Product price

Quantity

Item total

Subtotal

Shipping

Tax

Total

Shipping address

Payment method

Payment status

Order status

Razorpay order ID

Razorpay payment ID

Timestamps

Supported order states are:

pending
confirmed
processing
shipped
delivered
cancelled

Supported payment states include:

pending
paid
failed
refunded

Seller Order Workflow

Sellers can move orders through a controlled forward flow:

pending
↓
confirmed
↓
processing
↓
shipped
↓
delivered

Cancellation is allowed from earlier states according to the
controller's transition rules.

Once an order reaches delivered or cancelled, the seller cannot
change it. fileciteturn45file3L375-L391

The seller order aggregation also ensures that a seller can only manage
orders containing products belonging to that seller.

14. Razorpay Payment Integration

Razorpay is used for online payment processing.

Payment flow

Customer Checkout
↓
Create Database Order
↓
Create Razorpay Order
↓
Return Razorpay Order ID
↓
Razorpay Checkout
↓
Payment Completed
↓
Client Sends Payment Details
↓
Server Generates HMAC Signature
↓
Signature Comparison
↓
Verify Order Ownership
↓
Verify Razorpay Order ID
↓
Mark Payment Successful

The application creates the Razorpay order using:

amount = total × 100
currency = INR

and stores the Razorpay order ID in MongoDB.
fileciteturn45file2L208-L234

Payment verification uses HMAC SHA-256 with the Razorpay API secret and
verifies:

razorpay_order_id + "|" + razorpay_payment_id

before processing the payment. fileciteturn45file2L285-L303

The server also checks that the database order belongs to the
authenticated user and that the Razorpay order ID matches the stored
order. fileciteturn45file2L305-L338

15. POÈME AI Assistant

The application contains an AI chatbot endpoint:

POST /api/chatbot

The assistant is intentionally scoped to POÈME Perfumery topics.

Supported topics include areas such as:

Perfumes

Fragrances

Products

Brands

Categories

Price

Stock

Cart

Checkout

Orders

Tracking

Delivery

Shipping

Returns

Refunds

Exchange

Payments

Coupons

Discounts

Offers

Login

Registration

Account

Contact

Support

Questions outside the supported POÈME Perfumery scope are rejected
instead of being treated as general-purpose questions.
fileciteturn46file4L647-L716

The AI functionality is backed by Google's GenAI package, which is
included in the project's dependency set. fileciteturn45file0L26-L55

16. Admin Dashboard and Analytics

The administrator dashboard is designed as a marketplace control centre.

It includes:

Business KPIs

Total revenue

Total orders

Total customers

Active sellers

Total products

Operational indicators

Pending sellers

Pending products

Pending orders

Low-stock products

Out-of-stock products

Order indicators

Paid orders

Delivered orders

Cancelled orders

Calculated health metrics

Seller activity

Order fulfilment

Product health

Analytics

Revenue chart for the recent 30-day period

Recent orders

Top sellers by revenue

The dashboard uses MongoDB aggregation pipelines to derive these
statistics. The revenue chart is grouped by day using the Asia/Kolkata
timezone. fileciteturn44file10L1462-L1508

17. Admin Product Management

The administrator product view supports:

Pagination

Search

Approval-status filtering

Stock-status filtering

Seller lookup

Category lookup

Product statistics

Approval state management

Products are joined with seller and category information through MongoDB
aggregation $lookup stages. fileciteturn44file2L281-L377

18. Admin Seller Management

The seller management section provides:

Seller search

Seller pagination

Product counts

Active-product counts

Seller status

Seller verification status

Seller creation/update dates

Pending-seller count

Seller deletion is implemented as a soft delete by setting:

isActive = false

rather than physically removing the seller document.
fileciteturn45file16L1083-L1146

19. Admin Customer Management

The customer management page focuses on customers who have actually
placed qualifying orders.

The aggregation:

Starts with paid orders.

Excludes cancelled orders.

Resolves the customer.

Resolves the customer's role.

Excludes admin and seller accounts.

Supports search by customer name, email and phone.

Groups orders by customer.

Calculates total orders.

Calculates total spending.

Counts products ordered.

Shows latest order information.

This gives the administrator a customer view based on actual purchasing
activity rather than simply listing every user account.

20. Categories

Categories are seller-owned and connected to products.

The admin category view supports:

Category search.

Seller information.

Product counts.

Pagination.

Total category statistics.

Categories with products.

Empty categories.

Total products assigned to categories.

The category page uses aggregation lookups to calculate product counts.

21. API Architecture

The project exposes versioned APIs under:

/api/v1

Major API areas include:

/api/v1/new-accessToken

/api/v1/user/...

/api/v1/seller/...

/api/v1/payment/...

/api/v1/admin/...

The project also has:

/api/chatbot

for the POÈME AI assistant.

The route index separates page routes from API routes and registers
user, seller, admin, authentication, payment and chatbot routing.
fileciteturn45file17L1159-L1199

22. Swagger / OpenAPI Documentation

Swagger is integrated directly into the Express application.

The Swagger UI is exposed at:

/poeme-perfumery/swagger

The application loads swagger.json, generates the OpenAPI document
through swagger-jsdoc, and serves the UI through swagger-ui-express.
fileciteturn45file1L107-L110 fileciteturn45file1L163-L168

The API routers contain Swagger annotations for:

Authentication

User APIs

Seller APIs

Admin APIs

Payment APIs

Chatbot API

Examples include seller CSV upload documentation, seller order-status
updates, admin product approval, admin orders, categories, customers and
sellers. fileciteturn46file8L1267-L1326
fileciteturn45file16L962-L1146

23. API Authentication

Protected APIs use bearer authentication.

Example:

Authorization: Bearer <access-token>

Swagger definitions use:

security:

- bearerAuth: []

Role-based middleware then restricts access according to the
authenticated user's role.

24. Important API Examples

Refresh Access Token

POST /api/v1/new-accessToken
Content-Type: application/json

{
"refreshToken": "<refresh-token>"
}

Create Payment Order

POST /api/v1/payment/create-order
Authorization: Bearer <access-token>
Content-Type: application/json

{
"shippingAddress": {
"name": "Customer Name",
"phone": "9876543210",
"address": "123 Main Road",
"city": "Kolkata",
"state": "West Bengal",
"pincode": "700001"
}
}

Verify Payment

POST /api/v1/payment/verify-payment
Authorization: Bearer <access-token>
Content-Type: application/json

{
"razorpay_payment_id": "pay_xxxxx",
"razorpay_order_id": "order_xxxxx",
"razorpay_signature": "signature",
"dbOrderId": "mongodb-order-id"
}

Seller CSV Upload

POST /api/v1/seller/products/bulk-upload
Authorization: Bearer <seller-access-token>
Content-Type: multipart/form-data

Form field:

file=<product CSV>

Seller Order Status

PATCH /api/v1/seller/orders/:id/status
Authorization: Bearer <seller-access-token>
Content-Type: application/json

{
"orderStatus": "confirmed"
}

25. Middleware

The project uses middleware for several cross-cutting responsibilities.

Authentication middleware

Protects routes and verifies user roles.

Optional authentication

Allows APIs such as payment creation to work with the application's
authenticated-user context while explicitly checking authentication
where required.

Cloudinary upload middleware

Handles image uploads, validates image MIME types, limits file size and
stores images in Cloudinary. fileciteturn45file10L623-L663

CSV upload middleware

Handles multipart CSV uploads for seller bulk product imports.

Session middleware

Maintains server-side session state.

Cookie middleware

Reads authentication and application cookies.

Passport middleware

Supports Passport authentication and OAuth integration.

26. Database Design

The project uses MongoDB through Mongoose.

The main domain entities are:

User
Role
Product
Category
Order
Cart
ImageLibrary
OTP

Relationships

Role
│
└── User
│
├── Products
│ └── Category
│ └── ImageLibrary
│
├── Cart
│
└── Orders
└── Order Items
└── Product

The application frequently uses MongoDB aggregation pipelines with:

$match

$lookup

$unwind

$group

$project

$facet

$sort

$count

$set

This is particularly visible in admin analytics, seller order
management, product management and category statistics.

27. Data Ownership and Isolation

Seller data is scoped to the authenticated seller.

For example:

{
sellerId: req.user.id
}

is used to ensure sellers access only their own products, categories,
images and relevant orders.

Seller order queries additionally join order items with products and
verify that the product's sellerId matches the authenticated seller.

This is an important multi-vendor marketplace security boundary.

28. Soft Delete Strategy

The application uses soft deletion for important business records.

For products:

isActive = false

For sellers:

isActive = false

This preserves database records while removing them from active business
workflows.

The seller product restoration flow reverses the product's active state.

29. Background Jobs

The project includes node-cron and a scheduled deleteUser job.

This indicates that account-related cleanup is handled separately from
normal request/response processing.

The cron module is loaded during application startup.
fileciteturn45file1L112-L114

30. Real-Time Infrastructure

Socket.IO is integrated into the HTTP server.

Startup sequence:

MongoDB connection
↓
Admin initialization
↓
HTTP server creation
↓
Socket.IO initialization
↓
Server listen

This provides infrastructure for real-time features such as chat or live
application events. fileciteturn45file1L171-L192

31. Email and OTP

The project includes:

Nodemailer

OTP model

OTP validation

Email helper functions

OTP functionality is part of the authentication flow and is used to
verify user accounts.

The user controller imports the OTP model, email helper and
authentication validation schemas. fileciteturn46file2L357-L376

32. Google Authentication

Passport and passport-google-oauth20 are included.

The application validates the following environment variables during
startup:

GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL

This means Google authentication is part of the configured
authentication architecture. fileciteturn45file1L81-L95

33. Environment Variables

The application requires environment-based configuration.

The startup code explicitly validates:

SESSION_SECRET
JWT_SECRET
JWT_REFRESH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL

The payment and media integrations also use environment variables for
Razorpay and Cloudinary configuration.

Typical configuration categories

PORT=4500

SESSION_SECRET=...

JWT_SECRET=...
JWT_REFRESH_SECRET=...

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=...

MONGO_URI=...

RAZERPAY_API_KEY=...
RAZERPAY_API_SECRET=...

CLOUD_NAME=...
CLOUD_API=...
CLOUD_SECRET=...
CLOUD_FOLDER_NAME=...

GEMINI_API_KEY=...

Use the exact variable names expected by the project's configuration
files when creating your .env.

Never commit real credentials, API secrets, database credentials or
OAuth secrets to source control.

34. Running the Project

Install dependencies

npm install

Development mode

npm run dev

The development script runs the Node.js application with Nodemon and
watches the Tailwind CSS build process concurrently.
fileciteturn45file0L19-L24

Production/start command

npm start

Build CSS

npm run build:css

Watch CSS

npm run watch:css

35. Application Startup

The server startup process performs the following:

Loads environment variables.

Validates required environment configuration.

Creates the Express application.

Configures JSON and URL-encoded body parsing.

Configures cookies.

Serves static assets.

Configures EJS.

Configures sessions.

Configures flash messages.

Initializes Passport.

Registers routes.

Registers Swagger UI.

Connects to MongoDB.

Creates/checks the admin account.

Creates the HTTP server.

Initializes Socket.IO.

Starts listening on the configured port.

This startup sequence is implemented in app.js.
fileciteturn45file1L115-L192

36. Web Routes vs API Routes

The project intentionally supports two application styles.

Server-rendered web application

Used by the EJS pages:

/poeme-perfumery/...
/poeme-perfumery/seller/...
/poeme-perfumery/admin/...

REST API

Used by API clients and frontend/API integrations:

/api/v1/...

This separation allows the same business domain to support both
traditional server-rendered pages and API-based clients.

37. Current API Route Map

The current route configuration includes:

/api/v1
└── Authentication

/api
└── Chatbot

/poeme-perfumery
└── Customer pages

/poeme-perfumery/seller
└── Seller pages

/poeme-perfumery/admin
└── Admin pages

/api/v1/payment
└── Payment APIs

/api/v1/user
└── Customer APIs

/api/v1/seller
└── Seller APIs

The current uploaded route index also contains an Admin API mount using
/api/v1/seller. This appears inconsistent with the documented Admin
endpoints, which use /api/v1/admin/.... If this is the current
production file, the mount should be reviewed before deployment.
fileciteturn45file18L1241-L1251

38. API Documentation URL

After starting the application, Swagger UI is intended to be available
at:

http://localhost:4500/poeme-perfumery/swagger

The actual port can be changed through PORT.

39. Development Scripts

The project defines:

{
"start": "node app.js",
"dev": "concurrently -n \"server,css\" -c \"cyan,magenta\" \"nodemon app.js --ext js,ejs,css --ignore public/css/output.css\" \"npm run watch:css\"",
"build:css": "tailwindcss -i ./public/css/input.css -o ./public/css/output.css",
"watch:css": "tailwindcss -i ./public/css/input.css -o ./public/css/output.css --watch"
}

These scripts provide separate production, development, CSS build and
CSS watch workflows. fileciteturn45file0L19-L24

40. Security Considerations

The project includes several security-oriented controls:

Password hashing with bcrypt.

JWT authentication.

Refresh-token support.

Role-based authorization.

Seller data ownership checks.

Payment signature verification.

Payment order ownership verification.

Razorpay order ID validation.

Duplicate product checks.

Category ownership checks.

Image ownership checks.

File type validation.

File size limits.

Soft-delete behaviour.

Input validation with Joi.

Regex escaping in multiple search operations.

Environment-based secret management.

The payment controller specifically prevents a user from verifying an
order belonging to another user. fileciteturn45file2L305-L338

41. Important Business Rules

Product visibility

A product is publicly visible only when it satisfies the approval,
active and stock conditions used by customer-facing queries.

Seller isolation

Sellers can operate only on records associated with their seller ID.

Image reuse

Products reference images from the seller image library.

Image deletion

Images assigned to active products cannot be deleted.

Product duplication

Seller product creation/import checks duplicate SKU and product name
conditions.

Order ownership

Sellers can manage an order only when the order contains one of their
products.

Order progression

Seller order status changes follow a controlled state transition model.

Payment verification

A successful client-side payment response is not trusted by itself. The
server verifies the Razorpay signature.

42. What an HR Reviewer Can Understand Quickly

POÈME Perfumery demonstrates experience with:

Full-stack application development.

Multi-role system design.

E-commerce architecture.

REST API development.

Authentication and authorization.

Database modelling.

MongoDB aggregation.

Payment gateway integration.

Cloud file storage.

Bulk data import.

Admin analytics.

Seller marketplace workflows.

Server-side rendering.

Responsive frontend development.

API documentation.

Third-party API integration.

AI assistant integration.

Real-time application infrastructure.

Background jobs.

Input validation and security controls.

The project therefore demonstrates more than basic CRUD development. It
contains business workflows spanning catalogue management, marketplace
administration, payments, fulfilment and customer support.

43. What a Developer Can Understand Quickly

A developer joining the project should start with:

1. app.js

Understand application initialization, middleware, Swagger, MongoDB,
Passport and Socket.IO.

2. Route index

Understand how page routes and API routes are mounted.

3. Authentication middleware

Understand how JWTs and roles are verified.

4. Models

Review User, Role, Product, Category, Cart, Order,
ImageLibrary and OTP.

5. Controllers

Review business logic by role:

userController
sellerController
adminController
paymentController

6. Swagger routers

Use the documented API routes to understand API inputs, outputs and
authentication requirements.

7. Cloudinary and upload middleware

Understand how product images and CSV files enter the system.

8. Payment controller

Understand order creation, Razorpay integration and signature
verification.

44. Suggested Development Workflow

For a new developer:

Clone Repository
↓
Install Dependencies
↓
Configure .env
↓
Start MongoDB
↓
Configure Cloudinary
↓
Configure Razorpay
↓
Configure Google OAuth
↓
Configure Gemini
↓
npm run dev
↓
Open Application
↓
Open Swagger
↓
Test APIs

45. Testing Approach

The current package.json does not define an automated test suite. Its
test script currently returns the default "no test specified" message.
fileciteturn45file0L19-L24

For production hardening, the project would benefit from automated
coverage for:

Authentication.

OTP verification.

Role authorization.

Product CRUD.

Seller isolation.

CSV validation.

Image ownership.

Cart calculations.

Checkout calculations.

Razorpay signature verification.

Order status transitions.

Admin approval.

Soft deletion/restoration.

API error responses.

46. Future Extension Areas

The existing architecture can be extended with:

Automated unit and integration tests.

API rate limiting.

Centralized API error middleware.

Structured application logging.

Request tracing.

Order cancellation/refund workflows.

Coupon and discount engine.

Wishlist APIs.

Product reviews and ratings.

Inventory reservation during checkout.

Webhook-based Razorpay payment reconciliation.

Email notifications for order status changes.

Seller sales reports.

Admin audit logs.

Automated API deployment.

CI/CD pipeline.

Production monitoring.

Redis-based caching.

More advanced recommendation/search functionality.

These are extension opportunities, not necessarily existing implemented
features.

47. Project Strengths

The strongest aspects of the current implementation are:

Multi-role architecture

The application separates customer, seller and admin responsibilities.

Marketplace controls

Admin approval prevents seller products from immediately becoming
public.

Seller isolation

Seller queries are scoped to seller ownership.

Real payment workflow

The application creates Razorpay orders and verifies signatures
server-side.

Cloud media management

Images are stored in Cloudinary and referenced through an image library.

Bulk catalogue management

CSV import reduces manual product creation effort.

Analytics

MongoDB aggregation is used for dashboard and operational statistics.

API-first extension

The system includes versioned REST endpoints and Swagger documentation.

AI support

The project includes a domain-scoped AI assistant for POÈME-related
customer support.

48. Project Status

The uploaded source represents a substantial full-stack implementation
containing:

Customer storefront.

Seller workspace.

Admin dashboard.

MongoDB data layer.

JWT authentication.

Google authentication configuration.

OTP functionality.

Product and category management.

Image library.

Cloudinary integration.

CSV bulk upload.

Razorpay checkout.

Order management.

Seller order fulfilment.

Admin product approval.

Admin analytics.

REST APIs.

Swagger documentation.

AI chatbot.

Socket.IO infrastructure.

Scheduled cleanup.

The README describes the implementation visible in the supplied project
files. Features described as future extensions are explicitly separated
from currently implemented functionality.

49. License

The project's package.json currently identifies the license as:

ISC

and identifies the author as:

Avijit Roy

fileciteturn45file0L11-L18

50. Quick Reference

Area Technology / Implementation

Runtime Node.js
Framework Express 5
Database MongoDB
ODM Mongoose
Rendering EJS
Styling Tailwind CSS
Authentication JWT, cookies, sessions, Passport
Password Security bcrypt
Validation Joi
OAuth Google OAuth 2.0
Payments Razorpay
Payment Verification HMAC SHA-256
Images Cloudinary
File Upload Multer
CSV csvtojson
Email Nodemailer
AI Google GenAI
Real-time Socket.IO
Scheduling node-cron
API Docs Swagger / OpenAPI
API UI Swagger UI Express
Development Nodemon + Concurrently
Code Formatting Prettier
Architecture MVC-style / modular Express

Final Summary

POÈME Perfumery is a full-stack, multi-vendor perfume e-commerce
platform with a clear separation between customers, sellers and
administrators.

The customer side provides the shopping journey from product discovery
through cart, address entry and Razorpay payment. The seller side
provides catalogue, image, CSV and fulfilment management. The
administrator side provides marketplace governance, product approval,
seller/customer management and analytics.

The backend is built around Express and MongoDB/Mongoose, while EJS and
Tailwind CSS provide the server-rendered web interface. Cloudinary
handles product media, Razorpay handles payments, JWT and role-based
middleware protect APIs, Swagger documents the REST layer, Socket.IO
provides real-time infrastructure, and Google GenAI powers the
domain-specific POÈME assistant.

This combination makes the project suitable for demonstrating practical
full-stack development, e-commerce business logic, API development,
database aggregation, third-party service integration and role-based
system design.
