const axios = require("axios")
const config = require("./config.json")
const Compo = require("../../component")
const fs = require('fs')
const path = require('path')
const NodeID3 = require('node-id3')
const http = require('http')
const https = require('https')

let baseDir = __dirname.replace(/((\/)|(\\))(Components)(((\/)|(\\))(yawarakai-official))/gu, "")
// io.js
let cacheDir = path.join(baseDir, "/cache")
let dataDir = path.join(cacheDir, "/data")
let musicDir = path.join(cacheDir, "/music")

if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir)
}
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir)
}
if (!fs.existsSync(musicDir)) {
    fs.mkdirSync(musicDir)
}

let main = {
    album: async function (params) {

    },
    playlist: async function (params) {

    },
    getSong: function (url, fileId) {
        return new Promise((resolve, reject) => {
            let extName = url.replace(/(https?:\/\/)(.*\/)/gui, "").split(".")[1]
            let fileName = fileId + "." + extName

            let file = fs.createWriteStream("./cache/music/" + fileName)
            let request = http.get(url, function (response) {
                if (response.statusCode != 200) {
                    reject()
                }
                response.pipe(file)
                resolve(fileName)
            })
        })
    },
    getAlbumPic: function (url, fileId) {
        return new Promise((resolve, reject) => {
            let extName = url.replace(/(https?:\/\/)(.*\/)/gui, "").split(".")[1]
            let fileName = fileId + "." + extName

            let file = fs.createWriteStream("./cache/data/" + fileName)
            let request = https.get(url, function (response) {
                if (response.statusCode != 200) {
                    reject()
                }
                response.pipe(file)
                resolve(fileName)
            })
        })
    },
    writeTag: function (audioFile, picFile, info) {
        return new Promise((resolve, reject) => {
            console.log(NodeID3.read(path.join(baseDir, "/cache/data/", audioFile)))
            let tag = {
                album: "",
                composer: "",
                genre: "",
                date: "",
                time: "",
                title: "",
                subtitle: "",
                artist: "",
                publisher: "",
                trackNumber: "",
                recordingDates: "",
                size: "",
                year: "",
                image: {
                    mime: "png/jpeg" / undefined,
                    type: {
                        id: 3,
                        name: "front cover"
                    },
                    description: "image description",
                    imageBuffer: null
                }
            }
        })
    },
    parseArgs: function (link) {
        // type one
        // prefix cut
        let domainName = /((https?:\/\/)|())(music.163.com)/gumi
        let desktopVersionPrefix = /\/#/gumi
        let categoriesPrefix = /\/((song)|(album)|(playlist))/gumi
        // REPLACE
        link = link.replace(domainName, "")
        link = link.replace(desktopVersionPrefix, "")

        let result

        if (link.startsWith("/song")) {
            link = link.replace(categoriesPrefix, "")
            return main.paramsDiffer(link, "song")
        }
        else if (link.startsWith("/album")) {
            link = link.replace(categoriesPrefix, "")
            return main.paramsDiffer(link, "album")
        }
        else if (link.startsWith("/playlist")) {
            link = link.replace(categoriesPrefix, "")
            return main.paramsDiffer(link, "playlist")
        }

        return undefined
    },
    paramsDiffer: function (src, type) {
        let params = {}
        let idCheck = /^id=/gu
        let useridCheck = /userid=/gu

        if (src.startsWith("?")) {
            src = src.replace("?", "")
            if (src.includes("&")) {
                src = src.split("&")
                src.forEach(param => {
                    params["type"] = type
                    if (idCheck.test(param)) { params["id"] = parseInt(param.replace(idCheck, "")) }
                    if (useridCheck.test(param)) { params["userid"] = parseInt(param.replace(useridCheck, "")) }
                })
                return params
            }
            else if (idCheck.test(src)) {
                params["type"] = type
                params["id"] = parseInt(src.replace(idCheck, ""))
                return params
            }
        }

        else if (src.startsWith("/")) {
            src = src.replace("/", "")
            if (src.includes("/?")) {
                src = src.split("/?")
                src.forEach(param => {
                    params["type"] = type
                    if (/^\d+/gu.test(param)) { params["id"] = parseInt(param) }
                    if (useridCheck.test(param)) { params["userid"] = parseInt(param.replace(useridCheck, "")) }
                })
                return params
            }
            else if (/^(\d+)(\/)?/gu) {
                params["type"] = type
                params["id"] = parseInt(src.replace("/", ""))
                return params
            }
        }
    }
}

