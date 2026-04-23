import { getAccessToken } from '../lib/api.js';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function exportPetPdf(petId, petName) {
  const token = getAccessToken();
  const res = await fetch(`${BASE_URL}/pets/${petId}/export.pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error('Falha ao gerar PDF');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const filename = `prontuario-${(petName || 'pet').toLowerCase().replace(/\s+/g, '-')}.pdf`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
