import WebSocket, { WebSocketServer } from "ws";
import fetch from "node-fetch";

const wss = new WebSocketServer({ port: 8080 });

let users = [];
let cities = ["Zürich", "Berlin", "Vladivostok", "Albuquerque"];

let newId = 0;

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (msg) => {
    switch (msg.type) {
      case "login": // existiert noch nicht
        users.push({
          id: newId,
          name: msg.content,
        });

        newId++;
        break;

      case "addLocation":
        cities.push(msg.content);
        break;

      default:
        console.log(
          `error handling message of type ${msg.type} with content ${msg.content}`
        );
        break;
    }
  });

  ws.on("close", () => {
    console.log("Client has disconnected");
  });

  ws.send("test");
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

async function sendAllData() {
  for (const city of cities) {
    try {
      let weatherCity = await getWeather(city);
      console.log(
        `In ${city}: At ${weatherCity.hourly.time[0]} the temperature is ${weatherCity.hourly.temperature_2m[0]}`
      );
    } catch {
      console.log(`City ${city} not found.`);
    }
  }
}

(async function () {
  setInterval(async () => {
    await sendAllData();
  }, 10000);
})(); // alle 10 sekunden
