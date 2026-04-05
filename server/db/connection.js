import { MongoClient } from "mongodb";

const URI = process.env.ATLAS_URI || "";
let db = null;
let client = null;

export async function connectDB() {
  // Return existing connection if already connected
  if (db && client) {
    console.log("📡 Using existing database connection");
    return db;
  }
  
  if (!URI) {
    throw new Error("ATLAS_URI environment variable is not set");
  }
  
  try {
    client = new MongoClient(URI, {
      // Proper TLS configuration (MongoDB Atlas default)
      tls: true,
      tlsAllowInvalidCertificates: false,  // Validate SSL certificates
      
      // Connection pooling for long-running server
      maxPoolSize: 10,
      minPoolSize: 2,
      
      // Timeouts for reliable connection
      connectTimeoutMS: 10000,      // 10 seconds to establish connection
      socketTimeoutMS: 45000,       // 45 seconds for socket operations
      serverSelectionTimeoutMS: 10000,  // 10 seconds to find server
      heartbeatFrequencyMS: 10000,  // Health check every 10 seconds
      maxIdleTimeMS: 45000,         // Close idle connections after 45 seconds
      
      // Retry logic for resilience
      retryWrites: true,
      retryReads: true,
    });
    
    // Connect and verify
    console.log("📡 Connecting to MongoDB Atlas...");
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");
    
    db = client.db("employees");
    console.log("✅ Database selected: employees");
    return db;
  } catch (err) {
    console.error("\n❌ MongoDB Connection Failed:");
    console.error("Error Message:", err.message);
    console.error("\n⚠️  TROUBLESHOOTING STEPS:");
    
    if (err.message.includes("tlsv1 alert") || err.message.includes("SSL")) {
      console.error("\n1️⃣  TLS/SSL Handshake Error - Check MongoDB Atlas:");
      console.error("   • Go to https://cloud.mongodb.com/");
      console.error("   • Check if cluster is running (green status)");
      console.error("   • Check Network Access > IP Whitelist");
      console.error("   • Add your IP: " + getClientIP());
      console.error("   • Verify username/password in connection string");
    } else if (err.message.includes("ECONNREFUSED")) {
      console.error("\n2️⃣  Cannot reach MongoDB Atlas - Check:");
      console.error("   • Internet connection");
      console.error("   • Firewall/Proxy settings");
      console.error("   • DNS resolution (nslookup cluster hostname)");
    } else if (err.message.includes("authentication")) {
      console.error("\n3️⃣  Authentication Failed - Check:");
      console.error("   • Username is correct");
      console.error("   • Password is correct");
      console.error("   • Special characters are URL-encoded");
    }
    
    process.exit(1);
  }
}

function getClientIP() {
  try {
    const os = require("os");
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (e) {
    return "YOUR_IP_ADDRESS";
  }
}

// Get the database instance
export function getDB() {
  if (!db) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return db;
}

// Close the database connection gracefully
export async function closeDB() {
  if (client) {
    try {
      await client.close();
      db = null;
      client = null;
      console.log("📴 MongoDB connection closed");
    } catch (err) {
      console.error("Error closing MongoDB connection:", err);
    }
  }
}