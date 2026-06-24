// Deliberately vulnerable sample for the Quantum Mythos white-box demo.
const crypto = require("crypto");

// Hardcoded secret (CWE-798).
const API_KEY = "AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY";

function makeKeyPair() {
  // Quantum-vulnerable RSA (Shor-breakable).
  return crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
}

function hashPassword(pw) {
  // Broken hash for passwords.
  return crypto.createHash("md5").update(pw).digest("hex");
}

function newSessionId() {
  // Weak RNG for a session id (CWE-330).
  return Math.floor(Math.random() * 1e9).toString();
}

module.exports = { makeKeyPair, hashPassword, newSessionId, API_KEY };
