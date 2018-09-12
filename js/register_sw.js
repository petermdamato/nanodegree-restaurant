/* Set up service worker */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
	.register('/sw.js', {scope: "/"})
    .then(function(registration) {
        // Registration was successful
        console.log('Service worker registered successfully');
        }, function(err) {
          // Registration failed
          console.log('Service worker registration error: ', err);
        });
      }

