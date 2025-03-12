require('dotenv').config({path: '../.env'})
const CryptoJS = require("crypto-js")
const secretKey = process.env.SECRET
const encrpytUsername = process.env.ENCUSERNAME
const encrpytPassword = process.env.ENCPASSWORD
let username, password
if(encrpytUsername && encrpytPassword && secretKey) {
    username = CryptoJS.AES.decrypt(encrpytUsername, secretKey).toString(CryptoJS.enc.Utf8)
    password = CryptoJS.AES.decrypt(encrpytPassword, secretKey).toString(CryptoJS.enc.Utf8)
}
module.exports = { username, password }
