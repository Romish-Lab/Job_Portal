import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/footer";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PostJob from "./pages/PostJob";
import MyJobs from "./pages/MyJobs";
import MyApplications from "./pages/MyApplications";
import JobApplicants from "./pages/JobApplicants";
import AdminUsers from "./pages/AdminUsers";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/post-job"
            element={
              <ProtectedRoute allow={["employer"]}>
                <PostJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-jobs"
            element={
              <ProtectedRoute allow={["employer"]}>
                <MyJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:id/applicants"
            element={
              <ProtectedRoute allow={["employer"]}>
                <JobApplicants />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-applications"
            element={
              <ProtectedRoute allow={["candidate"]}>
                <MyApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allow={["admin"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
