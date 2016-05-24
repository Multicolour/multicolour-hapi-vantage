"use strict"

const chalk = require("chalk")
const vantage = require("vantage")()

const colours = ["black", "red", "green", "yellow", "blue", "magenta", "cyan"]

// Randomise the colours of each character
// in a bunch of text.
// @param {String} text to make multicolour.
// @return {String} multicolour text.
const randomise = text =>
  text
    .split("")
    .map(character => chalk.bold[colours[~~(Math.random() * colours.length)]](character))
    .join("")

// A text banner when entering the Vantage server view.
// @param {String} name of the package to show in banner.
// @return {String} banner text.
const banner = name =>
  ([
    vantage.util.pad("", process.stdout.rows, "\n"),
    randomise(vantage.util.pad(" ", process.stdout.columns - 2, "#")) + "\n",
    ` # ${name}` + "\n",
    randomise(vantage.util.pad(" ", process.stdout.columns - 2, "#")) + "\n"
  ].join(""))


class Multicolour_Hapi_Vantage {
  register(Multicolour_Server_Hapi) {
    // Exit if it's production, nope. Stahp.
    if (process.env.NODE_ENV === "production") {
      return console.log(chalk.red.bold("Not setting up Vantage in production."))
    }

    const multicolour = Multicolour_Server_Hapi.request("host")

    const port = multicolour.get("config").get("api_connections").port || 1811
    const name = multicolour.get("package").name
    const server = Multicolour_Server_Hapi.request("raw")

    vantage
      .command("debug <state>")
      .description("Show HTTP requests in real time from your server.")
      .action(function(args, next) {
        const log = ["stop", "off"].indexOf(args.state.toLowerCase()) < 0
        const Table = require("cli-table")
        const verb_colours = {
          GET: "blue",
          POST: "green",
          PUT: "yellow",
          PATCH: "cyan",
          DELETE: "red"
        }

        if (log)
          console.log(chalk.blue.bold("$->"), chalk.white.underline(`Waiting for HTTP requests on ${server.info.host}:${server.info.port}`))

        server.on("response", (request) => {
          // If we're not logging, exit here.
          if (!log) return

          const table = new Table({
            head: ["", "Verb", "Response in", "Route", "Query", "Payload", "Headers"]
          })

          const took = request.info.responded - request.info.received
          const verb = request.method.toString().toUpperCase()
          const route = request.path
          const query = request.query
          const payload = request.payload
          const headers = request.headers

          table.push(
            {
              request: [
                chalk[verb_colours[verb]].bold(verb),
                `${took}ms`,
                route,
                JSON.stringify(query, null, 2),
                JSON.stringify(payload, null, 2),
                JSON.stringify(headers, null, 2)
              ]
            },
            {
              response: [
                chalk[verb_colours[verb]].bold(verb),
                `${took}ms`,
                route,
                JSON.stringify(query, null, 2),
                JSON.stringify(request.response.source, null, 2),
                JSON.stringify(headers, null, 2)
              ]
            }
          )

          this.log(table.toString())
        })

        next()
      })

    vantage
      .mode("repl")
      .delimiter(chalk.blue("multicolour~$"))
      .description("Multicolour REPL.")
      .action(function(args, callback) {
        /* eslint-disable */
        try { console.log(eval(args)) }
        catch(error) { console.error(chalk.red(error)) }
        /* eslint-enable */

        callback()
      })

    /* eslint-disable */
    console.log(banner(name))
    /* eslint-enable */

    // Share the listening with Hapi.
    vantage
      .delimiter(`${name}~$`)
      .listen(server, port)

    // Add a request interface.
    Multicolour_Server_Hapi.reply("vantage", () => vantage)

    // Show Vantage.
    vantage.show()
  }
}

module.exports = Multicolour_Hapi_Vantage
