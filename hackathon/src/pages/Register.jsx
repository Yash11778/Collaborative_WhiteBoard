import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FaUser, FaEnvelope, FaLock, FaSignInAlt, FaPalette } from 'react-icons/fa';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    color: `#${Math.floor(Math.random()*16777215).toString(16)}`
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuthStore();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRandomColor = () => {
    setFormData(prev => ({
      ...prev,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!formData.username || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await register(formData);
      if (success) {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
          Create an Account
        </h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="username">
              <FaUser className="mr-2" /> Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Choose a username"
            />
          </div>
          
          <div className="mb-4">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">
              <FaEnvelope className="mr-2" /> Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="you@example.com"
            />
          </div>
          
          <div className="mb-4">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="password">
              <FaLock className="mr-2" /> Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Minimum 6 characters"
            />
          </div>
          
          <div className="mb-4">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="confirmPassword">
              <FaLock className="mr-2" /> Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Confirm your password"
            />
          </div>
          
          <div className="mb-6">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="color">
              <FaPalette className="mr-2" /> Profile Color
            </label>
            <div className="flex items-center">
              <input
                type="color"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-10 h-10 border-0 p-0 mr-3 cursor-pointer"
              />
              <button 
                type="button" 
                onClick={handleRandomColor}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Generate Random Color
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This color will represent you when collaborating
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <FaSignInAlt className="mr-2" /> Register
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
