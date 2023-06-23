const FLICKR_API_URL = 'https://api.flickr.com/services/rest/';
const FLICKR_API_KEY = 'b3ce50d157bf5280e6b91ebc5f42bdd8';
const MAX_IMAGES = 5;

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("button");
  const container = document.getElementById('container');
  const baskets = document.getElementById('baskets');

  button.addEventListener("click", async (e) => {
    e.preventDefault();
    let search = document.getElementById("search").value;
    let searchTerms = search.split(" ");
    console.log(searchTerms);

    const promises = searchTerms.map(fetchImages);

    const results = await Promise.allSettled(promises);
    console.log(results);

    container.innerHTML = "";
    baskets.innerHTML = "";

    let imgs = [];
    let hasImages = false;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const images = result.status === 'fulfilled' && result.value.length !== 0 ? result.value.slice(0, MAX_IMAGES) : [];
  
      if (images.length !== 0) {
        hasImages = true;

        const term = searchTerms[i];
        const basketDiv = document.createElement('div');
        basketDiv.textContent = term;
        baskets.appendChild(basketDiv);

        imgs = [...imgs, ...images];
        imgs.sort(() => Math.random() - 0.5);

        for (const img of imgs) {
          const imgElement = document.createElement('img');
          imgElement.src = img.img;
          container.appendChild(imgElement);
        }
      }
    }

    if (!hasImages) {
      container.innerHTML = "No images found.";
    }

    console.log(imgs);
  });

  async function fetchImages(term) {
    try {
      const response = await fetch(`${FLICKR_API_URL}?method=flickr.photos.search&api_key=${FLICKR_API_KEY}&format=json&nojsoncallback=1&text=${term}&per_page=${MAX_IMAGES}`);
      const json = await response.json();
      return json.photos.photo?.map((photo) => {
        return {
          img: `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}.jpg`,
          keyword: term
        }
         });
    } catch (error) {
      console.error(error);
      return [];
    }
  }
});