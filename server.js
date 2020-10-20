var http = require('http'),
	fileSystem = require('fs'),
	path = require('path');
var bodyParser = require('body-parser');
const express = require('express');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const getKeyVsTypeMap = data => {
	var keyVsTypeMap = {}
	for (var key in data) {
		keyVsTypeMap[key] = getType(data[key]);
	}
	return keyVsTypeMap;
}

const getType = data => {
	switch (typeof data) {
		case "string": return "String"
		case "number" : return (data % 1 === 0) ? "Integer" : "Double";
		case "boolean" : return "Boolean";
		// assuming there wont be nested JSON Object
		case "object" : return `List < ${getType(data[0])} >`;
	}
}

const capitalize = (s) => {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const createFileData = (keyVsTypeMap) => {
	var fileData = `import java.util.List;

public class Converted {

`;
	for (var key in keyVsTypeMap) {
		fileData += `	private ${keyVsTypeMap[key]} ${key};\n`
	}
	fileData += '\n\n';

	for (var key in keyVsTypeMap) {
		var dataType = keyVsTypeMap[key];
		fileData += `	public ${dataType} get${capitalize(key)}() {
		return ${key};
	}

	public void set${capitalize(key)}(${dataType} ${key}) {
		this.${key} = ${key};
	}

`
	}
	fileData += '}';
	return fileData;
}

app.post('/create', function(req, res, next){
	data = JSON.parse(req.body.data);
	var keyVsTypeMap = getKeyVsTypeMap(data);
	var fileData = createFileData(keyVsTypeMap);
	var fileName = Date.now() + ".java";
	var filePath = path.join(__dirname, fileName);
	fileSystem.writeFile(filePath, fileData, function(err) {
		if (err) { }
		res.end(`
		<!doctype html>
		<html>
		<body>
			<a href="/download?filename=${fileName}" download="POJO.java">Download Generated POJO File</a>
		</body>`);
	})
});

app.get('/download', function(req, res, next) {
	var fileName = req.query.filename;
	var filePath = path.join(__dirname, fileName);
	res.download(filePath);
})

app.get('/', function(req, res, next) {
	res.end(`
		<!doctype html>
		<html>
		<body>
			<form action="/create" method="post" onsubmit="return validateJSON();">
				<textarea id="json-text-area" name="data" rows="30" style="width:60%;"></textarea>
				<button> Save </button>
			</form>
		</body>
		<script>
			function validateJSON() {
				var data = document.getElementById('json-text-area');
				try {
					data.value = JSON.stringify(JSON.parse(data.value));
					return true;
				} catch(err) {
					window.alert("Enter valid JSON");
					return false;
				}
			}
		</script>
		</html>
		`);
})

app.listen(2000, 'localhost');