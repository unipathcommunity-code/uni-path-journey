import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  to?: string;
  label?: string;
  className?: string;
}

const BackButton = ({ to, label, className = "" }: Props) => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (to) navigate(to);
    else navigate(-1);
  };
  return (
    <button
      onClick={handleClick}
      className={`glass px-3 py-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ${className}`}
      aria-label="Back"
    >
      <ArrowLeft className="w-4 h-4" />
      {label && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
};

export default BackButton;
