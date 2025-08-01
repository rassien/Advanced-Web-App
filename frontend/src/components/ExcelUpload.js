import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

const ExcelUpload = ({ 
  endpoint, 
  onSuccess, 
  title = "Excel Yükle",
  description = "Excel dosyasından toplu veri yükleyin",
  acceptedFormats = [".xlsx", ".xls", ".csv"],
  sampleColumns,
  maxFileSize = 10 // MB
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const validateFile = (file) => {
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      throw new Error(`Desteklenmeyen dosya formatı. Kabul edilen formatlar: ${acceptedFormats.join(', ')}`);
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      throw new Error(`Dosya boyutu çok büyük. Maksimum ${maxFileSize}MB`);
    }

    return true;
  };

  const handleFileUpload = async (file) => {
    try {
      validateFile(file);
      
      setIsUploading(true);
      setUploadResult(null);

      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadResult(result);
      toast.success('Excel dosyası başarıyla yüklendi!');
      
      if (onSuccess) {
        onSuccess(result);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message);
      setUploadResult({
        error: error.message,
        success: false
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedFormats.join(',')}
          onChange={handleFileSelect}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-sm text-gray-600">Dosya yükleniyor ve işleniyor...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600 mb-4">{description}</p>
            <button className="btn btn-primary">
              <FileText className="w-4 h-4 mr-2" />
              Dosya Seç
            </button>
            <p className="text-xs text-gray-500 mt-2">
              veya dosyayı buraya sürükleyin
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Desteklenen formatlar: {acceptedFormats.join(', ')} (max {maxFileSize}MB)
            </p>
          </div>
        )}
      </div>

      {/* Sample Columns Info */}
      {sampleColumns && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Beklenen Excel Sütunları:</h4>
          <div className="flex flex-wrap gap-2">
            {sampleColumns.map((column, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {column}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <div className={`
          border rounded-lg p-4
          ${uploadResult.error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}
        `}>
          <div className="flex items-start">
            {uploadResult.error ? (
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            )}
            
            <div className="flex-1">
              <h4 className={`font-medium ${uploadResult.error ? 'text-red-900' : 'text-green-900'}`}>
                {uploadResult.error ? 'Upload Başarısız' : 'Upload Başarılı'}
              </h4>
              
              {uploadResult.error && (
                <p className="text-sm text-red-700 mt-1">{uploadResult.error}</p>
              )}
              
              {uploadResult.results && (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">İşlenen:</span> {uploadResult.results.summary?.totalProcessed || 0}
                    </div>
                    <div>
                      <span className="font-medium">Başarılı:</span> {uploadResult.results.summary?.successful || 0}
                    </div>
                    <div>
                      <span className="font-medium">Başarısız:</span> {uploadResult.results.summary?.failed || 0}
                    </div>
                    <div>
                      <span className="font-medium">Geocoded:</span> {uploadResult.results.summary?.geocodingRate || '0%'}
                    </div>
                  </div>
                  
                  {uploadResult.results.failed && uploadResult.results.failed.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center text-sm font-medium text-red-700 mb-2">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Başarısız Kayıtlar:
                      </div>
                      <div className="max-h-32 overflow-y-auto">
                        {uploadResult.results.failed.slice(0, 5).map((item, index) => (
                          <div key={index} className="text-xs text-red-600 bg-red-100 rounded p-2 mb-1">
                            <strong>Satır:</strong> {JSON.stringify(item.employee || item.branch)} <br />
                            <strong>Hata:</strong> {item.error}
                          </div>
                        ))}
                        {uploadResult.results.failed.length > 5 && (
                          <p className="text-xs text-red-600">
                            ... ve {uploadResult.results.failed.length - 5} hata daha
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelUpload;