/**
 * Table Sorting Utilities
 * Provides reusable sorting functions for MUI tables
 */

/**
 * Generic comparison function for sorting
 * @param {any} a - First value
 * @param {any} b - Second value
 * @param {string} orderBy - Field to sort by
 * @param {boolean} isNumeric - Whether the field is numeric
 * @returns {number} Comparison result
 */
export function descendingComparator(a, b, orderBy, isNumeric = false) {
  const aVal = getNestedValue(a, orderBy);
  const bVal = getNestedValue(b, orderBy);

  // Handle null/undefined values
  if (bVal === null || bVal === undefined) return -1;
  if (aVal === null || aVal === undefined) return 1;

  // Numeric comparison
  if (isNumeric) {
    // Handle numeric strings and percentages by removing non-numeric characters except . and -
    const cleanNumeric = (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        // Remove % symbol and other non-numeric characters, keep decimal point and minus sign
        const cleaned = val.replace(/[^0-9.-]/g, '');
        return parseFloat(cleaned);
      }
      return parseFloat(val);
    };

    const aNum = cleanNumeric(aVal);
    const bNum = cleanNumeric(bVal);
    if (isNaN(aNum)) return 1;
    if (isNaN(bNum)) return -1;
    return bNum - aNum;
  }

  // Date comparison (for ISO strings or Date objects)
  if (aVal instanceof Date || bVal instanceof Date || isDateString(aVal) || isDateString(bVal)) {
    const aDate = new Date(aVal);
    const bDate = new Date(bVal);
    if (isNaN(aDate.getTime())) return 1;
    if (isNaN(bDate.getTime())) return -1;
    return bDate.getTime() - aDate.getTime();
  }

  // String comparison (case-insensitive)
  const aStr = String(aVal).toLowerCase();
  const bStr = String(bVal).toLowerCase();

  if (bStr < aStr) return -1;
  if (bStr > aStr) return 1;
  return 0;
}

/**
 * Get nested object value by dot notation
 * @param {Object} obj - Object to get value from
 * @param {string} path - Dot notation path (e.g., 'user.name')
 * @returns {any} The value
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object') {
      return acc[part];
    }
    return acc;
  }, obj);
}

/**
 * Check if a string is an ISO date string
 * @param {any} value - Value to check
 * @returns {boolean}
 */
function isDateString(value) {
  if (typeof value !== 'string') return false;
  // Check for ISO 8601 date format
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  return isoDateRegex.test(value);
}

/**
 * Main comparator function that handles sort order
 * @param {string} order - 'asc' or 'desc'
 * @param {string} orderBy - Field to sort by
 * @param {boolean} isNumeric - Whether the field is numeric
 * @returns {function} Comparator function
 */
export function getComparator(order, orderBy, isNumeric = false) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy, isNumeric)
    : (a, b) => -descendingComparator(a, b, orderBy, isNumeric);
}

/**
 * Stable sort implementation
 * @param {Array} array - Array to sort
 * @param {function} comparator - Comparison function
 * @returns {Array} Sorted array
 */
export function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

/**
 * Hook-like function to create sort handlers
 * @param {string} orderBy - Current sort field
 * @param {string} order - Current sort order ('asc' or 'desc')
 * @param {function} setOrderBy - Setter for orderBy state
 * @param {function} setOrder - Setter for order state
 * @param {function} setPage - Optional setter for page state (reset to 0 on sort)
 * @returns {function} Sort handler function
 */
export function createSortHandler(orderBy, order, setOrderBy, setOrder, setPage = null) {
  return (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    if (setPage) setPage(0); // Reset to first page when sorting
  };
}

/**
 * Utility to define sortable columns with their types
 * @example
 * const columns = [
 *   { id: 'name', label: 'Name', sortable: true },
 *   { id: 'score', label: 'Score', sortable: true, numeric: true },
 *   { id: 'date', label: 'Date', sortable: true },
 * ];
 */
export function defineSortableColumns(columns) {
  return columns;
}