exports.meta = config.components.musicshare

exports.commands = {
    main: async function (ctx) {

    }
}

exports.inlines = {
    main: async function (ctx) {
        let globalUrlPattern = /((https?)?((:\/\/))?)(music.163.com)(\/(#\/)?)(song|album|playlist)((\/\d+)|(\?id=\d+))((&userid=\d+)|(\/\?userid=\d+)|(\/\d+\/(\?userid=\d+)?)|(\/\d+\/)|(\/))?/gumi
        let link = ctx.inlineQuery.query

        //get song
        let baseUrl = "https://api.yutsuki.moe/cloudmusic"

        if (globalUrlPattern.test(link)) {
            link = link.match(globalUrlPattern)[0]
            let params = main.parseArgs(link)
            if (params.type == "song") {
                Compo.Interface.Log.Log.debug(`${ctx.from.first_name} 请求歌曲来自链接: ${link}`)
                return Promise.all([
                    axios.get(baseUrl + '/song/url', { params: { id: params.id } }),
                    axios.get(baseUrl + '/song/detail', { params: { ids: params.id } })
                ]).then(resArray => {
                    let authorText = new Array()
                    let authorInfo = resArray[1].data.songs[0].ar
                    authorInfo.forEach(item => authorText.push(item.name))
                    authorText = authorText.join(" / ")
                    let resultText = resArray[1].data.songs[0].name + " - " + authorText

                    // fileid
                    let FUID = new Array()
                    for (let i = 0; i < 3; i++) {
                        FUID.push(Math.floor(Math.random() * Math.floor(9)))
                    }
                    FUID = FUID.join("")
                    FUID = "2523" + new Date().getTime() + FUID

                    // song file
                    return Promise.all([
                        // main.getSong(resArray[0].data.data[0].url, FUID),
                        // main.getAlbumPic(resArray[1].data.songs[0].al.picUrl, FUID),
                        axios.get(baseUrl + '/album', { params: { id: resArray[1].data.songs[0].al.id } })
                    ]).then(dataArray => {
                        let infoContainer = {}
                        // infoContainer["song"] = resArray[1].data.songs[0]
                        infoContainer["album"] = dataArray[0].data.album

                        let data = [{
                            type: "audio",
                            id: ctx.inlineQuery.id,
                            title: resArray[1].data.songs[0].name,
                            audio_url: resArray[0].data.data[0].url,
                            description: resultText,
                            caption: dataArray[0].data.album.name,
                            reply_markup: { inline_keyboard: [[
                                {
                                    text: "Netease CloudMusic",
                                    url: `https://music.163.com/song?id=${params.id}`
                                }
                            ]] }
                        }]
                        return data

                    }).catch(err => Compo.Interface.Log.Log.fatal(err))
                }).catch(err => {
                    err["message"] = "Component Error: Yutsuki API failed to respond the request\nProbably could be the issue of Netease, you should report this issue to the API server maintainer"
                })
            }
            else if (params.type == "album") {
                Compo.Interface.Log.Log.debug(`${ctx.from.first_name} 请求查询专辑来自链接: ${link}`)
                return await main.album(params)
            }
            else if (params.type == "playlist") {
                Compo.Interface.Log.Log.debug(`${ctx.from.first_name} 请求查询歌单来自链接: ${link}`)
            }
        }
    }
}

exports.messages = {
    main: async function (ctx) {

    }
}

exports.callbackQuery = {
    main: async function (ctx) {

    }
}

exports.register = {
    // As the example to Yawarakai Compos
    commands: [
        {
            function: 'main'
        }
    ],
    inlines: [
        {
            function: "main"
        }
    ],
    messages: [
        // {
        //     function: 'main'
        // }
    ],
    callbackQuery: [
        // {
        //     function: 'main'
        // }
    ]
}
