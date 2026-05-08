export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatCompactDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  const year = String(date.getFullYear()).slice(-2);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}.${month}.${day}`;
}

export function formatDottedDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}.${month}.${day}`;
}

export function getTagSectionId(tag: string) {
  return `tag-${encodeURIComponent(tag)}`;
}

export function groupByYear<T extends { date: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const year = new Date(`${item.date}T00:00:00`).getFullYear().toString();
    groups[year] = [...(groups[year] ?? []), item];
    return groups;
  }, {});
}
