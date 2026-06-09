import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRider } from '../../context/RiderContext';
import { useNotification } from '../../context/NotificationContext';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function RiderLogin() {
  const navigate = useNavigate();
  const { login } = useRider();
  const { showSuccess, showError } = useNotification();

  const [formData, setFormData] = useState({
    email: 'rider@fooddelivery.com',
    password: 'demo123',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        showSuccess('Welcome back! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/rider/dashboard');
        }, 1000);
      } else {
        showError(result.error || 'Login failed. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full mb-4 text-3xl">
            🏍️
          </div>
          <h1 className="text-3xl font-heading font-bold mb-2">Rider Portal</h1>
          <p className="text-secondary-600">Sign in to start delivering</p>
        </div>

        {/* Login Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.email ? 'border-error' : 'border-secondary-300'
                }`}
                placeholder="rider@example.com"
              />
              {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.password ? 'border-error' : 'border-secondary-300'
                }`}
                placeholder="Enter your password"
              />
              {errors.password && <p className="text-error text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Demo Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Demo Credentials:</strong><br />
                Email: rider@fooddelivery.com<br />
                Password: demo123
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Links */}
            <div className="text-center space-y-2">
              <p className="text-sm text-secondary-600">
                <Link to="/forgot-password" className="text-primary-600 hover:underline">
                  Forgot your password?
                </Link>
              </p>
              <p className="text-sm text-secondary-600">
                Want to become a rider?{' '}
                <Link to="/rider/register" className="text-primary-600 hover:underline">
                  Apply now
                </Link>
              </p>
              <p className="text-sm text-secondary-600">
                <Link to="/" className="text-primary-600 hover:underline">
                  ← Back to customer site
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
