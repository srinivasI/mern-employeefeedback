export function validateEmployee(data) {
  const errors = {};
  
  if (!data.name?.trim()) {
    errors.name = "Name is required";
  } else if (data.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  }
  
  if (!data.email?.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Email format is invalid";
  }
  
  if (!data.department?.trim()) {
    errors.department = "Department is required";
  }
  
  return errors;
}

export function validateFeedback(data) {
  const errors = {};
  
  if (!data.givenBy?.trim()) {
    errors.givenBy = "Giver ID is required";
  }
  
  if (!data.givenTo?.trim()) {
    errors.givenTo = "Recipient ID is required";
  }
  
  if (!data.rating || data.rating < 1 || data.rating > 5) {
    errors.rating = "Rating must be between 1 and 5";
  }
  
  if (!data.comment?.trim()) {
    errors.comment = "Comment is required";
  } else if (data.comment.trim().length < 10) {
    errors.comment = "Comment must be at least 10 characters";
  }
  
  if (data.givenBy === data.givenTo) {
    errors.self = "Cannot give feedback to yourself";
  }
  
  return errors;
}