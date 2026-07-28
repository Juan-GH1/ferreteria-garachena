export const EMPTY_FILTERS = {
  categories: [],
  brands: [],
  minPrice: '',
  maxPrice: '',
  availability: 'all', // all | in_stock | providencia | vitacura
};

export function hasActiveFilters(filters) {
  return (
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.availability !== 'all'
  );
}
