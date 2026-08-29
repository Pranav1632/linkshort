const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ShortLink {
  id: string;
  short_code: string;
  original_url: string;
  created_at: string;
  click_count?: string | number;
}

export interface AnalyticsData {
  shortCode: string;
  totalClicks: number;
  devices: { device: string; count: string | number }[];
  browsers: { browser: string; count: string | number }[];
  countries: { country: string; count: string | number }[];
  recentClicks: {
    id: string;
    ip_address: string;
    country: string;
    city: string;
    device: string;
    browser: string;
    referrer: string;
    created_at: string;
  }[];
}

export async function fetchLinks(): Promise<ShortLink[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/links`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch links');
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error('Error fetching links:', err);
    return [];
  }
}

export async function createLink(originalUrl: string, customCode?: string): Promise<ShortLink> {
  const res = await fetch(`${API_BASE}/api/v1/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ originalUrl, customCode: customCode || undefined }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create short link');
  }

  return data.data;
}

export async function deleteLink(shortCode: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/v1/links/${shortCode}`, {
    method: 'DELETE',
  });
  return res.ok;
}

export async function fetchAnalytics(shortCode: string): Promise<AnalyticsData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/links/${shortCode}/analytics`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    const data = await res.json();
    return data.data || null;
  } catch (err) {
    console.error('Error fetching analytics:', err);
    return null;
  }
}
