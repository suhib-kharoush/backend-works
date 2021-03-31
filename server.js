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
const GEO_CODE_API_KEY = process.env.GEO_CODE_API_KEY;
const PARK_API_KEY = process.env.PARK_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;
const YELP_API_KEY = process.env.PARK_API_KEY;
const app = express();
app.use(cors());

const client = new pg.Client(DATABASE_URL);



app.get('/location', handleLocationRequest);
app.get('/weather', handleDayRequest);
app.get('/park', parkHandler);
app.use('*', notFoundHandler);
app.use('/movies', handleMovie);
app.use('/yelp', handleYelp);
app.get('/', (req, res) => {
    res.status(200).send('ok');
});


client.connect().then(() => {


    app.listen(PORT, () => {
        console.log('Connected to database:', client.connectionParameters.database);
        console.log('Server up on', PORT);
    });
});



function handleLocationRequest(req, res) {
    // const searchQuery = req.query;
    const city = req.query.city;
    const urlGEO = `https://us1.locationiq.com/v1/search.php`;
    // https://eu1.locationiq.com/v1/search.php?key=pk.5fef4bef87a31d4d9cfb6f09f0cd8468=amman&format=json
    // const locationData = require('./data/location.json');
    // const location = new Location(locationData)
    // res.send(location);
    if (!city) {
        res.status(404).send('no search query was provided');
    }

    const safeValues = [city];
    const sqlQuery = `SELECT * FROM locations WHERE name=$1`;
    client.query(sqlQuery, safeValues)
    const cityQueryParam = {
        key: GEO_CODE_API_KEY,
        city: city,
        format: 'json',
    }





    superagent.get(urlGEO).query(cityQueryParam).then(resData => {
        console.log(resData.body);
        const { city } = req.query
        const location = new Location(city, resData.body[0]);
        const safeValues = [city, location.search_query, location.formatted_query, location.latitude, location.longitude];
        const sqlQuery = `INSERT INTO locations(city, search_query, formatted_query, latitude, longitude) VALUES($1, $2, $3, $4)`;


        client.query(sqlQuery, safeValues).then(result => {
            if (result.rows.length === 0) {
                throw error
            }
            res.status(200).json(result.rows[0]);
        }).catch(error => {
            res.status(500).send(error)
        })


        res.status(200).send(location)
    }).catch((error) => {
        console.log('ERROR', error);
        res.status(500).send(error);


    })

}

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
    this.url3 = data.url;
}


function Movie(moviesData) {
    this.title = moviesData.title;
    this.overview = moviesData.overview;
    this.total_votes = moviesData.total_votes;
    this.image_url = `https://image.tmdb.org/t/p/w500${moviesData.poster_path}`
    this.popularity = moviesData.popularity;
    this.released_on = moviesData.released_on;
}



function Yelp(yelpData) {
    this.name = yelpData.name;
    this.image_url = yelpData.image_url;
    this.price = yelpData.price;
    this.rating = yelpData.rating;
    this.url = yelpData.url;
}



function parkHandler(req, res) {
    let PARK_API_KEY = process.env.PARK_API_KEY;
    const latitude = req.query.latitude;
    const longitude = req.query.longitude;


    // let url = `https://developer.nps.gov/api/v1/parks?parkCode=${parkCode}&api_key=${parkKey}`;
    let url3 = `https://developer.nps.gov/api/v1/parks?parkCode=acad&api_key=${PARK_API_KEY}&limit=10`;
    superagent.get(url3).then(parkData => {
        let parkd = parkData.body.data.map(element => {
            const parkObj = new Park(element);
            return parkObj;
        })
        res.send(parkd);
    }).catch(() => {
        res.status(500).send('sorry, error in getting data from server');

    })
}



function handleMovie(req, res) {
    const city = req.query.search_query;
    MOVIE_API_KEY = process.env.MOVIE_API_KEY;


    const movieUrl = `https://api.themoviedb.org/3/movie/550?api_key=${MOVIE_API_KEY}`
    let movies = [];

    superagent.get(movieUrl).then(moviesData => {
        movies = moviesData.body.result.map(element => {
            const moviesObj = new Movie(element);
            return moviesObj;
        })
        res.send(movies);
    })
}




function handleYelp(req, res) {
    const city = req.query.search_query;
    const page = req.query.page;
    const numPerPage = 5;
    const startIdx = ((page - 1) * numPerPage + 1);

    const yelpUrl = `https://api.yelp.com/v3/businesses/search?location=${city}&limit=${numbPerPage}&offset=${startIdx}`;

    let yelpArr = [];

    superagent.get(yelpUrl).set('Authorization', `Bearer ${YELP_API_KEY}`)
        .then(yelpData => {
            yelpArr = yelpData.body.buisnesses.map(element => {
                const yelpObj = new Yelp(element);
                return yelpObj;
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
    let weatherKey = process.env.WEATHER_API_KEY;
    // const city = req.query.city;
    const url2 = `https://api.weatherbit.io/v2.0/forecast/daily`;
    // https://api.weatherbit.io/v2.0/forecast/daily?city=amman&key=01e6b09a24b640dd9610c10e0045bb58

    // 7088c549dafb4dd7a435111798d8227f
    const queryObj = {
        lat: req.query.latitude,
        lon: req.query.longitude,
        key: weatherKey
    }


    superagent.get(url2).query(queryObj).then(weatherData => {
        let weatherd = weatherData.body.data.map(element => {
            const weatherObj = new Weather(element)
            return weatherObj
        })
        res.send(weatherd);
    }).catch(() => {
        res.status(500).send('sorry, error in getting data');

    })

    // getWeatherData.data.forEach(element => {
    //     dataWeather.push(new Data(element))
    // })
    // res.send(dataWeather);
}


function Weather(data) {
    this.forecast = data.weather.description;
    this.time = data.datetime;
}

// function error(req, res) {
//     if (res) res.status(500).send("sorry, something went error");
// }



app.use('*', (req, res) => {
    res.send('hello');

});
app.listen(PORT, () => {
    console.log(PORT + 'hello');
})


// client.query(sqlQuery).then(result => {
//     res.status(200).json(result.rows);
// }).catch(error => {
//     res.status(500).send(error)
// })