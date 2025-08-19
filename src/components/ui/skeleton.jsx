import React from 'react';

const LoadingSkeleton = ({ className = '', variant = 'rectangular' }) => {
  const baseClasses = 'animate-pulse bg-muted';

  const variants = {
    text: 'h-4 bg-muted rounded',
    rectangular: 'bg-muted rounded',
    circular: 'bg-muted rounded-full',
    avatar: 'w-10 h-10 bg-muted rounded-full',
  };

  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${className}`}
      role='status'
      aria-label='Loading...'
    />
  );
};

export const DashboardSkeleton = () => (
  <div className='space-y-6'>
    {/* Header skeleton */}
    <div className='space-y-2'>
      <LoadingSkeleton className='h-8 w-48' variant='text' />
      <LoadingSkeleton className='h-4 w-96' variant='text' />
    </div>

    {/* Stats cards skeleton */}
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      {[...Array(4)].map((_, i) => (
        <div key={i} className='bg-card p-6 rounded-lg border'>
          <LoadingSkeleton className='h-4 w-24 mb-2' variant='text' />
          <LoadingSkeleton className='h-8 w-16 mb-2' variant='text' />
          <LoadingSkeleton className='h-3 w-32' variant='text' />
        </div>
      ))}
    </div>

    {/* Charts skeleton */}
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      <div className='bg-card p-6 rounded-lg border'>
        <LoadingSkeleton className='h-6 w-32 mb-4' variant='text' />
        <LoadingSkeleton className='h-64' variant='rectangular' />
      </div>
      <div className='bg-card p-6 rounded-lg border'>
        <LoadingSkeleton className='h-6 w-32 mb-4' variant='text' />
        <LoadingSkeleton className='h-64' variant='rectangular' />
      </div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className='space-y-3'>
    {/* Header */}
    <div
      className='grid gap-4'
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {[...Array(columns)].map((_, i) => (
        <LoadingSkeleton key={i} className='h-4 w-full' variant='text' />
      ))}
    </div>

    {/* Rows */}
    {[...Array(rows)].map((_, rowIndex) => (
      <div
        key={rowIndex}
        className='grid gap-4'
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {[...Array(columns)].map((_, colIndex) => (
          <LoadingSkeleton
            key={colIndex}
            className='h-4 w-full'
            variant='text'
          />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className='bg-card p-6 rounded-lg border space-y-4'>
    <LoadingSkeleton className='h-6 w-3/4' variant='text' />
    <LoadingSkeleton className='h-4 w-full' variant='text' />
    <LoadingSkeleton className='h-4 w-2/3' variant='text' />
    <div className='flex space-x-2 pt-2'>
      <LoadingSkeleton className='h-8 w-20' variant='rectangular' />
      <LoadingSkeleton className='h-8 w-20' variant='rectangular' />
    </div>
  </div>
);

export default LoadingSkeleton;
