export default function Card({
  children,
  className = '',
  hover = false,
  onClick
}) {
  const hoverClass = hover ? 'hover:shadow-card-hover cursor-pointer active:scale-[0.98]' : '';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg xs:rounded-xl shadow-card p-3 xs:p-4 md:p-6 transition-all duration-200 ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
}
