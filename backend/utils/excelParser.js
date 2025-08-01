const XLSX = require('xlsx');

/**
 * Parse Excel file buffer and convert to JSON
 * @param {Buffer} buffer - Excel file buffer
 * @param {string} sheetName - Sheet name to parse (optional, uses first sheet if not provided)
 * @returns {Array} - Parsed data as array of objects
 */
const parseExcelBuffer = (buffer, sheetName = null) => {
  try {
    // Read workbook from buffer
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get sheet name
    const sheet = sheetName 
      ? workbook.Sheets[sheetName]
      : workbook.Sheets[workbook.SheetNames[0]];
    
    if (!sheet) {
      throw new Error(`Sheet ${sheetName || 'not found'}`);
    }
    
    // Convert sheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      header: 1, // Use first row as header
      defval: '', // Default value for empty cells
      blankrows: false // Skip blank rows
    });
    
    if (jsonData.length < 2) {
      throw new Error('Excel file must have at least header row and one data row');
    }
    
    // Convert to array of objects
    const headers = jsonData[0].map(header => 
      typeof header === 'string' ? header.trim().toLowerCase() : String(header).trim().toLowerCase()
    );
    
    const data = jsonData.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] !== undefined ? String(row[index]).trim() : '';
      });
      return obj;
    }).filter(row => {
      // Filter out completely empty rows
      return Object.values(row).some(value => value !== '');
    });
    
    return {
      headers,
      data,
      totalRows: data.length
    };
    
  } catch (error) {
    throw new Error(`Excel parsing failed: ${error.message}`);
  }
};

/**
 * Validate employee data from Excel
 * @param {Array} data - Parsed Excel data
 * @returns {Object} - Validation result
 */
const validateEmployeeData = (data) => {
  const requiredFields = ['ad', 'soyad', 'acik_adres'];
  const optionalFields = ['tckn'];
  const errors = [];
  const validRows = [];
  
  data.forEach((row, index) => {
    const rowErrors = [];
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        rowErrors.push(`${field} field is required`);
      }
    });
    
    // Validate TCKN if provided
    if (row.tckn && row.tckn.trim() !== '') {
      const tckn = row.tckn.trim();
      if (!/^\d{11}$/.test(tckn)) {
        rowErrors.push('TCKN must be 11 digits');
      }
    }
    
    if (rowErrors.length > 0) {
      errors.push({
        row: index + 2, // +2 because Excel row numbers start from 1 and we skip header
        errors: rowErrors,
        data: row
      });
    } else {
      validRows.push({
        ad: row.ad.trim(),
        soyad: row.soyad.trim(),
        acik_adres: row.acik_adres.trim(),
        tckn: row.tckn ? row.tckn.trim() : null
      });
    }
  });
  
  return {
    valid: errors.length === 0,
    validRows,
    errors,
    totalRows: data.length,
    validRowCount: validRows.length,
    errorRowCount: errors.length
  };
};

/**
 * Validate branch data from Excel
 * @param {Array} data - Parsed Excel data
 * @returns {Object} - Validation result
 */
const validateBranchData = (data) => {
  const requiredFields = ['ad', 'adres'];
  const optionalFields = ['norm_kadro'];
  const errors = [];
  const validRows = [];
  
  data.forEach((row, index) => {
    const rowErrors = [];
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        rowErrors.push(`${field} field is required`);
      }
    });
    
    // Validate norm_kadro if provided
    if (row.norm_kadro && row.norm_kadro.trim() !== '') {
      const normKadro = parseInt(row.norm_kadro.trim());
      if (isNaN(normKadro) || normKadro < 0) {
        rowErrors.push('norm_kadro must be a non-negative number');
      }
    }
    
    if (rowErrors.length > 0) {
      errors.push({
        row: index + 2,
        errors: rowErrors,
        data: row
      });
    } else {
      validRows.push({
        ad: row.ad.trim(),
        adres: row.adres.trim(),
        norm_kadro: row.norm_kadro ? parseInt(row.norm_kadro.trim()) : 0
      });
    }
  });
  
  return {
    valid: errors.length === 0,
    validRows,
    errors,
    totalRows: data.length,
    validRowCount: validRows.length,
    errorRowCount: errors.length
  };
};

/**
 * Map Excel columns to expected field names
 * @param {Array} headers - Excel headers
 * @param {Object} mapping - Field mapping
 * @returns {Object} - Mapped headers
 */
const mapExcelColumns = (headers, mapping) => {
  const mappedData = {};
  
  Object.keys(mapping).forEach(expectedField => {
    const possibleColumns = mapping[expectedField];
    const foundColumn = headers.find(header => 
      possibleColumns.some(col => 
        header.toLowerCase().includes(col.toLowerCase())
      )
    );
    
    if (foundColumn) {
      mappedData[expectedField] = foundColumn;
    }
  });
  
  return mappedData;
};

// Common column mappings
const EMPLOYEE_COLUMN_MAPPING = {
  ad: ['ad', 'adi', 'isim', 'name', 'first_name', 'firstname'],
  soyad: ['soyad', 'soyadi', 'surname', 'last_name', 'lastname'],
  acik_adres: ['adres', 'acik_adres', 'address', 'addr', 'tam_adres'],
  tckn: ['tckn', 'tc', 'tcno', 'tc_no', 'kimlik_no', 'id_number']
};

const BRANCH_COLUMN_MAPPING = {
  ad: ['ad', 'adi', 'sube_adi', 'branch_name', 'name'],
  adres: ['adres', 'acik_adres', 'address', 'addr', 'tam_adres'],
  norm_kadro: ['norm_kadro', 'norm', 'kapasite', 'capacity', 'kadro']
};

module.exports = {
  parseExcelBuffer,
  validateEmployeeData,
  validateBranchData,
  mapExcelColumns,
  EMPLOYEE_COLUMN_MAPPING,
  BRANCH_COLUMN_MAPPING
};