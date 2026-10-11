import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
  /** Site name from Site Settings. */
  name?: string
  /** Absolute/relative URL of the logo upload (Site Settings → logo). */
  src?: string
}

/** Uploaded logo when Site Settings has one, otherwise the site name as a wordmark. */
export const Logo = (props: Props) => {
  const { loading = 'lazy', priority = 'low', className, name = 'Scroll World', src } = props

  if (src) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        alt={name}
        height={34}
        loading={loading}
        fetchPriority={priority}
        decoding="async"
        className={clsx('max-w-[9.375rem] w-auto h-[34px]', className)}
        src={src}
      />
    )
  }

  return (
    <span
      className={clsx(
        'inline-flex h-[34px] items-center text-xl font-semibold tracking-tight',
        className,
      )}
    >
      {name}
    </span>
  )
}
