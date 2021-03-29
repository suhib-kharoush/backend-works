'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
// const { response } = require('express');

const PORT = process.env.PORT;
const GEO_CODE_API_KEY = process.env.GEO_CODE_API_KEY;
const app = express();
app.use(cors());

app.get('/location', handleLocationRequest);
app.get('/weather', handleDayRequest);
app.get('/park', parkHandler);
app.use('*', notFoundHandler);


function handleLocationRequest(req, res) {
    // const searchQuery = req.query;
    const cityName = req.query.city;
    const url = `https://eu1.locationq.com/v1/search.php`;
    // https://eu1.locationiq.com/v1/search.php?key=pk.5fef4bef87a31d4d9cfb6f09f0cd8468=amman&format=json
    // const locationData = require('./data/location.json');
    // const location = new Location(locationData)
    // res.send(location);




    const cityQueryParam = {
        key: GEO_CODE_API_KEY,
        city: cityName,
        format: 'json'
    };


    if (!cityName) {
        res.status(404).send('no search query was provided');
    }

    superagent.get(url).query(cityQueryParam).then(resData => {
        const location = new Location(city, resData.body[0]);
        res.status(200).send(location)
    }).catch((error) => {
        console.log('ERROR', error);
        res.status(500).send('sorry, something went wrong');

    })


}

function Location(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData.display_name;
    this.latitude = geoData.lat;
    this.longitude = geoData.lon;
}


function Park(parkData) {
    this.name = parkData.name;
    this.address = parkData.address;
    this.fee = parkData.fee;
    this.description = parkData.description;
    this.url3 = parkData.url;
}

function parkHandler(req, res) {
    let parkKey = process.env.PARK_API_KEY;
    const latitude = req.query.latitude;
    const longitude = req.query.longitude;


    // let url = `https://developer.nps.gov/api/v1/parks?parkCode=${parkCode}&api_key=${parkKey}`;
    let url3 = `https://developer.nps.gov/api/v1/parks?latitude=${latitude}&longitude=${longitude}&api_key=${parkKey}`;
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




function notFoundHandler(req, res) {
    response.status(404).send('huh?');
}


function handleDayRequest(req, res) {
    // const getWeatherData = require('./data/weather.json');
    const dataWeather = [];
    let weatherKey = process.env.WEATHER_API_KEY;
    const cityName = req.query.search_query;
    const url2 = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${weatherKey}`
        // https://api.weatherbit.io/v2.0/forecast/daily?city=amman&key=01e6b09a24b640dd9610c10e0045bb58

    superagent.get(url2).then(weatherData => {
        let weatherd = weatherData.body.data.map(element => {
            const weatherObj = new Data(element)
            return weatherObj
        })
        response.send(weatherd);
    }).catch(() => {
        res.status(500).send('sorry, error in getting data');

    })

    // getWeatherData.data.forEach(element => {
    //     dataWeather.push(new Data(element))
    // })
    // res.send(dataWeather);
}




function Location(datas) {
    this.search_query = 'Lynnwood';
    this.formatted_query = datas[0].display_name;
    this.latitude = datas[0].lat;
    this.longitude = datas[0].lon;
}


function Data(datas) {
    this.forecast = datas.weather.description;
    this.time = datas.datetime;
}

function error(req, res) {
    if (res) res.status(500).send("sorry, something went error");
}



app.use('*', (req, res) => {
    res.send('hello');

});
app.listen(PORT, () => {
    console.log(PORT + 'hello');
})