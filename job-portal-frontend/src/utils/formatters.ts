export const formatSalary = (min?: number, max?: number): string => {
  if (!min && !max) return "Salary not disclosed";
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  if (min) return `$${min.toLocaleString()}+`;
  return `Up to $${max?.toLocaleString()}`;
};

export const formatDate = (date: string | Date): string => {
  const now = new Date();
  const posted = new Date(date);
  const diffInDays = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diffInDays = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let prefix = "";
  if (diffInDays === 0) prefix = "Today, ";
  else if (diffInDays === 1) prefix = "Tomorrow, ";
  else if (diffInDays === -1) prefix = "Yesterday, ";

  return prefix + d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const isUpcoming = (date: string | Date): boolean => {
  return new Date(date) > new Date();
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
