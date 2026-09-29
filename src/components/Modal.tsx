import { useEffect, useRef, type ReactNode } from 'react'
import { X, type LucideIcon } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  icon?: LucideIcon
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ open, onClose, title, icon: Icon, children, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      const first = panelRef.current?.querySelector<HTMLElement>('input, select, textarea, button')
      first?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={panelRef}>
        <div className="modal__header">
          <h2 className="modal__title">
            {Icon && (
              <span className="modal__title-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
            )}
            {title}
          </h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  )
}
