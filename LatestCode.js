//replaced
const version = "4.1"; //version of this code
const date = "12/08/23";
const containData = false;
const fullscreen = false;

/*
The documentation of the function is on GitHub and iMarkdown.

<button function list>
0 = speak           1 = search web
2 = show website    3 = show mean
4 = hide mean       5 = back
6 = next
*/

const fm = FileManager.local();
const path= fm.bookmarkedPath("LEAP.json");
const jsonText = fm.readString(path);
const data = JSON.parse(jsonText);

let table = new UITable();

await checkVersion(); //what's new

let Input;
Input = [true, String(args.shortcutParameter)];

if(Input[1] == "null"){ //string型になってるいるので""が必要
  Input = await MakeAlert(
    "text",
    ["検索🔍","番号, 単語, 意味または範囲を入力。\n範囲指定方法(開始, 終了)"],
    {n1:"OK", n2:"Menu", c3:"Cancel"},
    ["単語 or 番号...", null]);
}
console.log(`mode [${Input}]`)

let IsNum = /^\d+$/;
if(Input[0] && Input[1] != ""){ //テキスト入力真 & 空白ではない
  Input = Input[1].toLowerCase(); //小文字化 & 配列から文字列化
  //数字
  if(IsNum.test(Input)){
    number(parseInt(Input));
  //範囲
  } else if(Input.includes(",") || Input.includes("、")){
    let temp, start, end;
    temp = await ConvRange(Input);
    start = temp[0];
    end = temp[1];
    if(temp){
      let mode = await MakeAlert(
        "sheet",
        ["表示方法を選択", `No.${start} ~ ${end} の単語を表示します。`],
        {n1:"すべて表示", n2:"ランダムに問題を出題", c3:"cancel"}, []);
      
      switch(mode[1]){
        case 0:
          range(start, end); break;
        case 1:
          var List = [];
          var range = end - start +1;
          var now = 0;
          quiz(start, end);
          break;
      } 
    }
  //単語
  } else{
    word(Input);
  }
} else if(!Input[0] && Input[1] == 1){
  const selected = await MakeAlert(
    "sheet",
    ["Menu", null],
    {n1:"新バージョンの確認", n2:"アップデート履歴", n3:"使い方を見る", c4:"Cancel"},
    []);
  switch(selected[1]){
    case 0:
      checkLatestVer();
      break;
    case 1:
      versionHis();
      break;
    case 2:
      help();
      break;
  }
} else{
  //cancel action
}
Script.complete();
//========================================
async function CheckRange(num){
  if(num < 1 || num > 1935){
    await MakeAlert(
      "alert",
      ["⚠️Error", "範囲外の数値です。\n1〜1935の範囲内で指定してください。"],
      {n1:"OK"}, []);
    return false;
  } else {
    return true;
  }
}

async function ConvRange(Input){
  Input = Input.replace(/ /g, "");
  Input = Input.replace(/　/g, "");
  let idx;
  if(Input.includes(",")){
    idx = Input.indexOf(",");
  } else{
    idx = Input.indexOf("、");
  }
  let start, end;
  start = parseInt(Input.slice(0, idx));
  end = parseInt(Input.slice(idx+1, Input.length));
  if(end < start){  //範囲逆転
    let temp = start;
    start = end;
    end = temp;
  }
  if(await CheckRange(start) && await CheckRange(end)){
    return [start, end];
  } else{
    return false;
  }
}
//========================================
// 入力値:番号
async function number(Input){
  if(await CheckRange(Input)){
    let temp = [(data[Input-1][0]), data[Input-1][1]];
    MakeBlock(Input, temp[0], temp[1], false);
    table.present(fullscreen);
  }
}
// 入力値:範囲全表示
function range(start, end){
  for(let i = start-1; i < end; i++){
    MakeBlock(
      i + 1,
      data[i][0],
      data[i][1],
      true);
  }
  MakeRow({tr1:[[null, false, null, 0], [`${end-start+1} 単語`, false, null, 15]]},
    [false, false, null], 70, null);
  table.present(fullscreen);
}

