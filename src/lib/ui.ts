/**
 * Maps a food category to a high-quality royalty-free image from Unsplash.
 */
export function getFoodCategoryImage(category: string): string {
  const c = (category || '').toLowerCase();
  
  if (c.includes('bakery') || c.includes('bread') || c.includes('pastr') || c.includes('cake')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80';
  }
  if (c.includes('grain') || c.includes('rice') || c.includes('dry') || c.includes('ration') || c.includes('wheat')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80';
  }
  if (c.includes('veg') && (c.includes('table') || c.includes('salad'))) {
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80';
  }
  if (c.includes('fruit')) {
    return 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80';
  }
  if (c.includes('dairy') || c.includes('milk') || c.includes('cheese')) {
    return 'https://images.unsplash.com/photo-1528750951163-f248a3359737?auto=format&fit=crop&w=600&q=80';
  }
  if (c.includes('meat') || c.includes('protein') || c.includes('chicken') || c.includes('fish')) {
    return 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80';
  }
  
  // Default fallback (mixed prepared curry and rice)
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
}

/**
 * Returns a deterministic gradient class string based on the organization name.
 */
export function getAvatarGradient(name: string): string {
  const gradients = [
    'from-emerald-500 to-teal-500',
    'from-blue-500 to-indigo-500',
    'from-purple-500 to-pink-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-red-500',
    'from-cyan-500 to-blue-500'
  ];
  
  let hash = 0;
  const str = name || '';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

/**
 * Gets initials from an organization or person name.
 */
export function getInitials(name: string): string {
  if (!name) return 'FO';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
