// Turns an ApiError into a single user-facing sentence.
// The API's centralized failure shape is { success, message, errors? } where
// `errors` is either { source, issues: [{ field, message }] } (validation) or a
// plain list of issues.
export function describeApiError(
  error,
  { forbidden = "You do not have permission to perform this action.", fallback = "Something went wrong." } = {},
) {
  if (!error) return fallback;
  if (error.status === 403) return forbidden;
  if (error.status === 0) return "Cannot reach the MoveFlow API. Is the backend running?";

  const issues = Array.isArray(error.errors?.issues)
    ? error.errors.issues
    : Array.isArray(error.errors)
      ? error.errors
      : null;
  if (issues && issues.length > 0) return issues.map((issue) => issue.message).join(" · ");

  return error.message || fallback;
}

export default describeApiError;
