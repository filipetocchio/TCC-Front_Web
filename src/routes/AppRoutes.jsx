// src/routes/AppRoutes.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import Home from '../pages/Home';
import EditProfile from '../pages/EditProfile'; // Crie essa página também

const AppRoutes = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/home" element={<Home />} />
      <Route path="/editprofile" element={<EditProfile />} />
    </Routes>
  </Router>
);

export default AppRoutes;
