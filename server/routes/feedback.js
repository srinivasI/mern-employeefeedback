import express from "express";
import { ObjectId } from "mongodb"; // Convert the id from string to ObjectId for the _id.
import { getDB } from "../db/connection.js";
import { validateFeedback } from "../middleware/validators.js";

// Router for handling feedback-related routes
const router = express.Router();

// Get all feedback sorted by date (newest first) - MUST come before /:id
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const collection = await db.collection("feedback");
    const feedbacks = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    res.status(200).json({
      success: true,
      totalCount: feedbacks.length,
      feedbacks: feedbacks
    });
  } catch (err) {
    console.error("Failed to fetch all feedback:", err);
    res.status(500).json({ 
      error: "Error fetching feedback",
      code: "FETCH_ERROR"
    });
  }
});

// Check if feedback exists within 24 hours from the same person - MUST come before /:id
router.get("/check", async (req, res) => {
  try {
    const { givenBy, givenTo } = req.query;

    if (!givenBy?.trim() || !givenTo?.trim()) {
      return res.status(400).json({ 
        error: "givenBy and givenTo parameters are required",
        code: "MISSING_PARAMS"
      });
    }

    // Calculate the timestamp for 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const db = getDB();
    const collection = await db.collection("feedback");
    
    // Find feedback from the same person to the same person within the last 24 hours
    const result = await collection.findOne({
      givenBy: givenBy.trim(),
      givenTo: givenTo.trim(),
      createdAt: { $gte: twentyFourHoursAgo }
    });

    // Return true if feedback exists, false otherwise
    res.status(200).json({ exists: !!result });
  } catch (err) {
    console.error("Failed to check feedback history:", err);
    res.status(500).json({ 
      error: "Error checking feedback history",
      code: "CHECK_ERROR"
    });
  }
});

// Get feedback received by an employee (newest first) - MUST come before /:id
router.get("/received/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    if (!employeeId?.trim()) {
      return res.status(400).json({ 
        error: "Employee ID is required",
        code: "MISSING_EMPLOYEE_ID"
      });
    }
    
    const db = getDB();
    const collection = await db.collection("feedback");
    const feedbacks = await collection
      .find({ givenTo: employeeId.trim() })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.status(200).json({
      success: true,
      employeeId: employeeId.trim(),
      totalCount: feedbacks.length,
      averageRating: feedbacks.length > 0 
        ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(2)
        : null,
      feedbacks: feedbacks
    });
  } catch (err) {
    console.error("Failed to fetch received feedback:", err);
    res.status(500).json({ 
      error: "Error fetching feedback",
      code: "FETCH_ERROR"
    });
  }
});

// Get average rating for an employee - MUST come before /:id
router.get("/average/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    if (!employeeId?.trim()) {
      return res.status(400).json({ 
        error: "Employee ID is required",
        code: "MISSING_EMPLOYEE_ID"
      });
    }
    
    const db = getDB();
    const collection = await db.collection("feedback");
    
    const result = await collection.aggregate([
      { $match: { givenTo: employeeId.trim() } },
      {
        $group: {
          _id: "$givenTo",
          averageRating: { $avg: "$rating" },
          totalFeedback: { $sum: 1 },
          maxRating: { $max: "$rating" },
          minRating: { $min: "$rating" },
          ratings: { $push: "$rating" }
        }
      }
    ]).toArray();
    
    if (!result.length) {
      return res.status(200).json({ 
        employeeId: employeeId.trim(),
        averageRating: null, 
        totalFeedback: 0,
        message: "No feedback received yet"
      });
    }
    
    const data = result[0];
    res.status(200).json({
      success: true,
      employeeId: data._id,
      averageRating: data.averageRating ? parseFloat(data.averageRating.toFixed(2)) : null,
      totalFeedback: data.totalFeedback,
      maxRating: data.maxRating,
      minRating: data.minRating,
      ratingDistribution: {
        fiveStars: data.ratings.filter(r => r === 5).length,
        fourStars: data.ratings.filter(r => r === 4).length,
        threeStars: data.ratings.filter(r => r === 3).length,
        twoStars: data.ratings.filter(r => r === 2).length,
        oneStar: data.ratings.filter(r => r === 1).length,
      }
    });
  } catch (err) {
    console.error("Failed to calculate average rating:", err);
    res.status(500).json({ 
      error: "Error calculating average rating",
      code: "CALCULATION_ERROR"
    });
  }
});

