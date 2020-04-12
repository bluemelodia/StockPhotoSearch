# StockPhotoSearch

Small practice project using JavaScript/Bootstrap CSS frontend and Node.js/Express backend. This was adapted from one of the Udacity's Front End Nanodegree Program projects, which asked students to create an asynchronous web app that uses Web API and user data to dynamically update the UI in a Weather Journal application. Instead, I created an application that works with the Pexels Stock Photo API. 

    Features:
        - Users can search for stock photos. 
        - Users can bookmark their favorite photos, generate citations for crediting the photographers, preview photos, and remove photos from their list of saved photos.
        - Bookmarked photos will persist across user searches.

<img src="./img/StockPhotoExplorer.png"/>
<img src="./img/StockPhotoExplorer2.png"/>

## Dependencies:

    body-parser: https://www.npmjs.com/package/body-parser

    The `bodyParser` object exposes various factories to create middlewares. All middlewares will populate the `req.body` property with the parsed body when the `Content-Type` request header matches the `type` option, or an empty object ({}) if there was no body to parse, the `Content-Type` was not matched, or an error occurred.

    cors: https://www.npmjs.com/package/cors

    Cross-origin resource sharing (CORS) is a mechanism that allows restricted resources on a web page to be requested from another domain outside the domain from which the first resource was served.

    A web page may freely embed cross-origin images, stylesheets, scripts, iframes, and videos. Certain "cross-domain" requests, notably Ajax requests, are forbidden by default by the same-origin security policy. CORS defines a way in which a browser and server can interact to determine whether it is safe to allow the cross-origin request. It allows for more freedom and functionality than purely same-origin requests, but is more secure than simply allowing all cross-origin requests.