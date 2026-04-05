import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import App from "./App";
import RecordForm from "./components/RecordForm";
import RecordList from "./components/RecordList";
import "./index.css";
import FeedbackForm from "./components/FeedbackForm";
import FeedbackList from "./components/FeedbackList";
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <RecordList /> },
      { path: "create", element: <RecordForm /> },
      { path: "edit/:id", element: <RecordForm /> },
      { path: "feedback/create", element: <FeedbackForm /> },
      { path: "feedback/:employeeId", element: <FeedbackForm /> },
      { path: "feedback-list", element: <FeedbackList /> }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
