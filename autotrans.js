var fs = require('fs');
var path = require('path');
var request = require('request');
var urlencode = require('urlencode');




var fileQueen = [];
var filePath;
var fileData;

if (process.argv.length != 3 || process.argv[2] == '-h' || process.argv[2] == '--help') {
	printUsage();
}
else {
	traversalFolder(process.argv[2]);
	transQueen();
}

function printUsage() {
	console.log('Automatically translates all files in the specified folder.\n\n' +
				'Usage: node autotrans.js < folder path >\n\n');
}

function traversalFolder(dir) {
	if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
		var files = fs.readdirSync(dir);
		for (var file of files) {
			file = path.join(dir, file);
			var info = fs.statSync(file);
			if (info.isDirectory()) {
				traversalFolder(file);
			}
			else {
	    		fileQueen.push(file);
			}
		}
	}
	else {
		printUsage();
	}
}

function transQueen() {
	if (fileQueen.length <= 0) {
		console.log('done.');
		return;
	}

	var file = fileQueen.shift();
	console.log((fileQueen.length+1) + ' > ' + file);
	fs.readFile(file, 'utf-8', function (err, data) {
	    if (err) {
	        console.log(err);
	    } else {
	    	filePath = file;
	    	fileData = data;
			transFile();
	    }
	});
}

function transFile() {
    var reg = /(\'(.*[\u4E00-\u9FFF]+.*)\')|(\"(.*[\u4E00-\u9FFF]+.*)\")/g;
	var match = reg.exec(fileData);

	if (match != null){
		var matchstr = (match[2] == undefined) ? match[4] : match[2];
		translateBaidu(matchstr, function(result) {
			result = result.replace(/(\'|\")/g, '\\$1');
			console.log('    ', matchstr, ' > ', result);
			fileData = fileData.substr(0, match.index+1) + result + fileData.substr(match.index+1 + matchstr.length);
			transFile();
		});
	}
	else {
		fs.writeFile(filePath, fileData, 'utf8', (err) => {
			if (err) {
				console.log(err);
			}
			transQueen();
		});
	}
}

function translateBaidu(translateContent, callback, fromLanguage = "cht", toLanguage = "en")
{
	var url = 'https://fanyi.baidu.com/transapi?from='+fromLanguage+'&to='+toLanguage+'&query='+urlencode(translateContent);
	request(url, function (err, res, body) {
		if (err) {
			console.log(translateContent, err)
		}else {
			var result = JSON.parse(body);
			if (result.error) {
				console.log(translateContent, body);
			}
			else {
				callback(result.data[0].result[0][1]);
			}
		}
	});
}




