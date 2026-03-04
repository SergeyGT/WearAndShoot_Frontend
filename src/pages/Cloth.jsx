// src/pages/Cloth.jsx
export default function Cloth() {
  // Пока пустой массив — потом заменишь на данные из API
  const items = Array(8).fill(null) // 8 пустых карточек для примера

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500">
      {/* Контейнер с отступами */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Заголовок страницы */}
        <div className="text-center mb-12">
          <h1 className="
            text-5xl sm:text-6xl font-black 
            bg-gradient-to-r from-purple-300 via-purple-200 to-purple-300 
            bg-clip-text text-transparent 
            drop-shadow-lg tracking-tight
          ">
            Cloth Catalog
          </h1>
          <p className="mt-4 text-purple-900/90 text-xl sm:text-2xl font-medium">
            Здесь скоро появятся твои вещи...
          </p>
        </div>

        {/* Сетка карточек */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {items.map((_, index) => (
            <div
              key={index}
              className="
                bg-gradient-to-b from-purple-950 to-indigo-950 
                backdrop-blur-xl 
                rounded-3xl 
                border-4 border-purple-700/60 
                shadow-2xl shadow-purple-900/70 
                overflow-hidden 
                transition-all duration-300 
                hover:scale-[1.03] hover:shadow-purple-800/80
                h-[480px] flex flex-col
              "
            >
              {/* Пустое место под фото/картинку */}
              <div className="h-3/5 bg-purple-900/50 flex items-center justify-center">
                <div className="text-purple-400/50 text-6xl font-bold">
                  ?
                </div>
              </div>

              {/* Информация (пока заглушки) */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-purple-200 mb-2">
                    Вещь #{index + 1}
                  </h3>
                  <p className="text-purple-300/80 text-sm">
                    Описание пока отсутствует...
                  </p>
                </div>

                <div className="mt-4">
                  <div className="text-amber-400 font-bold text-xl">
                    ??? ₽
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Нижний текст (можно убрать позже) */}
        <div className="text-center mt-16 text-purple-900/70 text-lg">
          Скоро здесь появятся реальные карточки с вещами из базы данных
        </div>
      </div>
    </div>
  )
}