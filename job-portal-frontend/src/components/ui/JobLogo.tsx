import { Briefcase } from "lucide-react";
import { assetUrl } from "../../api/client";

interface JobLogoProps {
  logoUrl?: string;
  companyName: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-20 h-20",
};

const iconSizes = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

export const JobLogo = ({ logoUrl, companyName, size = "md" }: JobLogoProps) => {
  if (logoUrl) {
    return (
      <img
        src={assetUrl(logoUrl)}
        alt={companyName}
        className={`${sizeClasses[size]} rounded-lg object-cover`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center`}>
      <Briefcase className={`${iconSizes[size]} text-gray-400`} />
    </div>
  );
};
