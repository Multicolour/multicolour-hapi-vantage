"use strict"

require("console.table")
const chalk = require("chalk")
const vantage = require("vantage")()

const colours = ["black", "red", "green", "yellow", "blue", "magenta", "cyan"]

const randomise = text =>
  text
    .split("")
    .map(character => chalk.bold[colours[~~(Math.random() * colours.length)]](character))
    .join("")

const banner = name =>
  ([
    randomise(vantage.util.pad(" ", process.stdout.columns - 2, "#")) + "\n",
    ` # Multicolour - ${name} - REPL` + "\n",
    randomise(vantage.util.pad(" ", process.stdout.columns - 2, "#")) + "\n"
  ].join(""))


class Multicolour_Hapi_Vantage {
  register(Multicolour_Server_Hapi) {
    const multicolour = Multicolour_Server_Hapi.request("host")

    const port = multicolour.get("config").get("api_connections").port || 1811
    const name = multicolour.get("package").name

    vantage
      .mode("repl")
      .delimiter(chalk.blue("multicolour~$"))
      .description("Multicolour REPL, access all of Multicolour using dot.notation.")
      .action(function(args, callback) {
        /* eslint-disable */
        try { console.log(eval(args)) }
        catch(error) { console.error(chalk.red(error)) }
        /* eslint-enable */

        callback()
      })

    console.log(banner(name))

    // Share the listening with Hapi.
    vantage
      .banner(banner(name))
      .delimiter(`${name}~$`)
      .listen(port)

    // Add a request interface.
    Multicolour_Server_Hapi.reply("vantage", () => vantage)

    // Show Vantage.
    vantage.show()
  }
}

module.exports = Multicolour_Hapi_Vantage
