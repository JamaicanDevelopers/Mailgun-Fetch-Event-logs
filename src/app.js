const { ipcRenderer, remote } = require('electron');
const fs = require('fs-extra');
const mputils = require('./mailgun-putils.js');
const Mailgun = require('mailgun-js');


const sharedObj = remote.getGlobal('sharedObj');
const config = {
    "domain": sharedObj.CONFIG.MAILGUN_USR_DOMAIN || localStorage.getItem("MAILGUN_USR_DOMAIN"),
    "apiKey": sharedObj.CONFIG.MAILGUN_USR_APIKEY || localStorage.getItem("MAILGUN_USR_APIKEY")
}

var MicroModal = require('micromodal');
MicroModal.init();

var mailgun;
var domains = mputils.csvFinder();
var domainElement = document.querySelector("#usrDomain");
var apiKeyElement = document.querySelector("#usrApiKey");
var noticeTitle = document.querySelector("#notice-title");
var noticeMessage = document.querySelector("#notice-message");
var credform = document.querySelector("#credform");

if (config.domain) {
    domainElement.value = config.domain;
}
if (config.apiKey) {
    apiKeyElement.value = config.apiKey;
}

async function saveDataAsJSON(data, filename) {
    fse.writeJson(filename, data, err => {
      if (err) return console.error(err)
      console.log('Write to file (' + filename + ') success!');
    });
}


function setMailgun(apiKey, domain) {
    mailgun = Mailgun({ apiKey: apiKey, domain: domain });
}

function listDomains()  {
    domains = mputils.csvFinder();
}


credform.addEventListener('submit', (e) => {
    event.preventDefault();
    noticeTitle.innerHTML = "Notice";
    noticeMessage.innerHTML = "Please wait a moment...";
    MicroModal.show("notice");
    setTimeout(trigger_button, 500);
    return false;
});


function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
  }

function trigger_button() {
    var apiKey = apiKeyElement.value;
    var domain = domainElement.value;
    var config = {
        "MAILGUN_USR_DOMAIN": domain,
        "MAILGUN_USR_APIKEY": apiKey
    }
    noticeMessage.innerHTML = "Fetching logs...";
    try{
        setMailgun(apiKey, domain);
    } catch (err) {
        noticeTitle.innerHTML = "<div style='color: red'>Error!!!!</div>";
        noticeMessage.innerHTML = "<code>"+ err +"</code>";
        return false;
    }
    
    localStorage.setItem("MAILGUN_USR_DOMAIN", domain);
    localStorage.setItem("MAILGUN_USR_APIKEY", apiKey);
    var mcsvFetch = new mputils.MailgunCSVLog(mailgun, domain, apiKey);
    mcsvFetch.get_events((e) => {

        MicroModal.show("notice");
        if (e.statusCode < 300) {
            noticeTitle.innerHTML = "Notice";
            noticeMessage.innerHTML = e.statusMessage;
            sleep(3000);
            alert(e.statusMessage);
        } else {
            noticeTitle.innerHTML = "<div style='color: red'>Error!!!!</div>";
            noticeMessage.innerHTML = e.statusMessage;
        }
    });
    return false;
}