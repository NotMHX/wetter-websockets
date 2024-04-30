import WebSocket, { WebSocketServer } from "ws";
import fetch from "node-fetch";

const wss = new WebSocketServer({ port: 8080 });

let cities = [];

wss.on("connection", async (ws) => {
  console.log("New client connected");

  // show data on startup
  sendAllData();

  ws.on("message", async (msg) => {
    console.log(msg);

    try {
      let TestData = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${msg}&count=1&language=en&format=json`
      );
      const testJson = await TestData.json();

      console.log(testJson);
      if (testJson != null) {
        console.log("city exists");
        cities.push(msg);
      }
    } catch (error) {
      console.log("error");
    }

    sendAllData();
  });

  ws.on("close", () => {
    console.log("Client has disconnected");
  });

  async function sendAllData() {
    const data = await getAllData();
    console.log(data);
    ws.send(JSON.stringify(data));
  }

  // update data every minute
  setInterval(sendAllData, 60000);
});

async function getWeather(city) {
  let cityData = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`
  );
  const cityJson = await cityData.json();
  const cityJson2 = cityJson.results[0];

  let weatherData = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${cityJson2.latitude}&longitude=${cityJson2.longitude}&hourly=temperature_2m&timezone=Europe%2FBerlin&forecast_days=3`
  );
  const weatherJson = await weatherData.json();

  return weatherJson;
}

async function getAllData() {
  let weatherCity = [];
  for (const city of cities) {
    try {
      const cityString = JSON.parse(city);
      let cityWeatherObject = {
        city: cityString,
        data: await getWeather(cityString),
      };
      weatherCity.push(cityWeatherObject);
    } catch {
      console.log(`City ${city} not found.`);
    }
  }
  return weatherCity;
}
