const FLICKR_API_URL = 'https://api.flickr.com/services/rest/';
const FLICKR_API_KEY = 'b3ce50d157bf5280e6b91ebc5f42bdd8';
const MAX_IMAGES = 5;
let imgs = [];
let isAddingImages = false;
let baskets = [];

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('button');
  const container = document.getElementById('container');
  const basketsContainer = document.getElementById('baskets');

  button.addEventListener('click', async (e) => {
    e.preventDefault();
    if (isAddingImages) {
      return;
    }
    isAddingImages = true;

    let search = document.getElementById('search').value;
    let searchTerms = search.split(' ');
    console.log(searchTerms);

    container.innerHTML = '';
    basketsContainer.innerHTML = '';
    imgs = [];
    baskets = [];

    let hasImages = false;

    for (let i = 0; i < searchTerms.length; i++) {
      const term = searchTerms[i];
      const images = await fetchImages(term);

      if (images.length !== 0) {
        hasImages = true;

        const basketDiv = document.createElement('div');
        const basketId = `${term}`;
        basketDiv.id = basketId;
        basketDiv.classList.add('basket');
        basketsContainer.appendChild(basketDiv);
        basketDiv.ondragover = allowImageDrop;
        basketDiv.ondrop = (e) => handleImageDrop(e, basketId);

        const basketName = document.createElement('span');
        basketName.textContent = term;
        basketDiv.appendChild(basketName);

        basketDiv.addEventListener('click', () => {
          if (basketDiv.classList.contains('selected')) {
            basketDiv.classList.remove('selected');
          } else {
            basketDiv.classList.add('selected');
          }
        });

        imgs = [...imgs, ...images];
        imgs.sort(() => Math.random() - 0.5);

        for (const img of imgs) {
          const imgElement = document.createElement('img');
          imgElement.src = img.img;
          imgElement.draggable = true;
          imgElement.ondragstart = handleImageDragStart;
          container.appendChild(imgElement);
        }
      }
    }

    if (!hasImages) {
      container.innerHTML = 'No images found.';
    }

    console.log(imgs);

    isAddingImages = false;
  });

  function allowImageDrop(e) {
    e.preventDefault();
    console.log('ondragover');
  }

  function handleImageDrop(e, basketId) {
    e.preventDefault();
    const imageSrc = e.dataTransfer.getData('text/plain');
    const matchingImage = imgs.find(
      (img) => img.img === imageSrc && img.keyword === basketId
    );
    if (matchingImage && !baskets.some((e) => e.img === matchingImage.img)) {
      baskets.push(matchingImage);
      console.log(baskets);
      const basketDiv = document.getElementById(matchingImage.keyword);
      basketDiv.innerHTML = '';
      const fragment = document.createDocumentFragment();

      baskets
        .filter((e) => e.keyword === basketId)
        .forEach((image) => {
          const imgElement = document.createElement('img');
          imgElement.src = image.img;
          fragment.appendChild(imgElement);
        });

      basketDiv.appendChild(fragment);

      const basketName = document.createElement('span');
      basketName.textContent = matchingImage.keyword;
      basketDiv.appendChild(basketName);
    } else {
      console.log('Image does not match the basket.');
    }
  }

  function handleImageDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.src);
  }

  async function fetchImages(term) {
    try {
      const response = await fetch(
        `${FLICKR_API_URL}?method=flickr.photos.search&api_key=${FLICKR_API_KEY}&format=json&nojsoncallback=1&text=${term}&per_page=${MAX_IMAGES}`
      );
      const json = await response.json();
      return json.photos.photo?.map((photo) => {
        return {
          img: `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}.jpg`,
          keyword: term,
        };
      });
    } catch (error) {
      console.error(error);
      return [];
    }
  }
});
