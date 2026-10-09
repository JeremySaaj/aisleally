'use client';
import { FlowButton } from './FlowButton';

interface PrimaryActionButtonProps {
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export default function PrimaryActionButton({ 
  label, 
  onClick, 
  type = "button", 
  disabled = false,
  isLoading = false 
}: PrimaryActionButtonProps) {
  return (
    <FlowButton 
      text={isLoading ? "Loading..." : label}
      onClick={onClick}
      type={type}
      disabled={disabled || isLoading}
    />
  );
}
