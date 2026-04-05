import express from "express";
import { ObjectId } from "mongodb"; // Convert the id from string to ObjectId for the _id.
import { getDB } from "../db/connection.js";
import { validateEmployee } from "../middleware/validators.js";

// Router for handling record-related routes is created here. 
const router = express.Router();

// Backend defines API endpoints at /record for CRUD operations (GET, GET by id, POST, PATCH, DELETE):

// Get a list of all the records.
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const collection = await db.collection("records"); // Get 'records' collection from db.
    const results = await collection.find({}).toArray(); // Fetch all records and convert to an array
    res.status(200).json(results); // Send the results with a 200 OK status (use json, not send)
  } catch (err) {
    console.error("Failed to fetch records:", err); 
    res.status(500).json({ 
      error: "Error fetching records",
      code: "FETCH_ERROR"
    });
  }
});

// Get a single record by id
router.get("/:id", async (req, res) => {
  try {
    // Validate ObjectId format
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        error: "Invalid record ID format",
        code: "INVALID_ID"
      });
    }

    const db = getDB();
    const query = { _id: new ObjectId(req.params.id) }; // Create a query object to find the record by its _id
    const collection = await db.collection("records"); // Get 'records' collection 
    const result = await collection.findOne(query); // Find one record matching the query

    if (!result) {
      return res.status(404).json({ 
        error: "Record not found",
        code: "NOT_FOUND"
      });
    }
    res.status(200).json(result);
  } catch (err) {
    console.error("Failed to fetch record:", err);
    res.status(500).json({ 
      error: "Error fetching record",
      code: "FETCH_ERROR"
    });
  }
});

// Create a new record.
router.post("/", async (req, res) => {
  try {
    // Validate input
    const errors = validateEmployee(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: errors
      });
    }

    const newDocument = {
      name: req.body.name.trim(),
      email: req.body.email.trim(),
      department: req.body.department.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const db = getDB();
    const collection = await db.collection("records"); // Get 'records' collection 
    const result = await collection.insertOne(newDocument); // Insert the new document into the collection
    res.status(201).json({ 
      success: true,
      id: result.insertedId,
      data: { ...newDocument, _id: result.insertedId }
    }); // 201 Created
  } catch (err) {
    console.error("Failed to create record:", err);
    res.status(500).json({ 
      error: "Error creating record",
      code: "CREATE_ERROR"
    });
  }
});



// Update a record by id.
router.patch("/:id", async (req, res) => {
  try {
    // Validate ObjectId format
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        error: "Invalid record ID format",
        code: "INVALID_ID"
      });
    }

    // Validate input
    const errors = validateEmployee(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: errors
      });
    }

    // Converts the id parameter from the URL into a MongoDB ObjectId.
    const query = { _id: new ObjectId(req.params.id) }; // Used to find the record by its _id
    // Creates an update object using the $set operator.
    // The fields name, email, and department are set to the values provided in the request body (req.body).
    const updates = {
      $set: {
        name: req.body.name.trim(),  
        email: req.body.email.trim(), 
        department: req.body.department.trim(),
        updatedAt: new Date()
      },
    };
    const db = getDB();
    const collection = await db.collection("records"); // Retrieves records collection.
    // Update the document matching the query
    const result = await collection.updateOne(query, updates);

    if (result.matchedCount === 0) { // Checks the matchedCount property of the result to determine if any documents were matched by the query.
      return res.status(404).json({ 
        error: "Record not found",
        code: "NOT_FOUND"
      });
    }
    res.status(200).json({ 
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error("Failed to update record:", err);
    res.status(500).json({ 
      error: "Error updating record",
      code: "UPDATE_ERROR"
    });
  }
});




// Delete a record
router.delete("/:id", async (req, res) => {
  try {
    // Validate ObjectId format
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        error: "Invalid record ID format",
        code: "INVALID_ID"
      });
    }

    const db = getDB();
    const query = { _id: new ObjectId(req.params.id) };
    const collection = await db.collection("records");
    const result = await collection.deleteOne(query); // Delete the document matching the query

    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        error: "Record not found",
        code: "NOT_FOUND"
      });
    }
    res.status(200).json({ 
      success: true,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Failed to delete record:", err);
    res.status(500).json({ 
      error: "Error deleting record",
      code: "DELETE_ERROR"
    });
  }
});

export default router; // Export the router
