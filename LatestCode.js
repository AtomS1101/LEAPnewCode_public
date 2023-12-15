//replaced
const verUrl = "https://raw.githubusercontent.com/AtomS1101/LEAPnewCode_public/main/LatestVersion.txt";
const codeUrl= "https://raw.githubusercontent.com/AtomS1101/LEAPnewCode_public/main/LatestCode.js";
const data = new Request(verUrl);
const latestVer = await data.loadString();
console.log(latestVer);

const codeData = new Request(codeUrl);
const codeString = await codeData.loadString();

const fm = FileManager.local();
fm.writeString(module.filename, codeString);