// 入力値:ランダム出題
function quiz(start, end){
  getRandList(start, end);
  table.present(fullscreen);
  QuizReload(-1);
}
// 入力値:単語
function word(Input){
  let flg = false;
  let count = 0;
  for(let i=0; i<1935; i++){
    if(data[i][0] == Input){
      flg = true;
      MakeBlock(i+1, data[i][0], data[i][1], false);
      MakeRow({br1:["Webで検査🔍", 1]},
        [false, false, null], 70, null);
      break;
    } else{
      for(let mean of (data[i][1])){
        if(mean.includes(Input)){
          flg = true;
          count++
          MakeBlock(i+1, data[i][0], data[i][1], true);
          break;   //2重検知防止
        }   //if
      }   //for
    }   //if_else
  }   //for
  
  if(!flg){
    MakeRow({tl1:[["検索結果なし", true, null, 20], [`\n"${Input}" は、見出し語に見つかりませんでした。`, false, null, 15]]},
      [false, false, null], 100, null);
    MakeRow({br1:["かわりにWebで検索🔍", 1]},
      [false, false, null], 90, null);
  } else if(count != 0){
    MakeRow({tr1:[[null, false, null, 0], [`${count} 単語ヒット`, false, null, 15]]},
      [false, false, null], 80, null);
    MakeRow({br1:["Webで検索🔍", 1]},
      [false, false, null], 100, null);
  }
  table.present(fullscreen);
}
// help
function help(){
  const help = getHelp();
  MakeRow({tl1:[["<使い方⚙️>", true, null, 30], [null, false, null, 0]]},
    [false, false, null], 50, null);
  for(let item in help){
    if(item != "version"){
      MakeRow({tl1:[[item, true, null, 20], [help[item], false, null, 14]]},
        [true, false, null], 120, null);
    } else{
      MakeRow({tl1:[[null, false, null, 0], [help[item], false, null, 12]]},
        [false, false, null], 100, null);
    }
  }
  table.showSeparators = true;
  table.present(fullscreen);
}
//===========Button action================
async function BtnWeblio(){
  table.removeAllRows();
  MakeRow({tl1:[["検索中...", true, null, 20], ["インターネットに接続してください...", true, null, 15]]},
    [false, false, null], 100, null);
  table.reload();
  let wordInURL = Input.replace(/ /g, "+");
  let url = `https://ejje.weblio.jp/content/${wordInURL}`;
  let data = new Request(url);
  let html = await data.loadString();
  
  const FormCheck = [
    `<meta name="description" content="「${Input}」の意味・翻訳・日本語 -`,
    `<meta name="description" content="｢${Input}｣は英語でどう表現する？`,
    `<meta name="description" content="${Input}を英語で訳すと`,
    `<meta name="description" content="${Input}の意味や使い方`,
    `<meta name="description" content="${Input}`];
  const Format = [
    `<meta name="description" content="「${Input}」の意味・翻訳・日本語 - (.*?)｜Weblio英和・和英辞書">`,
    `<meta name="description" content="｢${Input}｣は英語でどう表現する？(.*?) - 1000万語以上収録！英訳・英文・英単語の使い分けならWeblio英和・和英辞書">`,
    `<meta name="description" content="${Input}を英語で訳すと (.*?) - 約865万語ある英和辞典・和英辞典。発音・イディオムも分かる英語辞書。">`,
    `<meta name="description" content="${Input}の意味や使い方 (.*?) - 約865万語ある英和辞典・和英辞典。発音・イディオムも分かる英語辞書。">`,
    `<meta name="description" content="${Input}(.*?)- 1000万語の英語の意味を収録！Weblio英和・和英辞書">`];
  
  let mean = false;
  let i;
  for(i = 0; i < FormCheck.length; i++){
    if(html.includes(FormCheck[i])){
      mean = html.match(Format[i]);
      break;
    }
  }
  if(!mean) mean = [null, "見つかりませんでした。"];
  //matchしたけれど空白だった場合
  if(mean[1].replace(/ /g, "") == "") mean = [null, "見つかりませんでした。"];
  mean = mean[1].replace(/【/g, "\n【");
  mean = mean.replace(/、/g, "\n");
  mean = mean.replace(/,/g, "\n");
  mean = mean.split("\n");
  table.removeAllRows();
  MakeBlock(" [Not LEAP]", Input, mean, true);
  MakeRow({tr1:[[null, false, null, 0], ["Weblio英和和英辞典より。", false, null, 16]]},
    [false, false, null], 60, null);
  MakeRow({tl1:[[null, false, null, 0], [`HTML format : ${i + 1}`, false, null, 10]],
    br1:["サイトを表示する", 2]},
    [false, false, null], 50, null);
  table.reload();
}

