'use strict';

require('dotenv').config();

// const server = express();
// server.use(cors());
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
// const { json } = require('express');


const PORT = process.env.PORT;
const ENV = process.env.DEV || 'DEP';
const GEO_CODE_API_KEY = process.env.GEO_CODE_API_KEY;
const PARK_API_KEY = process.env.PARK_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;
const YELP_API_KEY = process.env.YELP_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY
const app = express();
app.use(cors());
// let client = '';
// if (ENV === 'Dep') {

//     client = new pg.Client({
//         connectionString: DATABASE_URL,
//         ssl: {
//             rejectUnauthorized: false
//         }
//     });
// } else {
//     client = new pg.Client(DATABASE_URL);

// }

let client = '';
if (ENV === 'DEP') {
    client = new pg.Client({
        connectionString: DATABASE_URL,
        // ssl: {
        //     rejectUnauthorized: false
        // }
    });
} else {
    client = new pg.Client({
        connectionString: DATABASE_URL,
    });
}


app.get('/location', handleLocationRequest);
app.get('/weather', handleDayRequest);
app.get('/parks', parkHandler);
app.get('/movies', handleMovie);
app.get('/yelp', handleYelp);
app.use('*', notFoundHandler);
// app.get('/', (req, res) => {
//     res.status(200).send('ok');
// });









function handleLocationRequest(req, res) {
    // const searchQuery = req.query;
    const city = req.query.city;
    // https://eu1.locationiq.com/v1/search.php?key=pk.5fef4bef87a31d4d9cfb6f09f0cd8468=amman&format=json
    // const locationData = require('./data/location.json');
    // const location = new Location(locationData)
    // res.send(location);
    if (!city) {
        res.status(404).send('no search query was provided');
    }
    addingToDataBase(city).then(results => {
        res.send(results)
    });
    // const safeValues = [city];
    // const sqlQuery = `SELECT * FROM locations WHERE search_query=$1`;
    // client.query(sqlQuery, safeValues)



}

function addingToDataBase(city) {
    const safeValus = [city]

    const newQuery = `SELECT * FROM locations WHERE search_query=$1;`
    return client.query(newQuery, safeValus).then(results => {
        if (results.rows.length !== 0) {
            return results.rows[0]
        } else {
            const cityQueryParam = {
                key: GEO_CODE_API_KEY,
                city: city,
                format: 'json',
            }
            const urlGEO = `https://us1.locationiq.com/v1/search.php`;
            return superagent.get(urlGEO).query(cityQueryParam).then(data => {
                const locations = new Location(city, data.body[0])
                const safeValues = [locations.search_query, locations.formatted_query, locations.latitude, locations.longitude];
                const sqlQuery = `INSERT INTO locations(search_query, formatted_query, latitude, longitude) VALUES($1, $2, $3, $4)`;
                client.query(sqlQuery, safeValues)
                return locations;



            })

        }
    })
}
//     superagent.get(urlGEO).query(cityQueryParam).then(resData => {
//         console.log(resData.body);
//         const { city } = req.query
//         const location = new Location(city, resData.body[0]);





// }

function Location(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData.display_name;
    this.latitude = geoData.lat;
    this.longitude = geoData.lon;
}


function Park(data) {
    this.name = data.name;
    this.address = `${data.addresses[0].line1} ${data.addresses[0].city} ${data.addresses[0].stateCode} ${data.addresses[0].postalCode}`;
    this.fee = '0.00';
    this.description = data.description;
    this.url = data.url;
}


function Movie(moviesData) {
    this.title = moviesData.title;
    this.overview = moviesData.overview;
    this.total_votes = moviesData.total_votes;
    this.image_url = `https://image.tmdb.org/t/p/w500${moviesData.poster_path}`
    this.popularity = moviesData.popularity;
    this.released_on = moviesData.released_on;
}



function Yelp(data) {
    this.name = data.name;
    this.image_url = data.image_url;
    this.price = data.price;
    this.rating = data.rating;
    this.url = data.url;
}



function parkHandler(req, res) {
    // const latitude = req.query.latitude;
    // const longitude = req.query.longitude;
    const city = req.query.search_query;

    // let url = `https://developer.nps.gov/api/v1/parks?parkCode=${parkCode}&api_key=${parkKey}`;
    let url3 = `https://developer.nps.gov/api/v1/parks?q=${city}&api_key=${PARK_API_KEY}`;

    if (!city) { //for empty request
        res.status(404).send('no search query was provided');
    }

    superagent.get(url3).then(parkData => {
        const parkd = parkData.body.data.map(element => {
            return new Park(element);
        })
        res.status(200).send(parkd);
    }).catch(() => {
        res.status(500).send('sorry, error in getting data from server');

    })
}



function handleMovie(req, res) {
    const city = req.query.search_query;
    const movieUrl = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_API_KEY}&query=${city}&page=1&sort_by=popularity.desc&include_adult=false`

    superagent.get(movieUrl).then(moviesData => {
        const movies = moviesData.body.results.map(element => {
            const moviesObj = new Movie(element);
            return moviesObj;
        })
        res.send(movies);
    }).catch(error => {
        console.log(error);
        res.status(500).send('OPPS')
    })
}




function handleYelp(req, res) {
    const longitude = req.query.longitude;
    const latitude = req.query.latitude;
    const page = req.query.page;
    const numPerPage = 5;
    const startIdx = ((page - 1) * numPerPage + 1);

    const yelpUrl = `https://api.yelp.com/v3/businesses/search?longitude=${longitude}&latitude=${latitude}&limit=${numPerPage}&offset=${startIdx}`;


    superagent.get(yelpUrl).set('Authorization', `Bearer ${YELP_API_KEY}`).then(yelpData => {
        console.log(yelpData);
        const yelpArr = yelpData.body.businesses.map((element) => {
            return new Yelp(element);

        })
        res.send(yelpArr);
    })
}





function notFoundHandler(req, res) {
    res.status(404).send('huh?');
}


function handleDayRequest(req, res) {
    // const getWeatherData = require('./data/weather.json');
    // const dataWeather = [];
    // let weatherKey = process.env.WEATHER_API_KEY;
    const latitude = req.query.latitude;
    const longitude = req.query.longitude;
    const url2 = `https://api.weatherbit.io/v2.0/forecast/daily`;
    // https://api.weatherbit.io/v2.0/forecast/daily?city=amman&key=01e6b09a24b640dd9610c10e0045bb58

    const queryObj = {
        lat: latitude,
        lon: longitude,
        key: WEATHER_API_KEY
    }


    superagent.get(url2).query(queryObj).then(weatherData => {
        let weatherd = weatherData.body.data.map(element => {
            const weatherObj = new Weather(element)
            return weatherObj
        })
        res.send(weatherd.slice(0 - 9));
    }).catch(() => {
        res.status(500).send('sorry, error in getting data');

    })


}


function Weather(data) {
    this.forecast = data.weather.description;
    this.time = data.datetime;
}





client.connect().then(() => {


    app.listen(PORT, () => {
        console.log('Connected to database:', client.connectionParameters.database);
        console.log('Server up on', PORT);
    });
});