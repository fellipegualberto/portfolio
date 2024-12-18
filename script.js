document.addEventListener("DOMContentLoaded", function () {
  const carousels = document.querySelectorAll('.carousel-container'); // Seleciona todos os carrosséis na página

  carousels.forEach(carouselContainer => {
    const carousel = carouselContainer.querySelector('.carousel');
    const cards = Array.from(carouselContainer.querySelectorAll('.card'));
    const prevBtn = carouselContainer.querySelector('.prev');
    const nextBtn = carouselContainer.querySelector('.next');
    const playPauseBtn = carouselContainer.querySelector('.play-pause');

    const cardWidth = cards[0].getBoundingClientRect().width + 10; // Inclui o gap entre os cards
    const visibleCards = window.innerWidth > 768 ? Math.floor(carouselContainer.offsetWidth / cardWidth) : 1;
    const maxIndex = Math.max(0, cards.length - visibleCards);


    let index = 0;
    let playing = false;
    let interval;

	const updateCarousel = () => {
  	  index = Math.min(index, maxIndex);
  	carousel.style.transform = `translateX(-${cardWidth * index}px)`;
    };

    const showNext = () => {
      index = (index + 1) % (maxIndex + 1);
      updateCarousel();
    };

    const showPrev = () => {
      index = Math.max(index - 1, 0);
      updateCarousel();
    };

    const togglePlayPause = () => {
      playing = !playing;
      if (playing) {
        interval = setInterval(showNext, 3000);
        playPauseBtn.textContent = 'Pause';
      } else {
        clearInterval(interval);
        playPauseBtn.textContent = 'Play';
      }
    };

    cards.forEach((card, idx) => {
      card.addEventListener('click', () => onCardClick(idx));
    });

    const onCardClick = (index) => {
      console.log(`Card ${index + 1} clicado no carrossel!`);
    };

    prevBtn.addEventListener('click', showPrev);
    nextBtn.addEventListener('click', showNext);
    playPauseBtn.addEventListener('click', togglePlayPause);

    // Inicia o autoplay se o carrossel estiver definido como jogando ao carregar
    if (playing) {
      interval = setInterval(showNext, 3000);
    }
  });
});
