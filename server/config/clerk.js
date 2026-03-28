const { verifyToken } = require("@clerk/backend");
const { clerkClient } = require("@clerk/express");

async function verifyClerkSessionToken(token) {
  return verifyToken(token, {
    secretKey: process.env.CLERK_SECRET_KEY,
    authorizedParties: [
      process.env.CLIENT_URL || "http://localhost:5173"
    ],
  });
}

module.exports = {
  verifyClerkSessionToken,
  clerkClient,
};

