import { ClayCard } from './clay';

// Kept for older imports; the clay card is the one card style.
export default function Card({ children, className = '', hover = false, onClick }) {
  return <ClayCard lift={hover} onClick={onClick} className={`${hover ? 'cursor-pointer' : ''} ${className}`}>{children}</ClayCard>;
}
