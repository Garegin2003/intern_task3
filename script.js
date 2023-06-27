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
let imgs = [];

form.addEventListener('submit', submitHandler);

function submitHandler(e) {
  e.preventDefault();
  button.disabled = true;

  container.innerHTML = '';
  basketsContainer.innerHTML = '';

  let searchTerms = search.value
    .toLowerCase()
    .split(' ')
    .filter((e) => e.trim().length > 0);
  const terms = [...new Set(searchTerms)];
  const promises = terms.map((term) => fetchImages(term));

  Promise.all(promises)

    .then((results) => {
      results.forEach((images, index) => {
        const term = terms[index];
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

          imgs.push(...images);

          baskets[basketId] = [];

        }
      });

      imgs.sort(() => Math.random() - 0.5);

      imgs.forEach((e) => {
        const imgElement = document.createElement('img');
        imgElement.src = e.img;
        imgElement.draggable = true;
        imgElement.classList.add('container__item');
        imgElement.ondragstart = handleImageDragStart;
        imgElement.ondragend = allowImageDrop;
        const existingImage = container.querySelector(`img[src="${e.img}"]`);
        if (!existingImage) {
          container.appendChild(imgElement);
        }
      });
    })
    .catch((error) => {
      console.log('Error fetching images:', error);
    })
    .finally(() => {
      button.disabled = false;
      if (imgs.length === 0) {
        container.innerHTML = '<h1>No images</h1>'
      }
    });

  imgs = [];
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
    console.log(baskets);
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
      img.classList.add('container__item--none');
    });
  } else {
    console.log('Image does not match the basket.');
  }

  const allBasketsFilled = Object.values(baskets).every(
    (basket) =>
      basket.length >= imgs.filter((e) => e.keyword === basketId).length
  );
  if (allBasketsFilled) {
    container.innerHTML = '<h1>All sorted</h1>';
  } else {
    console.log('Image does not match the basket.');
  }
}

function handleImageDragStart(e) {
  e.dataTransfer.setData('text/plain', e.target.src);
  e.target.classList.add('container__item--opacity');
}

function fetchImages(term) {
  return new Promise((resolve, reject) => {
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
        resolve(images || []);
      } else {
        reject(new Error('Request failed.'));
      }
    };
    xhr.onerror = function () {
      reject(new Error('Request failed.'));
    };
    xhr.send();
  });
}
