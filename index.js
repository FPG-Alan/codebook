var fs = require('fs');
var readline = require('readline');
var inquirer = require('inquirer');
var crypto = require('crypto');
var generator = require('generate-password');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var username, password;
var codelist = {};
var dataPath = './data.json';
var key = new Buffer('85CE6CCF67FBBAA8BB13479C3A6E084D', 'hex');
// first check if a data file exist
var checkDataFile = function(){
    fs.open(dataPath,'r', function(err, fd){
        if(err){
            if (err.code === 'ENOENT') {
                ifregist();
            }
        }else{
            fs.readFile(dataPath, 'utf8', function (err, data) {
                if (err) throw err;
                obj = JSON.parse(decrypt(key, data));

                username = obj.un;
                password = obj.pw;

                // for(var key in )
                if(obj.codes){
                    codelist = obj.codes;
                }

                login();
            });
        }
    });
}
// ------------------------------------------------------------------
var ifregist = function(){
    rl.question('regist a account? (y/n) ', (answer)=>{
        if(answer == 'y'){
            regist();
        }else{
            process.exit();
        }
    });
}
var regist = function(){
    var username, password;
    rl.question('name: ',(answer)=>{
        username = answer;
        rl.question('password: ',(answer)=>{
            password = answer;
            generateDataFile(username, password);
        });
    });
}
var generateDataFile = function(un, pw){
    var data = {
        'un': un,
        'pw': pw
    };
    fs.writeFile(dataPath,encrypt(key, JSON.stringify(data)), (err)=>{
        if (err) throw err;
        console.log('Regist complete!');
        process.exit();
    });
}

// ------------------------------------------------------------------
var login = function(){
    var tmpUn, tmpPw
    rl.question('usename: ', (answer)=>{
        tmpUn = answer;
        rl.question('Password: ', (answer)=>{
            tmpPw = answer;

            if(tmpUn == username && tmpPw == password){
                showMainMenu();
            }else{
                console.log('wrong username/passward!');
                process.exit();
            }
        });
    });
}
var showMainMenu = function(){
    inquirer.prompt([
        {
            type: 'list',
            name: 'work',
            message: 'What do you want to do?',
            choices: [
                'Add a new password',
                'List all password',
                'Remove password',
                'Exit'
            ]
        }
    ]).then(function (answers) {
        var tmpAnswer = JSON.stringify(answers, null, '  ');
        if (answers.work == 'Add a new password') {
            addNew();
        }
        if (answers.work == 'List all password') {
            listAll();
        }
        if (answers.work == 'Remove password') {
            remove();
        }
        if (answers.work == 'Exit') {
            process.exit();
        }
    });
}

var addNew = function(){
    inquirer.prompt([
        {
            type: 'list',
            name: 'generate',
            message: 'Which way do u want to generate the password?',
            choices: [
                'Automatic',
                'Manual',
            ]
        }
    ]).then(function(answers){
        // var tmpAnswer = JSON.stringify(answers, null, '  ');
        if(answers.generate == 'Automatic'){
            addNewAutomaic();
        }else{
            addNewManual();
        }
    });
}

var addNewAutomaic = function(){
    var autoPWD = generator.generate({
	    length: 10,
	    numbers: true
    });

    inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'What\'s the code name?'
        },
        {
            type: 'input',
            name: 'des',
            message: 'Some describition?(help u remeber the code)'
        },
        {
            type: 'input',
            name: 'username',
            message: 'User name of this code: '
        }
    ]).then(function(answers){
        // var tmpAnswer = JSON.stringify(answers, null, '  ');
        inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Confirm ur information(yes/no): \r'+answers.name+'\r'+answers.des+'\r'+answers.username+'\r'+autoPWD,
                default: 'yes',
            }
        ]).then(function(answers_confirm){
            // console.log(answers_confirm);
            if(answers_confirm.confirm){
                codelist[answers.name] = {
                    un: answers.username,
                    pw: autoPWD,
                    des: answers.des
                }
                writeToJson('New code added.');
            }else{
                addNewAutomaic();
            }
        });
    });
}

var addNewManual = function(){
    inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'What\'s the code name?'
        },
        {
            type: 'input',
            name: 'des',
            message: 'Some describition?(help u remeber the code)'
        },
        {
            type: 'input',
            name: 'username',
            message: 'User name of this code: '
        },
        {
            type: 'password',
            name: 'password',
            message: 'Password of this code: '
        },

    ]).then(function(answers){
        // var tmpAnswer = JSON.stringify(answers, null, '  ');
        inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Confirm ur information(yes/no): \r'+answers.name+'\r'+answers.des+'\r'+answers.username+'\r'+answers.password,
                default: 'yes',
            }
        ]).then(function(answers_confirm){
            // console.log(answers_confirm);
            if(answers_confirm.confirm){
                codelist[answers.name] = {
                    un: answers.username,
                    pw: answers.password,
                    des: answers.des
                }
                writeToJson('New code added.');
            }else{
                addNewManual();
            }
        });
    });
}

var writeToJson = function(msg){
    var data = {
        'un': username,
        'pw': password,
        'codes': codelist
    };
    fs.writeFile(dataPath,encrypt(key, JSON.stringify(data)), (err)=>{
        if (err) throw err;
        console.log(msg);
        // process.exit();
        showMainMenu();

    });
}
// ------------------------------------------
var listAll = function(){
    var output = '-------------------\n';
    for(var key in codelist){
        output += key +'\n' + 'username: '+codelist[key].un +'\n'+'password: '+codelist[key].pw+'\n'+codelist[key].des+'\n'+'-------------------\n'
    }

    console.log(output);
    showMainMenu();

}

// ------------------------------------------
var remove = function(){
    var tmpPromt = {
        type: 'list',
        name: 'code',
        message: 'Which one do u want to remove?',
        choices: []
    };
    for(var key in codelist){
        tmpPromt.choices.push(key)
    }
    inquirer.prompt(
        tmpPromt
    ).then((answers)=>{
        delete codelist[answers.code];
        writeToJson(answers.code+ ' has been deleted.');
    });
}

// ------------------------------------------
function encrypt(key, data) {
    var cipher = crypto.createCipher('aes256', key);
    var crypted = cipher.update(data, 'utf-8', 'hex');
    crypted += cipher.final('hex');

    return crypted;
}

function decrypt(key, data) {
    var decipher = crypto.createDecipher('aes256', key);
    var decrypted = decipher.update(data, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    return decrypted;
}


checkDataFile();