function BtnSpeak(word){
  Speech.speak(word);
}

function BtnOpenSite(){
  let wordInURL = Input.replace(/ /g, "+");
  let url = `https://ejje.weblio.jp/content/${wordInURL}`;
  Safari.openInApp(url, false);
}

function QuizReload(mode){
  let RandList = getRandList();
  let mean = ["答えを表示"];
  mean = mean.concat(Array(5).fill(null));
  switch(mode){
    case 1:
      if(now < RandList.length-1) now++; //next
      break;
    case -1:
      if(now > 0) now--; //back
      break;
    case "show":
      mean = data[RandList[now]-1][1];
      mean = mean.concat(Array(6-(data[RandList[now]-1][1]).length).fill(null));
      break;
    case "hide":
      mean = ["答えを表示"];
      mean = mean.concat(Array(5).fill(null));
      break;
  }
  table.removeAllRows();
  MakeRow({}, [false, false, null], 50, null)
  MakeRow({tl1:[[`${now+1}/${range} 問目`, false, null, 20], [null, false, null, 0]], tr2:[[null, false, null, 0], [`${Math.round((now+1)/range * 100)} %`]]},
    [false, false, null], 15, null);
  MakeRow({ic2:[Progress(range, now+1)]},
    [false, false, null], 30, null);
  MakeBlock(RandList[now], data[RandList[now]-1][0], mean, false);
  MakeRow({bl1:["◀︎Back", 5], br2:["Next▶︎", 6]},
    [false, false, null], 100, null);
  table.reload();
}


function ChoseFunction(id, word){
  switch(id){
    case 0:
      BtnSpeak(word); break;
    case 1:
      BtnWeblio(); break;
    case 2:
      BtnOpenSite(); break;
    case 3:
      QuizReload("show"); break;
    case 4:
      QuizReload("hide"); break;
    case 5:
      QuizReload(-1); break;
    case 6:
      QuizReload(1); break;
  }
}

//========================================
async function MakeAlert(mode, message, action, txtValue){
  let alert = new Alert();
  alert.title = message[0];
  alert.message = message[1];
  for(let item in action){
    if(action.hasOwnProperty(item)){
      switch(item[0]){
        case "n":
          alert.addAction(action[item]);
          break;
        case "c":
          alert.addCancelAction(action[item]);
          break;
        case "d":
          alert.addDestructiveAction(action[item]);
          break;
      } //switch
    } //if
  } //for
  let idx;
  if(mode == "sheet"){
    idx = await alert.presentSheet();
  } else{
    if(mode == "text"){
      alert.addTextField(txtValue[0], txtValue[1]);
    }
    idx = await alert.presentAlert();
  }
  if(idx == -1){
    return [false, "cancel"];
  } else if(idx == 0 && mode == "text"){
    return [true, alert.textFieldValue(0)];
  } else{
    return [false, idx];
  }
}

function MakeRow(dic, select, height, background){
              //({}, [],      int,   str)
  let row = new UITableRow();
  for(let item in dic){
    if(dic.hasOwnProperty(item)){
      let content;
      switch(item[0]){ //追加コンテント
        case "t":
          content = row.addText(dic[item][0][0], dic[item][1][0]);
          let titFont = (dic[item][0][1] ? "Arial-BoldMT" : "ArialMT");
          let subFont = (dic[item][1][1] ? "Arial-BoldMT" : "ArialMT");
          if(dic[item][0][3] != null){content.titleFont = new Font(titFont, dic[item][0][3]);}
          if(dic[item][1][3] != null){content.subtitleFont = new Font(subFont, dic[item][1][3]);}
          if(dic[item][0][2] != null){content.titleColor = new Color(dic[item][0][2]);}
          if(dic[item][1][2] != null){content.subtitleColor = new Color(dic[item][1][2]);}
          break;
        case "b":
          content = row.addButton(dic[item][0]);
          content.onTap = () => {
            let word;
            if(dic.hasOwnProperty("tl1")){
              word = dic.tl1[0][0];
            }
            ChoseFunction(dic[item][1], word);
          };
          content.dismissOnTap = dic[item][2];
          break;
        case "i":
          content = row.addImage(dic[item][0]);
          break;
      } //switch1
      switch(item[1]){  //ポジション
        case "l":
          content.leftAligned(); break;
        case "r":
          content.rightAligned(); break;
        case "c":
          content.centerAligned(); break;
        case "n":
          break;
      } //switch2
    } //if
  } //for
  row.height = height;
  if(background != null){ //色指定がある場合
    row.backgroundColor = new Color(background);
  }
  if(select[0]){
    row.onSelect = () => {
      ChoseFunction(select[2], null);
    };
    row.dismissOnSelect = select[1];
  }
  table.addRow(row);
}

