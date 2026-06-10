export default function Button({
  children, variant = 'primary', size = 'md',
  onClick, disabled = false, type = 'button', className = ''
}) {
  const variants = {
    primary:   'btn-glow-orange text-white',
    secondary: 'glass text-forest-100 hover:glass-green',
    outline:   'glass text-forest-200 hover:glass-green border border-forest-600/40',
    ghost:     'text-ember-400 hover:text-ember-300',
    success:   'btn-glow-green text-white',
    danger:    'bg-red-600/80 hover:bg-red-600 text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`font-semibold rounded-xl transition-all duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed active:scale-95
        ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
}
