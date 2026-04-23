const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  if (!value) return true;
  return EMAIL_RE.test(value.trim());
}

export function isValidPhone(value) {
  if (!value) return true;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
}

export function formatPhoneBR(value) {
  const digits = (value || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function validateVetForm(form) {
  const errors = {};
  if (!form.name?.trim()) errors.name = 'Nome é obrigatório';
  if (form.email && !isValidEmail(form.email)) errors.email = 'E-mail inválido';
  if (form.phone && !isValidPhone(form.phone)) errors.phone = 'Telefone inválido';
  return errors;
}
