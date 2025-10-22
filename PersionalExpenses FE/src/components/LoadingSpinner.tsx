import { cn } from "../utils/cn";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  className?: string;
  text?: string;
}

const LoadingSpinner = ({
  size = "medium",
  className = "",
  text,
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-primary-600",
          sizeClasses[size]
        )}
      />
      {text && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
