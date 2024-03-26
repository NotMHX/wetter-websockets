import WebSocket, { WebSocketServer } from "ws";
import fetch from "node-fetch";

const wss = new WebSocketServer({ port: 8080 });

let users = [];
let cities = ["Zürich", "Berlin", "Vladivostok", "Albuquerque"];

let newId = 0;

wss.on("connection", async (ws) => {
  console.log("New client connected");

  // show data on startup
  const data = await sendAllData();
  console.log(data);
  ws.send(JSON.stringify(data));

  ws.on("message", (megString) => {
    let location = JSON.parse(msg);

    console.log(location);
    switch (location.type) {
      case "login": // existiert noch nicht
        users.push({
          id: newId,
          name: location.content,
        });

        newId++;
        break;

      case "addLocation":
        console.log("Here");
        cities.push(location.content);
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

  // update data every 10000 ms
  setInterval(async () => {
    const data = await sendAllData();
    console.log(data);
    ws.send(JSON.stringify(data));
  }, 10000);
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
  let weatherCity = [];
  for (const city of cities) {
    try {
      let cityWeatherObject = {
        city: city,
        data: await getWeather(city),
      };
      weatherCity.push(cityWeatherObject);
    } catch {
      console.log(`City ${city} not found.`);
    }
  }
  return weatherCity;
}