function MakeBlock(num, word, mean, sep){
  let withNum = [];
  for(let i=0; i<mean.length; i++){
    if(mean[i]){ // nullではない場合
      if(mean[i] != "答えを表示"){
        withNum.push(`${i+1}, ${mean[i]}`);
      } else{
        withNum.push(mean[i]);
      }
    }
  }
  MakeRow({tl1:[[`No.${num}`, false, null, 19], [null, false, null, 0]]},
    [false, false, null], 10, null);
  MakeRow({tl1:[[`  ${word}`, true, null, 20], [null, false, null, 0]],
    bn2:["🔊Speak", 0]},
    [false, false, null], 50, null);
  MakeRow({tl1:[[null, false, null, 0], [withNum.join("\n"), false, null, 15]]},
    [mean[0]=="答えを表示", false, 3], mean.length*30, null);
  if(sep){
    MakeRow({tc1:[[null, false, null, 0], ["-".repeat(50), false, "#858585", null]]},
      [false, false, null], 30, null);
    MakeRow({}, [false, false, null], 30, null);
  }
}

//========================================
function getRandList(start, end){
  if(start != null){
    List = Array.from({ length: end-start+1 }, (_, index) => index + start);
    for(let i=List.length-1; i>0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [List[i], List[j]] = [List[j], List[i]]; //シャッフル
    }
  }
  return List;
}

function Progress(total, havegone){
  const context = new DrawContext();
  context.size = new Size(500, 5);
  context.opaque=false;
  context.respectScreenScale=true;
  for(let i=0; i<2; i++){
    let backC = (Device.isUsingDarkAppearance() ? "#474747" : "#C2C2C2");
    let color = (i==0 ? backC : "#3A80F3");
    let wid = (i==0 ? 500 : 500*havegone/total);
    context.setFillColor(new Color(color));
    const path = new Path();
    path.addRoundedRect(new Rect(0, 0, wid, 5), 3, 2);
    context.addPath(path);
    context.fillPath();
  }
  return context.getImage()
}

//========================================
function getHelp(){
  const help = {
    "✔︎ 単語検索" :"LEAPの番号、単語を入力して調べる。",
    "✔︎ 意味から検索" :"単語の意味から検索する。検索結果は当てはまる意味を含む単語が一覧で表示される。",
    "✔︎ 範囲を指定して表示する" :"表示したい範囲の初めと終わりの番号を「,」「、」のどちらかで区切って入力する。\n  例) 400, 1000",
    "✔︎ 発音を確認する" :"単語右の「🔊Speak」ボタンをタップして発音を確認。",
    "✔︎ ︎Webから検索" :"単語を検索し、右下の「Webで検索🔍」を選ぶことでインターネットから意味を検索できる。「サイトを表示する」をタップすると、Webページを確認できる。",
    "✔︎ 暗記テスト" :"範囲を入力し、「ランダムに出題」を選択すると、範囲内の単語をクイズ形式で確認できる。[答えを表示]をタップして意味を表示する。",
    version :`ver : ${version}\nDate : ${date}\ncontain json : ${containData}`};
  return help;
}

