import React from 'react';

export const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  itemsPerPage = 10,
  totalItems 
}) => {
  // Если страниц меньше 2, не показываем пагинацию
  if (totalPages <= 1) return null;

  // Функция для генерации номеров страниц
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // Максимальное количество видимых страниц
    
    if (totalPages <= maxVisiblePages) {
      // Если страниц мало, показываем все
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Если страниц много, показываем с многоточием
      if (currentPage <= 3) {
        // В начале
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // В конце
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // В середине
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="pagination-container flex items-center justify-center mt-8 mb-4">
      {/* Информация о страницах */}
      <div className="text-gray-600 text-xl mr-4">
        Показано {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} из {totalItems}
      </div>
      
      {/* Кнопка "Назад" */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-2 mx-1 rounded-[17px] transition-colors ${
          currentPage === 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:text-gray-900'
        }`}
      >
        ←
      </button>

      {/* Номера страниц */}
      {pageNumbers.map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="px-3 py-2 text-gray-500 text-xl">...</span>
          ) : (
                         <button
               onClick={() => onPageChange(page)}
               className={`px-3 py-2 mx-1 rounded-[17px] transition-colors text-xl ${
                 currentPage === page
                   ? 'text-[#FFDC64] font-medium'
                   : 'text-gray-700 hover:text-gray-900'
               }`}
             >
               {page}
             </button>
          )}
        </React.Fragment>
      ))}

      {/* Кнопка "Вперед" */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-2 mx-1 rounded-[17px] transition-colors text-xl ${
          currentPage === totalPages
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:text-gray-900'
        }`}
      >
        →
      </button>
    </div>
  );
};
