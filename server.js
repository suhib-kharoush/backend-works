'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT;
const app = express();
app.use(cors());

app.get('/location', handleLocationRequest);
app.get('/weather', handleDayRequest);


function handleLocationRequest(req, res) {
    // const searchQuery = req.query;
    const locationData = require('./data/location.json');
    const location = new Location(locationData)
    res.send(location);
}


function handleDayRequest(req, res) {
    const getWeatherData = require('./data/weather.json');
    const dataWeather = [];
    getWeatherData.data.forEach(element => {
        dataWeather.push(new Data(element))
    })
    res.send(dataWeather);
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

app.use('*', (request, response) => {
    response.send('hello');

});
app.listen(PORT, () => {
    console.log(PORT + 'hello');
})