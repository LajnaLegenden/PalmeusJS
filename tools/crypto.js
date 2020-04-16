let fs = require('fs')
let shelljs = require('shelljs');
let inquirer = require('inquirer');
let password = undefined;


inquirer.prompt({ name: "password", type: "password", message: "Whats the passphrase?" ,when : () => {return !process.argv[3]}}).then(async answers => {
    password = answers["password"];
    main()
})
function main() {
if(!password) password = process.argv[3]
    let decrypt = process.argv[2] == "false" ? false:true;
    let files = getRouteFiles(__dirname + "/../env", decrypt)


    for (let file of files) {
        console.log(decrypt)
        if (decrypt) {
            let a = shelljs.exec('npx node-cipher dec --password ' + password + ' ' + file + ' ' + getDecFilename(file))
        } else {
            let a = shelljs.exec('npx node-cipher enc --password ' + password + " " + file + ' ' + file + ".enc")
        }
    }


    function getRouteFiles(path, decrypt) {
        let files = fs.readdirSync(path);
        let out = new Array()
        for (let file of files) {
            if (fs.lstatSync(path + "/" + file).isDirectory()) {
                let filesFromDir = getRouteFiles(path + "/" + file, decrypt);
                for (let i of filesFromDir) {
                    out.push(i);
                }
            } else if (file.split(".").pop().includes("enc") && decrypt) {
                out.push(path + "/" + file);
            } else if (!file.split(".").pop().includes("enc") && !decrypt) {
                out.push(path + "/" + file);
            }
        }
        return out;
    }

    function getDecFilename(name) {
        let file = name.split(".");
        file.pop();
        return file.join(".");
    }
}