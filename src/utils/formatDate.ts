export function formatProjectDeadline(deadline: string) {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return deadline;

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}
