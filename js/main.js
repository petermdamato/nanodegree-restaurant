let restaurants,
  neighborhoods,
  cuisines
var map;
var markers = [];


// Fetch neighborhoods and cuisines on page load
document.addEventListener('DOMContentLoaded', (event) => {
  registerServiceWorker();
  fetchNeighborhoods();
  initMap();
  fetchCuisines();
});

registerServiceWorker = () => {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(function(reg) {
      console.log("SW registered");
    }).catch(function(error) {
      // If registration fails
      console.log('Registration failed with ' + error);
    });
  }
};

// Fetch all neighborhoods and set their HTML.
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

// Set neighborhoods HTML.
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

// Fetch all cuisines and set their HTML.
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

// Set cuisines HTML
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

// Initialize Google map, called from HTML.
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  map = L.map('map', { zoomControl:false }).setView(loc, 12);//* leaflet code
  map.scrollWheelZoom.disable(); // Turn off stupid scrolling
  L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);
  updateRestaurants();
};

// Update page and map for current restaurants.
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

// Clear current restaurants, their HTML and remove their map markers.
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  // this.markers.forEach(this.markers)
  self.markers.forEach((m) => {
    self.map.removeLayer(m);
  });
  self.markers = [];
  self.restaurants = restaurants;
};

// Create all restaurants HTML and add them to the webpage.
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

// Create restaurant HTML.
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const container = document.createElement('div');
  const image = document.createElement('img');
  container.className = 'restaurant-img-container';
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = restaurant.name + ' restaurant in ' + restaurant.neighborhood;
  container.append(image);
  li.append(container);

  const profile = document.createElement('div');
  profile.className = 'profile';
  li.append(profile);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  profile.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  profile.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  profile.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  profile.append(more);

  return li;
}

// Add markers for current restaurants to the map.

addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {

    // Make markers then put them in the markers array
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);

    self.markers.push(marker);
  });
}