async function checkVersion(){
  const firstRunKey = "version4.0";  //使用済みのキー
  if(!Keychain.contains(firstRunKey)) {
    const newThing = [
    "✔︎ ランダム出題で進捗バーが表示されるようになりました。",
    "✔︎ SiriShortcutからの入力で番号からの検索ができないバグを修正しました。",
    "✔︎ ランダム出題でボタンの高さが単語によって変わってしまうバグを修正しました。",
    "✔︎ 一部のUIを変更しました。",
    "✔︎ LEAP辞書データの修正によりデータサイズを軽減しました。"];
    MakeRow({tl1:[["What's New✨", true, null, 40], [null, false, null, 10]]},
      [false, false, null], 60, null);
    for(let item of newThing){
      MakeRow({tl1:[[null, false, null, 0], [item, false, null, 15]]},
        [false, false, null], 60, null);
    }
    MakeRow({tr1:[[null, false, null, 0], ["この内容はいつでも\n[使い方を見る] → [Version history]\nから確認することができます。"]]},
      [false, false, null], 350, null);
    Keychain.set(firstRunKey, "true");
    await table.present(false)
    table.removeAllRows();
  }
  //Keychain.remove(firstRunKey);
}

function versionHis(){
  const versionHistory = {
  "v4.0": "1. ランダム出題で進捗バーの表示。\n2. ランダム出題でボタンの位置固定化。\n3. JSONの修正によりデータ軽減。\n4. SiriShortcutからの数字入力で発生するエラーの修正。\n5. 一部のUI、その他マイナーなアップデート。\n\n\n\ndate: 12/08/23",
  "v3.2": "1. 辞書データの誤字の修正。\n\n\ndate: 10/24/23",
  "v3.1": "1. 単語の意味が長文の場合に表示が見切れるバグの修正。\n\n\ndate: 10/15/2",
  "v3.0": "1. 範囲を指定してランダムに問題を表示。\n\n\ndate: 10/15/23",
  "v2.1": "1. 表示可能なWeblioのHTMLフォーマット追加。\n\n\ndate: 10/04/23",
  "v2.0": "1. 単語見出しの強調表示\n2. 掲載のない単語をWeblioから検索。\n\n\ndate: 10/03/23",
  "v1.4": "1. SiriShortcutからの入力に対応。\n2. 大文字を含む入力に対応。\n\n\ndate: 10/01/23",
  "v1.3": "1. 検索ヒット数の表示、versionの確認。\n\n\ndate: 09/28/23",
  "v1.2": "1. 起動時に使い方, ヘルプの表示。\n\n\ndate: 09/27/23",
  "v1.1": "1. 日本語入力で意味からの検索に対応。\n\n\ndate: 09/27/23",
  "v1.0": "1. 単語, 番号, 範囲から検索。\n\n\ndate: 09/26/23"
}
  const checkVersionTable = new UITable();
  for(let item in versionHistory){
    const row = new UITableRow();
    row.addText(item, versionHistory[item]);
    row.height = versionHistory[item].split("\n").length * 30;
    checkVersionTable.addRow(row);
  }
  checkVersionTable.showSeparators = true;
  checkVersionTable.present(false);
}

async function checkLatestVer(){
  const verUrl  = "https://raw.githubusercontent.com/AtomS1101/LEAPnewCode_public/main/LatestVersion.txt";
  const codeUrl = "https://raw.githubusercontent.com/AtomS1101/LEAPnewCode_public/main/LatestCode.js";
  const data = new Request(verUrl);
  const latestVer = String(await data.loadString());
  console.log("latest : " + latestVer);
  console.log("this code: "+ version);
  
  if(latestVer != version){
    let acceptUpdate = await MakeAlert(
      "alert",
      ["新しいバージョンがあります!", `新しいバージョン: ${latestVer}\n今すぐアップデートしますか？\nアップデートは数秒で終わります。`],
      {n1:"今すぐアップデート", n2:"後で"}, []);
    if(acceptUpdate[1] == 0){
      const codeData = new Request(codeUrl);
      const codeString = await codeData.loadString();
      const fm = FileManager.local();
      //fm.writeString(module.filename, codeString);
      await MakeAlert(
        "alert",
        ["アップデートが正常にされました。", `バージョン: ${latestVer}\nコードを開いている場合はDoneをタップして閉じてください。`],
        {c1:"OK"}, []);
    }
  } else{
    await MakeAlert(
      "alert",
      ["バージョンは最新です。", `バージョン: ${version}`],
      {c1:"OK"}, []);
  }
}

// data here