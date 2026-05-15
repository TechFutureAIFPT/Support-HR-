/**
 * Dark Loader — Component cho Dark Mode
 */
import React from 'react';
import SupportHRLoading from '@/components/common/SupportHRLoading';

interface DarkLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export const DarkLoader: React.FC<DarkLoaderProps> = ({
  size = 'md',
  text,
  fullScreen = false,
  className = '',
}) => {
  const minHeightClass = size === 'sm' ? 'min-h-[9rem]' : size === 'lg' ? 'min-h-[18rem]' : 'min-h-[14rem]';

  return (
    <SupportHRLoading
      mode={fullScreen ? 'screen' : 'inline'}
      minHeightClass={fullScreen ? undefined : minHeightClass}
      label="Support HR // Dark Loader"
      title={text || 'Đang tải dữ liệu'}
      description="Hệ thống đang chuẩn bị trạng thái hiển thị."
      className={className}
    />
  );
};

/* ======== Dark Skeleton ======== */
interface DarkSkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const roundedClasses = {
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
};

export const DarkSkeleton: React.FC<DarkSkeletonProps> = ({
  width,
  height = '1rem',
  rounded = 'md',
  className = '',
}) => {
  return (
    <div
      className={`bg-slate-800/50 animate-pulse ${roundedClasses[rounded]} ${className}`}
      style={{ width, height }}
    />
  );
};

/* ======== Dark Dots Loader ======== */
interface DarkDotsLoaderProps {
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const DarkDotsLoader: React.FC<DarkDotsLoaderProps> = ({
  count = 3,
  size = 'md',
  color = 'bg-blue-400',
  className = '',
}) => {
  const dotSizes = { sm: 'w-1 h-1', md: 'w-2 h-2', lg: 'w-3 h-3' };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${dotSizes[size]} ${color} rounded-full animate-bounce`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
};
