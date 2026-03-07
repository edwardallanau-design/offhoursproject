import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export const Modal = ({ title, onClose, children, maxWidth = 'max-w-lg' }: Props) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className={`w-full ${maxWidth} rounded-2xl bg-white shadow-xl`}>
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  </div>
);
