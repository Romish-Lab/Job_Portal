import { useAuth } from "../context/AuthContext";
import Interviews from "./Interviews";
import EmployerInterviews from "./EmployerInterviews";

// /interviews shows the right view for the logged-in role:
//   employer  -> interviews they scheduled (can reschedule / complete / cancel)
//   candidate -> interviews they were invited to (view only)
export default function InterviewsEntry() {
  const { user } = useAuth();
  return user?.role === "employer" ? <EmployerInterviews /> : <Interviews />;
}
