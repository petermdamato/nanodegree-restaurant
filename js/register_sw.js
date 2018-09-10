/* Set up service worker */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
	.register('/sw.js', {scope: "/"})
    .then(function(registration) {
        if ('sync' in registration) {
        }
        // Registration was successful
        console.log('Service worker registered successful');
        }, function(err) {
          // registration failed :(
          console.log('Service worker registration error: ', err);
        });
      }

