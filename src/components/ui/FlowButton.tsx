'use client';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export function FlowButton({
  text = "Continue",
  onClick,
  type = "button",
  disabled = false
}: {
  text?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const buttonTransition = 'all 600ms cubic-bezier(0.23,1,0.32,1)';
  const arrowTransition = 'all 800ms cubic-bezier(0.34,1.56,0.64,1)';
  const circleTransition = 'all 800ms cubic-bezier(0.19,1,0.22,1)';
  const textTransition = 'all 800ms ease-out';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        padding: '12px 32px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        border: '1.5px solid',
        borderColor: isHovered ? 'transparent' : 'rgba(27,67,50,0.4)',
        borderRadius: isHovered ? '12px' : '100px',
        backgroundColor: isHovered ? '#1B4332' : 'transparent',
        color: isHovered ? '#ffffff' : '#1B4332',
        transition: buttonTransition,
        transform: 'scale(1)',
      }}
    >
      {/* Left arrow */}
      <span style={{
        position: 'absolute',
        width: '16px',
        height: '16px',
        left: isHovered ? '16px' : '-25%',
        zIndex: 9,
        transition: arrowTransition,
      }}>
        <ArrowRight style={{
          width: '16px',
          height: '16px',
          stroke: isHovered ? '#ffffff' : '#1B4332',
          fill: 'none',
        }} />
      </span>

      {/* Text */}
      <span style={{
        position: 'relative',
        zIndex: 1,
        transform: isHovered ? 'translateX(12px)' : 'translateX(-12px)',
        transition: textTransition,
      }}>
        {text}
      </span>

      {/* Expanding circle */}
      <span style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isHovered ? '220px' : '16px',
        height: isHovered ? '220px' : '16px',
        backgroundColor: '#1B4332',
        borderRadius: '50%',
        opacity: isHovered ? 1 : 0,
        transition: circleTransition,
      }} />

      {/* Right arrow */}
      <span style={{
        position: 'absolute',
        width: '16px',
        height: '16px',
        right: isHovered ? '-25%' : '16px',
        zIndex: 9,
        transition: arrowTransition,
      }}>
        <ArrowRight style={{
          width: '16px',
          height: '16px',
          stroke: isHovered ? '#ffffff' : '#1B4332',
          fill: 'none',
        }} />
      </span>
    </button>
  );
}
