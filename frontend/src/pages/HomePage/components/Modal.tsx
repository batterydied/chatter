type ModalProps = {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

const Modal = ({ isOpen, onClose, children, className }: ModalProps) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose} // close when clicking overlay
    >
      <div
        className={`bg-base-100 rounded-md w-200 h-100 relative ${className} p-2`}
        onClick={e => e.stopPropagation()} // prevent closing when clicking modal content
      >
        {children}
      </div>
    </div>
  )
}

export default Modal