// Get a single feedback by id - MUST come AFTER all specific routes
router.get("/:id", async (req, res) => {
  try {
    // Validate ObjectId format
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        error: "Invalid feedback ID format",
        code: "INVALID_ID"
      });
    }

    const db = getDB();
    const query = { _id: new ObjectId(req.params.id) };
    const collection = await db.collection("feedback");
    const result = await collection.findOne(query);

    if (!result) {
      return res.status(404).json({ 
        error: "Feedback not found",
        code: "NOT_FOUND"
      });
    }
    res.status(200).json(result);
  } catch (err) {
    console.error("Failed to fetch feedback:", err);
    res.status(500).json({ 
      error: "Error fetching feedback",
      code: "FETCH_ERROR"
    });
  }
});

// Create a new feedback
router.post("/", async (req, res) => {
 try {
    const { rating, comment, givenBy, givenTo } = req.body;
    
    // Validate input using validators
    const errors = validateFeedback({ rating, comment, givenBy, givenTo });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: errors
      });
    }
    
    // Check 24-hour duplicate prevention
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const db = getDB();
    const collection = await db.collection("feedback");
    
    const existing = await collection.findOne({
      givenBy: givenBy.trim(),
      givenTo: givenTo.trim(),
      createdAt: { $gte: twentyFourHoursAgo }
    });
    
    if (existing) {
      return res.status(409).json({ 
        error: "You have already given feedback to this employee within 24 hours. Try again later.",
        code: "DUPLICATE_FEEDBACK_24H"
      });
    }
    
    const newDocument = {
      rating: parseInt(rating),
      comment: comment.trim(),
      givenBy: givenBy.trim(),
      givenTo: givenTo.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(newDocument);
    res.status(201).json({ 
      success: true, 
      id: result.insertedId,
      data: { ...newDocument, _id: result.insertedId }
    });
  } catch (err) {
    console.error("Failed to create feedback:", err);
    res.status(500).json({ 
      error: "Error creating feedback",
      code: "SERVER_ERROR"
    });
  }

});



// Update feedback by id
router.patch("/:id", async (req, res) => {
  try {
    // Validate ObjectId format
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        error: "Invalid feedback ID format",
        code: "INVALID_ID"
      });
    }

    // Validate input
    const errors = validateFeedback(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: errors
      });
    }

    const query = { _id: new ObjectId(req.params.id) };
    const updates = {
      $set: {
        rating: parseInt(req.body.rating),
        comment: req.body.comment.trim(),
        givenBy: req.body.givenBy.trim(),
        givenTo: req.body.givenTo.trim(),
        updatedAt: new Date(),
      },
    };
    const db = getDB();
    const collection = await db.collection("feedback");
    const result = await collection.updateOne(query, updates);

    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        error: "Feedback not found",
        code: "NOT_FOUND"
      });
    }
    res.status(200).json({ 
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error("Failed to update feedback:", err);
    res.status(500).json({ 
      error: "Error updating feedback",
      code: "UPDATE_ERROR"
    });
  }
});

// Delete feedback (only the person who gave it can delete)
router.delete("/:id", async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const { givenBy } = req.body; // In production, this would come from req.user
    
    // Validate ObjectId format
    if (!ObjectId.isValid(feedbackId)) {
      return res.status(400).json({ 
        error: "Invalid feedback ID format",
        code: "INVALID_ID"
      });
    }
    
    if (!feedbackId?.trim()) {
      return res.status(400).json({ 
        error: "Feedback ID is required",
        code: "MISSING_ID"
      });
    }
    
    if (!givenBy?.trim()) {
      return res.status(400).json({ 
        error: "givenBy field is required",
        code: "MISSING_USER"
      });
    }
    
    const query = { _id: new ObjectId(feedbackId) };
    const db = getDB();
    const collection = await db.collection("feedback");
    
    // First, fetch the feedback to check authorization
    const feedback = await collection.findOne(query);
    
    if (!feedback) {
      return res.status(404).json({ 
        error: "Feedback not found",
        code: "NOT_FOUND"
      });
    }
    
    // Check if the user is the one who gave the feedback
    if (feedback.givenBy !== givenBy.trim()) {
      return res.status(403).json({ 
        error: "Only the feedback giver can delete this feedback",
        code: "UNAUTHORIZED"
      });
    }
    
    const result = await collection.deleteOne(query);
    
    res.status(200).json({ 
      success: true,
      deleted: result.deletedCount,
      message: "Feedback deleted successfully"
    });
  } catch (err) {
    console.error("Failed to delete feedback:", err);
    res.status(500).json({ 
      error: "Error deleting feedback",
      code: "DELETE_ERROR"
    });
  }
});

export default router;
