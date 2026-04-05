import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';

const API_URL = import.meta.env.MODE === 'production' ? '/' : 'http://localhost:5000';

const Record = (props) => (
  <tr className="border-b transition-colors hover:bg-muted/50">
    <td className="p-4 align-middle">{props.record.name}</td>
    <td className="p-4 align-middle">{props.record.email}</td>
    <td className="p-4 align-middle">{props.record.department || props.record.level}</td>
    <td className="p-4 align-middle">
      <div className="flex gap-2">
        <Link
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium text-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-blue-600 bg-blue-600 hover:bg-blue-700 h-9 rounded-md px-3"
          to={`/edit/${props.record._id}`}
        >
          Edit
        </Link>
        <Link
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium text-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-blue-600 bg-blue-600 hover:bg-blue-700 h-9 rounded-md px-3"
          to={`/feedback/${props.record._id}`}
        >
          Feedback
        </Link>
        <button
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium text-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-red-600 bg-red-600 hover:bg-red-700 h-9 rounded-md px-3"
          type="button"
          onClick={() => {
            if (window.confirm("Are you sure you want to delete this record?")) {
              props.deleteRecord(props.record._id);
            }
          }}
        >
          Delete
        </button>
      </div>
    </td>
  </tr>
);

Record.propTypes = {
  record: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    department: PropTypes.string,
    level: PropTypes.string,
  }).isRequired,
  deleteRecord: PropTypes.func.isRequired,
};

export default function RecordList() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function getRecords() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_URL}/record/`);
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }
        const data = await response.json();
        setRecords(data);
      } catch (err) {
        setError("Failed to load employee records. Please try again.");
        console.error("Error fetching records:", err);
      } finally {
        setLoading(false);
      }
    }
    getRecords();
  }, []); // ✅ FIXED: Empty array - runs once

  async function deleteRecord(id) {
    try {
      const response = await fetch(`${API_URL}/record/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete");
      }
      const newRecords = records.filter((el) => el._id !== id);
      setRecords(newRecords);
    } catch (error) {
      setError("Failed to delete record. Please try again.");
      console.error("Error deleting record:", error);
    }
  }

  return (
    <div className="w-full">
      <h3 className="text-2xl font-semibold p-4">Employee Directory</h3>

      {loading && (
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600 mt-2">Loading employees...</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 font-medium">❌ {error}</p>
        </div>
      )}

      {!loading && records.length === 0 && !error && (
        <div className="p-8 text-center bg-gray-50 rounded-md">
          <p className="text-gray-600 text-lg">No employees found yet.</p>
          <p className="text-gray-500">Create your first employee to get started!</p>
        </div>
      )}

      {records.length > 0 && (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 border-b">
              <tr>
                <th className="p-4 text-left font-semibold">Name</th>
                <th className="p-4 text-left font-semibold">Email</th>
                <th className="p-4 text-left font-semibold">Department</th>
                <th className="p-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <Record key={record._id} record={record} deleteRecord={deleteRecord} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}