import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

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
    // First, sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }, // Save the username in the user metadata
    });
  
    if (authError) {
      setMessage(`Error: ${authError.message}`);
      setIsError(true);
      return;
    }
  
    // Check if signup was successful
    if (authData) {
      setEmail('');
      setPassword('');
      setUsername('');
      setMessage('Signup successful! Please check your email to confirm your account.');
      setIsError(false);

      // Optionally update user-specific metadata in your profiles table
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user?.id, // `authData.user` might be null before email confirmation
        username,
        updated_at: new Date().toISOString(),
      });
  
      if (profileError) {
        console.error(`Error setting username: ${profileError.message}`);
      }
    }
  };
  

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-gray-800">
          Welcome
        </h2>
        <p className="text-sm text-center text-gray-500 mb-6">
          Sign up or log in to continue
        </p>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-1"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleLogin}
                variant="default"
                className="w-full"
                type="submit"
              >
                Log In
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="signup">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-1"
                />
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="mt-1"
                />
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a password"
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleSignUp}
                variant="default"
                className="w-full"
                type="submit"
              >
                Sign Up
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {message && (
          <p
            className={`mt-4 text-center text-sm font-medium ${isError ? 'text-red-500' : 'text-green-500'}`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};
