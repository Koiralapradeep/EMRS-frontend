import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../Context/authContext';
import { useNavigate } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email,
        password,
      });

      const user = response.data.user;
      if (response.data.success && user?.role) {
        login({ ...user, token: response.data.token }, navigate);
      } else {
        setError('Login failed. User role is missing.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An unexpected error occurred. Please try again.');
      console.error('Login Error:', err.response || err.message);
    }
  };

  const handleGoogleLogin = () => {
    // Add your logic for Google login here
    console.log('Continue with Google clicked');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition duration-300"
          >
            Login
          </button>
        </form>

        <div className="text-center mt-4">
          <a
            href="/forgot-password"
            className="text-blue-400 hover:underline text-sm"
          >
            Forgot Password?
          </a>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white text-gray-900 py-2 rounded font-medium flex items-center justify-center transition duration-300 hover:bg-gray-100"
        >
          <FaGoogle className="mr-2" />
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
