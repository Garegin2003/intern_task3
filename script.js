const FLICKR_API_URL = 'https://api.flickr.com/services/rest/';
const FLICKR_API_KEY = 'b3ce50d157bf5280e6b91ebc5f42bdd8';
const MAX_IMAGES = 5;

const baskets = {};
const search = document.querySelector('.form__search');
const container = document.querySelector('.container');
const basketsContainer = document.querySelector('.baskets');
const form = document.querySelector('.form');
const button = document.querySelector('.form__button');
const content = document.querySelector('.content');
const noimages = document.querySelector('.no-images');
let imgs = [];

form.addEventListener('submit', submitHandler);

function submitHandler(e) {
  e.preventDefault();

  button.disabled = true;
  imgs = [];

  container.innerHTML = '';
  basketsContainer.innerHTML = '';

  let searchTerms = search.value
    .toLowerCase()
    .split(' ')
    .filter((e) => e.trim().length > 0);

  const terms = searchTerms.filter((e, i, arr) => arr.indexOf(e) === i);
  const totalSearches = terms.length;

  let completedSearches = 0;
  let existingImages = [];

  terms.forEach((term) => {

    fetchImages(term, (error, result) => {

      if (error) {
        container.innerHTML = `<h1>Error fetching images: ${error}</h1>`;

      } else {
        const { term, images } = result;

        if (images.length !== 0) {
          const basketDiv = document.createElement('div');
          const basketId = `${term}`;
          basketDiv.id = basketId;
          basketDiv.classList.add('baskets__item');
          basketsContainer.appendChild(basketDiv);
          basketDiv.ondragover = allowImageDrop;
          basketDiv.ondrop = (e) => handleImageDrop(e, basketId);
          const basketName = document.createElement('span');
          basketName.textContent = term;
          basketDiv.appendChild(basketName);

          basketDiv.addEventListener('click', () => {

            if (basketDiv.classList.contains('baskets__item--selected')) {
              basketDiv.classList.remove('baskets__item--selected');
            } else {
              basketDiv.classList.add('baskets__item--selected');
            }

          });

          let uniqueImages = images.filter(
            (image) => !existingImages.includes(image.img)
          );

          imgs.push(...uniqueImages);
          existingImages.push(...uniqueImages.map((image) => image.img));

          baskets[basketId] = [];
        } else {
          noimages.innerHTML = '<h1>No images</h1>';
        }
      }

      completedSearches++;

      if (completedSearches === totalSearches) {
        button.disabled = false;

        if (imgs.length === 0) {
          noimages.innerHTML = '<h1>No images</h1>';
        }

        if (imgs.length > 0) {
          imgs.sort(() => Math.random() - 0.5);

          noimages.innerHTML = '';

          imgs.forEach((e) => {
            const imgElement = document.createElement('img');
            imgElement.src = e.img;
            imgElement.draggable = true;
            imgElement.classList.add('container__item');
            imgElement.ondragstart = handleImageDragStart;
            imgElement.ondragend = allowImageDrop;
            container.appendChild(imgElement);
          });
        }
      }
    });
  });
}

function allowImageDrop(e) {
  e.preventDefault();
  e.target.classList.remove('container__item--opacity');
}

function handleImageDrop(e, basketId) {

  e.preventDefault();
  const imageSrc = e.dataTransfer.getData('text/plain');
  const matchingImage = imgs.find(
    (img) => img.img === imageSrc && img.keyword === basketId
  );

  const existingImages = container.querySelectorAll(
    `img[src="${matchingImage.img}"]`
  );

  if (
    matchingImage &&
    !baskets[basketId].some((e) => e.img === matchingImage.img)
  ) {

    baskets[basketId].push(matchingImage);
    const basketDiv = document.getElementById(basketId);
    basketDiv.innerHTML = '';
    const fragment = document.createDocumentFragment();

    baskets[basketId].forEach((image) => {
      const imgElement = document.createElement('img');
      imgElement.src = image.img;
      fragment.appendChild(imgElement);
    });

    basketDiv.appendChild(fragment);

    const basketName = document.createElement('span');
    basketName.textContent = matchingImage.keyword;
    basketDiv.appendChild(basketName);

    existingImages.forEach((img) => {
      img.remove();
    });
  }

  if (container.querySelectorAll('img').length === 0) {
    container.innerHTML = '<h1>All sorted</h1>';
  }
}

function handleImageDragStart(e) {
  e.dataTransfer.setData('text/plain', e.target.src);
  e.target.classList.add('container__item--opacity');
}

function fetchImages(term, callback) {

  const xhr = new XMLHttpRequest();
  xhr.open(
    'GET',
    `${FLICKR_API_URL}?method=flickr.photos.search&api_key=${FLICKR_API_KEY}&format=json&nojsoncallback=1&text=${term}&per_page=${MAX_IMAGES}`
  );

  xhr.onload = function () {
    
    if (xhr.status === 200) {
      const json = JSON.parse(xhr.responseText);
      const images = json.photos.photo?.map((photo) => {
        return {
          img: `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}.jpg`,
          keyword: term,
        };
      });

      const result = {
        term: term,
        images: images || [],
      };
      callback(null, result);
    } else {
      callback(new Error('Request failed.'));
    }
  };

  xhr.onerror = function () {
    callback(new Error('Request failed.'));
  };

  xhr.send();
}
