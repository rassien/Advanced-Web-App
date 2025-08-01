import React from 'react';
import { GitBranch, Download, RefreshCw } from 'lucide-react';

const AssignmentsPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atamalar</h1>
          <p className="mt-1 text-sm text-gray-500">
            Çalışan-şube atamalarını görüntüleyin ve yönetin
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn btn-outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Yenile
          </button>
          <button className="btn btn-primary">
            <Download className="w-4 h-4 mr-2" />
            Excel İndir
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="card">
          <div className="card-content p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GitBranch className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Toplam Atama</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Başarılı</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Beklemede</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ortalama Mesafe</p>
                <p className="text-2xl font-semibold text-gray-900">- km</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Atama Listesi</h3>
          <p className="card-description">
            Tüm çalışan-şube atamaları ve detayları
          </p>
        </div>
        <div className="card-content">
          <div className="text-center py-12">
            <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Henüz atama yapılmamış
            </h3>
            <p className="text-gray-500 mb-6">
              Atama yapmak için önce çalışan ve şube bilgilerini ekleyin, sonra analiz sayfasından atama yapın
            </p>
            <div className="flex justify-center space-x-3">
              <button 
                className="btn btn-outline"
                onClick={() => window.location.href = '/employees'}
              >
                Çalışan Ekle
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => window.location.href = '/branches'}
              >
                Şube Ekle
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => window.location.href = '/analysis'}
              >
                Analiz Yap
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentsPage;