import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';


export const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      setIsError(true);
    } else {
      setMessage('Logged in successfully!');
      setIsError(false);
    }
  };

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("User already exists")) {
        setMessage("This email is already registered. Please log in.");
      } else {
        setMessage(`Error: ${error.message}`);
      }
      setIsError(true);
    } else {
      setMessage('Signup successful! Please check your email.');
      setIsError(false);
      console.log(data); // Handle sign-up response
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-gray-800">Welcome</h2>
        <p className="text-sm text-center text-gray-500">Sign up or log in to continue</p>

        <div className="mt-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full mt-2 mb-4"
          />

          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full mt-2"
          />
        </div>

        <div className="mt-6">
          {isSignUp ? (
            <Button
              onClick={handleSignUp}
              variant="default"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
            >
              Sign Up
            </Button>
          ) : (
            <Button
              onClick={handleLogin}
              variant="default"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
            >
              Log In
            </Button>
          )}
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-blue-500 hover:underline"
          >
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        {message && (
          <p className={`mt-4 text-center text-sm font-medium ${isError ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};
