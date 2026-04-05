  import { useState, useEffect } from "react";
  import { useParams, useNavigate } from "react-router-dom";
  
  // Form component for creating or updating feedback. (Create/Edit Feedback Screen)
  
  const API_URL = import.meta.env.MODE === 'production' ? '/' : 'http://localhost:5000'; // API URL
  
  export default function FeedbackForm() {
    // Manage form data and record status.
    const [form, setForm] = useState({      
      rating: 0,
      comment: "",
      givenBy: "",
      givenTo: ""
    });
    const [isGiven, setisGiven] = useState(true); // Flag to check if it's a new record or existing
    const [error, setError] = useState(""); // Error state for validation messages
    const params = useParams();         // Stores the route parameters, specifically the id or employeeId of the record.
    const navigate = useNavigate();     // A function to navigate between routes
  
      // Makes a GET request to fetch the record with the given id.
      // If successful, it updates the form with the fetched record.
      // If the record doesn't exist, it navigates back to the home page.
      // Check if the route has an ID parameter.
      // Attempt to get the id from params and convert it to a string, or if it doesn't exist or undefined, set id to undefined.
        
        
  
  // useEffect to fetch an existing record when the component mounts, if an id is provided in the URL. 
      useEffect(() => {
        async function fetchData() {
          const id = params.id?.toString() || undefined; // get the id from the URL params
          const employeeId = params.employeeId?.toString() || undefined; // get the employeeId from the URL params
          
          // If employeeId is provided, fetch the employee data to pre-fill givenTo
          if(employeeId) {
            try {
              const response = await fetch(`${API_URL}/record/${employeeId}`);
              if (response.ok) {
                const employee = await response.json();
                setForm(prev => ({
                  ...prev,
                  givenBy: employee.name || ""
                }));
              }
            } catch (err) {
              console.error("Error fetching employee data:", err);
            }
            return;
          }
          
          if(!id) return;   //if id is undefined exit the fetchData function early without making fetch request.
          setisGiven(false); // and set isGiven to false.
          // Makes a GET request to fetch the record with the given id.
          const response = await fetch(`${API_URL}/feedback/${id}`);
          if (!response.ok) {
            const message = `An error has occurred: ${response.statusText}`;
            console.error(message);
            return;
          }
          // Parse the JSON response
            const record = await response.json();
            // If the record doesn't exist, navigate back to the home page.
            if (!record) {
              console.warn(`Record with id ${id} not found`);
              navigate("/");
              return;
            }
  
          setForm(record); // Set the form state with fetched record data
      } // end of fetchData()
      fetchData(); // Call the fetchData function
      return; 
    }, [params.id, params.employeeId, navigate]); // trigger the effect when the id changes or when the navigate function changes.
  
  
  
  // Updates the state with the new value,
  // ensuring the form state reflects the user's input.
    function updateForm(value) {
      return setForm((prev) => {
        return { ...prev, ...value };
      });
    }
  
  
  
    // Handles form submission by either creating a new record or updating an existing one.
    // When either a POST or PATCH request is sent to the URL, fetch will either add a new record to the database or update an existing record in the database.
    
    // Check if the same person has given feedback within 24 hours
    async function checkFeedbackWithin24Hours(givenBy, givenTo) {
      try {
        const response = await fetch(`${API_URL}/feedback/check?givenBy=${givenBy}&givenTo=${givenTo}`);
        if (response.ok) {
          const data = await response.json();
          return data.exists; // Returns true if feedback exists within 24 hours
        }
        return false;
      } catch (err) {
        console.error('Error checking feedback history:', err);
        return false;
      }
    }

  function validateFeedback(form) {
  const errors = {};
  
  if (!form.givenBy?.trim()) errors.givenBy = "Giver is required";
  if (!form.givenTo?.trim()) errors.givenTo = "Recipient is required";
  if (!form.rating || form.rating < 1 || form.rating > 5) {
    errors.rating = "Rating must be between 1 and 5";
  }
  if (!form.comment?.trim()) errors.comment = "Comment is required";
  if (form.givenBy === form.givenTo) {
    errors.self = "Cannot give feedback to yourself";
  }
  
  return errors;
}

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    // Validate the form
    const errors = validateFeedback(form);
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors).join(", "));
      return;
    }

    try {
      // Check if feedback already exists within 24 hours (only for new feedback)
      if (isGiven) {
        const exists = await checkFeedbackWithin24Hours(form.givenBy, form.givenTo);
        if (exists) {
          setError("You have already given feedback to this employee within 24 hours. Try again later.");
          return;
        }
      }

      let response;
      const feedbackData = {
        rating: form.rating,
        comment: form.comment,
        givenBy: form.givenBy,
        givenTo: form.givenTo,
      };

      if (isGiven) {
        // Create new feedback
        response = await fetch(`${API_URL}/feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(feedbackData),
        });
      } else {
        // Update existing feedback
        response = await fetch(`${API_URL}/feedback/${params.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(feedbackData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save feedback");
        return;
      }

      // Success - navigate back
      navigate("/feedback-list");
    } catch (error) {
      setError("An error occurred while saving feedback.");
      console.error("Error:", error);
    }
  }
  
  
    return (
      <>
        <h3 className="text-lg font-semibold p-4">Create/Update Employee Feedback</h3>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        <form
          onSubmit={onSubmit}
          className="border rounded-lg overflow-hidden p-4"
        >
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-slate-900/10 pb-12 md:grid-cols-2">
          <div>
            <h2 className="text-base font-semibold leading-7 text-slate-900">
              Feedback 
            </h2>
           
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 ">
            <div className="sm:col-span-4">
              <label
                htmlFor="rating"
                className="block text-sm font-medium leading-6 text-slate-900">
                Rating (1-5)        
              </label>
              <div className="mt-2">
                <div className="flex gap-3 items-center">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        value={value}
                        checked={form.rating === value}
                        onChange={(e) => updateForm({ rating: parseInt(e.target.value) })}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm font-medium text-slate-900">{value}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="comment"
                className="block text-sm font-medium leading-6 text-slate-900">
                Comment
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600">
                  <textarea
                    name="comment"
                    id="comment"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="Enter your comments"
                    value={form.comment}
                    onChange={(e) => updateForm({ comment: e.target.value })}
                    rows="4"
                  />
                </div>
              </div>
            </div>
            <div className="sm:col-span-4">
              <label
                htmlFor="givenBy"
                className="block text-sm font-medium leading-6 text-slate-900">
                Given By          
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                 
                  {/* onChange is react prop that get triggered when input value changes. 
                  It calls the updateForm function with the new value of the input element that trigger the event.
                  'name' is set to the current value of the input field.*/}
                  <input
                    type="text"
                    name="givenBy"
                    id="givenBy"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="Given By"
                    value={form.givenBy}
                    onChange={(e) => updateForm({ givenBy: e.target.value })}
                  />

                </div>
              </div>
            </div>
           
            <div className="sm:col-span-4">
              <label
                htmlFor="givenTo"
                className="block text-sm font-medium leading-6 text-slate-900">
                Given To          
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                 
                  {/* onChange is react prop that get triggered when input value changes. 
                  It calls the updateForm function with the new value of the input element that trigger the event.
                  'name' is set to the current value of the input field.*/}
                  <input
                    type="text"
                    name="givenTo"
                    id="givenTo"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="Given To"
                    value={form.givenTo}
                    onChange={(e) => updateForm({ givenTo: e.target.value })}
                  />

                </div>
              </div>
            </div>
          </div> {/* End of grid */}
        </div> {/** End of bigger grid */}
        <div className="flex justify-end">
          <input
          type="submit"
          value="Save Employee Feedback"
          className="inline-flex items-center justify-center whitespace-nowrap text-md font-medium text-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-blue-600 bg-blue-600 hover:bg-blue-700 h-9 rounded-md px-3 cursor-pointer mt-4"
        />
        </div>

      </form>
    </>
  );
}