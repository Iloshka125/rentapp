import React from 'react';

export const Support = () => {
  return (
    <main className="main-wrapper px-[6em] py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-medium text-[#53515E] text-center mb-12">Поддержка</h1>
        
        {/* Разделительная черта */}
        <div style={{ 
          height: '1px', 
          width: '100%', 
          backgroundColor: '#53515E', 
          marginBottom: 40,
          opacity: 0.3
        }}></div>
        
        <div className="flex flex-col items-center">
          {/* Иконка в разработке */}
          <div className="mb-10 text-center">
            <div className="w-32 h-32 bg-[#FFDC64] rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
              <svg 
                className="w-16 h-16 text-[#53515E]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
            </div>
          </div>

          {/* Основное сообщение */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-medium text-[#53515E] mb-5 leading-relaxed w-5xl">
              Мы работаем над созданием системы поддержки для вас
            </h2>
            <p className="text-lg text-[#605F6D] leading-relaxed">
              Наша команда активно разрабатывает удобную и функциональную систему поддержки, 
              которая поможет вам решить любые вопросы по использованию платформы.
            </p>
          </div>

          {/* Информационный блок */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 mb-10 w-full max-w-2xl shadow-sm">
            <h3 className="text-xl font-medium text-[#53515E] mb-5 text-center">
              В ближайшее время здесь появится:
            </h3>
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#FFDC64] rounded-full flex-shrink-0"></div>
                <span className="text-base text-[#605F6D]">FAQ и часто задаваемые вопросы</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#FFDC64] rounded-full flex-shrink-0"></div>
                <span className="text-base text-[#605F6D]">Форма обратной связи</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#FFDC64] rounded-full flex-shrink-0"></div>
                <span className="text-base text-[#605F6D]">Инструкции по использованию</span>
              </div>
              
            </div>
          </div>

          {/* Кнопка возврата */}
          <button 
            onClick={() => window.history.back()}
            className="save_but"
            style={{ marginTop: '20px' }}
          >
            Вернуться назад
          </button>
        </div>
      </div>
    </main>
  );
};
