import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/Dashboard';
import { CourseEdit } from './pages/teacher/CourseEdit';
import { TeacherAnalytics } from './pages/teacher/Analytics';
import { StudentManagement } from './pages/teacher/StudentManagement';
import { UnitEdit } from './pages/teacher/vocab/UnitEdit';
import { TeacherVocabDashboard } from './pages/teacher/vocab/TeacherVocabDashboard';

// Student Pages
import { StudentHome } from './pages/student/Home';
import { StudentLearn } from './pages/student/Learn';
import { StudentVocabDashboard } from './pages/vocab/StudentVocabDashboard';

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole: 'teacher' | 'student' }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== allowedRole) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<Layout />}>
            {/* Teacher Routes */}
            <Route path="/teacher" element={
              <ProtectedRoute allowedRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="/teacher/courses/new" element={
              <ProtectedRoute allowedRole="teacher">
                <CourseEdit />
              </ProtectedRoute>
            } />
            <Route path="/teacher/courses/:id" element={
              <ProtectedRoute allowedRole="teacher">
                <CourseEdit />
              </ProtectedRoute>
            } />
            <Route path="/teacher/analytics" element={
              <ProtectedRoute allowedRole="teacher">
                <TeacherAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/teacher/students" element={
              <ProtectedRoute allowedRole="teacher">
                <StudentManagement />
              </ProtectedRoute>
            } />
            <Route path="/teacher/vocab" element={
              <ProtectedRoute allowedRole="teacher">
                <TeacherVocabDashboard />
              </ProtectedRoute>
            } />
            <Route path="/teacher/vocab/unit/:lectureId" element={
              <ProtectedRoute allowedRole="teacher">
                <UnitEdit />
              </ProtectedRoute>
            } />

            {/* Student Routes */}
            <Route path="/student" element={
              <ProtectedRoute allowedRole="student">
                <StudentHome />
              </ProtectedRoute>
            } />
            <Route path="/student/vocab" element={
              <ProtectedRoute allowedRole="student">
                <StudentVocabDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/learn/:courseId" element={
              <ProtectedRoute allowedRole="student">
                <StudentLearn />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
