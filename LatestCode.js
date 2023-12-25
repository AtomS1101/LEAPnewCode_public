// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: language;
const version = "4.2";
const date = "12/25/23";
const containData = true;
const fullscreen = false;
/*
The documentation of the function is on GitHub and iMarkdown.
*/
const fm = FileManager.local();

const data = getJSON();

let Input;
const table = new UITable();

await checkVersion(); //what's new
Input = [true, String(args.shortcutParameter)]; //ShortCutからの入力
if(args.widgetParameter == "leap"){
  Input = [true, String(getRandomNum())];
}

if(!config.runsInWidget){ //アプリから実行
  if(Input[1] == "null"){ //string型になってるいるので""が必要
    Input = await MakeAlert(
      "text",
      ["検索🔍","番号, 単語, 意味または範囲を入力。\n範囲指定方法(開始, 終了)"],
      {n1:"OK", n2:"Menu", c3:"Cancel"},
      ["単語 or 番号...", null]
    );
  }
  console.log(`mode [${Input}]`);
} else{ //widgetから実行
  showWidget();
  Input =  [false, "cancel"];
}

const IsNum = /^\d+$/;
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
      const mode = await MakeAlert(
        "sheet",
        ["表示方法を選択", `No.${start} ~ ${end} の単語を表示します。`],
        {n1:"すべて表示", n2:"ランダムに問題を出題", c3:"cancel"}, []
      );
      switch(mode[1]){
        case 0:
          range(start, end); break;
        case 1:
          var List = [];
          var range = end - start +1;
          var now = 0;
          quiz(start, end);
          break;
      } //switch
    } //if
  //単語
  } else{
    word(Input);
  }
} else if(!Input[0] && Input[1] == 1){
  const selected = await MakeAlert(
    "sheet",
    ["Menu", null],
    {n1:"アップデートの確認", n2:"バージョン履歴", n3:"アプリの詳細", n4:"使い方を見る", c4:"Cancel"},
    []
  );
  switch(selected[1]){
    case 0:
      checkLatestVer();
      break;
    case 1:
      versionHis();
      break;
    case 2:
      showDetail();
      break;
    case 3:
      showHelp();
      break;
  }
} else{
  //cancel action
}
// Script.complete();
//========================================
async function CheckRange(num){
  if(num < 1 || num > 1935){
    await MakeAlert(
      "alert",
      ["⚠️Error", "範囲外の数値です。\n1〜1935の範囲内で指定してください。"],
      {n1:"OK"}, []
    );
    return false;
  } else {
    return true;
  }
}

async function ConvRange(Input){
  Input = Input.replace(/ /g, "");
  Input = Input.replace(/　/g, "");
  const idx = (Input.includes(",") ? Input.indexOf(",") : Input.indexOf("、"));
  let start, end;
  start = parseInt(Input.slice(0, idx));
  end = parseInt(Input.slice(idx+1, Input.length));
  if(end < start){  //範囲逆転
    const temp = start;
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
    MakeBlock(
      Input,
      temp[0],
      temp[1],
      false
    );
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
      true
    );
  }
  MakeRow(
    {tr1:[[null, false, null, 0], [`${end-start+1} 単語`, false, null, 15]]},
    [false, false, null], 70, null
  );
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
      MakeBlock(
        i+1,
        data[i][0],
        data[i][1],
        false
      );
      MakeRow(
        {br1:["Webで検査🔍", 1]},
        [false, false, null], 70, null
      );
      break;
    } else{
      for(let mean of (data[i][1])){
        if(mean.includes(Input)){
          flg = true;
          count++
          MakeBlock(
            i+1,data[i][0],
            data[i][1],
            true
          );
          break;   //2重検知防止
        }   //if
      }   //for
    }   //if_else
  }   //for
  
  if(!flg){
    MakeRow(
      {tl1:[["検索結果なし", true, null, 20], [`\n"${Input}" は、見出し語に見つかりませんでした。`, false, null, 15]]},
      [false, false, null], 100, null
    );
    MakeRow(
      {br1:["かわりにWebで検索🔍", 1]},
      [false, false, null], 90, null
    );
  } else if(count != 0){
    MakeRow(
      {tr1:[[null, false, null, 0], [`${count} 単語ヒット`, false, null, 15]]},
      [false, false, null], 80, null
    );
    MakeRow(
      {br1:["Webで検索🔍", 1]},
      [false, false, null], 100, null
    );
  }
  table.present(fullscreen);
}

//===========Button action================
async function BtnWeblio(){
  table.removeAllRows();
  MakeRow(
    {tl1:[["検索中...", true, null, 20], ["インターネットに接続してください...", false, null, 15]]},
    [false, false, null], 100, null
  );
  table.reload();

  const url = `https://ejje.weblio.jp/content/${Input.replace(/ /g, "+")}`;
  const data = new Request(url);
  const html = await data.loadString();
  const FormatType = [
    "content-explanation  ej",
    "content-explanation  je",
    "bubble"
  ];
  let mean;
  for(let className of FormatType){
    const format = `<span class="${className}">`;
    if(html.includes(format)){
      if(className == "bubble"){
        mean = [null, "見出し後に見つかりませんでした。"];
        break;
      }
      const formatType = `${format}\n(.*?)<`;
      mean = await html.match(formatType);
      break;
    }
  }
  mean = mean[1].replace(/ /g, "");
  mean = mean.replace(/;/g, "/");
  mean = mean.replace(/、/g, "/");
  mean = mean.split("/");
  table.removeAllRows();
  MakeBlock(
    " [Not LEAP]",
    Input,
    mean,
    true
  );
  MakeRow(
    {tr1:[[null, false, null, 0], ["Weblio英和和英辞典より。", false, null, 13]]},
    [false, false, null], 40, null
  );
  MakeRow(
    {br1:["サイトを表示する", 2]},
    [false, false, null], 50, null
  );
  table.reload();
}

function BtnSpeak(word){
  Speech.speak(word);
}

function BtnOpenSite(){
  const url = `https://ejje.weblio.jp/content/${Input.replace(/ /g, "+")}`;
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
  const row = new UITableRow();
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
      withNum.push(mean[i]!="答えを表示" ? `${i+1}, ${mean[i]}` : mean[i]);
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
    const backC = (Device.isUsingDarkAppearance() ? "#474747" : "#C2C2C2");
    const color = (i==0 ? backC : "#3A80F3");
    const wid = (i==0 ? 500 : 500*havegone/total);
    context.setFillColor(new Color(color));
    const path = new Path();
    path.addRoundedRect(new Rect(0, 0, wid, 5), 3, 2);
    context.addPath(path);
    context.fillPath();
  }
  return context.getImage()
}

//========================================
function showHelp(){
  const help = {
    "✔︎ 単語検索" :"LEAPの番号、単語を入力して調べる。",
    "✔︎ 意味から検索" :"単語の意味から検索する。検索結果は当てはまる意味を含む単語が一覧で表示される。",
    "✔︎ 範囲を指定して表示する" :"表示したい範囲の初めと終わりの番号を「,」「、」のどちらかで区切って入力する。\n  例) 400, 1000",
    "✔︎ 発音を確認する" :"単語右の「🔊Speak」ボタンをタップして発音を確認。",
    "✔︎ ︎Webから検索" :"単語を検索し、右下の「Webで検索🔍」を選ぶことでインターネットから意味を検索できる。「サイトを表示する」をタップすると、Webページを確認できる。",
    "✔︎ 暗記テスト" :"範囲を入力し、「ランダムに出題」を選択すると、範囲内の単語をクイズ形式で確認できる。[答えを表示]をタップして意味を表示する。",
    "✔︎ widget" :"step1:\n ホーム画面編集の画面にする。\n\nstep2:\n プラスボタンを押してscriptableアプリのwidgetを追加。\n\nstep3:\n 編集画面のままwidgetをタッチし、scriptからLEAPを選択。\n\nstep4:\n 下の項目から「Run script」を選択し、Parameterに小文字で「leap」と入力。"
  };
  MakeRow({tl1:[["<使い方⚙️>", true, null, 30], [null, false, null, 0]]},
    [false, false, null], 50, null);
  for(let item in help){
    if(item != "version"){
      MakeRow({tl1:[[item, true, null, 20], [help[item], false, null, 14]]},
        [true, false, null], help[item].length + 90, null);
    }
  }
  table.showSeparators = true;
  table.present(false);
}

async function checkVersion(){
  const firstRunKey = `version${version}`;  //使用済みのキー
  if(!Keychain.contains(firstRunKey)) {
    const newThing = [
    "✔︎ Menuにアプリ詳細画面を追加しました。",
    "✔︎ ホームのwidgetからバージョンと、ランダムな単語を確認できるようになりました。\nparameterには小文字半角で「leap」と入力してください。",
    "✔︎ その他マイナーなアップデート。"];
    MakeRow({tl1:[["What's New✨", true, null, 40], [null, false, null, 10]]},
      [false, false, null], 60, null);
    for(let item of newThing){
      MakeRow({tl1:[[null, false, null, 0], [item, false, null, 15]]},
        [false, false, null], 60, null);
    }
    MakeRow({tr1:[[null, false, null, 0], ["この内容はいつでも\n[Menu] → [バージョン履歴]\nから確認することができます。", false, null, 0]]},
      [false, false, null], 350, null);
    Keychain.set(firstRunKey, "true");
    await table.present(false);
    table.removeAllRows();
  }
  //Keychain.remove(firstRunKey);
}

async function versionHis(){
  const historyURL = "https://raw.githubusercontent.com/AtomS1101/LEAPnewCode_public/main/VersionHistory.json";
  const historyData = new Request(historyURL);
  const versionHistory = await historyData.loadJSON();
  const sortedObject = Object.fromEntries(
    Object.entries(versionHistory).sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
  );
  for(let item in sortedObject){
    const height = versionHistory[item][1].split("\n").length * 40;
    MakeRow(
      {tl1:[[item, false, null, 17], [null, false, null, 15]],
      tr2:[[null, false, null, 0], [versionHistory[item][0], false, null, 15]]},
      [false, false, null], 30, null
    );
    MakeRow(
      {tl1:[[item, false, null, 0],[versionHistory[item][1], false, null, 15]],},
      [false, false, null], height, null
    );
    MakeRow(
      {tc1:[[null, false, null, 0], ["-".repeat(53), false, "#606060", null]]},
      [false, false, null], 20, null
    );
  }
  table.present(false);
}

async function showDetail(){
  const detail = {
    "App Version":version,
    "Updated day":date,
    "LEAP data included":containData,
    "Size":`${await FileManager.local().fileSize(module.filename)} KB`,
    "Length of code":`${
      (await FileManager.local().readString(module.filename)).length
    } characters`
  }
  for(let item in detail){
    MakeRow({tl1:[[item, true, null, 17], [null, false, null, 0]],
      tr2:[[`${detail[item]}`, false, null, 17], [null, false, null, 0]]},
      [false, false, null], 50, null);
  }
  table.showSeparators = true;
  table.present(false);
}

async function checkLatestVer(){
  const latestVer = await checkRequest();
  
  if(latestVer[1]){
    let acceptUpdate = await MakeAlert(
      "alert",
      ["新しいバージョンがあります!", `新しいバージョン: v${latestVer[0]}\n今すぐアップデートしますか？\nアップデートは数秒で終わります。`],
      {n1:"今すぐアップデート", n2:"後で"}, []
    );
    if(acceptUpdate[1] == 0){
      await MakeAlert(
        "alert",
        ["", "インターネットに接続してください。\n途中で接続を切ったりアプリを閉じたりしないでください。"],
        {n1:"OK"}, []
      );
      const codeUrl = "https://raw.githubusercontent.com/AtomS1101/LEAPnewCode_public/main/LatestCode.js";
      const codeData = new Request(codeUrl);
      const codeString = await codeData.loadString();
      fm.writeString(module.filename, codeString);
      await MakeAlert(
        "alert",
        ["アップデートが正常に行われました。", `バージョン: ${latestVer[0]}\nコードを開いている場合は閉じてください。`],
        {c1:"OK"}, []
      );
    }
  } else{
    await MakeAlert(
      "alert",
      ["バージョンは最新です。", `バージョン: ${version}`],
      {c1:"OK"}, []
    );
  }
}

async function checkRequest(){
  const verUrl  = "https://raw.githubusercontent.com/AtomS1101/LEAPnewCode_public/main/LatestVersion.txt";
  const req = new Request(verUrl);
  const latestVer = await req.loadString();
  console.log("latest : " + latestVer);
  console.log("this code: "+ version);
  return [latestVer, (parseFloat(latestVer) > parseFloat(version) ? true : false)];
}
//========================================
function getRandomNum(){
  const date = String(new Date()).slice(0, 18);
  const seed = Array.from(date).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const x = Math.sin(seed+1) * 10000;
  return Math.floor((x - Math.floor(x)) * (1935)) + 1;
}

async function showWidget(){
  const widget = new ListWidget();
  const latestVer = await checkRequest();
  
  const textColor = new Color("#FFFFFF");
  const shadow = 3;
  widget.addSpacer(15);
  const randNum = getRandomNum();
  const selected = data[randNum-1][0];
  const num  = widget.addText(` No.${randNum}`);
  const word = widget.addText(`   ${selected}`);
  const ans  = widget.addText(" 意味を確認する");
  num.font = Font.mediumMonospacedSystemFont(15);
  num.textColor = textColor;
  num.shadowRadius = shadow;
  word.font = Font.mediumMonospacedSystemFont(-(5/3)*selected.length + 32);
  word.textColor = textColor;
  word.shadowRadius = shadow;
  ans.font = Font.mediumMonospacedSystemFont(13);
  ans.textColor = new Color("#B0B0B0");
  ans.shadowRadius = shadow;
  
  const mainStack = widget.addStack();
  mainStack.size = new Size(140, 90); //バージョン表示域

  const canvas = new DrawContext(); //図形用意
  const path = new Path();
  path.addRoundedRect(
    new Rect(9, 15, 280, 140),
    30, 30
  );
  canvas.size = new Size(300, 170);
  canvas.opaque = false;
  canvas.addPath(path);
  canvas.setFillColor(new Color("#FFFFFF", 0.08));
  canvas.fillPath();
  if(latestVer[1]){
    const badge = new Path(); //通知バッジ
    badge.addRoundedRect(
      new Rect(250, 0, 50, 50),
      25, 25
    );
    canvas.addPath(badge);
    canvas.setFillColor(new Color("#EB4E3D"));
    canvas.fillPath();
    canvas.setTextColor(new Color("#FFFFFF"));
    canvas.setFontSize(40);
    canvas.drawText("1", new Point(265, 0));
  }
  const content = (latestVer[1] ?
  `新しいバージョンが\nあります。\nLatest version : v${latestVer[0]}` : "バージョンは最新です。");
  canvas.setTextColor(new Color("#FFFFFF"));
  canvas.setFontSize(27);
  canvas.drawText(content, new Point(20, 28));
  mainStack.addImage(canvas.getImage());

  const gradient = new LinearGradient();
  gradient.colors = [
    new Color("#777777"),
    new Color("#202020")
  ];
  gradient.locations = [0, 1];
  widget.backgroundGradient = gradient;
  Script.setWidget(widget);
//   widget.presentSmall();
  Script.complete();
}

