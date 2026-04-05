import express from "express";
import cors from "cors";
import path from 'path';
import { connectDB, closeDB } from "./db/connection.js";
import records from "./routes/record.js";
import feedback from "./routes/feedback.js";

const PORT = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://yourdomain.com'
    : ['http://localhost:5173', 'http://localhost:3000'], // Vite default + common dev ports
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}));

app.use(express.json());

// Routes
app.use("/record", records);
app.use("/feedback", feedback);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Server is running" });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    ...(process.env.NODE_ENV === 'development' && { message: err.message })
  });
});

// Start server with database connection
async function startServer() {
  try {
    // Connect to database first
    await connectDB();
    
    // Then start the server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
      console.log(`📊 NODE_ENV: ${process.env.NODE_ENV}`);
    });
    
    // Graceful shutdown handlers
    process.on("SIGINT", () => shutdownGracefully(server));
    process.on("SIGTERM", () => shutdownGracefully(server));
    
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

// Graceful shutdown function
async function shutdownGracefully(server) {
  console.log("\n⏹️  Shutting down gracefully...");
  
  // Stop accepting new connections
  server.close(async () => {
    // Close database
    await closeDB();
    console.log("✅ Server shutdown complete");
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error("❌ Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

startServer();