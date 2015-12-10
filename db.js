var tedious = require('tedious');
var TYPES = tedious.TYPES;

var _sqlConnection;

function connect(cb) {

    if(_sqlConnection && !_sqlConnection.closed) {
        return cb(null, _sqlConnection);
    }

    var configSql = require("./sql.azure.private.json");
    console.log('connecting to server', configSql.server);

    var Connection = tedious.Connection;
    var connection = new Connection(configSql);

    connection.on('connect', function(err) {
        if (err) {
            console.error('error connecting to sql server', configSql.server);
            return cb(err);
        }
        _sqlConnection = connection;
        console.log('connection established', !connection.closed);
        return cb(null, connection);
    });
}

function getJobDetails(id, cb) {
    return getDataSets({
        sproc: 'GetJob',
        sets: ['job', 'video', 'user', 'frames'],
        params: [{name: 'Id', type: TYPES.Int, value: id}]
    }, cb);
}

function createOrModifyJob(req, cb) {
    connect(function(err, connection){
        if (err) return cb(err);

        var resultJobId;

        var request = new tedious.Request('UpsertJob', function(err) {
            if (err) {
                console.error('error calling Upsert stored procedure', err);
                return cb(err);
            }

            cb(null, {jobId: resultJobId});
        });

        if(req.id)
            request.addParameter('Id', TYPES.Int, req.id);

        request.addParameter('VideoId', TYPES.Int, req.videoId);
        request.addParameter('UserId', TYPES.Int, req.userId);
        request.addParameter('Description', TYPES.VarChar, req.description);
        request.addParameter('CreatedById', TYPES.Int, req.createdById);
        request.addParameter('ConfigJson', TYPES.NVarChar, req.configJson);

        request.addOutputParameter('JobId', TYPES.Int);

        request.on('returnValue', function(parameterName, value, metadata) {
            if (parameterName == 'JobId') {
                resultJobId = value;
            }
        });

        connection.callProcedure(request);

    });
}

function getDataSets(opts, cb) {
    connect(function(err, connection){
        if (err) return cb(err);

        var sproc = opts.sproc,
            sets = opts.sets,
            params = opts.params,
            currSetIndex = -1;

        var result = {};

        var request = new tedious.Request(sproc, function(err, rowCount, rows) {
            if (err) {
                console.error('error calling', sproc, 'stored procedure', err);
                return cb(err);
            }
        });

        for (var i=0; i<params.length; i++) {
            var param = params[i];
            request.addParameter(param.name, param.type, param.value);
        }

        request.on('columnMetadata', function (columns) {
            currSetIndex++;
            result[sets[currSetIndex]] = [];
        });

        request.on('row', function (columns) {
            var rowObj = {};
            for(var i=0; i<columns.length; i++) {
                rowObj[columns[i].metadata.colName] = columns[i].value;
            }
            result[sets[currSetIndex]].push(rowObj);
        });

        request.on('doneProc', function (rowCount, more, returnStatus, rows) {
            console.log('doneProc', rowCount, more, returnStatus, rows);

            cb(null, result);
        });

        connection.callProcedure(request);

    });
}

module.exports = {
    connect: connect,
    createOrModifyJob: createOrModifyJob,
    getJobDetails: getJobDetails
}