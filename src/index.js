let fs = require('fs');
let promisify = require('util').promisify;
let chalk = require('chalk');
readFile = promisify(fs.readFile);

module.exports = {
    async  formatFile(path, ifPrintAll) {
        function formatJson(str) {
            let result = str;
            // 兼容格式错误
            try {
                result = JSON.stringify(JSON.parse(str), null, 4);
            }
            catch (e) {}
            return result;
        }

        function formatOne(str) {
            let logType = str.split('[')[0];

            let errno = str.match(/errno\[[^\]]*/)[0].split('[')[1];
            let logId = str.match(/logId\[[^\]]*/)[0].split('[')[1];
            let uri = str.match(/uri\[[^\]]*/)[0].split('[')[1];
            let user = str.match(/user\[[^\]]*/)[0].split('[')[1];
            let refer = str.match(/refer\[[^\]]*/)[0].split('[')[1];
            let cookie = str.match(/cookie\[[^\]]*/)[0].split('[')[1];

            let custom = str.split('custom')[1].trim();
            if (custom.slice(-1) === '-') {
                custom = custom.slice(0, -1).trim();
            }

            custom = custom.slice(1, -1);

            function getStrA2B(a, b) {
                let lenA = a.length;
                let lenB = b.length;
                let startA = custom.indexOf(a);
                let endA = startA + lenA;
                let startB = custom.indexOf(b);
                let endB = startB + lenB;

                let request = custom.slice(endA, startB).trim();
                let response = custom.slice(endB).trim();
                request = formatJson(request);
                response = formatJson(response);
                return {request, response};
            }

            let {request, response} = getStrA2B('request=', 'response=');
            let ioData = getStrA2B('input=', 'output=');
            let input = ioData.request;
            let output = ioData.response;
            return {
                logType,
                errno,
                logId,
                uri,
                user,
                refer,
                cookie,
                custom,
                request,
                response,
                input,
                output
            };
        }
        function decode(str) {
            return decodeURIComponent(unescape(unescape(str)));
        }
        function colorConsole(color, str) {
            let arr = [...arguments];
            arr.shift();
            arr = arr.map(item => {
                return chalk[color](item);
            });
            console.log(...arr);
        }
        // 只color第一项
        function colorKeyValue(color, str) {
            let colorKey = color[0];
            let colorValue = color[1];
            let arr = [...arguments];
            arr.shift();
            arr = arr.map((item, index) => {
                if (index === 0) {
                    return chalk[colorKey](item);
                }
                else {
                    return chalk[colorValue](item);
                }

            });
            console.log(...arr);
        }

        let fileContent = await readFile(path, 'utf8');
        let logArr = fileContent.split('\n');

        logArr.forEach((log, index) => {
            log = decode(log);

            let {
                logType,
                errno,
                logId,
                uri,
                user,
                refer,
                cookie,
                custom,
                request,
                response,
                input,
                output
            } = formatOne(log);
            colorConsole('bgGreen', '[请求' + (index + 1) + ']');

            colorKeyValue(['cyan', 'yellow'], '[logType:]', logType);
            colorKeyValue(['cyan', 'yellow'], '[errno:]', errno);
            colorKeyValue(['cyan', 'yellow'], '[logId:]', logId);
            colorKeyValue(['cyan', 'yellow'], '[uri:]\n', uri);
            colorKeyValue(['cyan', 'yellow'], '[refer:]\n', refer);
            if (request !== 'undefined' && request) {
                colorKeyValue(['cyan', 'yellow'], '[request:]\n', request);
                colorKeyValue(['cyan', 'yellow'], '[response:]\n', response);
            }
            else {
                colorKeyValue(['cyan', 'yellow'], '[input:]\n', input);
                colorKeyValue(['cyan', 'yellow'], '[output:]\n', output);
            }

            if (ifPrintAll) {
                colorKeyValue(['cyan', 'yellow'], '[custom:]\n', custom);
                colorKeyValue(['cyan', 'yellow'], '[user:]\n', user);
                colorKeyValue(['cyan', 'yellow'], '[cookie:]\n', cookie);
            }

        });
    }
};
