/**
 * alerts.ts — SweetAlert2 customized with Deep Navy Palette (#0d1b2a, #1b263b, #415a77, #778da9, #e0e1dd)
 */

import Swal from 'sweetalert2';

// Base SweetAlert2 styling matching our application palette
const CyberSwal = Swal.mixin({
  background: '#1b263b',
  color: '#e0e1dd',
  backdrop: 'rgba(13, 27, 42, 0.85)',
  customClass: {
    popup: 'border border-[#415a77] rounded-2xl shadow-2xl font-sans',
    title: 'text-[#e0e1dd] font-semibold text-lg tracking-tight',
    htmlContainer: 'text-[#778da9] text-sm leading-relaxed',
    confirmButton:
      'bg-[#415a77] hover:bg-[#526e8f] text-[#e0e1dd] font-semibold px-4 py-2 rounded-lg border border-[#778da9]/50 shadow-sm mx-1 focus:outline-none',
    cancelButton:
      'bg-[#223049] hover:bg-[#2b3d5b] text-[#778da9] hover:text-white px-4 py-2 rounded-lg border border-[#415a77] mx-1 focus:outline-none',
  },
  buttonsStyling: false,
});

export const showSuccessAlert = (title: string, text: string) => {
  return CyberSwal.fire({
    icon: 'success',
    iconColor: '#10b981',
    title,
    text,
    timer: 2500,
    showConfirmButton: false,
  });
};

export const showWarningAlert = (title: string, text: string) => {
  return CyberSwal.fire({
    icon: 'warning',
    iconColor: '#f59e0b',
    title,
    text,
    confirmButtonText: 'Acknowledge',
  });
};

export const showErrorAlert = (title: string, text: string) => {
  return CyberSwal.fire({
    icon: 'error',
    iconColor: '#ef4444',
    title,
    text,
    confirmButtonText: 'Dismiss',
  });
};

export const showInfoAlert = (title: string, text: string) => {
  return CyberSwal.fire({
    icon: 'info',
    iconColor: '#778da9',
    title,
    text,
    confirmButtonText: 'Understood',
  });
};

export const showConfirmAlert = async (
  title: string,
  text: string,
  confirmButtonText = 'Proceed',
  cancelButtonText = 'Cancel'
): Promise<boolean> => {
  const result = await CyberSwal.fire({
    icon: 'question',
    iconColor: '#778da9',
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
  });
  return result.isConfirmed;
};

export default CyberSwal;
