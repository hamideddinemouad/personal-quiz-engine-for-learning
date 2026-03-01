import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon(props: IconProps): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
      {...props}
    />
  );
}

export function CompassIcon(props: IconProps): JSX.Element {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 14.8l1.65-5.25 5.1-1.65-1.65 5.1-5.1 1.8z" />
    </BaseIcon>
  );
}

export function ClockIcon(props: IconProps): JSX.Element {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.25v5.2l3.65 2.05" />
    </BaseIcon>
  );
}

export function FlameIcon(props: IconProps): JSX.Element {
  return (
    <BaseIcon {...props}>
      <path d="M12 3.6c2.8 2.3 4.9 4.95 4.9 8.2a4.9 4.9 0 11-9.8 0c0-2.1 1-3.85 2.85-5.45.4 1.7 1.95 2.7 3.55 3.1-.25-2.2.45-4.05 2.5-5.85z" />
    </BaseIcon>
  );
}

export function TargetIcon(props: IconProps): JSX.Element {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.7" />
    </BaseIcon>
  );
}

export function ShuffleIcon(props: IconProps): JSX.Element {
  return (
    <BaseIcon {...props}>
      <path d="M3.5 7.5h3.2l2.5 3.2 2.6 3.6H20" />
      <path d="M17 4.8L20 7.5 17 10.2" />
      <path d="M3.5 16.5h3.2l2.5-3.2 1.2-1.6" />
      <path d="M17 13.8L20 16.5 17 19.2" />
    </BaseIcon>
  );
}

export function ChevronLeftIcon(props: IconProps): JSX.Element {
  return (
    <BaseIcon {...props}>
      <path d="M14.8 6.2L9 12l5.8 5.8" />
    </BaseIcon>
  );
}

export function ChevronRightIcon(props: IconProps): JSX.Element {
  return (
    <BaseIcon {...props}>
      <path d="M9.2 6.2L15 12l-5.8 5.8" />
    </BaseIcon>
  );
}

export function LightbulbIcon(props: IconProps): JSX.Element {
  return (
    <BaseIcon {...props}>
      <path d="M8.35 10a3.65 3.65 0 117.3 0c0 1.25-.6 2.4-1.6 3.15-.45.35-.75.85-.75 1.4V15.6H10.7v-1.05c0-.55-.3-1.05-.75-1.4A3.88 3.88 0 018.35 10z" />
      <path d="M10.05 18h3.9M10.4 20h3.2" />
    </BaseIcon>
  );
}

export function SparklesIcon(props: IconProps): JSX.Element {
  return (
    <BaseIcon {...props}>
      <path d="M12 3.5l1.25 3.25L16.5 8l-3.25 1.25L12 12.5l-1.25-3.25L7.5 8l3.25-1.25L12 3.5z" />
      <path d="M18 12.2l.8 2.1L21 15.1l-2.2.85-.8 2.15-.85-2.15-2.15-.85 2.15-.8.85-2.1z" />
      <path d="M6 13l.65 1.7L8.3 15.35l-1.65.65L6 17.65 5.35 16 3.7 15.35l1.65-.65L6 13z" />
    </BaseIcon>
  );
}

export function CheckCircleIcon(props: IconProps): JSX.Element {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.4 12.2l2.2 2.25 4.95-5.1" />
    </BaseIcon>
  );
}

export function AlertCircleIcon(props: IconProps): JSX.Element {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.4" />
      <path d="M12 16.35h.01" />
    </BaseIcon>
  );
}

export function TrophyIcon(props: IconProps): JSX.Element {
  return (
    <BaseIcon {...props}>
      <path d="M8.5 4.5h7v2.4a3.5 3.5 0 01-7 0V4.5z" />
      <path d="M6.2 5.2H4.5a2.2 2.2 0 002.2 2.2M17.8 5.2h1.7a2.2 2.2 0 01-2.2 2.2" />
      <path d="M12 11.3v3.3M9.3 18.5h5.4M10.2 14.6h3.6" />
    </BaseIcon>
  );
}
