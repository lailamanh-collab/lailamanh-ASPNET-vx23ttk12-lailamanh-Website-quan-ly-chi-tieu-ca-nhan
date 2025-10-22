import { cn } from "../utils/cn";

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: "small" | "medium" | "large";
  className?: string;
  onClick?: () => void;
}

const Avatar = ({
  src,
  alt = "Avatar",
  name = "",
  size = "medium",
  className = "",
  onClick,
}: AvatarProps) => {
  const sizeClasses = {
    small: "w-8 h-8 text-sm",
    medium: "w-12 h-12 text-base",
    large: "w-16 h-16 text-lg",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        "rounded-full bg-primary-500 flex items-center justify-center text-white font-medium select-none",
        sizeClasses[size],
        onClick && "cursor-pointer hover:bg-primary-600 transition-colors",
        className
      )}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};

export default Avatar;
