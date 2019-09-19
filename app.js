/**************************************************************************
    
    yawarakai: A running core that support many neural network models which works for NLP or providing solution
    Copyright (C) 2019  Yuna Hanami

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>

 *************************************************************************/

// Dependencies

// Local Packages

let Log = require('./log').Log
let AnonymousLog = require('./log').AnonymousLog
let Core = require('./core')
let Bot = require('./bot')
let Lang = require('./lang').Lang
let config = require('./config.json')
let packageInfo = require('./package.json')

// Core Runtime

var startInfo = Lang.app.startTime + "：" + Core.Time.logTime + " - " + config.botname + " " + Lang.app.coreVersion + ": " + packageInfo.version

console.log("Yawarakai  Copyright (C) 2019  Yuna Hanami")
console.log(startInfo)
AnonymousLog.info(startInfo)

// CLI

Core.cliInput('> ', input => {
    var command = input.split(' ')[0] // Cut Command and set to First string
    var isCommand = command.includes("/") && (command.indexOf("/") == 0) // Check command type
    if(isCommand) {
        switch (command) {
            default:
                console.log(config.coreName + ": " + input + ": " + Lang.app.cliCommandUnknownPrompt)
                AnonymousLog.trace( Lang.app.commandExecution + ": " + input)
                break
            case '/telegram':
                Bot.telegram.command(input)
                break
            case '/help':
                console.log( Lang.app.cliAvailiableCommand + ": /telegram | /help | /[exit|stop]")
                break
            case '/stop':
            case '/exit':
                return false;
        }
    }
    else { // Basic session processing and exception handling
        switch(input) {
            default:
                break
            case '':
                break
        }
    }
})

// Processing

Bot.telegram.Bot.on("text", (ctx) => {
    // Send Data to Message Control
    Bot.message.messagectl.logMsg(ctx)
    // Send Data to Processor
    Bot.message.messagectl.process(ctx)
})

// Log

Bot.telegram.Bot.catch((err) => {
    Log.fatal(err)
})