// KinakanGo clay components. They only add styling: every prop that a plain
// element takes (onClick, disabled, type, aria-*, …) passes straight through.
// The look itself lives in src/index.css (the "Clay design system" section),
// so pages that still use the class names (glass, btn-glow-*) match these.
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Heart, Plus, Star, UtensilsCrossed, X } from 'lucide-react';

const cx = (...c) => c.filter(Boolean).join(' ');

// Raised clay surface. tone: 'cream' (default) | 'sage' | 'mustard' | 'forest'
export function ClayCard({ as: Tag = 'div', tone = 'cream', lift = false, className = '', children, ...rest }) {
  const toneClass = { cream: 'clay-card', sage: 'clay-card glass-green', mustard: 'clay-card clay-mustard', forest: 'clay-card clay-forest' }[tone];
  return <Tag className={cx(toneClass, lift && 'clay-lift', 'rounded-2xl p-5 md:p-6', className)} {...rest}>{children}</Tag>;
}

// Tactile button that presses in. variant: 'primary' (forest) | 'accent' (mustard) | 'soft' (cream) | 'danger'
export function ClayButton({ variant = 'primary', size = 'md', className = '', type = 'button', children, ...rest }) {
  const v = { primary: 'clay-btn-primary', accent: 'clay-btn-accent', soft: 'clay-btn text-forest-100', danger: 'bg-red-600 text-white clay-btn-primary' }[variant];
  const s = { sm: 'px-3.5 py-2 text-xs rounded-xl', md: 'px-5 py-3 text-sm rounded-xl', lg: 'px-7 py-3.5 text-base rounded-2xl' }[size];
  return (
    <button type={type} className={cx(v, s, 'font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed', className)} {...rest}>
      {children}
    </button>
  );
}

// Recessed field. Pass multiline for a textarea.
export function ClayInput({ multiline = false, className = '', ...rest }) {
  const Tag = multiline ? 'textarea' : 'input';
  return <Tag className={cx('input-glass clay-input w-full px-4 py-3 text-sm rounded-xl', className)} {...rest} />;
}

// Sculpted switch
export function ClayToggle({ checked, onChange, label, disabled = false, className = '' }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} aria-label={label} disabled={disabled}
      onClick={() => onChange?.(!checked)} className={cx('clay-toggle disabled:opacity-50', className)} />
  );
}

// Small embossed status pill. tone: 'sage' | 'mustard' | 'forest' | 'red'
export function ClayBadge({ tone = 'sage', className = '', children }) {
  const t = { sage: 'text-forest-300', mustard: 'clay-mustard', forest: 'clay-forest', red: 'bg-red-500 text-white' }[tone];
  return <span className={cx('clay-badge', t, className)}>{children}</span>;
}

// Navigation item: raised icon, pressed in when active
export function ClayNavItem({ active, icon: Icon, label, className = '', ...rest }) {
  return (
    <button type="button" aria-current={active ? 'page' : undefined}
      className={cx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
        active ? 'clay-active' : 'text-forest-100/70 hover:glass', className)} {...rest}>
      {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}<span className="truncate">{label}</span>
    </button>
  );
}

// Floating dialog that rises into view. Closes on Escape and on the backdrop.
export function ClayModal({ open, onClose, title, labelledBy, className = '', children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(8,6,5,.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby={labelledBy}
        className={cx('clay-modal w-full max-w-sm p-6 space-y-3', className)} onClick={e => e.stopPropagation()}>
        {title && (
          <div className="flex items-center justify-between gap-3">
            <p id={labelledBy} className="text-white font-heading font-bold text-lg">{title}</p>
            {onClose && (
              <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 glass rounded-xl flex items-center justify-center text-forest-100">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}

// Food card: rounded photo well, name, price and a tactile add button
export function ClayProductCard({ item, rating, favorite = false, onOpen, onAdd, onFavorite, className = '', style }) {
  return (
    <div role="button" tabIndex={0} onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen?.(); } }}
      className={cx('clay-card clay-lift cursor-pointer group p-2.5 flex flex-col animate-fade-up', className)} style={style}>
      <div className="relative aspect-[4/3] clay-photo">
        {item.image_url
          ? <img src={item.image_url} alt={item.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
          : <div className="w-full h-full glass-green flex items-center justify-center"><UtensilsCrossed className="w-8 h-8 text-forest-300/50" /></div>}
        {onFavorite && (
          <button type="button" aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={e => { e.stopPropagation(); onFavorite(); }}
            className="absolute top-2 right-2 w-8 h-8 glass rounded-full flex items-center justify-center">
            <Heart className={`w-4 h-4 ${favorite ? 'fill-ember-500 text-ember-500' : 'text-forest-200'}`} />
          </button>
        )}
      </div>
      <div className="px-1.5 pt-3 pb-1 flex-1 flex flex-col">
        <p className="text-white font-semibold text-sm leading-snug line-clamp-2">{item.name}</p>
        <p className="text-forest-200/60 text-xs truncate mt-0.5">{item.category_name || 'Food'}</p>
        <div className="flex items-end justify-between gap-2 mt-auto pt-3">
          <div>
            <p className="text-forest-300 font-heading font-bold text-base">₱{Number(item.price).toFixed(2)}</p>
            {rating != null && (
              <p className="flex items-center gap-1 text-forest-200/70 text-xs"><Star className="w-3 h-3 fill-ember-500 text-ember-500" />{rating}</p>
            )}
          </div>
          {onAdd && (
            <button type="button" aria-label={`Add ${item.name}`} onClick={e => { e.stopPropagation(); onAdd(); }}
              className="w-10 h-10 clay-btn-accent rounded-xl flex items-center justify-center flex-shrink-0">
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
