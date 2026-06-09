import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/Card';
import Button from '../components/Button';

export default function ForgotPassword() {
  const { showSuccess, showError } = useNotification();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setEmailSent(true);
      showSuccess('Password reset link sent! Check your email.');
    } catch (error) {
      console.error('Forgot password error:', error);
      showError('Failed to send reset link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="container-custom py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-heading font-bold mb-3">Check Your Email</h2>
              <p className="text-secondary-600 mb-2">
                We've sent a password reset link to:
              </p>
              <p className="text-primary-600 font-medium mb-6">{email}</p>
              <p className="text-sm text-secondary-600 mb-8">
                Click the link in the email to reset your password. The link will expire in 24
                hours.
              </p>
              <div className="space-y-3">
                <Link to="/login">
                  <Button size="lg" className="w-full">
                    Back to Login
                  </Button>
                </Link>
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  className="w-full text-primary-600 hover:text-primary-700 font-medium"
                >
                  Resend Email
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-16">
      <div className="max-w-md mx-auto">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-3xl font-bold">FD</span>
          </div>
          <h1 className="text-3xl font-heading font-bold mb-2">Forgot Password?</h1>
          <p className="text-secondary-600">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="john.doe@example.com"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  error ? 'border-error' : 'border-secondary-300'
                }`}
              />
              {error && <p className="text-error text-sm mt-1">{error}</p>}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center space-x-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Back to Login</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
