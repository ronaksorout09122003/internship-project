"use client";

interface ReconnectBannerProps {
  isVisible: boolean;
  error?: string | null;
}

export function ReconnectBanner({ isVisible, error }: ReconnectBannerProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Reconnecting to the live room. You can keep editing locally while sync recovers.
      {error ? <span className="ml-2 text-amber-700">{error}</span> : null}
    </div>
  );
}