function getJSON(){
  const dic = [["agree",["[自]賛成する","(主語の中で)意見が一致する","(with ～)(気候,食べ物が)(～に)合う"]],["oppose",["[他]～に反対する"]],["advise",["[他]～に忠告する"]],["tip",["[名]助言,ヒント","チップ","(足や山などの)先,先端(いずれも<可算>)"]],["discuss",["[他]～について話し合う,議論する","～を話題に出す"]],["blame",["[他]～に責任があるとする"]],["argue",["[他](that S V)～と主張する","[自](with ～)(～と)言い争う"]],["claim",["[他](that S V)～と主張する","～を要求する,主張する","[名]主張,要求"]],["complain",["[自]文句を言う,苦情を言う","(of ～)(病気などを)訴える"]],["offer",["[他]～を申し出る","[名]申し出","値引き"]],["suggest",["[他]～を示唆する","～を提案する"]],["recommend",["[他]～を推薦する,勧める"]],["grateful",["[形]感謝している"]],["apologize",["[自](to ～)(～に)謝る"]],["excuse",["[名]言い訳","[他]～を許す","(A from B)(B からA)を免除する"]],["celebrate",["[他]～を祝う","(儀式など)を挙行する,執り行なう"]],["admire",["[他]～に感心する,称賛する"]],["impress",["[他]～に感銘を与える,～を感心させる"]],["award",["[名]賞","[他]～を授与する"]],["describe",["[他]～を説明する"]],["explain",["[他]～を説明する"]],["communicate",["[自](with ～)(～と)意思の疎通をはかる","[他]～を伝える"]],["express",["[他](意見,気持ち)を表現する","[名]急行(列車,バス)"]],["promise",["[名]約束","[他]～を約束する"]],["information",["[名]情報<不可算>"]],["technology",["[名](科学)技術"]],["research",["[名](学術)研究","[他]～を研究する"]],["material",["[名]材料,生地","資料,教材","[形]物質的な","重大な"]],["artificial",["[形]人工的な"]],["electric",["[形]電気の,電動の"]],["invent",["[他]～を発明する","(話など)をでっち上げる"]],["discover",["[他]～を発見する","(that S V)～を知る,～に気がつく","(知るという意味で)～に出会う"]],["develop",["[自]発達する","[他]～を発達させる","～を開発する","(話,考え)を発展させる","(病気)にかかる"]],["skill",["[名]技術,力"]],["ability",["[名]能力"]],["talent",["[名]才能"]],["effort",["[名]努力"]],["practice",["[名]練習","実践","慣習","[他]～を練習する","～を実践する"]],["game",["[名]試合,ゲーム<可算>","獲物<不可算>"]],["achieve",["[他]～を達成する"]],["manage",["[他](to do)何とかして～する","～を経営する,管理する"]],["improve",["[他]～を改善する,磨く","[自]よくなる"]],["produce",["[他]～を生産する,産出する","(見せるために)～を取り出す","[名]農作物<不可算>"]],["create",["[他]～を創造する","～を引き起こす"]],["establish",["[他]～を確立する,定着させる","～を設立する"]],["save",["[他](時間,手間)を省く","～を貯金する","(命など)を救う","[前]～を除いて(＝except)"]],["medicine",["[名](for ～)(～の)薬","医学"]],["patient",["[名]患者","[形]忍耐強い"]],["condition",["[名]状態,容態","(通例 －s)(周囲の)状況,条件"]],["medical",["[形]医療の","医学の"]],["stress",["[名]ストレス","(on ～)(～に対する)強調","[他]～を強調する"]],["suffer",["[自](from ～)(病気などで)苦しむ","[他](苦痛,損害)を経験する"]],["exercise",["[名]運動","(－s)練習","[自]運動する","[他]～を行使する"]],["breathe",["[自]呼吸する,息をする"]],["thirsty",["[形]のどが渇いた","(for ～)(～を)切望して"]],["physical",["[形]身体的な","物理的な"]],["fever",["[名](体温の)熱","熱狂"]],["strength",["[名](physical －)体力","力"]],["tear",["[名](通例 －s)涙<可算>","[他](up)～を引き裂く"]],["taste",["[自]～の味がする","[他]～の味をみる","[名]味","好み"]],["rule",["[名]規則","[他]～を支配する"]],["role",["[名]役割"]],["habit",["[名]習慣,癖"]],["custom",["[名]習慣","(－s)税関"]],["tradition",["[名]伝統"]],["society",["[名]社会<不可算>","(ある具体的な)社会<可算>","(one's －)～と同席すること","協会"]],["law",["[名](the－)(集合的に)法律,国法","(個々の)法律","(科学などの)法則"]],["ancestor",["[名]祖先"]],["population",["[名]人口,個体数","(一定の地域に住む)住民"]],["native",["[形]母国の,その土地の","[名](ある土地の)生まれの人"]],["abroad",["[副]海外へ,海外で"]],["local",["[形]その土地の,地元の","地方の","[名] 地元の人"]],["survey",["[名]調査<可算>","[他]～を調査する"]],["evidence",["[名]証拠<不可算>"]],["value",["[名]価値","(－s)価値観","お買い得品<不可算>","[他]～を重んじる"]],["treasure",["[名]財宝,宝","大事な物［人］","[他](思い出など)を大事にする"]],["fashion",["[名]流行","流儀,やり方","[他](手などで)～を作る"]],["public",["[名](the －)大衆","[形]公の,公共の"]],["vote",["[名]投票(数)","[自]投票する"]],["government",["[名]政府"]],["nation",["[名]国家","(the －) 国民"]],["capital",["[名]首都","資本","[形]重大な,死に値する"]],["state",["[名]州","状態","国家","[他](意見,情報)を述べる"]],["political",["[形]政治的な,政治の"]],["price",["[名]価格","(－s)物価","代償"]],["cost",["[他](費用)を要する,～がかかる","～を犠牲にする","[名]費用,犠牲"]],["sum",["[名](修飾語を伴って)金額","合計","(簡単な)計算","[他](up)～を要約する"]],["budget",["[名]予算"]],["fee",["[名](会費,遊園地などの)料金","(専門職への)謝礼"]],["fare",["[名]運賃"]],["bill",["[名]勘定","請求書","<米>紙幣","法案"]],["trade",["[名]貿易","(the ～ trade)～業","商売","[他]～を交換する"]],["wealth",["[名]富,財産<不可算>","(a － of ～)豊富な～"]],["economy",["[名]経済","節約"]],["company",["[名]会社","(one's －)一緒にいること","仲間","来客"]],["task",["[名]仕事<可算>"]],["earn",["[他](金)を稼ぐ,もうける","(評判など)を得る"]],["hurt",["[自](身体の部位が)痛む","[他](身体,感情)を傷つける"]],["injure",["[他]～を痛める","～をけがさせる"]],["damage",["[他]～に損害を与える","[名]損害,被害<不可算>","(－s)賠償金"]],["destroy",["[他]～を(完全に)破壊する","～を殺す,全滅させる"]],["ruin",["[他]～を台無しにする","～を破滅させる","[名](－s)廃墟,荒廃"]],["danger",["[名]危険"]],["neighbor",["[名]近所の人","(a next-door －)隣の人"]],["audience",["[名]聴衆,観客"]],["crowd",["[名]群衆"]],["author",["[名]著者","作家"]],["staff",["[名](集合的に)職員,従業員"]],["clerk",["[名]<米>店員","事務員,社員"]],["customer",["[名]客"]],["passenger",["[名]乗客"]],["elderly",["[形]年配の","(the －)年配の人々"]],["female",["[形]女性の","(動物)雌の","[名]女性,雌"]],["head",["[自]向かう","[他]～を率いる"]],["follow",["[他]～の後について行く,～に続く","(忠告,方針など)に従う"]],["wander",["[自]歩き回る,さまよう"]],["travel",["[自]旅行する,移動する","(光,音などが)進む"]],["pass",["[他]～を通り過ぎる","～を抜く","(試験)に受かる","((人)A)(人)に(A を)渡す","[自](時が)過ぎる","[名]通行証"]],["likely",["[形](to do)～しそうだ,可能性が高い","[副]おそらく"]],["natural",["[形]当然の","自然の","生まれながらの"]],["certain",["[形]確かな","(名詞の前で)ある～"]],["probably",["[副]おそらく"]],["face",["[他]～に直面する","<方向>～向きである","[名]顔,体面"]],["avoid",["[他]～を避ける"]],["solve",["[他]～を解決する"]],["trouble",["[名]問題,ごたごた(通例<不可算>)","[他] ～を困らせる"]],["issue",["[名]問題","(雑誌の)号","[他](切手など)を発行する"]],["cheer",["[他](on)～に声援を送る","(up)～を励ます"]],["encourage",["[他](A to do)(A)に(～するよう)促す,奨励する","～を励ます"]],["support",["[他]～を支持する","(家族など)を養う","(理論など)を立証する","[名]支持,支援"]],["prevent",["[他]～を妨げる","～を予防する"]],["deny",["[他]～を否定する","<S V O1 O2>(O1)に(O2を)与えない"]],["enable",["[他](A to do)(A)に［が］(～することを)可能にする"]],["succeed",["[自](in ～)(～に)成功する","(to ～)(家業などを)継ぐ"]],["miss",["[他]～を逃す","～を休む","～を恋しく思う"]],["fail",["[自](in［at］～)(～に)失敗する","(to do)～できない","[他](試験)に落ちる","(人)に役に立たない"]],["mistake",["[名]間違い","[他](A for B)(A)を(B と)間違える"]],["check",["[他]～を調べる","～を阻止する","[名]小切手","勘定書","検査,点検","抑制"]],["hide",["[他]～を隠す","[自]隠れる"]],["draw",["[他](線で絵など)を描く","(注意)を引く"," ～を引っ張る,集める"]],["join",["[他](クラブ,団体など)に加わる","～をつなぐ","(食事などを)～とともにする","[自](議論,活動などに)参加する"]],["throw",["[他]～を投げる","(away［out］)～を捨てる","(パーティなど)を催す","[名]投げること"]],["operate",["[他](機械など)を操作する","[自]手術する","(機械などが)作動する,(組織が)運営される"]],["repair",["[他]～を修理する"," ～を修復する","[名] 修理,修復"]],["sew",["[他]～を縫う","(on)(ボタンなど)を縫いつける"]],["raise",["[他] ～を上げる","(子ども,作物)を育てる","(お金,資金)を集める","(問題)を提起する","[名]賃上げ,昇給"]],["serve",["[他](飲食物)を出す","～に役立つ","[自] 役立つ"]],["pour",["[他]～を注ぐ","[自]降りそそぐ"]],["spill",["[他]～をこぼす","[名](石油などの)流出"]],["pretend",["[自](to do / that S V)(～する/ ～である)ふりをする"]],["behave",["[自]ふるまう"]],["bear",["[他](can －)～に耐える","～を持つ","～を産む"]],["explore",["[他]～を探検する,(街など)を探索する","(問題など)を探る"]],["happen",["[自](to ～)(～に)起こる","(to do)偶然～する"]],["appear",["[自]現れる","(to be ～)～のように思える"]],["remain",["[自]～のままでいる","残る"]],["survive",["[自]生き残る","[他]～から生き延びる,～の後も存続する"]],["belong",["[自](to ～)","(～に)所属している","(～の)所有物である"]],["represent",["[他]～を代表する","(記号などが)を表す","～を表現する"]],["base",["[他]～の基礎を置く","[名]基礎(の部分),基盤","基地"]],["include",["[他]～を含む"]],["contain",["[他]～を含む","～を抑える"]],["own",["[形](所有格の後で)","自分自身の","(名詞的に)自分自身のもの","[他]～を所有している"]],["share",["[他]～を共有する","(考えなど)を(人に)伝える","[名]共有","分け前"]],["collect",["[他](同種の物)を集める","～を徴収する,回収する"]],["gather",["[他]～を集める","[自]集まる"]],["history",["[名]歴史","履歴,前歴,病歴"]],["subject",["[名]科目","話題","被験者","[形](be － to ～)～を受けやすい"]],["education",["[名]教育"]],["knowledge",["[名]知識,知っていること"]],["uniform",["[名]制服","[形]同一の,一定の"]],["grade",["[名](小,中,高の)学年","等級","成績"]],["senior",["[名](高校,大学の)最上級生","[形]高齢者の","(地位が)上位の"]],["graduate",["[自](from ～)(～を)卒業する"]],["decide",["[他](to do)(～すること)を決定する,決心する","[自](on ～)(～を)決める"]],["judge",["[他]～を判断する","[名]裁判官,審判(員)"]],["quit",["[他]～を(完全に)やめる"]],["retire",["[自](from ～)(～を)引退する,退職する"]],["review",["[名]再検討","(新聞などの)批評","復習"]],["choose",["[他]～を選ぶ","[自]選ぶ"]],["imagine",["[他]～を想像する"]],["guess",["[他]～を推測する","[名]推測"]],["expect",["[他]～を予期する","(A of［from］ B)(B にA)を期待する","(be －ing)(～を)身ごもっている"]],["predict",["[他]～を予測する"]],["remember",["[他](doing)(過去にしたこと)を覚えている","(to do)(～すること)を覚えている","(me to ～)(～に)よろしく伝える"]],["remind",["[他](A of B)(A)に(B のことを)思い出させる","((人)to do)(人)に～するように念を押す"]],["realize",["[他]～を(はっきり)理解する","(夢,計画など)を実現する"]],["appreciate",["[他]～を(正しく)理解する","～のよさがわかる","～に感謝する"]],["accept",["[他]～を受け入れる"]],["consider",["[他]～をよく考える,考慮する","(人の気持ち)を思いやる","(A (to be) B) (A)を(B と)みなす"]],["mind",["[自]気にする","[名]精神,頭脳","(才能,知性のある)人"]],["wonder",["[他](wh－節 / if S V)～かなと思う","[自](at ～)(～に)驚く"]],["seem",["[自]～のように思われる"]],["compare",["[他](A with［to,and］ B)(A)を(B と)比較する","(A to B)(A)を(B に)例える","[自](with［to］～)(～に)匹敵する"]],["concentrate",["[自](on ～)(～に)集中する","[他](A on B)(A)を(B に)集中させる"]],["focus",["[自](on ～)(～に)焦点を当てる,力を注ぐ","[名]焦点"]],["allow",["[他](人が)～を許可する","(物が)～を可能にする"]],["admit",["[他]～を認める","～の入場［入学］を許可する"]],["ground",["[名]地面","根拠"]],["pollution",["[名]汚染,公害<不可算>"]],["sight",["[名]光景","視力"]],["view",["[名]眺め,景色<可算>","見解,見方<不可算>","[他](A as B)(A)を(B と)みなす"]],["landscape",["[名]風景","(the －)(政治,社会の)情勢"]],["nature",["[名](無冠詞)自然","(しばしばthe － of ～) (～の)性質"]],["seed",["[名]種","シード選手"]],["plant",["[名]植物","(大規模な)工場","[他]～を植える"]],["bloom",["[自](花が)咲く","[名]開花"]],["harvest",["[名]収穫","[他]～を収穫する","(臓器,体液など)を摘出する"]],["insect",["[名]昆虫"]],["earthquake",["[名]地震"]],["temperature",["[名]温度,気温","体温"]],["degree",["[名](温度などの)度","程度"," 学位"]],["flood",["[名]洪水","[他]～を水浸しにする"]],["freeze",["[自]凍る,凍りつく","[他]～を凍らせる"]],["reflect",["[他]～を反射する","～を反映する","[自](on ～)(～を)熟考する"]],["polite",["[形](人,言動が)礼儀正しい"]],["rude",["[形]無礼な,不作法な"]],["lonely",["[形]孤独な"]],["lazy",["[形](やる気がなく)怠惰な,いい加減な","(名詞の前で)くつろいだ"]],["strict",["[形]厳しい"]],["ugly",["[形]醜い"]],["intelligent",["[形]知的な,賢い"]],["silly",["[形]ばかな"]],["nervous",["[形]あがって,落ち着かない","神経質な,臆病な","(身体の)神経の"]],["awake",["[形]目を覚まして"]],["attitude",["[名]態度,姿勢"]],["character",["[名]性格,特徴","登場人物","文字"]],["characteristic",["[名]特徴<可算>","[形]特有の,特徴的な"]],["feature",["[名]特徴","特集記事","[他]～を特集する"]],["detail",["[名]詳細","(建物などの)細部"]],["advantage",["[名](over ～)(～に対する)利点"]],["fault",["[名](ちょっとした)欠点,不具合<可算>","(one's －)責任<不可算>","断層"]],["quality",["[名]質<不可算>","(通例－s)(人間の)資質"]],["correct",["[形]正確な,正しい","[他]～を訂正する,矯正する"]],["ideal",["[形]理想的な,申し分のない","[名]理想,理想的な姿"]],["fair",["[形]公正な,公平な","[名]品評会,見本市"]],["appropriate",["[形]適切な"]],["famous",["[形](for one's ～)(～で)有名な","(as ～)(～として)有名な"]],["elementary",["[形]初歩的な,基本の"]],["major",["[形]主要な","[自](in ～)(～を)専攻する"]],["matter",["[自]重要である","[名](修飾語を伴い)物質","(－s)事態,状況"]],["bright",["[形]明るい","(主に子どもや若者が)賢い"]],["brilliant",["[形]輝いている","すばらしい"]],["lively",["[形]生き生きとした"]],["comfortable",["[形](物が)快適な","(人が)心地よい"]],["pleasant",["[形](人にとって)楽しい,心地よい"]],["convenient",["[形]都合がよい","近くて便利がよい"]],["false",["[形]誤った","偽の"]],["terrible",["[形]ひどい","苦手で"]],["awful",["[形]ひどい,不快な"]],["thin",["[形]薄い","(病的に)やせた","(毛が)薄い"]],["tight",["[形]引き締まった,きつい","厳しい"]],["loose",["[形]ゆるい","解き放たれた"]],["raw",["[形]生の,加工されていない"]],["empty",["[形]空の,中身のない","[他]～を空にする"]],["smooth",["[形]滑らかな","順調な","[他](服のしわ)をのばす,(髪)をなでつける"]],["direct",["[形]直接的な","[他]～を指揮［監督,演出］する","(注意など)を向ける","～に道を教える"]],["familiar",["[形]知られた","(人が)(よく)知っている"]],["similar",["[形](to ～)(～に)似た"]],["differ",["[自]異なる"]],["vary",["[自]さまざまだ,変わる"]],["specific",["[形]特定の","明確な,具体的な"]],["common",["[形]普及した,普通の","(主に名詞の前で)共通の"]],["unusual",["[形]珍しい"]],["add",["[他]～を加える","[自](to ～)(～を)増やす"]],["increase",["[自]増える","[他]～を増やす","[名](in ～)(～の)増加"]],["reduce",["[他]～を減らす","(A to B) A をB にする"]],["divide",["[他]～を分割する","(by ～)(～によって)(数字)を割る"]],["count",["[他]～を数える","[自]数える","重要である","(on ～)(～を)(全面的に)当てにする"]],["weigh",["[自]～の重さがある","[他]～の重さを量る","～を(比較)検討する"]],["quarter",["[名]4 分の1 ,15分,25セント","(都市のある特定な)地域"]],["lot",["[名](a － of ～)多くの～","(副詞的に)(a －)とても","(one's)(～の)状況,運命","(何らかの目的を持つ)土地"]],["pile",["[名]積み重ね,山","多量","[他]～を積み重ねる"]],["rate",["[名]割合,速さ","(ホテルなどの一定の)料金","[他]～を評価する"]],["figure",["[名]数字","人物","スタイル,体つき","図","[自]目立つ"]],["lack",["[名]((a)－ of ～)(～の)不足","[他]～を欠いている"]],["extra",["[形]余分な,追加の,臨時の","[名]余分な［追加された］もの"]],["ready",["[形]用意ができている","(be ～ to do)進んで～する"]],["prepare",["[他]～の準備をする,用意をする","[自]準備をする,用意をする","[形](be －d to do)(～する)準備ができている"]],["adjust",["[自](to ～)(～に)慣れる","[他]～を調整する"]],["apply",["[自](to ～)(～に)当てはまる","(for ～)(～に)申し込む","[他]～を当てはめる,応用する","(薬,口紅など)を塗る"]],["suit",["[他](人)に適している,好都合だ","(服装,色が人)に似合う","[名]訴訟(＝lawsuit)"," スーツ"]],["case",["[名]場合","(the －)事実","(犯罪)事件","症例","(make a －)主張(する)"]],["scene",["[名](劇,小説などの)場面","(事故)現場","(the ～ scene)～(業)界"]],["chance",["[名](to do)(～する)機会","(of ～ / that S V)(～の/ ～する)可能性"]],["opportunity",["[名](よい)機会,好機"]],["experience",["[名]経験","(個々の)体験","[他]～を経験する"]],["time",["[名](漠然とした)時間","(ある長さの)時間","回数","倍","(－s)情勢,時代","(接続詞的に(the) next －)次に～するとき"]],["spring",["[名]春","泉,温泉","[自]飛び出る,突然出現する"]],["minute",["[名](時間の)分","(a －)ちょっとの間","(－s)議事録","[形]とても小さい,細かい","[接](the －)～するとすぐに"]],["period",["[名]時代","期間","(学校の)時限"]],["generation",["[名]世代","生み出すこと","発電"]],["anniversary",["[名]記念日"]],["recently",["[副]最近,近ごろ"]],["used",["[助](to ～)以前は～だった,よく～したものだ","[形](be － to doing)(～することに)慣れている","中古の"]],["early",["[副](時間,時期が)早く,初期に","(予定より)早く","[形]早い,初期の"]],["first",["[形]第1 の","(for the － time)初めて","[副] 初めて","(文頭で)まず第1 に(＝firstly)","[名](at －)最初のうちは"]],["latest",["[形](the －)最新の"]],["modern",["[形]現代の","近代的な"]],["latter",["[形]後半の","[名](the －)後者"]],["spend",["[他](時間)を費やす","(お金)を使う"]],["delay",["[他]～を遅らせる","[名]遅延,延期"]],["borrow",["[他]～を借りる"]],["lend",["[他](無償で)～を貸す","(銀行が利子をつけて)を貸す"]],["rent",["[他]～を借りる","(A to B)(A)を(B に)賃貸しする","[名]家賃,賃貸料,使用料"]],["provide",["[他]～を供給する,与える"]],["shelf",["[名]棚(の一段)"]],["board",["[名](細長い)板","(幹部などによる)委員会","[他]～に乗る"]],["garbage",["[名]ごみ"]],["item",["[名]品物","項目","(短い)記事"]],["wheel",["[名]車輪","(the －)ハンドル","[他](車輪のついたもの)を動かす"]],["note",["[名]メモ","<英>紙幣","[他](that S V)(～ということ)を指摘する"," ～に注意を払う"]],["present",["[名]プレゼント","現在","[形]現在の"," 出席して,存在して","[他]～を贈る,提示する"]],["stuff",["[名](漠然とした)もの","[他]～を詰める"]],["string",["[名]ひも","(a － of ～)一連の～","(ギターなどの)弦"]],["leisure",["[名]余暇","(形容詞的に)余暇の"]],["diet",["[名]食事","規定食","(D－) (日本の)国会"]],["furniture",["[名]家具<不可算>"]],["refrigerator",["[名]冷蔵庫"]],["traffic",["[名]交通(量)<不可算>"]],["jam",["[名]渋滞","ジャム"]],["sell",["[他]～を売る","[自]売れる"]],["pay",["[他](A for B) (B の代金としてA)を支払う","[自](for A) (A の代金を)支払う","(仕事などが)割に合う","[名]給料"]],["wear",["[他]～を身につけている","～をすり減らす","[自]すり減る"]],["clothes",["[名]服<複数扱い>"]],["marry",["[他]～と結婚する"]],["greet",["[他]～に挨拶する,出迎える"]],["order",["[他]～を注文する","(医者や上官などが)～に命令する","[名] 注文","命令","順序","秩序"]],["room",["[名]部屋","余地,空間<不可算>"]],["story",["[名]階"]],["site",["[名]用地","現場,場所","(史跡などの)跡"]],["yard",["[名](主に<米>)庭","ヤード(＝約0.9 m)"]],["bottom",["[名]底","一番下,最下位"," 尻"]],["line",["[名]列","行,線","電話回線","セリフ","[自](up)並ぶ"]],["row",["[名]列","[他](ボート)をこぐ"]],["background",["[名]背景","経歴,生い立ち"]],["direction",["[名]方向,方角","(－s)道順","指示"]],["art",["[名]芸術","技術","(liberal －s)一般教養"]],["culture",["[名]文化","培養,養殖","教養","[他]～を耕す,栽培［養殖］する"]],["cartoon",["[名]漫画"]],["novel",["[名]小説","[形]斬新な"]],["instrument",["[名]楽器","器具"]],["tune",["[名]曲","[自](番組)にチャンネルを合わせる","[他]～の調子を合わせる"]],["sentence",["[名]( 1 つ1 つの)文","判決","[他](A to B)(A)を(B)の刑にする"]],["article",["[名]記事","品物","冠詞","条項"]],["passage",["[名](文章などの)一節","(時の)経過,移動","通路"]],["vocabulary",["[名]語彙"]],["rumor",["[名]うわさ"]],["spell",["[他]～をつづる","[名]呪文","(天気などのある一続きの)期間"]],["pronounce",["[他](単語など)を発音する","(判決など)を宣告する,～と断言する"]],["sign",["[名]兆候,印","標識,看板,掲示","[他] ～を署名する"]],["mean",["[他]～を意味する","(to do)～するつもりだ","[形]意地悪な"]],["publish",["[他]～を出版する","(公式に結果など)を発表する"]],["display",["[他]～を展示する","(実力など)を発揮する","～を誇示する","[名]展示,表現,誇示"]],["trust",["[他]～を信頼する","[名]信頼,信用"]],["depend",["[自](物,事が主語)(on ～)(～)次第である","(人が主語)(on ～)(～に)頼っている"]],["rely",["[自](on ～)(～に)頼る"]],["pray",["[自]祈る"]],["beg",["[他]～を嘆願する","[自]求める"]],["prefer",["[他](A to B) (B よりA)を好む"]],["weep",["[自]しくしく泣く"]],["hate",["[他]～を嫌う"]],["worry",["[自]心配をする","[名]心配(事)"]],["anxious",["[形](about ～)(～を)心配して","(to do / for ～)(～を)切望して"]],["satisfy",["[他]～を満足させる","(必要性,空腹など)を満たす"]],["annoy",["[他]～をいらだたせる"]],["bother",["[他]～に面倒をかける","(to do)わざわざ～する","[名]面倒なもの"]],["disturb",["[他](うるさくして)～に迷惑をかける","(平和など)を乱す"]],["frighten",["[他]～をおびえさせる"]],["upset",["[他]～を動揺させる","(均衡など)を乱す","[形]動揺して,腹を立てて"]],["regret",["[他]～を後悔する","(to do)残念ながら～しないといけない","[名]後悔"]],["favor",["[名]親切な行為","支持"]],["interest",["[名]関心","(－s)利益","(銀行などの)利子"]],["pity",["[名]残念なこと<可算>","哀れみ<不可算>"]],["due",["[形](due to (名詞))(名詞)が原因で","締め切りの","到着［出産］予定の"]],["reason",["[名]理由","理性","[他]～を推理する","[自]思考する,判断する"]],["result",["[名]結果","[自](in ～)結果として(～に)なる","(from ～)(～の)結果として生じる"]],["effect",["[名]効果,影響,結果"]],["influence",["[名]影響(力)","[他]～に影響を与える"]],["cause",["[他]～を引き起こす","[名]原因"]],["affect",["[他]～に影響を与える,作用する"]],["way",["[名]方法","(in ～ way)(～の)点(で)","道","[副]はるかに"]],["manner",["[名]方法","流儀,態度","(－s)マナー"]],["purpose",["[名]目的"]],["sake",["[名](for ～)ため","日本酒"]],["right",["[副](場所や時の副詞(句)を修飾して)ちょうど","[形]正しい,適切な","右の","[名](to ～)(～の)権利"]],["complete",["[形]完全な","[他]～を完成させる"]],["hardly",["[副](程度)ほとんど～ない","(－ ever)めったに～ない"]],["nearly",["[副]ほとんど","あやうく～しかける"]],["partly",["[副]ある程度,部分的に"]],["actually",["[副]実は","実際に"]],["indeed",["[副](強調として)実際に,本当に","(but を伴って)確かに～"]],["even",["[副]さえも","(比較級の前で)さらに"]],["exactly",["[副]正確に","<会話で>そのとおり"]],["gradually",["[副]徐々に"]],["therefore",["[副]それゆえに"]],["instead",["[副]代わりに","(of ～)(～の)代わりに"]],["until",["[前]～まで(ずっと)","[接]～まで(ずっと)"]],["besides",["[前]～に加えて","[副]おまけに"]],["except",["[前]～を除いて","(for ～)(～を)除いて"]],["debate",["[名]討論","[他]～を討論する"]],["criticize",["[他]～を批判する"]],["accuse",["[他]～を非難する","～を告訴する"]],["insist",["[自](on ～)(～と)言い張る,(強く)主張する","[他]～と主張する"]],["object",["[自](to ～)(～に感情的に)反対する","[名]物","目的","(嘲笑,欲望などの)対象"]],["protest",["[自](against ～)(～に対して)抗議する","[名]抗議"]],["controversial",["[形]論争を招く,物議をかもす"]],["bound",["[形](to do)きっと～(する,～する［である］に違いない)","(for ～)～行きで"]],["bet",["[他](that S V)きっと～だと思う","～を賭ける"]],["congratulate",["[他](人)を祝う,～にお祝いを述べる"]],["praise",["[他](A for B)(A)を(B のことで)褒める,称える","[名]賞賛"]],["honor",["[名]名誉,栄誉","[他]～を敬う"]],["chat",["[自]おしゃべりする","[名]おしゃべり"]],["refer",["[自](to ～)","(人が主語)(～に)言及する,参照する","(物が主語)(～を)示す"]],["mention",["[他]～について述べる,言及する"]],["convey",["[他]～を伝える","(乗客,音,病気など)を運ぶ"]],["emphasize",["[他]～を強調する"]],["exaggerate",["[他]～を誇張する","[自]誇張する,大げさに言う"]],["reply",["[自](to ～)(～に)返事をする,答える","[名]返事,答え"]],["respond",["[自](to ～)(手紙や問いなどに)返答する","(to ～)(～に)対応する,反応する"]],["whisper",["[自]ささやく","[名]ささやき(声)"]],["remark",["[名]発言","[他]～と発言する"]],["observe",["[他]～を観察する","(that S V)(気づいたことを)～と述べる","(規則など)を遵守する","(記念日など)を祝う"]],["theory",["[名]理論","(学)説"]],["analysis",["[名]分析"]],["experiment",["[名]実験","[自]実験する"]],["device",["[名]装置"]],["phenomenon",["[名]現象","特異なもの,天才"]],["substance",["[名]物質","本質,根拠"]],["chemical",["[名](通例 －s)化学物質","[形]化学の"]],["fuel",["[名]燃料","[他](感情など)を大きくする"]],["nuclear",["[形]原子力の,核の"]],["statistics",["[名]統計(値)<複数扱い>","統計学<不可算>"]],["pursue",["[他]～を追求する,続ける","～を追跡する"]],["accomplish",["[他]～をやり遂げる"]],["overcome",["[他]～を克服する"]],["fulfill",["[他](義務,願望など)を果たす","(必要など)を満たす"]],["devote",["[他](A to B) (A)を(B に)ささげる"]],["aim",["[自]狙う","[他](-ed at ～)～向けだ","[名]狙い,目的"]],["challenge",["[名]難問,課題","[他]～に異議を唱える"]],["trial",["[名]試み","裁判","試練"]],["dizzy",["[形]めまいがして"]],["pale",["[形](顔色が)青白い,青ざめた","(色が)淡い"]],["appetite",["[名]食欲"]],["starve",["[自](be －ing)とてもお腹が空いている","餓死する"]],["mental",["[形]精神の","知力の"]],["rest",["[名]休憩","(the －)残り","[自](横になったりして)休む","(on ～)(～)次第だ","[他]～を休ませる"]],["ache",["[名]痛み","[自]痛む"]],["surgery",["[名]手術","外科(","","ともに<不可算>)"]],["disease",["[名]病気"]],["symptom",["[名](通例 －s)症状","兆候"]],["cancer",["[名]がん","(C－)カニ座"]],["ambulance",["[名]救急車"]],["recover",["[自](from ～)(～から)回復する","[他](盗品など)を取り戻す"]],["sore",["[形](のどや筋肉が)痛い","(話題など)触れてほしくない,心が痛む"]],["swell",["[自](手足などが)腫れる","(風船,費用などが)膨らむ"]],["cough",["[自]咳をする","[名]咳<可算>"]],["bleed",["[自]出血する"]],["faint",["[形](色,光などが)かすかな","[自]気絶する","[名]気絶"]],["exhaust",["[他]～を疲れ果てさせる","～を使い果たす","[名]排出,排気ガス"]],["cure",["[他]～を治療する","[名]治療法"]],["disabled",["[形]障がいのある","[名](the －)(集合的に)障がいのある人"]],["stiff",["[形](筋肉などが)凝った,(動かすと)痛い"," 堅い"]],["muscle",["[名]筋肉"]],["tongue",["[名]舌","言語,言葉","(have a ～ tongue)話し方"]],["sense",["[名]感覚","分別","意味","[他](何となく)～を感じる"]],["sweat",["[名]汗(通例<不可算>)","[自]汗をかく"]],["nationality",["[名]国籍"]],["citizen",["[名]市民","国民"]],["civil",["[形](一般)市民の","国内の","礼儀正しい"]],["racial",["[形]人種の,民族の"]],["domestic",["[形]国内の","家庭内の"]],["rural",["[形]田舎の"]],["suburb",["[名](通例the －s)郊外"]],["border",["[名]国境(地帯),境界","[他]～を縁取る"]],["burden",["[名]重荷,負担"]],["impact",["[名](on ～)(～への)影響","(物体間の)衝撃","[自](on ～)(～に)影響を及ぼす"]],["status",["[名]地位","(特定の時点の)状況"]],["equal",["[形](to ～)(～に)等しい,平等な","[他]～に等しい"]],["relationship",["[名]関係","親密な関係","2ともに<可算>)"]],["reputation",["[名](人,物の)評判<可算>"]],["trend",["[名](世の中の)風潮,傾向","流行"]],["service",["[名](政府あるいは企業による)事業,制度","(電車,バスの)便","サービス,接客<不可算>"]],["religion",["[名]宗教"]],["moral",["[形]道徳的な","[名](物語の)教訓","(－s)道徳"]],["standard",["[名]基準,水準","[形]標準の"]],["prosperity",["[名]繁栄"]],["crisis",["[名]危機"]],["prejudice",["[名]偏見,先入観","[他]～に偏見をもたせる"]],["discrimination",["[名]差別","識別"]],["charity",["[名]慈善(事業)<不可算>","慈善団体<可算>","(形容詞的に)慈善のための"]],["benefit",["[名]恩恵","(－s)手当","[自](from ～)(～から)利益を得る","[他]～に利益を与える"]],["welfare",["[名]福祉","(健康なども含めた)幸福","生活保護"]],["community",["[名](地域)社会,共同体(の人々)"]],["individual",["[名]個人,個体","[形]個人の,個々の"]],["official",["[名]役人,役員","[形]公式の"]],["immigrant",["[名](外国からの)移民"]],["volunteer",["[名]ボランティア","[自](to do)(～することを)進んで引き受ける"]],["contribute",["[自](to ～)","(～に)貢献する","(～の)一因となる","[他](A to B)(A)を(B に)寄付する,提供する"]],["abolish",["[他]～を廃止する"]],["impose",["[他](A on B)(A)を(B に)課す,押しつける"]],["access",["[名] 利用する権利","(場所への)接近方法"]],["duty",["[名] 義務","関税"]],["compulsory",["[形]義務的な","規定の"]],["responsible",["[形](人が主語)責任がある","(物が主語)原因となっている"]],["policy",["[名]政策","方針","保険契約,約款"]],["elect",["[他]～を(選挙で)選ぶ"]],["industry",["[名]工業","(the ～ industry)産業,業界"," 勤勉"]],["income",["[名]収入"]],["profit",["[名]利益,利潤"]],["tax",["[名]税金(<米>→<可算> <英>→<不可算>)"]],["expense",["[名]費用,経費","(at the － of ～)(～を)犠牲(にして)"]],["debt",["[名]借金"]],["deposit",["[名]預金","頭金,保証金","埋蔵物","[他] ～を預ける"]],["charge",["[名]料金","責任,管理","(against ～)(～に対する)非難,告訴","[他]～を請求する","～を告訴する","～を充電する"]],["wage",["[名]賃金","[他](闘争,運動など)を行う"]],["recession",["[名]不況,不景気"]],["consume",["[他]～を消費する"]],["waste",["[他]～を浪費する","[名]浪費,無駄","廃棄物<不可算>"]],["invest",["[他](A in B)(A)を(B に)投資する","(A with B)(A)に(B を)与える"]],["import",["[他]～を輸入する","[名]輸入,輸入品"]],["financial",["[形]財政的な,金銭的な"]],["hire",["[他]～を(一時的に)雇う","(金を払って短期間)～を借りる"]],["employ",["[他](人)を雇う","(物,事)を用いる"]],["resign",["[自](as ～)(～を)辞職する","[他](地位など)を辞める"]],["qualify",["[自](for ～)(～の)資格がある","(as ～)(～としての)資格を得る","[他]～に資格を与える"]],["assign",["[他]～を割り当てる","～を配属する"]],["occupation",["[名]職業<可算>","占有,占領<不可算>"]],["career",["[名]職業","経歴"]],["profession",["[名](専門的な)職業","(the －)同業者集団"]],["unemployment",["[名]失業","失業率(＝－rate),失業者数 (",""," ともに<不可算>)"]],["document",["[名]書類,資料","[他]～を記録する"]],["department",["[名](組織の)部門,課","(大学の)学科","(米国などの)省"]],["branch",["[名]支店,支局","(学問の)部門","枝"]],["retail",["[名]小売り<不可算>","[自]小売りされている"]],["system",["[名]組織,制度","体系","2ともに<可算>)"]],["structure",["[名]構造"]],["architecture",["[名]建築(様式)<不可算>"]],["construction",["[名]建設<不可算>"]],["function",["[名]機能","[自]機能する"]],["surface",["[名]表面","[自]表面化する"]],["aspect",["[名]側面"]],["edge",["[名]端","(ナイフなどの)刃","優位"]],["consist",["[自](of ～)(～で)構成されている","(in ～)(～に)ある"]],["compose",["[他]～を構成する,組み立てる","～を作曲［作文］する","～を落ち着かせる"]],["attach",["[他]～をくっつける,添付する","～に愛着を持たせる"]],["connect",["[他]～をつなげる","～を関連づける","[自]つながる"]],["relate",["[他](A to B)(A)を(B に)関連づける","～を(順序立てて)話す","[自](to ～)(～の)気持ちがわかる"]],["associate",["[他](A with B)(A)を(B と)関連づける,(A)から(B を)連想する","[自](with ～) (～と)付き合う","[名]同僚,共同経営者"]],["stick",["[他]～を貼り付ける","(舌や脚)を出す","[自](to)(規則などを)守る,固執する"]],["separate",["[他]～を引き離す","[形]別々の"]],["thief",["[名]泥棒"]],["crime",["[名]犯罪"]],["motive",["[名]動機"]],["punish",["[他]((人)for ～)(人)を(～の理由で)罰する"]],["violate",["[他](法律など)に違反する","(権利など)を侵害する"]],["legal",["[形]合法の","法律の,法的な"]],["enemy",["[名]敵","(形容詞的に)敵の"]],["compete",["[自]競争する","(in ～)(競技などに)参加する"]],["defeat",["[他](相手)を打ち負かす","[名]敗北"]],["victim",["[名]犠牲者"]],["obstacle",["[名](to ～)(～に対する)障害<可算>"]],["harm",["[名]害<不可算>","[他]～に害を与える"]],["invade",["[他](プライバシーなど)を侵害する","(国など)に侵入する,～を侵略する"]],["endanger",["[他]～を危険にさらす"]],["interrupt",["[他]～を中断する","～を遮る","[自]人の話を遮る"]],["spoil",["[他]～を台無しにする","(子ども)を甘やかす"]],["spectator",["[名]観客"]],["relative",["[名](家族も含めて)親戚","[形]相対的な"]],["enter",["[他]～に入る","～を入力する","[自](into ～)(ある段階などに)入る"]],["accompany",["[他](人が主語)～と一緒に行く","(物が主語)～に伴う"]],["departure",["[名]出発","逸脱"]],["destination",["[名]目的地","(tourist －)旅行先,観光地"]],["transportation",["[名]交通機関<不可算>"]],["via",["[前]～経由で","～によって"]],["lead",["[自](to ～)(～に)至る","[他](a ～ life)(～な生活)を送る","(A to do)A に～させる","[名]鉛,(シャーペンなどの)芯"]],["rise",["[自]上がる,昇る","[名]上昇"]],["lower",["[他]～を下げる"]],["flow",["[自]流れる","[名]流れ"]],["burst",["[自]破裂する,爆発する","(慣用句で)突然～し始める"]],["crack",["[自]割れる,砕ける","(パンと)音を出す","[他]～を割る,砕く","[名]割れ目"]],["melt",["[自](固体が)溶ける","[他]～を溶かす"]],["progress",["[名]進歩,前進 <不可算>","[自]進歩する,進む"]],["advance",["[名]進歩,前進 <可算>","[自](軍隊などが)前進する,進歩する","[形]事前の"]],["deal",["[自](with～)(～を)扱う","[名]取り引き"]],["handle",["[他]～を扱う","(手で)～を扱う,触れる","[名]取っ手"]],["cope",["[自](with～)(～に)(うまく)対処する"]],["treat",["[他](副詞を伴って)～を扱う","(病人,病気)を治療する","(A to B) (A) に(Bを)おごる","[名]楽しみ"]],["clue",["[名](to ～)(～の)手がかり"]],["restrict",["[他]～を制限する"]],["limit",["[他](数量,範囲)を制限する","[名]制限"]],["forbid",["[他]～を禁じる"]],["ban",["[名]禁止<可算>","[他]～を禁止する"]],["refuse",["[他]～を断る","(to do)～するのを拒む"]],["reject",["[他]～を拒絶する","(人)を除け者にする"]],["persuade",["[他](A to do)(A)を説得して～させる"]],["convince",["[他](A of B)(A)に (Bを)確信させる,(A that S V)(A)に(～を) 確信させる","(A to do)(A)を説得して～させる"]],["inspire",["[他]～を奮起させる,かき立てる","(作品)に創作のヒントを与える"]],["discourage",["[他]～のやる気をなくさせる,落胆させる"]],["promote",["[他]～を促進する","(be［get］－d to ～)(～に)出世［昇進］する"]],["expand",["[自]拡大する,膨張する","[他]～を拡大する,膨張させる"]],["extend",["[他]～を延長する,広げる","[自]伸びる,広がる"]],["broaden",["[他]～を広げる","[自]広がる"]],["spread",["[他]～を広げる","[自]広がる","[名]広がり"]],["tie",["[他](荷物など)を縛る","(ひも,ネクタイなど)を結ぶ","[名]ネクタイ (＝necktie)","(家族などの)きずな"]],["bind",["[他]～を結びつける,縛る"]],["fasten",["[他]～を固定する","(ボタンなど)をかける,留める"]],["fix",["[他]～を固定する","～を修理する","(主に <米>)(食事,飲み物)を作る"]],["install",["[他](機械など)を設置する","～をインストールする"]],["resist",["[他]～を我慢する","～に抵抗する"]],["obey",["[他]～に従う"]],["engage",["[自]従事する","[他](関心,注意など)を引く"]],["bump",["[自](into～)","(～に)ぶつかる","(～に)偶然出会う"]],["crash",["[自]激突する","(飛行機が)墜落する","[名]激突,墜落"]],["bend",["[自]身をかがめる","[他]～を曲げる","[名](道の)カーブ"]],["hug",["[他](人)を (愛情こめて)抱きしめる","[名]抱擁"]],["stare",["[自](at ～)(～を)じっと見つめる","[名]凝視"]],["gaze",["[自](at［on］～)(～を)見つめる","[名]視線,凝視"]],["glance",["[自]ちらりと見る","[名]ちらりと見ること"]],["glimpse",["[他]～がちらりと見える","[名]ちらりと見えること"]],["stretch",["[他](手足や体)を伸ばす,広げる","[自]伸ばす,広がる","[名](ひと続きの)広がり"]],["stumble",["[自]つまずく","(across［into］～)(～に)偶然出会う"]],["press",["[他]～を(強く)押す","～を押しつける,勧める","[名](the －)報道機関,出版"]],["drag",["[他]～を(ずるずると)引きずる"]],["lean",["[自](against［on］～)(～に)寄りかかる","(forward)身を乗り出す","[形](健康的に)痩せている"]],["scratch",["[他]～をひっかく,かく","[名]ひっかき傷"]],["bow",["[自]おじぎする","[名]おじぎ"]],["nod",["[自]うなずく","(off)うたた寝する","[名]うなずき,会釈"]],["sigh",["[自]ため息をつく","[名]ため息"]],["yawn",["[自]あくびをする","[名]あくび"]],["bury",["[他]～を埋める","～を埋葬する"]],["perform",["[他]～を遂行する","～を演じる,演奏する","[自](副詞を伴い)やる"]],["adopt",["[他]～を採用する","～を養子にする"]],["escape",["[自](from ～)(～から)逃れる","[他]～を避ける","[名]逃亡"]],["scatter",["[他]～をまき散らす","[自](群衆などが)散る"]],["fold",["[他]～を折る","(up)～を折りたたむ","(腕)を組む","[自]折りたためる"]],["hang",["[他]～を掛ける"," ～を絞首刑にする","[自]ぶら下がる"]],["release",["[他]～を解放する","(映画など)を発表する,出す","(ガスなど)を放出する","[名]解放,発売"]],["strike",["[他]～を打つ","(災害が)～を襲う","(考えが人)に思い浮かぶ","(A as B)(A)に(B という)印象を与える","[名]ストライキ"]],["beat",["[他]～を打つ","～に勝つ"]],["protect",["[他]～を守る,保護する"]],["twist",["[他]～を(ねじ)曲げる","(体の一部)をひねる,ねんざする"]],["stir",["[他](液体など)を混ぜる","(up ～)(感情など)を呼び覚ます"]],["shake",["[他]～を振る","～を揺さぶる","[自](恐怖,寒さで)震える"]],["burn",["[自]焼ける","[他]～を燃やす,(CD など)を複製する"]],["skip",["[他]～をサボる,抜かす"]],["expose",["[他]～をさらす","(秘密,犯罪など)を暴露する"]],["dip",["[他]～を(ちょっと)つける,浸す","～を少し下げる"]],["polish",["[他]～を磨く"]],["cheat",["[自]ごまかす","[他]～をだます"]],["attend",["[他] ～に出席する,通う","[自](to ～)(～に)注意を向ける","(to ～)(～を)世話する"]],["participate",["[自](in ～)(～に)参加する"]],["imitate",["[他]～をまねる"]],["exist",["[自]存在する"]],["arise",["[自]生じる"]],["occur",["[自]生じる","(to (人))(考えなどが(人)に)思いつく"]],["generate",["[他](電気,利益など)を生み出す"]],["involve",["[他](be －d in ～)(事件などに)巻き込まれる","(be －d in ～)(子育てなどに)参加する","～を伴う"]],["require",["[他]～を必要とする"]],["counterpart",["[名](to ～)(～に)対応する［(～と)同等の］人［物,事］"]],["maintain",["[他]～を維持する","(that S V)(～)を(強く)主張する"]],["last",["[自](時間的に)続く","(服などが)長持ちする","[形](the last ～)","この前の～,最後の～","もっとも～でない","[名](at －)ついに"]],["persist",["[自]持続する,残る","(in［with］～)(～を)貫く,(～に)固執する"]],["gain",["[他]～を増す","～を得る","[名]利益,増加"]],["obtain",["[他](資格,許可,情報など)を得る"]],["acquire",["[他]～を習得する","～を獲得する","～を買収する"]],["examine",["[他]～を調査する","～を検査する"]],["search",["[他](A for B) (B(物)を求めてA(場所))を捜す","[名]捜索,調査"]],["reunion",["[名]同窓会","再会"]],["scholarship",["[名]奨学金<可算>","(人文科学の)学識<不可算>"]],["logic",["[名]論理(学)"]],["instruction",["[名](通例－s)指示"]],["determine",["[他]～を決める,～に大きく影響する","(be －d to do)～することを決意している","(原因など)を特定する"]],["conclude",["[他](that S V)～と結論を下す","～を終わりにする"]],["distinguish",["[他]～を区別する"]],["classify",["[他]～を分類する"]],["estimate",["[他]～を推定する,見積もる","[名](for ～)(～の)見積もり"]],["select",["[他](注意深く)～を選ぶ,精選する","[形]えり抜きの"]],["organize",["[他](考えなど)をまとめる","～を組織化する,取りまとめる"]],["recognize",["[他](知り合いなど)が誰だかわかる","(that S V)～を認識する"]],["suppose",["[他](be －d to do)～することになっている","～と思う,仮定する"]],["assume",["[他]～と思い込む,決めつける","～を引き受ける"]],["care",["[自](否定文で)気にする","世話をする","[名]世話,心配"]],["doubt",["[他]～を疑う","(that S V)～とは思わない","[名]疑い"]],["notice",["[他]～に気がついている","[名]通知,掲示,注意"]],["aware",["[形]気づいている"]],["conscious",["[形]意識している,気づいている","意識がある"]],["concerned",["[形](with［about］～)(～に)関心を持っている,重視している","(with ～)(～を)扱っている","(about［for］～)(～を)心配している"]],["regard",["[他](A as B)(A)を(B と)みなす","(副詞を伴い)～を評価する","[名](in －)点","(－s)よろしくという挨拶"]],["commit",["[他](oneself to ～ / be －ed to ～)～に専念する","(A to B) (A)を(B に)委ねる,充てる","(犯罪など)を犯す"]],["memorize",["[他]～を暗記する"]],["approve",["[自](of ～)(～を)認める,承認する","[他]～を承認する"]],["forgive",["[他](人,過ち)を許す"]],["grant",["[他]～を認める","(権利など)を与える","[名]交付,補助金"]],["recall",["[他]～を思い出す","(商品)を回収する,リコールする"]],["abandon",["[他]～を捨てる,放棄する"]],["rid",["[名](get － of ～)","(不要品)を処分する","～を取り除く"]],["eliminate",["[他](不要な人,物,事)を排除する","(be －d)敗退する"]],["relieve",["[他]～を取り除く","～を安心させる"]],["remove",["[他]～を取り除く,取り去る","(衣服)を脱ぐ"]],["resource",["[名](－s)(石油などの)資源,(人,国の)財産","(－s)(困難に立ち向かう)力量","(万一の頼みの)手段"]],["conservation",["[名]保護"]],["preserve",["[他](自然など)を保護する","(景観,平和,食品など)を保つ"]],["disaster",["[名]災害","大失敗"]],["planet",["[名]惑星","(the －)地球"]],["environment",["[名]環境,周囲(の状況)"]],["horizon",["[名]水平線,地平線","(－s)視野"]],["agriculture",["[名]農業<不可算>"]],["crop",["[名]作物","収穫(高)","[自](up)生じる"]],["soil",["[名]土,土壌"]],["weed",["[名]雑草,海草","[他]～の雑草を抜く"]],["drown",["[自]溺れ死ぬ"]],["leak",["[自]漏れる","[他]～を漏らす","[名]漏れ"]],["climate",["[名]気候","(政治,経済,文化の)状況"]],["atmosphere",["[名](the－)大気","雰囲気","(the( Earth's)－)大気圏"]],["forecast",["[名]予報","[他]～を予報する"]],["thermometer",["[名]温度計,寒暖計","体温計"]],["humid",["[形]湿気が多い"]],["tropical",["[形]熱帯の"]],["solar",["[形]太陽の"]],["mosquito",["[名]蚊"]],["species",["[名]種<単複同形>"]],["extinct",["[形]絶滅した"]],["feed",["[他]～にえさを与える","(子どもなど)を養う"]],["energetic",["[形](人,運動などが)活発な"]],["greedy",["[形]貪欲な"]],["brave",["[形]勇敢な"]],["generous",["[形]気前のよい"]],["intellectual",["[形]知的な"]],["curious",["[形](人が主語)好奇心が強い","(物が主語)奇妙な,好奇心をそそる"]],["imaginative",["[形]想像力豊かな"]],["talkative",["[形]おしゃべりの"]],["afford",["[他](can －)～する余裕がある","(SVO1O2)(O1に)O2を与える"]],["eager",["[形]熱心な"]],["selfish",["[形]利己的な,自分勝手な"]],["aggressive",["[形]攻撃的な","積極的な"]],["cruel",["[形]残酷な"]],["addicted",["[形]～の中毒になっている"]],["stubborn",["[形]頑固な"]],["earnest",["[形]真面目な","[名](in －)真面目(に)"]],["bold",["[形]大胆な"]],["guilty",["[形]申し訳なく思う,罪の意識がある","(of ～)(～の)罪を犯した"]],["innocent",["[形](of ～)(～に関して)無実の","無邪気な"]],["sincere",["[形](心から)誠実な","(言動が)心からの,偽りのない"]],["modest",["[形](人が)謙虚な","(物が)大きくない,高くない"]],["stupid",["[形]ばかな"]],["indifferent",["[形]無関心で"]],["punctual",["[形](約束などの)時間を守る"]],["coward",["[名]臆病者"]],["precise",["[形]正確な"]],["accurate",["[形]正確な"]],["proper",["[形]適切な"]],["tidy",["[形](主に<英>)きちんとした,整然とした","[他]～を整頓する"]],["neat",["[形]きちんとした"]],["efficient",["[形]能率的な,無駄がない","(人が)有能な"]],["reasonable",["[形]理にかなった","(値段が)手ごろな"]],["significant",["[形]重要な","(数量,増減,相違などが)かなりの"]],["precious",["[形](時間や命などが)貴重な","(宝石などが)高価な"]],["essential",["[形]不可欠な","[名](－s)不可欠なもの"]],["fundamental",["[形]根本的な,基本的な","[名](－s)基本事項"]],["critical",["[形]重大な,危機的な状況の","批判的な"]],["serious",["[形]深刻な","(人が)真剣な,本気の"]],["complex",["[形]複雑な","[名]複合体(の建物)","強迫観念"]],["complicated",["[形]複雑な"]],["delicate",["[形]繊細な,微妙な","(人が)虚弱な"]],["plain",["[形]明白な,わかりやすい","質素な","[名]平野,原野"]],["obvious",["[形]明白な"]],["remarkable",["[形]注目すべき,すばらしい"]],["outstanding",["[形]傑出した,目立った"]],["various",["[形]さまざまな"]],["diverse",["[形]多様な"]],["sort",["[名]種(類)","(副詞的に)(－ of)多少","[他]～を分類する"]],["fancy",["[形]高級な","[他]<英>～が欲しい,～したい"]],["marvelous",["[形]驚くべき"]],["fabulous",["[形]とても素敵な","莫大な"]],["active",["[形]積極的な,活発な"]],["positive",["[形]前向きな,積極的な","確信している"]],["pure",["[形]純粋な","(水,空気が)澄んだ"]],["steady",["[形]着実な,一定の"]],["flexible",["[形]柔軟な,融通のきく"]],["ripe",["[形]熟した"]],["mature",["[形]成熟した,熟成した","[自]成熟する,熟成する"]],["stable",["[形]安定した","[名]馬小屋,きゅう舎"]],["negative",["[形]否定的な,否定の"]],["vague",["[形]曖昧な,漠然とした"]],["weird",["[形]変な"]],["rough",["[形](表面が)粗い","おおざっぱな","(海,天候などが)荒れている"]],["severe",["[形](天候,批判,罰則などが)厳しい","(けが,問題などが)ひどい"]],["passive",["[形]受動的な,消極的な"]],["vain",["[形](in －)無駄に","(努力などが)無駄な","うぬぼれの強い"]],["fake",["[形]偽の,偽造の","[名]偽造品"]],["risky",["[形]危険な,危うい"]],["absurd",["[形]ばかげた"]],["odd",["[形]奇妙な","奇数の","半端な,雑多な","[名]<英>(the －s)可能性"]],["contrast",["[名]対比","[他]～を対比する","[自]対照をなす"]],["valid",["[形](理由,主張などが)妥当な,正当な","(切符などが)有効な"]],["available",["[形]手に入る,利用できる","(人の予定が)空いている"]],["casual",["[形]気楽な","ふとした,何気ない"]],["rare",["[形]珍しい"]],["practical",["[形](人,知識が)現実的な,実際の","(発明,道具などが)実用的な,実践的な"]],["brand-new",["[形]新品の,真新しい"]],["rapid",["[形]急速な","[名](－s)急流"]],["urgent",["[形]緊急の,差し迫った"]],["sharp",["[形](変化,方向転換などが)急激な","(言葉が)きつい","(刃物,感覚,人などが)鋭い","[副](時刻が)きっちりで"]],["calm",["[形]落ち着いた","[自]落ち着く","[他]～を落ち着かせる"]],["shallow",["[形]浅い","(人,言動などが)浅はかな"]],["bare",["[形]むき出しの","最低限の"]],["naked",["[形](人が)裸の,むき出しの"]],["independent",["[形]独立した,無所属の","[名]無所属の人"]],["tense",["[形]張り詰めた","(人が)緊張した","[名]時制"]],["broad",["[形]幅広い"]],["narrow",["[形]狭い","[他]～を狭くする,細める"]],["vacant",["[形]空いている,使用されていない"]],["vivid",["[形](記憶,描写などが)鮮明な","(色が)鮮明な"]],["mutual",["[形](感情,行為が)相互の","(友だち,趣味などが)共通の"]],["awkward",["[形]ぎこちない","気まずい","扱いにくい"]],["objective",["[形]客観的な","[名]目標"]],["manual",["[形]手を使う,身体を使う","手動の","[名]手引き書"]],["alike",["[形]似ている","[副](A and B －)(A もB も)同様に"]],["tend",["[自](to do)～する傾向にある"]],["deserve",["[他]～に値する"]],["fragment",["[名]破片<可算>"]],["ease",["[名]簡単さ","[他](痛み,心配など)を和らげる,楽にする"]],["range",["[名]範囲","[自](from A to B)(A からB の)範囲に及ぶ"]],["scale",["[名]規模","(－s)体重計","うろこ"]],["unique",["[形](to ～)(～に)特有の,独自の","独特の"]],["particular",["[形]ある特定の,特有の","(about ～)(～の)好みがうるさい","[名](in －)特に(＝particularly)"]],["general",["[形]一般的な,全体の","[名]大将,将軍"]],["ordinary",["[形]平凡な,ふつうの"]],["typical",["[形]典型的な"]],["account",["[自](for ～)","(割合を)占める","(～の原因を)説明する","[名]説明","口座"]],["calculate",["[他]～を計算する"]],["measure",["[他]～を測る","[自]～の寸法がある","[名](－s)手段"]],["split",["[他]～を割る","～を分裂させる","[自]分裂する","[名]分裂,裂け目,割れ目"]],["volume",["[名]容積,体積","ボリューム,音量","(全集などの)1巻"]],["proportion",["[名]比率","部分","(－s)規模,大きさ"]],["dozen",["[名]ダース","(－s of ～)数十の～"]],["amount",["[名]量","[自](to ～)","(合計が)～に達する","結局～になる"]],["mass",["[名]大量","(the －es)大衆","かたまり","質量","(M－)ミサ"]],["shortage",["[名]不足<可算>"]],["enormous",["[形]莫大な,巨大な"]],["spare",["[形]余分な,予備の","[他](時間やお金,労力)を割く","～を惜しむ"]],["arrange",["[他]～を手配する","～を整理する"]],["adapt",["[自]適応する","[他]～を適応させる"]],["match",["[他]～と調和する","～に匹敵する","[名]釣り合う人［物］,好敵手"]],["fit",["[他](サイズが人)に合う","[形]健康な","(to do)(～するのに)適した"]],["emergency",["[名]緊急事態","(形容詞的に)緊急の"]],["occasion",["[名]場合","行事,祝い事"]],["circumstance",["[名](通例 －s)状況,事情"]],["incident",["[名](主に不快な)出来事"]],["current",["[形]最新の,今の","流通して","[名]流れ,風潮"]],["temporary",["[形]一時的な"]],["permanent",["[形]永久的な"]],["previous",["[形](時間,順序で)前の,以前の"]],["former",["[名](the －)前者","[形]前任の"]],["annual",["[形]年に1度の","1年間の"]],["contemporary",["[形]現代の","同時代の","[名]同時代の人"]],["lately",["[副]最近"]],["immediately",["[副]すぐに"]],["supply",["[他]～を供給する","[名]供給"]],["replace",["[他]～に取って代わる","(A with B)(A)を(B に)取り替える"]],["exchange",["[他]～を交換する","[名]交換"]],["substitute",["[他](A for B) (B の)代わりに(A)を用いる","[自](for ～)(～の)代わりになる,代わりをする","[形]代わりの","[名](for ～)(～の)代用品,代理人"]],["submit",["[他](願書,辞表など)を提出する","[自](to ～)(～に)服従する"]],["alternative",["[名](to ～)(～の)代わりのもの","選択肢","[形]代わりの"]],["deliver",["[他]～を配達する","(演説など)をする"]],["enclose",["[他]～を同封する","～を囲む,閉じ込める"]],["envelope",["[名]封筒"]],["trick",["[名](悪意のない)いたずら","(巧妙な)手口,策略","芸,手品","(of ～)秘けつ","[他]～をだます"]],["load",["[名]荷(物)<可算>","[他](A with B)(A)に(B を)積む"]],["content",["[名]中身,内容","[形](with ～)(～に)満足して"]],["routine",["[名]日課,決まり切った仕事","[形]日課の"]],["household",["[名](集合的に)所帯,家庭<可算>","[形]家庭の"]],["good",["[名](－s)商品","利益","[形](a － many ～)かなりの"]],["luxury",["[名]高級(品),ぜいたく品","(形容詞的に)豪華な,ぜいたくな"]],["credit",["[名](－ card)クレジットカード","功績,手柄","(大学の)単位","[他]～の功績を認める"]],["questionnaire",["[名]アンケート"]],["reservation",["[名]予約","慎重な姿勢"]],["applause",["[名]拍手<不可算>"]],["fuss",["[名]大騒ぎ"]],["reward",["[名]報酬,褒美 ,懸賞金","[他]～に褒美を与える,報いる"]],["farewell",["[名]別れ(のあいさつ)"]],["reception",["[名]もてなし,歓迎会","(ホテルの)フロント","受信状況"]],["hospitality",["[名]もてなし,歓迎"]],["portion",["[名](食事の)1盛り","(食堂などでの)1人前","一部"]],["laundry",["[名]<米>洗濯","<米>洗濯物","クリーニング店(＝a cleaner's)"]],["stain",["[名]シミ,汚れ","[他]～にシミをつける,～を汚す"]],["dye",["[他]～を染める","[名]染料"]],["outlet",["[名](電気の)コンセント","(販売)店","(感情などの)はけ口"]],["nap",["[名]昼寝,仮眠","[自]昼寝をする,仮眠をとる"]],["wake",["[自]目が覚める","[他](眠っている人)を起こす"]],["vending machine",["[名]自動販売機"]],["grocery",["[名]食料雑貨店","(-ies)食料雑貨類"]],["appointment",["[名](病院などの)予約,(面会の)約束","(役職などの)任命,指名"]],["consult",["[他]～に相談する","(辞書)を引く","[自](with ～)(～に)相談する"]],["register",["[他]～を登録する,記録する","[自](for ～)(授業などに)登録する","(ホテルなどで)記帳する","[名]登録(票),登録簿"]],["subscribe",["[自](to ～)(～を)定期購読する,加入している","(主に否定文で)(to ～)(考えなどを)支持する"]],["guarantee",["[他]～を保証する","[名]保証(期間)"]],["wipe",["[他]～を拭く","～を一掃する,壊滅させる"]],["sweep",["[他](床,地面)を掃く","(風,波などが)～を押し流す"]],["transfer",["[自](電車などを)乗り換える","転勤［転校,移籍］する","[他](物,活動拠点など)を移す,～を転勤［転属］させる","(銀行で)～を振り込む"]],["divorce",["[自]離婚する","[他]～と離婚する","[名]離婚"]],["fate",["[名]運命,宿命"]],["destiny",["[名]運命"]],["flavor",["[名]風味,味<可算>"]],["perfume",["[名]香り","香水"]],["ingredient",["[名](料理などの)材料","(何かを達成するための)要因","成分"]],["tender",["[形](肉などが)柔らかい","(愛情があり)優しい","(皮膚などが)弱い"]],["bitter",["[形]苦い,つらい","憤慨して"]],["aisle",["[名]通路"]],["track",["[名]足跡,小道","(鉄道の)線路,プラットホーム","[他]～を追跡する"]],["district",["[名]地区"]],["facility",["[名]施設,設備","能力,器用さ"]],["basement",["[名]地下(室)"]],["height",["[名]高さ","高い所","最盛期"]],["distant",["[形]遠い"]],["remote",["[形](地理的に)へんぴな","(時間,関係などが)遠い"]],["locate",["[他](be －d)～に位置している,ある","～の場所を見つける"]],["occupy",["[他]～を占める"]],["surround",["[他]～を取り囲む,包囲する"]],["classical",["[形](音楽,バレエ,ダンスなどで)クラシックの","古典的な"]],["civilization",["[名]文明"]],["heritage",["[名]遺産<不可算>"]],["script",["[名]台本,脚本","(ある言語の)文字","(手書きの)文字"]],["tale",["[名]話"]],["literature",["[名]文学","文献","2ともに<不可算>)"]],["tragedy",["[名]悲劇<可算>"]],["poetry",["[名]詩<不可算>"]],["biography",["[名]伝記"]],["term",["[名]用語,言葉","(long［short］などを伴い)期間,学期,任期","(be on ～ －s)(～の)間柄(である)","(－s)(契約などの)条件"]],["proverb",["[名]ことわざ"]],["fluent",["[形]流暢な"]],["translate",["[他]～を翻訳する","[自](into ～)(結果として)～に変わる"]],["define",["[他]～を定義する","～を規定する"]],["interpret",["[他]～を解釈する","～を通訳する","[自]通訳する"]],["quote",["[他]～を引用する"," ～に価格を提示する"]],["literally",["[副]文字どおりに"]],["indicate",["[他](データなどが)～を示す","～を指し示す"]],["reveal",["[他]～を明らかにする,暴露する"]],["announce",["[他]～を発表する"]],["broadcast",["[他]～を放送する","[名]( 1 回の)放送"]],["prove",["[他]～を証明する","(to be ～)～だとわかる"]],["advertise",["[他]～を宣伝する"]],["seek",["[他]～を求める","(to do)～しようと努める"]],["entertain",["[他]～を楽しませる"," ～をもてなす"]],["amuse",["[他]～を楽しませる"]],["attract",["[他]～を引きつける,魅了する"]],["fascinate",["[他]～を魅了する,～にとても興味をもたせる"]],["absorb",["[他](be －ed in ～)～に没頭する","～を吸収する"]],["fond",["[形]好きで"," 懐かしい"]],["scare",["[他]～をおびえさせる"]],["alarm",["[他]～をぎょっとさせる","[名] 恐怖,不安"]],["amaze",["[他]～を驚かせる"]],["irritate",["[他](長期にわたって)～をいらいらさせる"]],["puzzle",["[他]～を当惑させる","[名]難問,パズル"]],["confuse",["[他] ～を混乱させる,困惑させる","(A with［and］ B) (A)を(Bと)混同する"]],["bore",["[他]～をうんざりさせる,退屈させる"]],["frustrate",["[他] ～を欲求不満にさせる","(計画など)を挫折させる"]],["disappoint",["[他]～を失望させる"]],["embarrass",["[他]～に恥ずかしい思いをさせる,困惑させる"]],["ashamed",["[形]恥ずかしい"]],["uneasy",["[形]不安な,胸騒ぎがする"]],["hesitate",["[自]ためらう"]],["reluctant",["[形](to do)(～するのは)気が進まない"]],["tremble",["[自]震える"]],["boast",["[自]自慢する","[他](場所や組織が)～を誇りにしている"]],["jealous",["[形](of ～)(～に)嫉妬した"]],["envy",["[他]～を羨ましく思う","[名] 羨望"]],["yell",["[自]叫ぶ,大声をあげる","[名]叫び,わめき声"]],["respect",["[他](人)を尊敬する","(物)を尊重する","[名](for ～)(～に対する)尊敬,尊重","(in －)点"]],["despair",["[名]絶望"]],["emotion",["[名](特に強い)感情<可算>"]],["sympathy",["[名]同情"," 共感"]],["shame",["[名]残念なこと","恥"]],["ambition",["[名](強い)願望,野望"]],["confidence",["[名]自信","(in ～)(～に対する)信頼"]],["courage",["[名]勇気"]],["ignore",["[他](人,物)を無視する"]],["owe",["[他](A to B)","(A)は(B の)おかげだ","(A)を(B に)借りている"]],["fear",["[名]恐怖","[他] ～を恐れる"," ～を心配する"]],["method",["[名]方法"]],["medium",["[名](情報伝達)手段,媒体,メディア","[形] 中間の"]],["means",["[名]手段<単複同形>","(特定な表現で)財産,収入"]],["extent",["[名]程度"]],["extremely",["[副]極度に,非常に"]],["total",["[形]全体の","(a －)まったくの","[名]合計"]],["largely",["[副]大部分は","主に"]],["moderate",["[形]適度な,節度のある"]],["somewhat",["[副]いくぶん"]],["subtle",["[形]かすかな"]],["possibly",["[副]ひょっとすると","(cannot －)どうしても(～できない)"]],["eventually",["[副]最終的に,ついに"]],["necessarily",["[副](not －)必ずしも(～ない)"]],["frankly",["[副]率直に"]],["ironically",["[副]皮肉なことに"]],["moreover",["[副]その上"]],["otherwise",["[副]さもなければ"," ほかの点では"," ほかの方法で"]],["regardless",["[副](of ～)(～とは)無関係に"]],["worth",["[前]～の価値がある","(－ doing)(～する)価値がある","[名] 価値,(～)相当"]],["according to",["[前](調査,人の話など)によれば","(能力など)に応じて"]],["propose",["[他]～を提案する","[自](to ～)(～に)結婚を申し込む"]],["demand",["[他]～を(強く)要求する","[名](for ～)(～への)要求,需要"]],["desire",["[名]願望","[他]～を強く望む"]],["dismiss",["[他](意見や考えなど)を退ける","～を解雇する"]],["bless",["[他]～を祝福する"]],["glory",["[名]栄光"]],["compliment",["[名]褒め言葉,賛辞","[他]～を褒める"]],["feast",["[名]宴会,祝宴","とても楽しいこと,喜ばせるもの"]],["declare",["[他]～を宣言する","(税関や税務署で)～を申告する"]],["demonstrate",["[他]～を(はっきり)示す,実演する"]],["highlight",["[他]～を強調する","[名]呼び物,目玉商品,ハイライト"]],["imply",["[他](暗に)～を意味する,ほのめかす"]],["recite",["[他]～を暗唱する"]],["ray",["[名]光線","放射線","(a － of)一縷の,わずかな"]],["radiation",["[名]放射線"]],["laboratory",["[名]研究室,研究所"]],["oxygen",["[名]酸素"]],["molecule",["[名]分子"]],["compound",["[名]化合物","[形]複合的な"]],["tissue",["[名]組織","ティッシュペーパー"]],["cell",["[名]細胞","電池","独房","2,3いずれも<可算>)"]],["gene",["[名]遺伝子<可算>"]],["solid",["[形]固体の","ぎっしり詰まった","[名]固体"]],["satellite",["[名](月などの)衛星","人工衛星"]],["orbit",["[名]軌道","[他](惑星などが)～を周回する"]],["launch",["[他](ロケットなど)を打ち上げる","(運動,事業など)を始める","[名]打ち上げ,開始,発売"]],["attempt",["[名]試み","[他](to do)(～しようと)試みる"]],["capacity",["[名]能力","容量,収容力"]],["capable",["[形](of ～)(～する)力がある","有能な"]],["attain",["[他](人が主語)～を達成する","(物,人が主語)～に到達する"]],["desperate",["[形]必死の","(状況が)絶望的な"]],["struggle",["[自]苦闘する,もがく","[名]苦闘,もがくこと<可算>"]],["dedicate",["[他](A to B)(A)を(B に)ささげる"]],["pain",["[名]苦痛","(－s)苦労"]],["strain",["[名](心身の)負担,無理","[他](目や筋肉など)を痛める"]],["remedy",["[名]治療法,治療薬","改善策,対策("]],["fatigue",["[名](ひどい)疲労<不可算>"]],["obesity",["[名](病的な)肥満"]],["nursing",["[名]看護"]],["terminal",["[形](病気が)末期の","[名]終着［始発］駅(の建物),ターミナルビル"]],["pregnant",["[形]妊娠した"]],["heal",["[他]～を治す","[自]治る"]],["ankle",["[名]足首"]],["thumb",["[名]親指"]],["forehead",["[名]額,おでこ"]],["chin",["[名]下あご,あごの先端"]],["chest",["[名]胸(部)","(大きな木の)箱,密閉容器"]],["breast",["[名](主に女性の)胸,乳房"]],["lung",["[名]肺<可算>"]],["organ",["[名]臓器,(動植物の)器官","(楽器)オルガン"]],["vision",["[名]視力,視野","未来像","未来を見通す力,先見の明"]],["skeleton",["[名]がい骨,骨格"]],["sensation",["[名]感覚","(説明し難い)感情"]],["code",["[名](服装などの)規定","暗号"]],["agenda",["[名]議題,協議事項"]],["gender",["[名]性,性別"]],["liberty",["[名]自由"]],["humanity",["[名](集合的に)人類","(the －ies)人文科学","人間性"]],["mankind",["[名](集合的に)人類"]],["authority",["[名]権威","権力","(－ies)当局"]],["justice",["[名]正義"]],["insurance",["[名]保険<不可算>"]],["hardship",["[名](主に経済的)苦難"]],["poverty",["[名]貧困<不可算>"]],["chaos",["[名]大混乱,混沌<不可算>"]],["isolation",["[名]孤立,分離,孤独感"]],["interaction",["[名] 交流,やりとり","相互作用"]],["region",["[名]地域"]],["proof",["[名]証拠,証明<不可算>","[形](複合語で)～を防ぐ,～に耐える"]],["principle",["[名]原理,原則","主義,信念"]],["origin",["[名]起源"]],["setting",["[名]環境,状況","(小説,劇,機械などの)設定,舞台"]],["monument",["[名]記念碑,遺跡,史跡"]],["mission",["[名]任務,使命","使節団","(主にキリスト教の)布教(団)"]],["project",["[名]計画,企画","[他](予算など)を見積もる","～を投影する"]],["revolution",["[名]革命"]],["pension",["[名]年金<可算>"]],["found",["[他]～を創立する"]],["contract",["[名]契約","[他]～を契約する","(病気)に感染する"]],["negotiate",["[自](with ～)(～と)交渉する","[他](交渉の上で,条件など)を取り決める"]],["cooperate",["[自](with ～)(～と)協力する,(in ～)(～を)協力する"]],["restore",["[他](治安など)を回復する","(古い建物,絵など)を修復する"]],["conservative",["[形]保守的な"]],["affair",["[名](－s)情勢","(スキャンダラスな)事件"," 情事,浮気"]],["agency",["[名](政府)機関","代理店"]],["council",["[名]議会"]],["kingdom",["[名]王国","(the ～ kingdom)～界,社会"]],["republic",["[名]共和国"]],["empire",["[名]帝国"]],["security",["[名](国家などの)安全","防犯,防衛"]],["aid",["[名]援助,救援物資<不可算>"]],["reform",["[名]改革"]],["mayor",["[名]市長"]],["minister",["[名]大臣","牧師"]],["poll",["[名](政治関連の)世論調査","投票","[他](得票)を得る"]],["fortune",["[名]財産","運"]],["property",["[名](主に集合的)財産,資産","(建物を含む)所有地","(物質の)特性"]],["fund",["[名](－s)資金","基金","[他]～に資金を出す"]],["stock",["[名]株(式)","在庫品,蓄え"]],["bankrupt",["[形]倒産した,破産した"]],["labor",["[名]労働","(集合的に)労働者","努力,陣痛"]],["overwork",["[自]働きすぎる","[他]～を働かせすぎる,酷使する","[名]過労"]],["firm",["[名]会社","[形](土台,信念などが)固い","(体が)引き締まった"]],["union",["[名]労働組合","合併","連邦"]],["administration",["[名]経営,運営","行政","政権","2は<不可算>)"]],["secretary",["[名]秘書","(米国の各省の)長官,事務局長"]],["editor",["[名](新聞,雑誌などの)編集長,(書籍の)編集者"]],["client",["[名]依頼人","(サービス業の)取引先"]],["colleague",["[名](from ～)(～の)同僚"]],["basis",["[名]基礎,根拠","(on a ～ basis)(～を)基準(として)"]],["element",["[名](最も重要な)要素,(化学の)元素","(the －s)自然の力,悪天候","(an － of ～)少しの～"]],["constitute",["[他](主語が複数)～を構成する","(主語が単数)～である"]],["unify",["[他]～を統一する"]],["unite",["[自]団結する","[他]～を団結させる"]],["combine",["[他](A with B) (A)を(B と)結びつける,同時に行う","[自]結びつく"]],["murder",["[名]殺人","(形容詞的に)殺人の","[他](計画的に)～を殺す"]],["arrest",["[他]～を逮捕する","[名]逮捕"]],["prison",["[名]刑務所"]],["vice",["[名](売春,麻薬などの)犯罪<不可算>","悪徳","[形] 副～"]],["witness",["[名]目撃者,証人"," 証言","[他]～を目撃する"]],["conflict",["[名]対立,紛争","葛藤","[自](with ～)(～と)矛盾する"]],["bullet",["[名]弾丸"]],["wound",["[名]傷","[他]～を傷つける"]],["triumph",["[名]勝利","[自]勝利する"]],["military",["[形]軍事的な"]],["strategy",["[名]戦略"]],["conquer",["[他](国や地域)を征服する","(病気や恐怖など)を克服する"]],["defend",["[他](A from B)(B からA)を守る"]],["quarrel",["[自](with ～)(～と)口論する","[名]口論"]],["rob",["[他](銀行など)を襲う","(A of B)(A)から(B を)奪う"]],["deprive",["[他](A of B) (A)から(B を)奪う"]],["devastate",["[他](町など)を壊滅させる","(人)を打ちのめす"]],["hazard",["[名]危険(になり得るもの)"]],["orphan",["[名]孤児"]],["infant",["[名](主に歩く前の)幼児"]],["slave",["[名]奴隷","(to ～)(比喩的に)(～の)奴隷"]],["acquaintance",["[名]知人","面識,(ちょっとした)知識"]],["merchant",["[名]商人"]],["resident",["[名]住人,居住者","滞在者","[形]住んでいる"]],["crew",["[名](集合的に)乗組員","(取材などの)チーム"]],["commute",["[自]通勤する","[名]通勤"]],["chase",["[他]～を追いかける","[名]追跡"]],["overtake",["[他]～を追い越す"]],["fade",["[自](色,記憶などが)薄れる"]],["dissolve",["[自]溶ける","[他]～を溶かす","(議会など)を解散する"]],["float",["[自]浮かぶ","[他]～を浮かべる"]],["sink",["[自]沈む","[他]～を沈める","[名](台所の)流し"]],["fluctuate",["[自](数値,物価が)変動する"]],["circulate",["[自]循環する,流布する","[他]～を循環させる"]],["transform",["[他]～を(大幅に)変える","[自](大幅に)変形する,変身する"]],["shift",["[名](考え方の)転換","(勤務の)交替"]],["modify",["[他]～を修正する"]],["revise",["[他](制度,予測,論文など)を修正する,改正する"]],["vehicle",["[名](エンジンの付いた)車両","(思想,意見の)伝達手段"]],["voyage",["[名]航海,船旅"]],["confirm",["[他]～を確認する","～を裏付ける"]],["ensure",["[他]～を確実にする"]],["address",["[他]～に取り組む","～に呼びかける","[名]演説","住所"]],["approach",["[名](to ～)(～への)取り組み方,接近","[他]～に取り組む,接近する"]],["resolve",["[他]～を解決する","(to do)(～する)決心をする"]],["settle",["[他](紛争など)を解決する","～を置く,据える","[自]定住する","(on ～)(～を)決める"]],["warn",["[他]～に警告する"]],["force",["[他]～に強いる","[名]力,武力"]],["boost",["[他]～を促進させる,増大させる"]],["appeal",["[自](to ～)(～に)訴える","[名]魅力,人気","(for ～)(～に対する)訴え"]],["leap",["[自]跳ぶ","[名]躍進,急増"]],["grab",["[他](ぐいっと)～をつかむ","(急いで食事,睡眠)をとる"]],["seize",["[他]～をつかむ","(麻薬など)を押収する,(犯人)を捕らえる"]],["cast",["[他]～を投げる","(光など)を投げかける","～に役を与える"]],["slap",["[他]～を平手打ちする"]],["stun",["[他]～を気絶させる","～をぼう然とさせる"]],["illuminate",["[他]～を照らす","(問題など)を解明する"]],["mend",["[他]～を修繕する"]],["react",["[自](to ～)(～に)反応する"]],["endure",["[他](長期にわたり)～に耐える"]],["encounter",["[他]～に偶然出会う","(問題,反対など)に遭う","[名]出会い"]],["neglect",["[他]～を怠る,放置する","(子ども)の世話をしない","[名]放置"]],["undergo",["[他]～を経験する"]],["trace",["[他]～を捜し出す","～の追跡調査をする","[名](微妙な)跡"]],["conduct",["[他]～を行う","(電気,熱)を伝える","[名]行為"]],["emerge",["[自](隠れていたものが)現れる","(国家などが)台頭する"]],["unfold",["[自]展開する,はっきりしてくる","[他]～を広げる"]],["derive",["[自](from ～)(～に)由来する","[他]～を引き出す,得る"]],["possess",["[他]～を所有している"]],["retain",["[他]～を保持する"]],["secure",["[他](場所,地位,契約など)を確保する","[形]安全で,守られて"]],["capture",["[他]～を捕らえる","[名]捕獲,(敵地の)攻略"]],["inquiry",["[名](into ～)(～の)調査","質問,問い合わせ"]],["specialize",["[自](in ～)","<英>(～を)専攻する","(～を)専門にする"]],["semester",["[名](米,日本などの2 学期制の)学期"]],["biology",["[名]生物学"]],["ecology",["[名]生態(学)"]],["philosophy",["[名](学問としての)哲学<不可算>","人生哲学,考え方<可算>"]],["geography",["[名]地理(学)"]],["psychology",["[名]心理学","心理"]],["institution",["[名](大学,病院などの)機関","(結婚などの)制度"]],["dormitory",["[名]寮"]],["notion",["[名]考え"]],["concept",["[名]概念,考え"]],["meditation",["[名]瞑想","熟考"]],["insight",["[名](into ～)(～に対する)洞察(力)","見識"]],["outlook",["[名](人生,世界などに対する)考え方","(経済,天候などの)見通し"]],["caution",["[名]用心","警告","[他]～に注意［警告］を与える"]],["will",["[名]意志","遺書"]],["option",["[名]選択肢,選択(の自由)"]],["nightmare",["[名]悪夢","悪夢のようなこと"]],["keen",["[形](頭脳,感性などが)鋭い","(be － on ～)(～に)熱中して,好きで"]],["cherish",["[他]～を大切にする,胸に抱く"]],["intend",["[他](to do)～するつもりだ"]],["suspect",["[他](that S V)～ではないかと思う","～に嫌疑をかける","[名]容疑者"]],["comprehend",["[他]～を(十分に)理解する"]],["misunderstand",["[他](人,人の言うこと)を誤解している"]],["identify",["[他]～を(何なのか)特定する","(A with B)(A)を(B と)同一視する","(with ～)(～に)なりきる"]],["permit",["[他]～を許可する","[名]許可証"]],["acknowledge",["[他]～を認める"]],["trim",["[他]～を刈り込む,切り取る","[形]こぎれいな"]],["omit",["[他]～を省く"]],["cultivate",["[他]～を耕す","～を育む","～を磨く"]],["shade",["[名]日陰,(絵画,写真の)陰の部分,ブラインド","(意味などの)わずかな違い"]],["breeze",["[名]そよ風"]],["desert",["[名]砂漠","[他]～を見捨てる"]],["fog",["[名]霧"]],["moisture",["[名]湿気,水分"]],["damp",["[形]湿った,じめじめした"]],["path",["[名](小)道"]],["trail",["[名]山道","跡","(a － of destruction)爪跡"]],["stream",["[名]小川","(a － of ～)(～の)流れ"]],["tide",["[名]潮(の干満),潮流","時流"]],["habitat",["[名]生息地"]],["layer",["[名](大気や地面などの)層"]],["volcano",["[名]火山"]],["mine",["[名]鉱山","地雷(＝landmine)"]],["scent",["[名](花,果物の良い)香り","(動物が残したそれ自身の)臭い"]],["wheat",["[名]小麦"]],["swallow",["[名]ツバメ","[他]～を飲み込む"]],["web",["[名](クモの)巣","インターネット(www＝the World Wide Web)"]],["cattle",["[名]ウシ"]],["kitten",["[名]子ネコ"]],["organism",["[名]生物"]],["wildlife",["[名]野生生物"]],["beast",["[名]野獣"]],["ape",["[名]類人猿"]],["mammal",["[名]哺乳動物,哺乳類"]],["flock",["[名](鳥,羊の)群れ","[自]群れる"]],["breed",["[自]繁殖する","[他]～を繁殖させる","～を引き起こす","[名]品種,血統"]],["reproduce",["[他]～を繁殖させる","(音,絵など)を再現する"]],["hatch",["[自](卵から)かえる,孵化する","[他](卵から)～をかえす"]],["diligent",["[形]勤勉な"]],["noble",["[形]高潔な","貴族の","[名]貴族<可算>"]],["arrogant",["[形]傲慢な"]],["timid",["[形]臆病な"]],["humble",["[形]控えめな","卑しい,貧しい"]],["inclined",["[形](be ～ to do)～する傾向がある","～したい気持ちだ"]],["principal",["[形]主要な","[名]<米>校長"]],["prime",["[形](目標,容疑者などが)最重要な","[名]素数"]],["indispensable",["[形]不可欠な"]],["grave",["[形]重大な","[名]墓(穴)"]],["definite",["[形]明確な"]],["evident",["[形]明らかな"]],["prominent",["[形](物が)目立った","(人が)著名な,重要な"]],["marked",["[形](名詞の前で)際立った,著しい"]],["grace",["[名]優美さ","(say －)(食事の前後の)感謝の祈り(をささげる)"]],["charm",["[名]魅力","(a good-luck －)お守り,まじない"]],["rational",["[形]理性的な"]],["magnificent",["[形]壮大な,素晴らしい"]],["superior",["[形](be － to ～)(～)より優れている","[名]上役,上司"]],["loyal",["[形](to ～)(～に)忠実な"]],["horrible",["[形](物,天気などが)とてもひどい,ぞっとする"]],["miserable",["[形]悲惨な,とても不幸な"]],["dull",["[形]退屈な","切れ味が悪い","鈍い"]],["nasty",["[形](人,物,発言などが)不快な"]],["insane",["[形]正気でない"]],["ridiculous",["[形]ばかげた"]],["notorious",["[形](for ～)(～で)悪名高い"]],["evil",["[形](道徳的に)悪い","[名]悪"]],["mess",["[名]乱雑","[自](with ～)(～を)からかう,ちょっかいを出す"]],["vast",["[形](地域,土地が)広大な","(数量が)莫大な"]],["huge",["[形]巨大な"]],["tiny",["[形]とても小さな"]],["sphere",["[名]球体","範囲,領域"]],["strip",["[名]細長い一片","[他](罰として)～から奪う","[自]裸になる"]],["internal",["[形]内部の","国内の"]],["mobile",["[形]流動的な","[名]携帯電話"]],["steep",["[形](坂などが)険しい","(増減が)急な,(価格などが)異常に高い"]],["intense",["[形](感情,競争などが)強烈な"]],["abstract",["[形]抽象的な","[名](論文などの)要旨"]],["inevitable",["[形]避けられない,必然的な"]],["neutral",["[形]中立の","[名]中立"]],["brief",["[形]手短な,簡潔な","[名]要約"]],["potential",["[形]潜在的な","[名]潜在能力,可能性<不可算>"]],["tough",["[形]たくましい,頑強な","骨の折れる,厳しい"]],["secondhand",["[形]中古の","間接的な"]],["resemble",["[他]～に似ている"]],["contrary",["[名](on the －)それどころか","[副](－ to A)(A とは)反対に","[形]((名詞) to the －)それとは反対の～"]],["category",["[名]範疇"]],["scope",["[名]範囲"]],["respective",["[形]それぞれの"]],["given",["[形](時間,量などが)定められた","[前]～を考慮すると"]],["peculiar",["[形](to ～)(～に)固有の","独特な,変な"]],["plenty",["[名](of ～)十分な～,たくさんの～"]],["sufficient",["[形]十分な"]],["numerous",["[形]多くの"]],["substantial",["[形]かなりの,たくさんの","内容のある,重要な"]],["unit",["[名]単位"]],["diameter",["[名]直径"]],["quantity",["[名]量"]],["deficiency",["[名]欠乏,不足"]],["lessen",["[他]～を減らす"]],["era",["[名]時代"]],["session",["[名](活動の)期間","(議会などの)会期","(ある活動の)集まり"]],["pause",["[名]休止","[自]休止する"]],["meanwhile",["[副]その間","(対比を示して)その一方で"]],["souvenir",["[名]土産,記念品"]],["brick",["[名]れんが","<英>(おもちゃの)積み木"]],["pole",["[名]棒,さお,柱","(天体,地球の)極"]],["thread",["[名]糸","[他]～に糸を通す"]],["mischief",["[名]いたずら<不可算>"]],["superstition",["[名]迷信"]],["storage",["[名]貯蔵,保管<不可算>"]],["shelter",["[名]避難(所)","住居"]],["garment",["[名]衣類"]],["cabinet",["[名]戸棚","(the C－)内閣"]],["recipe",["[名]レシピ,調理法","秘訣,原因"]],["brochure",["[名]パンフレット"]],["shipping",["[名](商品の)発送"]],["fetch",["[他](主に<英>)～を取って来る"]],["distribute",["[他]～を分配する,配る","(be －d)分布している"]],["statue",["[名]像"]],["sculpture",["[名]彫刻"]],["carve",["[他]～を彫る,刻む"]],["myth",["[名](俗説という意味での)神話","(古代の)神話"]],["craft",["[名]工芸(品)","(職人の)技術","船,乗り物"]],["journal",["[名]雑誌,専門誌","(公的な)日誌,日記"]],["heaven",["[名]天国","(the －s)空"]],["funeral",["[名]葬式"]],["soul",["[名]魂","(慣用句あるいは否定文で)人"]],["priest",["[名]神父,僧侶,牧師,聖職者"]],["faith",["[名](主に宗教上の)信仰","信頼"]],["sacred",["[形]神聖な"]],["divine",["[形]神の"]],["context",["[名]文脈","状況"]],["singular",["[形]単数の","(褒めて)比類なき","奇妙な"]],["command",["[名]言語を操る力","命令","[他]～を集める","～を見渡せる"]],["instance",["[名]例"]],["narrative",["[名]語り,物語"]],["dialogue",["[名](本,劇,映画の中の)会話","対談,対話"]],["usage",["[名]語法"]],["accent",["[名]訛","アクセント"]],["temper",["[名]気性","平静(な気分)"]],["affection",["[名]愛情"]],["enthusiasm",["[名]情熱,熱意"]],["passion",["[名]情熱"]],["rage",["[名]激怒","[自](戦争,病気が)激しく続く,猛威をふるう"]],["sorrow",["[名]悲しみ"]],["incredible",["[形]信じられない"]],["chuckle",["[自]くすくす笑う","[名]くすくす笑うこと"]],["tease",["[他]～をからかう,冷やかす"]],["dare",["[他](to do)思い切って～する","[助](do)思い切って～する"]],["willing",["[形](be － to do)嫌がらずに～する"]],["scream",["[自]悲鳴を上げる","[名]悲鳴"]],["soothe",["[他](人)をなだめる","(痛みなど)をやわらげる"]],["tempt",["[他]～を誘惑する"]],["scold",["[他]～を叱る"]],["oppress",["[他]～を圧迫する,虐げる"]],["threaten",["[他](to do)～すると脅す","～を脅かす","～のおそれがある"]],["delight",["[他]～を喜ばせる","[名](大)喜び"]],["astonish",["[他]～を(とても)驚かせる"]],["mourn",["[他]～を嘆く,悼む"]],["offend",["[他](人,物が)～を怒らせる,～の気分を害する"]],["depress",["[他]～を憂うつにさせる,落ち込ませる"]],["sacrifice",["[他]～を犠牲にする","[名]犠牲"]],["impulse",["[名]衝動"]],["curse",["[名]災いの元","呪い","[他]～を呪う,ののしる"]],["factor",["[名]要因"]],["stem",["[自](from ～)(～が)原因である","[名]茎,幹,ワイングラスの脚"]],["trigger",["[他]～のきっかけになる,～を誘発する","[名](銃の)引き金"]],["consequence",["[名]結果","(of －) 重要性"]],["process",["[名]過程","[他]～を加工する,処理する"]],["resort",["[自](to ～)(～に)訴える","[名]行楽地","手段"]],["formula",["[名]方法","秘けつ","(数学,化学などの)式,公式"]],["procedure",["[名]手続き,手順"]],["extraordinary",["[形]並外れた","臨時の(会議など)","特命の(大使など)"]],["absolute",["[形]絶対的な"]],["overwhelming",["[形]圧倒的な"]],["altogether",["[副]完全に","全部で"]],["entire",["[形]すべての"]],["tremendous",["[形]すさまじい"]],["sheer",["[形](数量やサイズを強調して)とてつもない～の","まったくの"]],["partial",["[形]部分的な","不公平な","(to ～)(～が)大好きで"]],["barely",["[副]かろうじて","ほとんど～ない"]],["slight",["[形]わずかな"]],["approximately",["[副](数量が)おおよそ,約"]],["frequently",["[副]頻繁に"]],["apparently",["[副]どうやら～らしい","見たところでは"]],["merely",["[副](主に名詞の前で)～にすぎない","(動詞などの前で)単に"]],["nevertheless",["[副]それにもかかわらず"]],["somehow",["[副]何らかの方法で","何らかの理由で,どういうわけか"]],["thus",["[副]それゆえ(に)","このように"]],["pretty",["[副]まあまあ","[形]かわいい"]],["despite",["[前]～にもかかわらず"]],["assert",["[他]～と断定する,～を主張する"]],["defy",["[他]～に逆らう","～を拒む"]],["condemn",["[他]～を非難する","～に(刑の)宣告をする"," ～を強いる"]],["contradict",["[他]～と矛盾する","～に反論する"]],["cite",["[他]～を引き合いに出す,引用する"]],["illustrate",["[他](例で)～を説明する,例証する","～に挿絵を入れる,～を図解する"]],["articulate",["[他](考えなど)をはっきり述べる","[形]考えを明確に表現できる"]],["advocate",["[名]提唱者,支持者","[他]～を主張する,支持する"]],["breakthrough",["[名]飛躍的進歩,大発見"]],["evolution",["[名]進化"]],["innovation",["[名]革新"]],["probe",["[名]探査機","[他]～を調査する"]],["fluid",["[名]流体","[形]流動的な,なめらかな"]],["particle",["[名]粒子","(not a － of A)(A の)かけら(もない)"]],["gravity",["[名]重力","重大さ"]],["friction",["[名]摩擦"]],["mutation",["[名]突然変異"]],["heredity",["[名]遺伝"]],["hypothesis",["[名]仮説"]],["specimen",["[名]標本","サンプル"]],["microscope",["[名]顕微鏡"]],["realm",["[名]領域,領土"]],["acid",["[形]酸性の","辛辣な"]],["toxic",["[形]有害な,有毒な"]],["poison",["[名]毒"]],["strive",["[自]努力する"]],["endeavor",["[名]努力,試み","[他]～を(懸命に)努力する,試みる"]],["manufacture",["[他]～を製造する","[名]製造,製品"]],["yield",["[他]～を産出する","[自](to ～)(～に)屈する","[名]産出量"]],["duplicate",["[他]～を複製する","[名]複製品","[形]複製の"]],["assemble",["[他]～を組み立てる","[自]集まる"]],["mold",["[他]～を(型に入れて)作る","(人格,意見など)を形成する"]],["coin",["[他]～を作り出す","[名]硬貨"]],["physician",["[名]<米>医師","<英>内科医"]],["veterinarian",["[名]獣医"]],["therapy",["[名]治療(法)"]],["injection",["[名]注射"]],["dose",["[名](1回分の)服用量"]],["sanitation",["[名]衛生"]],["germ",["[名]細菌,ばい菌<可算>"]],["tumor",["[名]腫瘍<可算>"]],["agony",["[名]苦痛"]],["disorder",["[名](心身の)不調"]],["plague",["[名](大規模な)疫病,伝染病,災害","[他]～を苦しめる"]],["epidemic",["[名](大)流行"]],["diagnosis",["[名]診断"]],["mortality",["[名](－ rate)死亡率","死すべき運命"]],["chronic",["[形]慢性の"]],["immune",["[形]免疫の(ある)"]],["choke",["[自](on ～)(～で)息が詰まる,窒息する","[他]～を窒息させる"]],["paralyze",["[他]～を麻痺させる"]],["infect",["[他](人,動物,地域)に感染させる,伝染する"]],["prescribe",["[他](薬など)を処方する","(行為など)を指示する"]],["digest",["[他]～を消化する","～を理解する","[名]要約"]],["weary",["[形](極度に)疲れている","うんざり［飽き飽き］している"]],["nourish",["[他]～に栄養を与える","(考えなど)を抱く"]],["flesh",["[名](人,動物の皮,骨に対する)肉"]],["kidney",["[名]腎臓"]],["posture",["[名]姿勢"]],["limb",["[名]手足(の1 本)"]],["erect",["[形]直立した","[他]～を建てる"]],["compensate",["[他](A for B) (A)に(B を)補償する"]],["flourish",["[自]栄える"]],["abuse",["[名]虐待","乱用","[他]～を悪用する"]],["bias",["[名]偏見"]],["prestige",["[名]名声,威信"]],["privilege",["[名]特権"]],["feat",["[名]偉業"]],["dignity",["[名]威厳"]],["virtue",["[名]美徳","(人,物の個々の)長所","(by － of ～)～のために"]],["aristocracy",["[名]貴族(階級,社会)"]],["rebel",["[名]反逆者","[自](against ～)(～に)反逆する,反抗する"]],["scheme",["[名]<英>計画","陰謀"]],["convention",["[名]会議,大会","慣習","条約"]],["conference",["[名](on ～)(～に関する)会議"]],["consent",["[名]合意","[自](to ～)(～に)合意する"]],["initiative",["[名]新構想,新計画","主導権"]],["province",["[名](カナダなどの)州,(中国の)省","(the －s)地方"]],["colony",["[名]植民地","(アリなどの)群落"]],["frontier",["[名]辺境,(主に<英>)国境","(the －s)最前線"]],["tribe",["[名]部族,種族"]],["primitive",["[形]原始的な,未開の"]],["ethnic",["[形]民族の,民族的な"]],["anonymous",["[形]匿名の"]],["coverage",["[名]報道","(保険の)補償(範囲)"]],["obligation",["[名](社会に対する)責務","(個人に対する)恩義"]],["norm",["[名]ふつうのこと","(－s)規範"]],["patent",["[名]特許(権)","[他]～の特許をとる","[形]明白な,見えすいた"]],["entitled",["[形](to ～)(～の)権利がある","～と題された"]],["donate",["[他]～を寄付する","(臓器など)を提供する"]],["conform",["[自](to ～)(～に)合わせる"]],["comply",["[自](with ～)(～に)従う,遵守する"]],["legislation",["[名](集合的に)法律<不可算>"]],["testimony",["[名](法廷などでの)証言"]],["jury",["[名]陪審(員団)"]],["legitimate",["[形]正当な","合法の"]],["enforce",["[他]～を施行する","～を強制する"]],["regime",["[名]政権,政治体制"]],["bureaucracy",["[名]官僚制度,官僚主義","(集合的に)官僚"]],["corruption",["[名]腐敗,汚職"]],["tyranny",["[名]圧政,専制政治","暴虐(な行為)"]],["sanction",["[名](－s)制裁","(公的な)認可"]],["census",["[名]国勢調査"]],["candidate",["[名](for ～)(～の)候補(者),(～に)なりそうな人［物］"]],["senator",["[名]<米>(しばしばS－)上院議員"]],["ambassador",["[名]大使"]],["diplomat",["[名]外交官"]],["refugee",["[名]難民"]],["territory",["[名]領土","(動物などの)縄張り,(学問などの)領域"]],["ally",["[名]同盟国,協力者","[自](with ～)(～と)提携する"]],["federal",["[形]連邦の"]],["feudal",["[形](主に欧州の)封建制の"]],["communist",["[形]共産主義(者)の","[名]共産主義者"]],["estate",["[名](全)財産","地所"]],["asset",["[名]財産,資産"]],["revenue",["[名](国などの)歳入,(事業などの)収益"]],["deficit",["[名](会社,国の)赤字"]],["commerce",["[名]商業"]],["output",["[名]生産高","(エンジン,発電機などの)出力"]],["subsidy",["[名]補助金"]],["monopoly",["[名]独占(権,品),独占企業"]],["transaction",["[名]取り引き"]],["corporation",["[名]企業,法人"]],["enterprise",["[名]企業","(冒険的な)事業"]],["venture",["[名](ベンチャー)事業","[自]危険を冒して行く"]],["headquarters",["[名]本社,本部"]],["personnel",["[名](官庁,会社などの)全職員<複数扱い>","人事"]],["expertise",["[名]専門的知識,専門的技術<不可算>"]],["quota",["[名]ノルマ,割り当て"]],["warehouse",["[名]倉庫,<英>問屋"]],["toil",["[自](長時間)骨折って働く","[名]骨の折れる仕事"]],["undertake",["[他](仕事など)を引き受ける,始める"]],["merge",["[自]合併する","[他]～を合併させる"]],["comprise",["[他]～から成る","(割合)を占める"]],["component",["[名]構成要素,(車などの)部品"]],["framework",["[名]枠組","骨組み"]],["prototype",["[名](of［for］～)(～の)原型","試作品","典型"]],["dimension",["[名](問題などの)側面,要因,次元","(－s)寸法,大きさ"]],["margin",["[名]余白,欄外","(票などの)差","端"]],["relevant",["[形]関連のある"]],["compatible",["[形](with ～)(～と)適合する,互換性がある"]],["correspond",["[自](to［with］～)(～と)一致する","(with ～)(～と)(メールや手紙で)やりとりをする"]],["identical",["[形]同一の,うり二つの"]],["equivalent",["[形]等しい","[名]同等のもの"]],["random",["[形]無作為の,でたらめの"]],["warrior",["[名]戦士"]],["assault",["[名]襲撃,暴行"]],["troop",["[名](－s)軍隊"]],["torture",["[名]拷問","辛いこと","[他]～を拷問にかける"]],["dispute",["[名]論争,紛争","[他]～に異議を唱える"]],["riot",["[名]暴動"]],["persecution",["[名]迫害"]],["dominate",["[他]～を支配する"]],["slaughter",["[他]～を虐殺する,(食肉用に)殺す"]],["suppress",["[他](反乱,暴動)を鎮圧する","(笑い,怒り)を抑える"]],["surrender",["[自](to ～)(～に)降伏する","[他]～を引き渡す"]],["contend",["[自](with ～)(～と)戦う","[他](that S V)(～と)(強く)主張する"]],["hostile",["[形]敵意のある","敵の","(環境などが)厳しい"]],["wreck",["[名](乗り物,家の)残骸","(健康を損ね)ボロボロの人"]],["toll",["[名]犠牲［死傷］者(数),被害","(高速道路などの)通行料","通話料"]],["disrupt",["[他](活動の進行など)をかき乱す"]],["interfere",["[自](with ～)(～を)邪魔する,干渉する"]],["confront",["[他](困難などが人)に立ちふさがる","(人が困難など)に直面する,"]],["hinder",["[他]～を妨げる"]],["explode",["[自]爆発する","爆発的に増加する"]],["collide",["[自](with ～)(～と)衝突する"]],["nephew",["[名]甥"]],["spouse",["[名]配偶者"]],["heir",["[名]相続人,後継者"]],["folk",["[名]民族","人々"]],["peer",["[名](－s)同等の人,同輩","[自](よく見えなくて)じっと見る"]],["proceed",["[自](順を追って)進む","(to do)(さらに続けて)～する"]],["navigate",["[自](旅などで)進路を決める","[他]～を航行する,誘導する"]],["roam",["[自]歩き回る"]],["flee",["[自]逃亡する"]],["retreat",["[自]退く","[名]撤退,退却"]],["crawl",["[自]這って進む,這うように進む"]],["drift",["[自]漂う"]],["alter",["[他]～を変える"]],["convert",["[他](A into B)(A)を(B に)転換する","～を改宗させる"]],["shrink",["[自]縮む","(数量が)減る","[他]～を縮ませる,減らす"]],["wither",["[自]しおれる,しぼむ"]],["transition",["[名]移り変わり,推移"]],["distortion",["[名]歪めること"]],["enhance",["[他]～を向上させる"]],["reinforce",["[他]～を補強する"]],["foster",["[他](才能など)を育成する","～の里親になる","[形]里親の"]],["breakdown",["[名]崩壊","故障","衰弱"]],["collapse",["[自]崩壊する,倒れる","[名]崩壊,倒れること"]],["render",["[他](SVOC)(O)を(C)にする","(援助など)を与える"]],["impair",["[他](人間の機能など)を低下させる,損なう"]],["deteriorate",["[自]悪化する"]],["undermine",["[他]～を弱める,揺るがす"]],["tackle",["[他]～に取り組む"]],["disposal",["[名](at one's －)～を自由にする","処分,廃棄"]],["confine",["[他]～を閉じ込める","(活動など)を制限する"]],["designate",["[他](通例,受け身で)～を指定する"]],["regulate",["[他](主に規則によって)～を規制する","(機器など)を調整する"]],["prohibit",["[他]～を禁じる"]],["refrain",["[自](from ～)(～を)控える"]],["curb",["[他]～を抑制する","[名]縁石"]],["restrain",["[他]～を抑制する"]],["halt",["[他]～を止める","[自]止まる","[名]停止"]],["animate",["[他]～を活気づける","～をアニメ化する"]],["spur",["[他]～を駆り立てる,促す","[名]拍車,刺激,動機"]],["urge",["[他]～をせき立てる,～に強く勧める","[名](何かがしたい)衝動"]],["lure",["[他]～を誘い込む","[名]魅力,誘惑"]],["stimulate",["[他]～を刺激する"]],["compel",["[他](A to do)(A)に(～することを)強制する"]],["dictate",["[他]～を書き取らせる","～を命令する,規定する"]],["blur",["[他]～をぼやかす","[自]ぼやける"]],["divert",["[他](川など)の方向を変える","(注意など)をそらす"]],["reverse",["[他]～を逆転する,覆す","[名]逆","[形]逆の"]],["supplement",["[他](栄養,収入など)を補う","[名]補充,栄養補助食品","付録"]],["pose",["[他]～をもたらす"]],["stroll",["[自]散策する"]],["shrug",["[他](肩)をすくめる","[自]肩をすくめる"]],["sniff",["[自](くんくん)臭いをかぐ","(かぜや泣いて)鼻をすする"]],["embrace",["[他]～を抱擁する","(思想など)を受け入れる"]],["betray",["[他]～を裏切る","～を漏らす,(うっかり)さらけ出す"]],["deceive",["[他]～をだます"]],["bully",["[他]～をいじめる","[名]いじめっ子"]],["squeeze",["[他](果汁など)を搾る","(手,指で)～を強く押す"]],["insert",["[他]～を差し込む","(語句など)を書き込む"]],["detach",["[他](A from B) (A)を(B から)切り離す"]],["withdraw",["[他]～を引っ込める","(預金など)を引き出す","[自]退く"]],["withstand",["[他]～に耐える"]],["exert",["[他](力,影響力など)を働かせる"]],["compile",["[他]～をまとめる,編集する"]],["browse",["[自]拾い読みする","[他]～を拾い読みする"]],["manipulate",["[他]～を操作する"]],["implement",["[他](契約,計画など)を実行する","[名](単純な)道具"]],["execute",["[他]～を遂行する,実行する","～を処刑する"]],["host",["[他](大会など)を主催する","[名](a － of)多くの","(客を接待する)主人(＊女性も含む),主催者,開催地"]],["mount",["[他]～を据え付ける","(馬,自転車)に乗る","[自]増加する"]],["discharge",["[他]～を排出する","(職務,任地などから)～を解放する"]],["drain",["[他]～の水を抜く","～の水分を切る","[自](液体が)流出する,乾く"]],["soak",["[他]～を浸す","(up)(日光,考えなど)を吸収する"]],["suspend",["[他]～をつるす","～を中断する","～を停職［停学］にする"]],["extract",["[他]～を取り出す,抽出する","[名]抽出したもの,抜粋"]],["summon",["[他]～を呼ぶ,召喚する,喚問する","(勇気など)を奮い立たせる"]],["embark",["[自](on ～)(～に)着手する,乗り込む"]],["thrust",["[他]～を強く押しつける","(刃物で)～を突き刺す"]],["penetrate",["[他]～に入り込む","～を貫通する","[自]貫通する,入る"]],["intrude",["[自](on～)(～に)立ち入る"]],["evade",["[他]～を逃れる"]],["utilize",["[他]～を利用する"]],["spin",["[自]ぐるぐる回る","[他]～を回す","～を紡ぐ"]],["plunge",["[自](into ～)(～に)突っ込む","[他](A into B)(A)を(B に)突っ込む"]],["rattle",["[自]ガタガタ鳴る","[他]～を鳴らす","[名]ガラガラ"]],["vanish",["[自]消える"]],["cease",["[他](to do［doing］)～しなくなる"]],["haste",["[名]急ぐこと<不可算>"]],["conceal",["[他]～を隠す"]],["disguise",["[他]～を(偽装して)隠す","(oneself as ～)～に変装する","[名]変装"]],["coincide",["[自](with ～)(～と)同時に起きる","(with ～)(～と)一致する"]],["prevail",["[自](考え,習慣などが)普及している","(最後に人,考えが)優勢となる"]],["sustain",["[他](生命など)を維持する,支える"]],["linger",["[自](いつまでも)残る","(on)長居する"]],["revive",["[自]生き返る,よみがえる","[他]～を生き返らせる"]],["resume",["[他]～を再開する","[自]再開する","[名]<米>履歴書","概要,レジュメ"]],["inspect",["[他]～を検査する"]],["investigate",["[他](研究班などが)～を調査する","(警察が)～を捜査する"]],["detect",["[他]～を探知する,(病気など)を発見する,(うそなど)を見抜く"]],["discern",["[他]～を見分ける"]],["expedition",["[名](研究・探求・戦争目的の)探検,遠征","探検隊"]],["enroll",["[自](in ～)(～に)入学する","[他](be －ed)在籍している"]],["discipline",["[他]～をしつける","[名]しつけ,規律","(学問)分野"]],["cram",["[自]詰め込み勉強をする","[他]～を詰め込む","[名]詰め込み"]],["faculty",["[名](生まれ持った)能力","(大学の)学部","(大学の)全教員"]],["tuition",["[名]<米>授業料","(少人数での)授業"]],["diploma",["[名]<米>卒業証書"]],["mentor",["[他]～を指導する","[名](会社,大学などでの)指導者"]],["ethic",["[名](－s)(社会や職業上の)倫理(観)","(伝統的に守られた)倫理"]],["astronomy",["[名]天文学"]],["archaeologist",["[名]考古学者"]],["anthropologist",["[名](文化)人類学者"]],["perceive",["[他](A as B)(A)を(B だと)認識する","～を知覚する"]],["grasp",["[他]～を理解する","～をつかむ","[名]理解,つかむこと"]],["conceive",["[他]～を思い浮かべる","～を妊娠する","[自](of ～)(～を)想像する"]],["anticipate",["[他]～を予想する","～を期待する"]],["foresee",["[他]～を予知する"]],["speculate",["[自]推測する","(株,土地などに)投機をする"]],["infer",["[他](A from B) (B からA)を推測する"]],["deduce",["[他](A from B) (B からA)を推定する"]],["ponder",["[他]～を熟考する"]],["contemplate",["[他]～を熟考する"]],["assure",["[他]～に保証する,確信させる"]],["assess",["[他]～を評価する,査定する"]],["evaluate",["[他]～を(正しく)評価する"]],["verify",["[他](事実かどうか)を確かめる,検証する"]],["compromise",["[自](with ～)(～と)妥協する","[他](主義など)を曲げる","[名]妥協"]],["reconcile",["[他](A with B)(A)を(B と)調和させる,和解させる","(oneself to ～)(～を)仕方なく受け入れる"]],["alert",["[形]油断のない,用心深い","[名](公的な)警告"]],["stereotype",["[名]固定観念"]],["perspective",["[名](経験などで得られる)視点<可算>","(大局的な)見方,遠近法<不可算>"]],["prospect",["[名]見通し"]],["vow",["[名]誓い","[他]～を誓う"]],["intuition",["[名]直観"]],["illusion",["[名]幻想"]],["criterion",["[名]基準"]],["tolerate",["[他]～を大目に見る,我慢する"]],["overlook",["[他]～を(うっかり)見落とす","(人の欠点やミスなど)を見逃す,大目に見る","(場所が)～を見渡す"]],["grain",["[名]穀物","粒,少量"]],["drought",["[名]干ばつ"]],["irrigation",["[名]灌漑"]],["spectacle",["[名](きわめて印象的な)光景","(大がかりな)見せ物"]],["altitude",["[名]標高,高度"]],["catastrophe",["[名]大災害,災難"]],["decay",["[名]腐敗","[自]腐敗する,衰える"]],["erosion",["[名]侵食"]],["flame",["[名]炎"]],["galaxy",["[名]銀河"]],["meteor",["[名]流星,隕石"]],["chill",["[名]寒気","[他]～を冷やす"]],["meadow",["[名]草地,牧草地"]],["exploit",["[他](自然の力など)を利用する","～を搾取する"]],["contaminate",["[他]～を汚染する"]],["erupt",["[自](火山が)噴火する"]],["evaporate",["[自]蒸発する"]],["fertile",["[形]肥沃な,肥えた"]],["roar",["[自]ほえる","[名]うなり声,怒号,轟音"]],["inhabit",["[他]～に生息している,ある"]],["nurture",["[他]～を育てる","[名]養育,教育"]],["owl",["[名]フクロウ"]],["instinct",["[名]本能"]],["prey",["[名]餌食","[自](on ～)餌食にする"]],["timber",["[名](主に<英>)材木"]],["fabric",["[名]布地,織物","組織,構造"]],["textile",["[名]織物","[形]織物の"]],["weave",["[他]～を織る","～を編む"]],["competent",["[形]有能な"]],["optimistic",["[形]楽観的な"]],["patriotic",["[形]愛国的な"]],["naughty",["[形]いたずらな"]],["vigorous",["[形](人,活動が)精力的な","活発な"]],["solitary",["[形](人が)孤高の","ただひとつの"]],["vulgar",["[形](人,行動が)品がない","(冗談などが)卑わいな"]],["skeptical",["[形]懐疑的な"]],["haunt",["[他](亡霊,考えなどが)～につきまとう,出没する","[名]好んで行く場所,たまり場"]],["obsessed",["[形](with［by］ ～)(～に)取りつかれて,頭が一杯で"]],["intent",["[形](on ～)(～に)没頭した,決心した","[名] 意図"]],["indulge",["[自](in ～)(～に)ふける","[他] ～を思いのままにさせる"]],["cling",["[自](to ～)(～に)固執する,しがみつく"]],["flaw",["[名]欠陥"]],["defect",["[名]欠陥"]],["trait",["[名]特性"]],["analogy",["[名]類似点,例え"]],["parallel",["[名]類似(物)","[形](to ～)(～と)平行の,類似した"]],["crucial",["[形]重大な"]],["primary",["[形]主な,第1 の","初期の,原始の"]],["integral",["[形]不可欠な","完全な"]],["vital",["[形]不可欠な,きわめて重要な"]],["profound",["[形]深い"]],["grim",["[形](状況などが)厳しい"]],["fierce",["[形](競争,嵐などが)激しい"," どう猛な"]],["harsh",["[形]厳しい"]],["savage",["[形](とても)容赦ない,どう猛な"]],["acute",["[形]深刻な","鋭い","急性の"]],["ambiguous",["[形]曖昧な"]],["obscure",["[形]ぼやけた,わかりにくい","無名の"]],["misleading",["[形]誤解を招く,紛らわしい"]],["straightforward",["[形](方法などが)わかりやすい","(人や行動が)率直な"]],["explicit",["[形](発言や文章などが)明確な"]],["sophisticated",["[形](機械,システムが)高度な"," 洗練された,教養のある"]],["ingenious",["[形]独創的な"]],["decent",["[形]まともな,きちんとした"]],["thrive",["[自](会社などが)好調である,繁栄する","(動［植］物などが)健康に育つ"]],["wit",["[名]機知,機知に富んだ人"]],["affluent",["[形]裕福な"]],["elaborate",["[形]手の込んだ,凝った","[他]～を苦労して作り上げる","[自](on ～)(～を)詳しく話す"]],["prompt",["[形]迅速な","[他]～に促す"]],["swift",["[形]素早い"]],["mighty",["[形]強力な"]],["renowned",["[形]有名な"]],["dim",["[形]薄暗い","(記憶などが)ぼんやりした","[他] ～を暗くする"]],["gloomy",["[形]薄暗い","陰気な,悲観的な"]],["barren",["[形]不毛な"]],["idle",["[形](仕事がなく)何もしていない"," 怠惰な","[他](away)(～を)何もしないでいる"]],["tiresome",["[形]退屈な,うんざりする"]],["static",["[形]静的な,(経済などで)変化のない,活気のない"]],["clumsy",["[形]無器用な"]],["ignorant",["[形]無知の"]],["reckless",["[形]無謀な"]],["arbitrary",["[形]独断的な,勝手な"]],["foul",["[形](味,臭いなどが)不快な","[名](スポーツなどの)違反,ファウル"]],["shabby",["[形]みすぼらしい,おんぼろの"]],["monotonous",["[形]単調な"]],["crude",["[形]粗末な,粗野な","加工されていない"]],["fragile",["[形]壊れやすい,もろい"]],["vulnerable",["[形]傷つきやすい,弱い","(非難,攻撃を)受けやすい,(病気に)かかりやすい"]],["rust",["[名]さび","[自]さびる"]],["plight",["[名]窮状,苦境"]],["conventional",["[形]従来の,慣習的な"]],["innate",["[形](才能などが)先天的な,生まれつきの"]],["exotic",["[形](動［植］物が)外来の","異国情緒のある"]],["tame",["[形]飼い慣らされた,従順な","[他]～を飼い慣らす"]],["solemn",["[形](場所,祝祭が)厳粛な,(音楽が)荘厳な","(態度が)真面目な"]],["manifest",["[形]明らかな","[他](姿勢,感情など)を明らかにする"]],["dense",["[形]密集した,(霧などが)濃い"]],["superficial",["[形]表面的な"]],["transparent",["[形]透明な"]],["consistent",["[形](with ～)矛盾のない,一致している","安定した,不変の"]],["coherent",["[形]一貫している"]],["universal",["[形]普遍的な"]],["upright",["[副]直立して","[形]直立した"]],["underlying",["[形]根底にある"]],["spontaneous",["[形]自然発生的な"]],["mock",["[形]模擬の,見せかけの","[他](からかって)～をまねる","～をあざける"]],["liable",["[形](to do)～しがちだ","(to ～)(病気などに)かかりやすい","(for ～)(～に対して)(法的に)責任がある"]],["converse",["[名]正反対","[形]正反対の","[自](with ～)(～と)会話する"]],["preliminary",["[形]予備的な,事前の","予選の","[名]予選"]],["version",["[名](個人的な)解釈,意見","(製品などの)～版"]],["indigenous",["[形](動［植］物,民族が)固有の"]],["decline",["[自]減る,衰退する","[他]～を断る","[名] 衰退,減少"]],["multiply",["[他]～を増やす","(A by B)(A)に(B を)掛ける","[自]増える"]],["soar",["[自](価格,温度が)急上昇する","(鳥が)舞い上がる"]],["accumulate",["[他]～を蓄積する","[自] 蓄積する"]],["exceed",["[他]～を越える"]],["abundant",["[形]豊富な"]],["ample",["[形]豊富な"]],["gross",["[形]総計の","(食べ物,行動などが)ひどい"]],["infinite",["[形]無限の"]],["sole",["[形]唯一の","[名]足の裏,靴底"]],["heap",["[名]山","(a － of ～)たくさんの～"]],["fraction",["[名]少量","分数,端数"]],["simultaneous",["[形]同時の"]],["medieval",["[形]中世の"]],["decade",["[名]10年"]],["dawn",["[名]夜明け","[自]夜が明ける","(on ～)(～に)わかり始める"]],["span",["[名](継続した)期間","(集中力,注意力,機械の持続)期間"]],["expire",["[自]期限が切れる"]],["postpone",["[他]～を延期する"]],["equip",["[他]～を装備させる,備え付ける","(人)に(知識や能力などを)身につけさせる"]],["transmit",["[他]～を送る,伝える","(病気など)をうつす"]],["endow",["[他]～を授ける"]],["inherit",["[他]～を受け継ぐ"]],["retrieve",["[他]～を回収する,取り戻す","(ファイルなど)を検索する"]],["displace",["[他] ～に取って代わる","(戦争,災害などで)～を(故郷などから)追い出す"]],["bond",["[名]きずな","公債,社債"]],["ornament",["[名](小さな)飾り,置物"]],["certificate",["[名]証明書,免許状,鑑定書"]],["accommodation",["[名](<米>－s)宿泊施設"]],["intersection",["[名]交差点"]],["pavement",["[名](主に<英>)歩道"]],["pedestrian",["[名]歩行者"]],["excursion",["[名]小旅行,遠足"]],["itinerary",["[名]旅程(表)"]],["token",["[名](as a － of)(～の)しるし(として)","(バスなどで使われる)代用硬貨,トークン","<英>商品引換券"]],["detergent",["[名]洗剤"]],["purchase",["[他]～を購入する","[名]購入(品)"]],["dwell",["[自]住む","(on ～)(～をくどくど)考える"]],["juvenile",["[形]青少年の"]],["adolescent",["[名]思春期の若者","[形]思春期の"]],["initial",["[形]最初の","[名]頭文字,イニシャル"]],["precede",["[他]～に先行する"]],["phase",["[名]段階"]],["priority",["[名]優先(事項)"]],["premise",["[名]前提","(－s)(建物を含めた)敷地"]],["legend",["[名]伝説,言い伝え","伝説的人物"]],["masterpiece",["[名]傑作"]],["ritual",["[名](宗教的)儀式","[形]儀式の"]],["worship",["[名]崇拝,礼拝","[他]～を崇拝する","[自](神社などに)お参りする"]],["advent",["[名]到来","(the A－)キリストの降臨"]],["swear",["[自]誓う","罵る"]],["confess",["[自](to ～)(～を)白状する","[他]～を認める"]],["verbal",["[形]言葉による"]],["oral",["[形]口述の","口の"]],["eloquent",["[形]雄弁な"]],["linguistic",["[形]言語の,言語学の"]],["plot",["[名](小説,演劇などの)筋","悪だくみ,陰謀"]],["draft",["[名]下書き,草稿","[他]～を徴兵する","[形](－ beer)生の(ビール)"]],["statement",["[名]述べたこと,声明","(給与などの)明細書"]],["paradox",["[名]逆説"]],["slang",["[名](集合的に)俗語"]],["riddle",["[名]なぞなぞ,謎"]],["clarify",["[他]～を明らかにする"]],["exhibit",["[他]～を展示する","～を示す","[名]展示物,展覧会"]],["portray",["[他]～を描く"]],["attribute",["[他](A to B) (A)を(B)のせいだとする","[名]特性,属性"]],["console",["[他]～を慰める"]],["arouse",["[他]～を呼び起こす"]],["distract",["[他](注意,意識など)をそらす","～の気を紛らす"]],["plead",["[自](with ～)(～に)懇願する","[他]～を申し立てる"]],["yearn",["[自]切望する","[他]～を切望する"]],["long",["[自](for ～)(～を)切望する"]],["adore",["[他]～を熱愛している"]],["utter",["[他](叫び声など)を発する","[形]まったくの"]],["exclaim",["[自](驚き,怒りなどで)叫ぶ"]],["lament",["[他]～を深く悲しむ,嘆く"]],["shed",["[他](涙など)を流す","(光)を当てる","～を取り除く","(ヘビなどが)(皮)を脱ぐ,(木が葉っぱ)を落とす"]],["resent",["[他]～に憤慨する"]],["dread",["[他]～を恐れる","[名]恐怖"]],["startle",["[他]～を驚かせる"]],["thrill",["[他]～をぞくぞく［わくわく］させる","[名]スリル"]],["humiliate",["[他]～に恥をかかせる"]],["blush",["[自]赤面する","[名]赤面"]],["frown",["[自](on ～)(～に)眉をひそめる","[名]しかめっ面"]],["dismay",["[他]～を狼狽させる","[名]狼狽"]],["bewilder",["[他](通例,受け身)～を当惑させる"]],["perplex",["[他]～を困惑させる"]],["disgust",["[他]～に嫌悪を抱かせる","[名]嫌悪"]],["despise",["[他]～を軽蔑する"]],["furious",["[形]激怒した"]],["intimate",["[形]親密な","(知識などが)深い"]],["intriguing",["[形]興味深い"]],["conscience",["[名]良心"]],["self-esteem",["[名]自尊心"]],["mercy",["[名]慈悲,情け"," 幸運"]],["aspiration",["[名]熱望"]],["grief",["[名](人の死などに対する)深い悲しみ"]],["distress",["[名]苦しみ,苦難","[他]～を苦しめる"]],["apprehension",["[名]不安","逮捕"]],["melancholy",["[名]憂うつ,ふさぎ込み"]],["contempt",["[名]軽蔑"]],["insult",["[名]侮辱","[他]～を侮辱する"]],["nuisance",["[名]迷惑(になるもの)"]],["menace",["[名](to ～)(～にとっての)厄介なもの［人］,脅威"]],["verge",["[名]瀬戸際,寸前"," 道路べり,(場所の)縁"]],["incentive",["[名]励み"]],["outcome",["[名]結果"]],["thorough",["[形]完全な,徹底的な"]],["adequate",["[形]十分な,適切な"]],["overall",["[形]全体的な,全面的な","[副]全体的に,全面的に"]],["ultimate",["[形]究極の,最終の"]],["genuine",["[形](感情が)心からの","(絵画などが)本物の"]],["radical",["[形]根本的な,抜本的な","過激な"]],["drastic",["[形]抜本的な,思い切った"]],["trivial",["[形]ささいな"]],["virtually",["[副]事実上"]],["abruptly",["[副]不意に,突然"]],["deliberately",["[副]故意に","慎重に"]],["hence",["[副]だから,それゆえに"]],["namely",["[副]すなわち"]],["whereas",["[接]～だが一方"]]];
  return dic;
}