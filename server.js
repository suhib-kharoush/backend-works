'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT;
const app = express();
app.use(cors());

app.get('/location', handleLocationRequest);
app.get('/weather', handleDayRequest);


function handleLocationRequest(req, weat) {
    const searchQuery = req.query;
    const locationRawData = require('./data/location.json');
    const location = new Location(locationRawData[0])
    weat.send(location);
}

function handleDayRequest(req, weat) {
    const weatherData = require('./data/weather.json');
    const weeklyWeather = [];
    weatherData.data.forEach(weather => {
        weeklyWeather.push(new Data(weather))
    })
    weat.send(weeklyWeather);
}

function Location(datas) {
    this.search_query = 'lynnwood';
    this.formatted_query = datas[0].display_name;
    this.latitude = datas[0].lat;
    this.longitude = datas[0].lon;
}

function Data(datas) {
    this.description = datas.weather.description;
    this.datetime = datas.weather.datetime;
}

app.use('*', (request, response) => {
    response.send('hello');

});
app.listen(PORT, () => {
    console.log(PORT + 'hello');
})