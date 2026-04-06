import { useEffect } from 'react'

/**
 * ConfirmModal — Beautiful, accessible confirmation dialog.
 *
 * Props:
 *   isOpen       {boolean}  — Whether the modal is visible
 *   title        {string}   — Modal heading
 *   message      {string}   — Body text / description
 *   confirmText  {string}   — Confirm button label (default "Confirm")
 *   cancelText   {string}   — Cancel button label (default "Cancel")
 *   confirmVariant {string} — "danger" (red) | "primary" (green) | "warning" (amber)
 *   onConfirm    {Function} — Called when the user clicks Confirm
 *   onCancel     {Function} — Called when the user clicks Cancel or the backdrop
 *   isLoading    {boolean}  — Shows spinner on confirm button
 */
function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onCancel?.()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const variantConfig = {
    danger: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      btnClass:
        'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    primary: {
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      btnClass:
        'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    warning: {
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      btnClass:
        'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  }

  const config = variantConfig[confirmVariant] || variantConfig.danger

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto
                   transform transition-all duration-200 scale-100 animate-modal-in"
        style={{ animation: 'modalIn 0.2s ease-out' }}
      >
        <div className="p-6">
          {/* Icon + Title row */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${config.iconBg}`}>
              <span className={config.iconColor}>{config.icon}</span>
            </div>
            <div className="flex-1 pt-1">
              <h2
                id="confirm-modal-title"
                className="text-lg font-bold text-gray-900 leading-tight"
              >
                {title}
              </h2>
              {message && (
                <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {message}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300
                         rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300
                         transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-5 py-2.5 text-sm font-medium rounded-xl focus:outline-none focus:ring-2
                          focus:ring-offset-2 transition-colors disabled:opacity-60 flex items-center
                          justify-center gap-2 ${config.btnClass}`}
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      {/* Keyframe for entry animation — injected as style tag */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default ConfirmModal
