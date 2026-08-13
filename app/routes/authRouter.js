const express = require("express");
const authController = require("../controller/authController");

const Auth = express.Router();

/**
 * @swagger
 * /api/v1/new-accessToken:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Generate a new access token
 *     description: Generates a new access token using the refresh token.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token.
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 *     responses:
 *       200:
 *         description: New access token generated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 *       400:
 *         description: Refresh token is missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Refresh token is required.
 *
 *       401:
 *         description: Invalid or expired refresh token.
 *
 *       500:
 *         description: Server error.
 */
Auth.post("/new-accessToken", authController.newAccessToken);

module.exports = Auth;
