export default function Card({ children, className = '', hover = false, onClick }) {
  return (
    <div onClick={onClick}
      className={`glass rounded-2xl p-5 transition-all duration-200 ${hover ? 'card-3d cursor-pointer hover:glass-green' : ''} ${className}`}>
      {children}
    </div>
  );
}
