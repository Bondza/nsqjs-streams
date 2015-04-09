var ConfigurationError = require("./configuration_error.js"),
    nsq = require("nsqjs"),
    Writable = require("stream").Writable,
    util = require("util");

var PART = {
    TOPIC: 0,
    MESSAGE: 1
};

function fieldGetter(field) {

    if (typeof field === "string") {
        return function (data) { return data[field]; };
    }

    if (typeof field === "function") {
        return field;
    }

    return function (data) { return data; };
}

/*jslint unparam:true*/
function getterWrite(chunk, encoding, callback) {
    var topic = this.getters.topic(chunk),
        message = this.getters.message(chunk);

    this.writer.publish(topic, message, function (error) {
        callback(error);
    });
}

function interleavedWrite(chunk, encoding, callback) {

    if (PART.TOPIC === this.part_type) {
        this.topic = this.getters.topic(chunk);
        callback();
    } else if (PART.MESSAGE === this.part_type) {
        this.writer.publish(this.topic, this.getters.message(chunk), function (error) {
            callback(error);
        });
    }

    this.part_type ^= 1; // Toggle type for next chunk.
}
/*jslint unparam:false*/

function WriterStream(nsqdHost, nsqdPort, options, getters) {

    if (!(this instanceof WriterStream)) {
        return new WriterStream(nsqdHost, nsqdPort, options);
    }

    Writable.call(this, { objectMode: true });

    var self = this;

    if (options && options.hasOwnProperty("topic") && options.hasOwnProperty("message")) {
        getters = options;
        options = {};
    }

    self.getters = {};
    if (getters) {
        self.getters.topic = fieldGetter(getters.topic);
        self.getters.message = fieldGetter(getters.message);
        self._write = getterWrite;
    } else {
        self.getters.topic = fieldGetter();
        self.getters.message = fieldGetter();
        self.part_type = 0;
        self._write = interleavedWrite;
    }

    self.writer = new nsq.Writer(nsqdHost, nsqdPort, options);
    self.writer.connect();

    self.writer.on("closed", function () {
        self.emit("close");
    });

    self.writer.on("error", function(error) {
        self.emit("error", error);
    });

    self.writer.on("ready", function () {
        self.emit("ready");
    });
}

util.inherits(WriterStream, Writable);

WriterStream.prototype.close = function () {
    this.writer.close();
}

module.exports = WriterStream;

