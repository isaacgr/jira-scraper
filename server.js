require("dotenv").config({ path: ".env.production" });
const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const schema = require("./schema");
const cors = require("cors");
const path = require("path");
const { GraphQLServer } = require("graphql-yoga");

// const app = express();
const server = new GraphQLServer({ schema });

server.express.use(cors());

// app.use(
//   "/graphql",
//   cors(),
//   graphqlHTTP({
//     schema,
//     graphiql: true
//   })
// );

server.express.use(express.static("build"));

server.express.get("/", (request, response) => {
  response.sendFile(path.resolve(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 5000;

server.start({ port: PORT, endpoint: "/graphql", playground: "/graphql" }, () =>
  console.log(`Server listening on ${PORT}`)
);
