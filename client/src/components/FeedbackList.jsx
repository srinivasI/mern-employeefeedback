import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

const API_URL = import.meta.env.MODE === 'production' ? '/' : 'http://localhost:5000';

export default function FeedbackList() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("date-newest");

  useEffect(() => {
    async function getFeedbacks() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_URL}/feedback`);
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }
        const data = await response.json();
        // API returns { success, totalCount, feedbacks }
        setFeedbacks(data.feedbacks || []);
      } catch (err) {
        setError("Failed to load feedback. Please try again.");
        console.error("Error fetching feedbacks:", err);
      } finally {
        setLoading(false);
      }
    }
    getFeedbacks();
  }, []);

  const sortedFeedbacks = [...feedbacks].sort((a, b) => {
    switch (sortBy) {
      case "date-newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "date-oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "rating-high":
        return b.rating - a.rating;
      case "rating-low":
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  async function deleteFeedback(id, givenBy) {
    if (!window.confirm("Are you sure you want to delete this feedback?")) {
      return;
    }
    try {
      const response = await fetch(`${API_URL}/feedback/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ givenBy }),
      });
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      setFeedbacks(feedbacks.filter((f) => f._id !== id));
    } catch (error) {
      setError("Failed to delete feedback. Please try again.");
      console.error("Error deleting feedback:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Feedback List</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="mb-6 flex justify-between items-center">
        <div>
          <label className="mr-2 text-sm font-medium">Sort By:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date-newest">Date (Newest First)</option>
            <option value="date-oldest">Date (Oldest First)</option>
            <option value="rating-high">Rating (Highest First)</option>
            <option value="rating-low">Rating (Lowest First)</option>
          </select>
        </div>
       
      </div>

      {feedbacks.length === 0 ? (
        <div className="text-center p-8 bg-slate-50 rounded-lg">
          <p className="text-slate-600 mb-4">No feedback found.</p>
          <Link
            to="/feedback/create"
            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium text-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-blue-600 bg-blue-600 hover:bg-blue-700 h-9 rounded-md px-3"
          >
            Create First Feedback
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b">
              <tr>
                <th className="p-4 text-left font-semibold">From</th>
                <th className="p-4 text-left font-semibold">To</th>
                <th className="p-4 text-left font-semibold">Rating</th>
                <th className="p-4 text-left font-semibold">Comment</th>
                <th className="p-4 text-left font-semibold">Date</th>
                <th className="p-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFeedbacks.map((feedback) => (
                <FeedbackRow
                  key={feedback._id}
                  feedback={feedback}
                  onDelete={deleteFeedback}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FeedbackRow({ feedback, onDelete }) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating) => {
    return "⭐".repeat(rating);
  };

  return (
    <tr className="border-b transition-colors hover:bg-slate-50">
      <td className="p-4">{feedback.givenBy || "N/A"}</td>
      <td className="p-4">{feedback.givenTo || "N/A"}</td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <span>{renderStars(feedback.rating)}</span>
          <span className="text-slate-600">({feedback.rating}/5)</span>
        </div>
      </td>
      <td className="p-4 max-w-xs truncate">{feedback.comment || "N/A"}</td>
      <td className="p-4 whitespace-nowrap text-slate-600">
        {formatDate(feedback.createdAt)}
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <Link
            to={`/feedback/${feedback._id}`}
            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium text-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-blue-600 bg-blue-600 hover:bg-blue-700 h-8 rounded-md px-2"
          >
            Edit
          </Link>
          <button
            onClick={() => onDelete(feedback._id, feedback.givenBy)}
            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium text-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-red-600 bg-red-600 hover:bg-red-700 h-8 rounded-md px-2"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

FeedbackRow.propTypes = {
  feedback: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    givenBy: PropTypes.string,
    givenTo: PropTypes.string,
    rating: PropTypes.number.isRequired,
    comment: PropTypes.string,
    createdAt: PropTypes.string.isRequired,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};