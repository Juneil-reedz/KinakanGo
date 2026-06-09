export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  className = ''
}) {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation';

  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus:ring-primary-500',
    secondary: 'bg-secondary-200 text-secondary-900 hover:bg-secondary-300 active:bg-secondary-400 focus:ring-secondary-500',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500',
    ghost: 'text-primary-600 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500',
    success: 'bg-success text-white hover:bg-green-600 active:bg-green-700 focus:ring-green-500',
    danger: 'bg-error text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-500',
  };

  const sizes = {
    sm: 'px-2.5 xs:px-3 py-1.5 xs:py-2 text-xs xs:text-sm min-h-[2.25rem]',
    md: 'px-3 xs:px-4 py-2 xs:py-2.5 text-sm xs:text-base min-h-[2.5rem]',
    lg: 'px-4 xs:px-6 py-2.5 xs:py-3 text-base xs:text-lg min-h-[2.75rem]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
